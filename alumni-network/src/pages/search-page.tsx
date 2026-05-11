import { useState } from "react";
import { Link } from "wouter";
import { Search as SearchIcon, MapPin, Building, GraduationCap, Briefcase } from "lucide-react";

import { useListProfiles, ListProfilesRole } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/layout";
import { Show } from "@clerk/react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  const { data: profilesData, isLoading } = useListProfiles({
    q: debouncedQuery || undefined,
    role: roleFilter !== "all" ? roleFilter as ListProfilesRole : undefined,
    limit: 50
  });

  return (
    <Layout>
      <Show when="signed-in">
        <div className="space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Directory</h1>
            <p className="text-muted-foreground">Find alumni, students, and recruiters in the network.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, university, skills..." 
                className="pl-9 bg-background"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="recruiter">Recruiters</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="space-y-2 w-full flex flex-col items-center">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : profilesData?.items.length === 0 ? (
              <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
                No profiles found matching your search.
              </div>
            ) : (
              profilesData?.items.map((profile) => (
                <Link key={profile.userId} href={`/profile/${profile.userId}`} className="block">
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full border-border/60 shadow-sm hover:shadow-md">
                    <CardContent className="p-6 flex flex-col items-center text-center h-full">
                      <Avatar className="h-20 w-20 mb-4 ring-2 ring-background">
                        <AvatarImage src={profile.avatarUrl || undefined} />
                        <AvatarFallback className="text-lg bg-muted text-muted-foreground">
                          {profile.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg line-clamp-1 w-full">{profile.displayName}</h3>
                      <p className="text-sm text-muted-foreground mb-4 capitalize">
                        {profile.userRole}
                      </p>
                      
                      <div className="mt-auto w-full space-y-2 text-sm text-muted-foreground">
                        {profile.currentRole && (
                          <div className="flex items-center justify-center gap-1.5 line-clamp-1">
                            <Briefcase className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{profile.currentRole}</span>
                          </div>
                        )}
                        {profile.university && (
                          <div className="flex items-center justify-center gap-1.5 line-clamp-1">
                            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{profile.university} {profile.graduationYear ? `'${profile.graduationYear.toString().slice(2)}` : ''}</span>
                          </div>
                        )}
                      </div>

                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex gap-1 mt-4 justify-center flex-wrap max-h-12 overflow-hidden">
                          {profile.skills.slice(0, 3).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                              {skill}
                            </Badge>
                          ))}
                          {profile.skills.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                              +{profile.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </Show>
    </Layout>
  );
}