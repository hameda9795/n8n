import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("Admin already exists:");
    console.log(`  Email: ${existingAdmin.email}`);
    console.log(`  Username: ${existingAdmin.username}`);
    return;
  }

  // Get from env or use defaults
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

  console.log("Admin user created successfully:");
  console.log(`  Email: ${admin.email}`);
  console.log(`  Username: ${admin.username}`);
  console.log(`  Password: ${adminPassword}`);
  console.log("\nChange the password after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
