import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  await requireUser();
  return <AppShell>{children}</AppShell>;
}
