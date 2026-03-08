import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const MANAGER_URL = process.env.N8N_MANAGER_URL || "https://manager.maxhmd.dev";
const MANAGER_SECRET = process.env.N8N_MANAGER_SECRET || "";
const BASE_DOMAIN = process.env.N8N_BASE_DOMAIN || "n8n.maxhmd.dev";

// GET /api/admin/users - List all users from local DB
export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Add n8nUrl to each user for display
    const usersWithUrl = users.map((user) => ({
      ...user,
      n8nUrl: `https://${user.username}.${BASE_DOMAIN}`,
    }));

    return NextResponse.json(usersWithUrl);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user via manager API
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { username } = await request.json();

    // Validate input
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric, hyphen, underscore only)
    const validUsername = /^[a-z0-9_-]+$/i;
    if (!validUsername.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, hyphens, and underscores" },
        { status: 400 }
      );
    }

    // Check if username already exists in local DB
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    // Call the manager API to create the n8n instance
    const managerResponse = await fetch(`${MANAGER_URL}/api/create-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MANAGER_SECRET}`,
      },
      body: JSON.stringify({ username: username.toLowerCase() }),
    });

    if (!managerResponse.ok) {
      const errorData = await managerResponse.json().catch(() => ({}));
      console.error("Manager API error:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to create n8n instance" },
        { status: managerResponse.status }
      );
    }

    const managerData = await managerResponse.json();

    // Create user in local database
    const user = await prisma.user.create({
      data: {
        email: `${username.toLowerCase()}@n8n.local`, // placeholder email
        username: username.toLowerCase(),
        password: "", // No password - user sets it on first n8n visit
        role: "USER",
        isActive: true,
      },
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      n8nUrl: managerData.url || `https://${username.toLowerCase()}.${BASE_DOMAIN}`,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Toggle user active status
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { userId, isActive } = await request.json();

    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return NextResponse.json({
      id: user.id,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user before deleting to notify manager (optional)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete from local database
    await prisma.user.delete({
      where: { id: userId },
    });

    // Optionally notify manager to delete the container
    // This depends on your manager API capabilities
    try {
      await fetch(`${MANAGER_URL}/api/delete-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MANAGER_SECRET}`,
        },
        body: JSON.stringify({ username: user.username }),
      });
    } catch (e) {
      // Log but don't fail if manager deletion fails
      console.warn("Failed to notify manager of user deletion:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
