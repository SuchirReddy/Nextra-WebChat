"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Search, UserPlus, X, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/api-client";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isOnline: boolean;
};

type SearchResult = {
  users: User[];
};

export default function GroupsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);

  const debouncedSearch = useDebounce(memberSearch, 300);

  const { data: searchData, isFetching } = useQuery({
    queryKey: ["user-search", debouncedSearch],
    queryFn: () =>
      apiClient<SearchResult>(`/api/search?q=${encodeURIComponent(debouncedSearch)}`),
    enabled: debouncedSearch.length >= 1
  });

  const searchResults = searchData?.users ?? [];

  const toggleMember = (user: User) => {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m.id === user.id);
      if (exists) return prev.filter((m) => m.id !== user.id);
      return [...prev, user];
    });
  };

  const removeMember = (userId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const createGroup = useMutation({
    mutationFn: () =>
      apiClient("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          memberUserIds: selectedMembers.map((m) => m.id)
        })
      }),
    onSuccess: (data: { chatId?: string }) => {
      toast.success(`Group "${name.trim()}" created!`);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      // Navigate to the new group chat if chatId is available
      if (data?.chatId) {
        router.push(`/chat/${data.chatId}`);
      } else {
        setName("");
        setDescription("");
        setSelectedMembers([]);
        setMemberSearch("");
      }
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Failed to create group")
  });

  const canCreate = name.trim().length >= 2 && selectedMembers.length >= 1;

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/chat" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create a Group</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up a group chat with two or more people.
          </p>
        </div>
      </div>

      {/* Group Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Group Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Group Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Team Standup"
              maxLength={80}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={2}
              maxLength={600}
            />
          </div>
        </CardContent>
      </Card>

      {/* Member Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Add Members
            {selectedMembers.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {selectedMembers.length} selected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Search by username to find people to add.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Selected members chips */}
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-accent px-3 py-1 text-sm"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={member.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {member.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{member.username}</span>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                    aria-label={`Remove ${member.username}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by username..."
              className="pl-9"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search results */}
          {debouncedSearch.length > 0 && (
            <div className="rounded-lg border border-border divide-y divide-border max-h-60 overflow-y-auto">
              {searchResults.length === 0 && !isFetching ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No users found for &quot;{debouncedSearch}&quot;
                </div>
              ) : (
                searchResults.map((user) => {
                  const isSelected = selectedMembers.some((m) => m.id === user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleMember(user)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                        isSelected && "bg-accent/60"
                      )}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={user.avatarUrl ?? undefined} />
                        <AvatarFallback>
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.username}</p>
                        {user.bio && (
                          <p className="truncate text-xs text-muted-foreground">{user.bio}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border">
                            <UserPlus className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        disabled={!canCreate || createGroup.isPending}
        onClick={() => createGroup.mutate()}
        size="lg"
      >
        {createGroup.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating group...
          </>
        ) : (
          <>
            <Users className="mr-2 h-4 w-4" />
            Create Group
            {selectedMembers.length > 0 && ` with ${selectedMembers.length} member${selectedMembers.length !== 1 ? "s" : ""}`}
          </>
        )}
      </Button>
    </div>
  );
}
