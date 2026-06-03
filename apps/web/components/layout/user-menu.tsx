"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/use-current-user";

export const UserMenu = () => {
  const { data } = useCurrentUser();

  return (
    <div className="flex items-center gap-3">
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            userButtonAvatarBox: "h-9 w-9"
          }
        }}
      />
      <div className="text-left">
        <p className="text-sm font-semibold leading-tight">{data?.username ?? "..."}</p>
        <p className="text-xs text-muted-foreground">{data?.role ?? "user"}</p>
      </div>
      <Link className="sr-only" href="/profile">
        Profile
      </Link>
    </div>
  );
};
