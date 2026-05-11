import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send, User as UserIcon, Loader2, Info, MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { 
  useListConversations, 
  useGetMessages, 
  useSendMessage,
  getListConversationsQueryKey,
  getGetMessagesQueryKey,
  Conversation,
  ListConversationsMode
} from "@workspace/api-client-react";
import { useUser } from "@clerk/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Layout from "@/components/layout";
import { Show } from "@clerk/react";

const messageSchema = z.object({
  content: z.string().min(1),
});

export default function MessagesPage() {
  const [mode, setMode] = useState<ListConversationsMode>("normal");
  const [activeConvId, setActiveConvId] = useState<number | null>(null);

  const { data: conversationsData, isLoading: isConvsLoading } = useListConversations({ mode });

  // When mode changes or conversations load, select the first one if none selected
  useEffect(() => {
    if (conversationsData?.items && conversationsData.items.length > 0 && !activeConvId) {
      setActiveConvId(conversationsData.items[0].id);
    }
  }, [conversationsData, activeConvId]);

  const activeConv = conversationsData?.items.find(c => c.id === activeConvId);

  return (
    <Layout>
      <Show when="signed-in">
        <div className="h-[calc(100vh-140px)] border border-border/60 rounded-xl overflow-hidden flex bg-background shadow-sm">
          {/* Sidebar */}
          <div className="w-80 flex flex-col border-r border-border/60 bg-muted/10">
            <div className="p-4 border-b border-border/60 bg-background">
              <h2 className="font-semibold text-lg mb-4">Messages</h2>
              <Tabs value={mode} onValueChange={(v) => { setMode(v as ListConversationsMode); setActiveConvId(null); }} className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="normal">Direct</TabsTrigger>
                  <TabsTrigger value="anonymous">Anonymous</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <ScrollArea className="flex-1">
              {isConvsLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversationsData?.items.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No {mode} conversations yet.
                </div>
              ) : (
                <div className="flex flex-col">
                  {conversationsData?.items.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`flex items-start gap-3 p-4 text-left transition-colors hover:bg-accent ${
                        activeConvId === conv.id ? "bg-accent border-l-2 border-primary" : "border-l-2 border-transparent"
                      }`}
                    >
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={conv.otherUserAvatarUrl || undefined} />
                        <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-medium text-sm truncate">{conv.otherUserName || "Unknown User"}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{format(new Date(conv.updatedAt), 'MMM d')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-background">
            {activeConvId && activeConv ? (
              <ChatArea conversation={activeConv} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                <p>Select a conversation to start messaging</p>
                {mode === "anonymous" && (
                  <p className="text-sm mt-2 max-w-sm">
                    Anonymous mode allows you to ask questions safely. Your identity is hidden.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Show>
    </Layout>
  );
}

function ChatArea({ conversation }: { conversation: Conversation }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: messagesData, isLoading } = useGetMessages(conversation.id, {
    query: {
      enabled: !!conversation.id,
      queryKey: getGetMessagesQueryKey(conversation.id),
      refetchInterval: 5000 // Poll for new messages
    }
  });

  const sendMessage = useSendMessage();

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesData]);

  const onSubmit = (values: z.infer<typeof messageSchema>) => {
    if (!conversation.otherUserId) return;
    
    sendMessage.mutate(
      {
        data: {
          recipientId: conversation.otherUserId,
          conversationId: conversation.id,
          content: values.content,
          isAnonymous: conversation.mode === "anonymous"
        }
      },
      {
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(conversation.id) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey({ mode: conversation.mode }) });
        }
      }
    );
  };

  return (
    <>
      <div className="h-14 border-b border-border/60 px-6 flex items-center bg-background shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={conversation.otherUserAvatarUrl || undefined} />
            <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{conversation.otherUserName || "Unknown User"}</h3>
            {conversation.mode === "anonymous" && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Anonymous Mode
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          messagesData?.items.slice().reverse().map(msg => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex max-w-[75%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"} gap-3`}>
                <Avatar className="h-8 w-8 shrink-0 mt-auto border border-border/50">
                  <AvatarImage src={isMe ? user?.imageUrl : msg.senderAvatarUrl || undefined} />
                  <AvatarFallback>{isMe ? "ME" : <UserIcon className="h-4 w-4" />}</AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMe 
                        ? "bg-primary text-primary-foreground rounded-br-sm" 
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                    {format(new Date(msg.createdAt), 'h:mm a')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-background border-t border-border/60">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
          <Input 
            {...form.register("content")} 
            placeholder="Type a message..." 
            className="flex-1 bg-muted/50 border-transparent focus-visible:bg-background"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={sendMessage.isPending || !form.watch("content").trim()}>
            {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </>
  );
}