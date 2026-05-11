import { useGetMyProfile, useGetAdminStats, useListAdminUsers, useBanUser, AdminUser } from "@workspace/api-client-react";
import { Users, FileText, Briefcase, Flag, AlertTriangle, UserX, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout";
import { Show } from "@clerk/react";

export default function AdminPage() {
  const { data: profile, isLoading: profileLoading } = useGetMyProfile();
  
  if (profileLoading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></Layout>;
  
  if (profile?.userRole !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
          <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Show when="signed-in">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Platform metrics and moderation tools.</p>
          </div>

          <AdminStatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <UserManagementTable />
            {/* Reports table could go here in a fuller implementation */}
          </div>
        </div>
      </Show>
    </Layout>
  );
}

function AdminStatsCards() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array(4).fill(0).map((_, i) => <Card key={i} className="h-28 animate-pulse bg-muted/20" />)}
    </div>;
  }

  const statItems = [
    { title: "Total Users", value: stats?.totalUsers || 0, icon: Users, desc: `+${stats?.newUsersThisWeek || 0} this week` },
    { title: "Active Posts", value: stats?.totalPosts || 0, icon: FileText },
    { title: "Job Listings", value: stats?.totalJobs || 0, icon: Briefcase },
    { title: "Open Reports", value: stats?.totalReports || 0, icon: Flag, highlight: (stats?.totalReports || 0) > 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((s, i) => (
        <Card key={i} className={s.highlight ? "border-destructive/50 shadow-sm" : "shadow-sm"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
            <s.icon className={`h-4 w-4 ${s.highlight ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${s.highlight ? "text-destructive" : ""}`}>{s.value}</div>
            {s.desc && <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserManagementTable() {
  const { data: usersData, isLoading } = useListAdminUsers({ limit: 10 });
  const banUser = useBanUser();
  const queryClient = useQueryClient();

  const handleToggleBan = (user: AdminUser) => {
    // In a real app we'd toggle. API only has useBanUser right now.
    if (!user.isBanned) {
      if (confirm(`Are you sure you want to ban ${user.displayName}?`)) {
        banUser.mutate(
          { userId: user.userId, data: { reason: "Admin action" } },
          { onSuccess: () => queryClient.invalidateQueries() }
        );
      }
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Recent Users</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData?.items.map(user => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.displayName}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{user.userRole}</TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Banned</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/30 text-green-600">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleToggleBan(user)}
                      disabled={user.isBanned || banUser.isPending}
                      className={user.isBanned ? "" : "text-destructive hover:text-destructive"}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}