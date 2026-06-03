"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Session persistence is handled via Clerk.</p>
          <p>Realtime reconnect and optimistic updates are active by default.</p>
          <p>Upload constraints and API rate limits are enforced server-side.</p>
          <p>Use dark/light toggle in top bar. Browser notifications trigger for new messages.</p>
        </CardContent>
      </Card>
    </div>
  );
}
