import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, GraduationCap, Link as LinkIcon, Github, MessageSquare, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  useGetMyProfile,
  useGetProfile,
  useUpsertMyProfile,
  useSendMessage,
  getGetMyProfileQueryKey,
  getGetProfileQueryKey,
  getListConversationsQueryKey,
  ProfileInputUserRole,
} from "@workspace/api-client-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout";
import { Show } from "@clerk/react";

interface ProfilePageProps {
  isMe?: boolean;
  userId?: string;
}

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters."),
  university: z.string().optional().or(z.literal("")),
  department: z.string().optional().or(z.literal("")),
  graduationYear: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
  currentRole: z.string().optional().or(z.literal("")),
  currentCompany: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  resumeUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  skills: z.string().optional().or(z.literal("")),
});

export default function ProfilePage({ isMe, userId }: ProfilePageProps) {
  return (
    <Layout>
      <Show when="signed-in">
        {isMe ? <MyProfileView /> : <PublicProfileView userId={userId!} />}
      </Show>
    </Layout>
  );
}

function SendMessageDialog({ recipientId, recipientName }: { recipientId: string; recipientName: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sendMessage = useSendMessage();

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate(
      {
        data: {
          recipientId,
          content: message.trim(),
          isAnonymous,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey({ mode: isAnonymous ? "anonymous" : "normal" }) });
          toast({ title: "Message sent" });
          setOpen(false);
          setMessage("");
          navigate("/messages");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to send message" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Message {recipientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Textarea
            placeholder="Write your message..."
            className="h-28 resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anon-toggle"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="anon-toggle" className="text-sm text-muted-foreground cursor-pointer">
              Send anonymously
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={!message.trim() || sendMessage.isPending}>
              {sendMessage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PublicProfileView({ userId }: { userId: string }) {
  const { data: profile, isLoading } = useGetProfile(userId, {
    query: {
      enabled: !!userId,
      queryKey: getGetProfileQueryKey(userId),
    },
  });

  if (isLoading) return <ProfileSkeleton />;

  if (!profile) return (
    <div className="text-center py-20 text-muted-foreground">
      Profile not found.
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="h-32 bg-primary/10 w-full" />
        <CardContent className="relative pt-0 px-8 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 mb-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-sm bg-background">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-4xl">{profile.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">{profile.displayName}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="capitalize">{profile.userRole}</span>
                {profile.graduationYear && (
                  <>
                    <span>•</span>
                    <span>Class of {profile.graduationYear}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <SendMessageDialog recipientId={profile.userId} recipientName={profile.displayName} />
              {profile.resumeUrl && (
                <Button asChild>
                  <a href={profile.resumeUrl} target="_blank" rel="noreferrer">View Resume</a>
                </Button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {profile.bio && (
                <section>
                  <h3 className="text-lg font-semibold mb-3">About</h3>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-sm">
                    {profile.bio}
                  </p>
                </section>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map(skill => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <section className="bg-muted/30 p-5 rounded-lg border border-border/50 space-y-4 text-sm">
                {profile.currentRole && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{profile.currentRole}</p>
                      {profile.currentCompany && <p className="text-muted-foreground">{profile.currentCompany}</p>}
                    </div>
                  </div>
                )}
                {profile.university && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{profile.university}</p>
                      {profile.department && <p className="text-muted-foreground">{profile.department}</p>}
                    </div>
                  </div>
                )}
                {profile.linkedinUrl && (
                  <div className="flex items-start gap-3">
                    <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                {profile.githubUrl && (
                  <div className="flex items-start gap-3">
                    <Github className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                      GitHub Profile
                    </a>
                  </div>
                )}
              </section>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MyProfileView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetMyProfile();
  const upsertProfile = useUpsertMyProfile();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      university: "",
      department: "",
      currentRole: "",
      currentCompany: "",
      bio: "",
      linkedinUrl: "",
      githubUrl: "",
      resumeUrl: "",
      skills: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName || "",
        university: profile.university || "",
        department: profile.department || "",
        graduationYear: profile.graduationYear || undefined,
        currentRole: profile.currentRole || "",
        currentCompany: profile.currentCompany || "",
        bio: profile.bio || "",
        linkedinUrl: profile.linkedinUrl || "",
        githubUrl: profile.githubUrl || "",
        resumeUrl: profile.resumeUrl || "",
        skills: profile.skills?.join(", ") || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    const skillsArray = values.skills
      ? values.skills.split(",").map(s => s.trim()).filter(s => s.length > 0)
      : undefined;

    upsertProfile.mutate(
      {
        data: {
          userRole: profile?.userRole as ProfileInputUserRole || "student",
          displayName: values.displayName,
          university: values.university,
          department: values.department,
          graduationYear: values.graduationYear,
          currentRole: values.currentRole,
          currentCompany: values.currentCompany,
          bio: values.bio,
          linkedinUrl: values.linkedinUrl,
          githubUrl: values.githubUrl,
          resumeUrl: values.resumeUrl,
          skills: skillsArray,
        }
      },
      {
        onSuccess: (updatedProfile) => {
          toast({ title: "Profile updated successfully" });
          queryClient.setQueryData(getGetMyProfileQueryKey(), updatedProfile);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update profile" });
        }
      }
    );
  };

  if (isLoading) return <ProfileSkeleton />;
  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4 border-b">
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Basic Info</h3>
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea className="resize-none h-24" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Education & Work</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="university"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>University</FormLabel>
                          <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="graduationYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Of</FormLabel>
                          <FormControl><Input type="number" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department / Major</FormLabel>
                        <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Role</FormLabel>
                          <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currentCompany"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Skills & Links</h3>
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills (comma separated)</FormLabel>
                      <FormControl><Input placeholder="React, Python, Design..." {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl><Input type="url" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="githubUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub URL</FormLabel>
                        <FormControl><Input type="url" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="resumeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resume / CV URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://drive.google.com/your-resume..."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={upsertProfile.isPending}>
                  {upsertProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <div className="h-32 bg-muted w-full" />
        <CardContent className="relative pt-0 px-8 pb-8">
          <div className="flex gap-6 items-end -mt-16 mb-6">
            <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
            <div className="flex-1 space-y-2 pb-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
