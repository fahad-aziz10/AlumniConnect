import { Link } from "wouter";
import { ArrowLeft, Building, MapPin, Briefcase, Calendar, Link as LinkIcon, Mail } from "lucide-react";
import { useGetJob, getGetJobQueryKey } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/layout";
import { Show } from "@clerk/react";

export default function JobDetailPage({ jobId }: { jobId: string }) {
  const { data: job, isLoading } = useGetJob(Number(jobId), {
    query: {
      enabled: !!jobId,
      queryKey: getGetJobQueryKey(Number(jobId)),
    }
  });

  return (
    <Layout>
      <Show when="signed-in">
        <div className="max-w-3xl mx-auto space-y-6">
          <Link href="/careers">
            <Button variant="ghost" size="sm" className="pl-0 gap-1 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to Careers
            </Button>
          </Link>

          {isLoading ? (
            <div className="space-y-8">
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !job ? (
            <div className="py-20 text-center text-muted-foreground">Job not found</div>
          ) : (
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="p-8 border-b border-border/50 bg-muted/10">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
                      {job.title}
                    </h1>
                    
                    <div className="flex flex-wrap gap-4 text-sm font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-foreground/80">
                        <Building className="h-4 w-4" />
                        {job.company}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5 capitalize">
                        <Briefcase className="h-4 w-4" />
                        {job.jobType.replace('-', ' ')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 shrink-0 min-w-[140px]">
                    {job.applyLink && (
                      <Button asChild size="lg" className="w-full">
                        <a href={job.applyLink} target="_blank" rel="noreferrer">
                          Apply Now <LinkIcon className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    )}
                    {job.applyEmail && (
                      <Button asChild variant={job.applyLink ? "outline" : "default"} size="lg" className="w-full">
                        <a href={`mailto:${job.applyEmail}`}>
                          Email Resume <Mail className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <h3 className="text-lg font-semibold mb-4">Job Description</h3>
                <div className="prose prose-sm md:prose-base prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-foreground/80">
                  {job.description}
                </div>
              </div>
            </div>
          )}
        </div>
      </Show>
    </Layout>
  );
}