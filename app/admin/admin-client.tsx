"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { Copy, LogOut, Plus, Power, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  username: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  n8nUrl?: string;
  createdAt: string;
}

interface AdminClientProps {
  initialUsers: User[];
  baseDomain: string;
}

export function AdminClient({ initialUsers, baseDomain }: AdminClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [createdUser, setCreatedUser] = useState<User | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCreatedUser(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setUsers([data, ...users]);
      setCreatedUser(data);
      setNewUsername("");
      toast.success(`User "${data.username}" created successfully!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const updatedUser = await response.json();
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, isActive: updatedUser.isActive } : u))
      );
      toast.success(`User ${updatedUser.isActive ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      setUsers(users.filter((u) => u.id !== userId));
      toast.success(`User "${username}" deleted`);
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const getN8nUrl = (username: string) => {
    return `https://${username}.${baseDomain}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">n8n Platform Admin</h1>
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
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-3xl">{users.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Users</CardDescription>
                <CardTitle className="text-3xl">
                  {users.filter((u) => u.isActive).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Create User Success Alert */}
          {createdUser && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-300">
                  User Created Successfully!
                </CardTitle>
                <CardDescription className="text-green-600 dark:text-green-400">
                  {createdUser.username} can now access their n8n instance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg bg-background text-sm font-mono break-all">
                    {createdUser.n8nUrl || getN8nUrl(createdUser.username)}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdUser.n8nUrl || getN8nUrl(createdUser.username))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <a 
                      href={createdUser.n8nUrl || getN8nUrl(createdUser.username)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  User will set their password on first visit.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage n8n instances and user access
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Enter a username to create a new n8n instance. The user will set their password on first visit.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="e.g., alice"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        pattern="[a-zA-Z0-9_-]+"
                        title="Only letters, numbers, hyphens, and underscores allowed"
                      />
                      <p className="text-xs text-muted-foreground">
                        This will create: https://{newUsername || "username"}.{baseDomain}
                      </p>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create User"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>n8n URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No users yet. Create your first user above.
                      </TableCell>
                    </TableRow>
                  )}
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.username}
                          {user.role === "ADMIN" && (
                            <Badge variant="secondary">Admin</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a
                            href={user.n8nUrl || getN8nUrl(user.username)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono text-blue-600 hover:underline truncate max-w-[200px]"
                          >
                            {user.n8nUrl || getN8nUrl(user.username)}
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(user.n8nUrl || getN8nUrl(user.username))}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            title={user.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power
                              className={`h-4 w-4 ${
                                user.isActive ? "text-green-500" : "text-gray-400"
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a 
                              href={user.n8nUrl || getN8nUrl(user.username)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="Open n8n"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteUser(user.id, user.username)}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Configuration Info */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Backend connection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Manager URL:</span>
                <code className="font-mono">{process.env.NEXT_PUBLIC_MANAGER_URL || "https://manager.maxhmd.dev"}</code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Domain:</span>
                <code className="font-mono">{baseDomain}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
