"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Flag, MessageSquareText, ShieldAlert, Users, Ban, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () =>
      apiClient<{
        stats: {
          usersCount: number;
          activeUsers: number;
          messagesCount: number;
          todayMessages: number;
          groupsCount: number;
          openReports: number;
          messageTrend: Array<{ day: string; count: number }>;
        };
        moderation: {
          users: Array<{ id: string; username: string; email: string; role: string; createdAt: string }>;
          reports: Array<{ id: string; reason: string; status: string; createdAt: string }>;
        };
      }>("/api/admin/stats")
  });

  const toggleBan = useMutation({
    mutationFn: ({ userId, ban }: { userId: string; ban: boolean }) =>
      apiClient(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        body: JSON.stringify({ banned: ban })
      }),
    onSuccess: () => {
      toast.success("User role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update user")
  });

  const resolveReport = useMutation({
    mutationFn: (reportId: string) =>
      apiClient(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "resolved" })
      }),
    onSuccess: () => {
      toast.success("Report marked as resolved");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to resolve report")
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading admin dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-destructive">{(error as Error).message}</div>;
  }

  const stats = data?.stats;
  const users = data?.moderation.users ?? [];
  const reports = data?.moderation.reports ?? [];

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-4">
        <Link href="/chat" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage platform statistics, users, and reports.</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">
            Reports
            {stats?.openReports ? (
              <span className="ml-2 rounded-full bg-destructive w-5 h-5 flex items-center justify-center text-[10px] text-destructive-foreground">
                {stats.openReports}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard icon={Users} label="Total Users" value={stats?.usersCount ?? 0} />
            <StatCard icon={ShieldAlert} label="Active Users" value={stats?.activeUsers ?? 0} />
            <StatCard icon={MessageSquareText} label="Messages" value={stats?.messagesCount ?? 0} />
            <StatCard icon={BarChart3} label="Today Messages" value={stats?.todayMessages ?? 0} />
            <StatCard icon={Users} label="Groups" value={stats?.groupsCount ?? 0} />
            <StatCard icon={Flag} label="Open Reports" value={stats?.openReports ?? 0} />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-3 font-medium">Username</th>
                      <th className="p-3 font-medium">Email</th>
                      <th className="p-3 font-medium">Role</th>
                      <th className="p-3 font-medium">Joined</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-medium">{u.username}</td>
                        <td className="p-3 text-muted-foreground">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === "admin" ? "bg-primary/10 text-primary" : 
                            u.role === "banned" ? "bg-destructive/10 text-destructive" : 
                            "bg-secondary text-secondary-foreground"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
                        <td className="p-3 text-right">
                          {u.role !== "admin" && (
                            <Button 
                              variant={u.role === "banned" ? "outline" : "destructive"} 
                              size="sm"
                              disabled={toggleBan.isPending}
                              onClick={() => toggleBan.mutate({ userId: u.id, ban: u.role !== "banned" })}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              {u.role === "banned" ? "Unban" : "Ban"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-3 font-medium">Reason</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Created</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-medium max-w-xs truncate" title={r.reason}>{r.reason}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            r.status === "open" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" : 
                            r.status === "resolved" ? "bg-green-500/10 text-green-600 dark:text-green-400" : 
                            "bg-secondary text-secondary-foreground"
                          }`}>
                            {r.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{format(new Date(r.createdAt), "MMM d, yyyy")}</td>
                        <td className="p-3 text-right">
                          {r.status === "open" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                              disabled={resolveReport.isPending}
                              onClick={() => resolveReport.mutate(r.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Resolve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No reports found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{label}</CardTitle>
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
