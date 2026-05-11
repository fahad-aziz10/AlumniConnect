import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, FileText, MapPin, Building, Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { 
  useListJobs, 
  useListCvs, 
  useGetCareersSummary,
  useCreateJob,
  useGetMyProfile,
  useUpsertMyProfile,
  getListJobsQueryKey,
  getListCvsQueryKey,
  getGetMyProfileQueryKey,
  JobInputJobType,
  ListJobsType
} from "@workspace/api-client-react";
import { useUser } from "@clerk/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Layout from "@/components/layout";
import { Show } from "@clerk/react";

const jobSchema = z.object({
  title: z.string().min(2),
  company: z.string().min(2),
  location: z.string().min(2),
  jobType: z.enum(["full-time", "part-time", "internship"]),
  description: z.string().min(10),
  applyLink: z.string().url().optional().or(z.literal("")),
  applyEmail: z.string().email().optional().or(z.literal("")),
});

export default function CareersPage() {
  const { data: summary } = useGetCareersSummary();

  return (
    <Layout>
      <Show when="signed-in">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Careers</h1>
              <p className="text-muted-foreground mt-1">Discover opportunities or find talent in the alumni network.</p>
            </div>
            
            <div className="flex gap-4 text-sm bg-muted/50 p-3 rounded-lg border border-border/50">
              <div className="flex flex-col items-center px-4">
                <span className="text-2xl font-bold text-foreground">{summary?.totalJobs || 0}</span>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Jobs</span>
              </div>
              <div className="w-px bg-border"></div>
              <div className="flex flex-col items-center px-4">
                <span className="text-2xl font-bold text-foreground">{summary?.totalCvs || 0}</span>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Resumes</span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="jobs">Job Board</TabsTrigger>
              <TabsTrigger value="cvs">Resume Book</TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs" className="mt-6 space-y-6">
              <JobsView />
            </TabsContent>
            
            <TabsContent value="cvs" className="mt-6">
              <CvsView />
            </TabsContent>
          </Tabs>
        </div>
      </Show>
    </Layout>
  );
}

function JobsView() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { user } = useUser();
  
  const { data: jobsData, isLoading } = useListJobs({
    type: filter !== "all" ? filter as ListJobsType : undefined,
    q: search || undefined
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input 
            placeholder="Search roles, companies..." 
            className="max-w-md bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PostJobModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="h-[200px] animate-pulse bg-muted/20" />
          ))
        ) : jobsData?.items.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
            No jobs found.
          </div>
        ) : (
          jobsData?.items.map((job) => (
            <Link key={job.id} href={`/careers/jobs/${job.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg line-clamp-2 leading-tight">{job.title}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 capitalize font-normal text-xs">
                      {job.jobType.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                    <Building className="h-4 w-4" />
                    <span className="font-medium text-foreground/80">{job.company}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground border-t pt-3">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function PostJobModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const createJob = useCreateJob();

  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "", company: "", location: "", jobType: "full-time", description: "", applyLink: "", applyEmail: ""
    }
  });

  const onSubmit = (values: z.infer<typeof jobSchema>) => {
    createJob.mutate(
      { data: values as any },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" /> Post a Job</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a Job Opportunity</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control} name="title"
                render={({ field }) => (
                  <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField
                control={form.control} name="company"
                render={({ field }) => (
                  <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField
                control={form.control} name="location"
                render={({ field }) => (
                  <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField
                control={form.control} name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control} name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea className="h-32" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control} name="applyLink"
                render={({ field }) => (
                  <FormItem><FormLabel>Application URL (Optional)</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField
                control={form.control} name="applyEmail"
                render={({ field }) => (
                  <FormItem><FormLabel>Application Email (Optional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createJob.isPending}>
                {createJob.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Post Job
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddResumeModal() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();
  const { data: myProfile } = useGetMyProfile();
  const upsertProfile = useUpsertMyProfile();

  const handleSave = () => {
    if (!myProfile) return;
    upsertProfile.mutate(
      {
        data: {
          userRole: myProfile.userRole as any,
          displayName: myProfile.displayName,
          university: myProfile.university ?? undefined,
          department: myProfile.department ?? undefined,
          graduationYear: myProfile.graduationYear ?? undefined,
          currentRole: myProfile.currentRole ?? undefined,
          currentCompany: myProfile.currentCompany ?? undefined,
          bio: myProfile.bio ?? undefined,
          linkedinUrl: myProfile.linkedinUrl ?? undefined,
          githubUrl: myProfile.githubUrl ?? undefined,
          skills: myProfile.skills ?? undefined,
          resumeUrl: url.trim() || undefined,
        },
      },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetMyProfileQueryKey(), updated);
          queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() });
          setOpen(false);
          setUrl("");
        },
      }
    );
  };

  const hasResume = !!myProfile?.resumeUrl;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={hasResume ? "outline" : "default"}>
          <Plus className="h-4 w-4 mr-2" />
          {hasResume ? "Update My Resume" : "Add My Resume"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{hasResume ? "Update Resume URL" : "Add Your Resume"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Paste a link to your resume (Google Drive, Notion, Dropbox, or any public URL).
          </p>
          <Input
            type="url"
            placeholder="https://drive.google.com/file/d/..."
            defaultValue={myProfile?.resumeUrl ?? ""}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={(e) => !url && setUrl(myProfile?.resumeUrl ?? "")}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsertProfile.isPending || !url.trim()}>
              {upsertProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CvsView() {
  const { data: cvsData, isLoading } = useListCvs();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Alumni and students who have shared their resume publicly.
        </p>
        <AddResumeModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Card key={i} className="h-[150px] animate-pulse bg-muted/20" />)
        ) : cvsData?.items.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed rounded-lg space-y-3">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No resumes shared yet.</p>
            <p className="text-sm text-muted-foreground">Be the first — add your resume URL using the button above.</p>
          </div>
        ) : (
          cvsData?.items.map(cv => (
            <Link key={cv.id} href={`/profile/${cv.userId}`} className="block">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-5 flex items-start gap-4">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={cv.avatarUrl || undefined} />
                    <AvatarFallback>{cv.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1 min-w-0">
                    <h3 className="font-semibold truncate">{cv.displayName}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{cv.university}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {cv.skills?.slice(0, 2).map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] py-0 px-1.5">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  {cv.resumeUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-xs h-8"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={cv.resumeUrl} target="_blank" rel="noreferrer">
                        <FileText className="h-3 w-3 mr-1" /> CV
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}