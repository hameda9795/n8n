import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("Admin user already exists:");
    console.log(`  Email: ${existingAdmin.email}`);
    console.log(`  Username: ${existingAdmin.username}`);
    return;
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

  console.log("Admin user created successfully:");
  console.log(`  Email: ${admin.email}`);
  console.log(`  Username: ${admin.username}`);
  console.log(`  Password: admin123`);
  console.log("\nPlease change the password after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
