import Link from "next/link";
import { MessageSquare, Search, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  { href: "/chat", icon: MessageSquare, title: "Realtime Chats", description: "Direct and group messaging with rich media." },
  { href: "/groups", icon: Users, title: "Groups", description: "Manage teams, admins, and group settings." },
  { href: "/search", icon: Search, title: "Search", description: "Find users, chats, and historical messages quickly." }
];

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage conversations, members, and realtime collaboration.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <card.icon className="h-5 w-5 text-primary" />
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-primary">Open</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
