"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { ExternalLink, Copy, LogOut, Webhook } from "lucide-react";
import { toast } from "sonner";

interface DashboardClientProps {
  user: {
    username: string;
    isActive: boolean;
  };
  baseDomain: string;
}

export function DashboardClient({ user, baseDomain }: DashboardClientProps) {
  const n8nUrl = `https://${user.username}.${baseDomain}`;
  const webhookUrl = `https://${baseDomain}/webhook/${user.username}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">n8n Platform</h1>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Welcome, {user.username}!
                  </CardTitle>
                  <CardDescription>
                    Access your n8n instance and manage workflows
                  </CardDescription>
                </div>
                <Badge
                  variant={user.isActive ? "default" : "destructive"}
                  className="text-sm"
                >
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                >
                  Your n8n is Ready
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Your n8n Instance</CardTitle>
              <CardDescription>Access your personal n8n environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                size="lg"
                className="w-full h-16 text-lg"
                asChild
                disabled={!user.isActive}
              >
                <a href={n8nUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open My n8n
                </a>
              </Button>

              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">
                  Your n8n URL
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono truncate">
                    {n8nUrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(n8nUrl, "n8n URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                First time? You&apos;ll be asked to set up your owner account on the n8n setup page.
              </p>
            </CardContent>
          </Card>

          {/* Webhook URL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook URL
              </CardTitle>
              <CardDescription>
                Use this URL for your n8n workflow webhooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 rounded-lg bg-muted text-sm font-mono break-all">
                  {webhookUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Click &quot;Open My n8n&quot; to access your instance</p>
              <p>2. On first visit, complete the setup owner account form</p>
              <p>3. Start building workflows!</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
