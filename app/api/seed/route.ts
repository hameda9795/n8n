import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Temporary seed endpoint - REMOVE AFTER USE
export async function GET(request: NextRequest) {
  // Check for secret to prevent unauthorized access
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  
  if (secret !== "setup123") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      return NextResponse.json({
        message: "Admin already exists",
        email: existingAdmin.email,
        username: existingAdmin.username,
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        username: "admin",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Admin created successfully",
      email: admin.email,
      username: admin.username,
      password: "admin123",
      note: "Please delete this file after setup: app/api/seed/route.ts",
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}
