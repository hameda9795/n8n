import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminClient } from "./admin-client";

const BASE_DOMAIN = process.env.N8N_BASE_DOMAIN || "n8n.maxhmd.dev";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Get all users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminClient
      initialUsers={users.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      }))}
      baseDomain={BASE_DOMAIN}
    />
  );
}
