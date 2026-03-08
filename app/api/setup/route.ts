import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== "maxhmd2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const results: string[] = [];

  try {
    // Step 1: Run prisma db push
    try {
      execSync("npx prisma db push --accept-data-loss", {
        stdio: "pipe",
        env: process.env,
        timeout: 60000,
      });
      results.push("✅ Database tables created");
    } catch (e: any) {
      results.push("⚠️ DB Push: " + e.message);
    }

    // Step 2: Check if admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      results.push(`✅ Admin already exists: ${existingAdmin.email}`);
    } else {
      // Step 3: Create admin
      const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          username: adminUsername,
          password: hashedPassword,
          role: "ADMIN",
          isActive: true,
        },
      });

      results.push(`✅ Admin created: ${admin.email} / ${adminPassword}`);
    }

    return NextResponse.json({
      success: true,
      results,
      login: {
        email: process.env.ADMIN_EMAIL || "admin@example.com",
        password: process.env.ADMIN_PASSWORD || "admin123",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Setup failed",
        message: error.message,
        results,
      },
      { status: 500 }
    );
  }
}
