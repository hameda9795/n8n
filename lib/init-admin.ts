import { prisma } from "./db";
import bcrypt from "bcryptjs";

export async function initAdmin() {
  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    return { created: false, email: existingAdmin.email };
  }

  // Get admin credentials from environment
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";

  try {
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

    console.log("✅ Admin user created:", admin.email);
    return { created: true, email: admin.email };
  } catch (error) {
    console.error("Failed to create admin:", error);
    return { created: false, error: "Failed to create admin" };
  }
}
