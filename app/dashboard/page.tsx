import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./dashboard-client";

const BASE_DOMAIN = process.env.N8N_BASE_DOMAIN || "n8n.maxhmd.dev";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get fresh user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardClient
      user={{
        username: user.username,
        isActive: user.isActive,
      }}
      baseDomain={BASE_DOMAIN}
    />
  );
}
