"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { apiClient } from "@/services/api-client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: user, refetch } = useCurrentUser();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setUsername(user.username);
    setBio(user.bio ?? "");
    setAvatarUrl(user.avatarUrl ?? "");
  }, [user]);

  const update = useMutation({
    mutationFn: () => apiClient("/api/profile", { method: "PATCH", body: JSON.stringify({ username, bio, avatarUrl }) }),
    onSuccess: async () => {
      toast.success("Profile updated");
      await refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed")
  });

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/chat" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">Profile Settings</h1>
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>{(username || "US").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder="Avatar URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          <Textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          <Button onClick={() => update.mutate()} disabled={update.isPending}>
            Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
