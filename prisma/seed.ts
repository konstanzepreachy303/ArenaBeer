import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@admin.com",
    },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@admin.com",
      passwordHash,
      role: "ADMIN",
      status: "ATIVO",
      mustChangePassword: true,
    },
  });

  await prisma.setting.upsert({
    where: {
      id: "default",
    },
    update: {
      companyName: "Arena Estoque",
      defaultMinimumStock: 5,
    },
    create: {
      id: "default",
      companyName: "Arena Estoque",
      defaultMinimumStock: 5,
    },
  });

  console.log("Seed executado com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });