import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Heart, Loader2, Send, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { 
  useListPosts, 
  useCreatePost, 
  useGetFeedSummary, 
  useLikePost,
  useDeletePost,
  useListComments,
  useCreateComment,
  getListPostsQueryKey,
  getListCommentsQueryKey,
  Post,
  Comment
} from "@workspace/api-client-react";
import { useUser } from "@clerk/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/layout";

const postSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty").max(1000),
});

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export default function FeedPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  const { data: summary } = useGetFeedSummary();
  const { data: postsData, isLoading: isPostsLoading } = useListPosts({ limit: 50 });
  const createPost = useCreatePost();

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: "" },
  });

  const onSubmit = (values: z.infer<typeof postSchema>) => {
    createPost.mutate(
      { data: { content: values.content } },
      {
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-6">
          {/* Create Post */}
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Textarea 
                              placeholder="Share an update, ask a question, or post a job opportunity..." 
                              className="min-h-[100px] resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={createPost.isPending}>
                      {createPost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-4">
            {isPostsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : postsData?.items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                No posts yet. Be the first to share something!
              </div>
            ) : (
              postsData?.items.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden md:block space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Network Overview</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Members</span>
                <span className="font-medium">{summary?.totalMembers || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Alumni</span>
                <span className="font-medium">{summary?.totalAlumni || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Students</span>
                <span className="font-medium">{summary?.totalStudents || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Posts</span>
                <span className="font-medium">{summary?.totalPosts || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function PostCard({ post }: { post: Post }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  
  const likePost = useLikePost();
  const deletePost = useDeletePost();

  const handleLike = () => {
    likePost.mutate(
      { postId: post.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        }
      }
    );
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePost.mutate(
        { postId: post.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          }
        }
      );
    }
  };

  const isOwner = user?.id === post.authorId;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.authorAvatarUrl || undefined} />
            <AvatarFallback>{post.authorName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{post.authorName}</span>
              {post.authorRole && (
                <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full capitalize">
                  {post.authorRole}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        {isOwner && (
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-destructive h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
        {post.imageUrl && (
          <img src={post.imageUrl} alt="Post attachment" className="mt-4 rounded-md max-h-96 object-cover" />
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex flex-col gap-4">
        <div className="flex items-center gap-6 w-full">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`gap-2 ${post.likedByMe ? 'text-destructive hover:text-destructive/90' : 'text-muted-foreground'}`}
            onClick={handleLike}
            disabled={likePost.isPending}
          >
            <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`} />
            {post.likeCount}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-muted-foreground"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4" />
            {post.commentCount}
          </Button>
        </div>

        {showComments && (
          <div className="w-full space-y-4 pt-4 border-t">
            <CommentList postId={post.id} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function CommentList({ postId }: { postId: number }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = useListComments(postId, {
    query: {
      enabled: !!postId,
      queryKey: getListCommentsQueryKey(postId)
    }
  });
  
  const createComment = useCreateComment();

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });

  const onSubmit = (values: z.infer<typeof commentSchema>) => {
    createComment.mutate(
      { postId, data: { content: values.content } },
      {
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(postId) });
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() }); // to update comment count
        }
      }
    );
  };

  if (isLoading) {
    return <div className="text-center py-4"><Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-4">
        {comments?.items.map((comment) => (
          <div key={comment.id} className="flex gap-3 text-sm">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={comment.authorAvatarUrl || undefined} />
              <AvatarFallback>{comment.authorName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="bg-muted/50 rounded-lg p-3 flex-1">
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-medium">{comment.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-foreground/90">{comment.content}</p>
            </div>
          </div>
        ))}
        {comments?.items.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-2">No comments yet.</p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 items-start mt-4">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input 
                    placeholder="Write a comment..." 
                    className="h-8 text-sm"
                    autoComplete="off"
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={createComment.isPending}>
            {createComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </Form>
    </div>
  );
}