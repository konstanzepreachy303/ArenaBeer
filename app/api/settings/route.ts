import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api";

const settingsSchema = z.object({
  companyName: z.string().trim().min(2).optional(),
  companyLogo: z.string().trim().nullable().optional(),
  defaultMinimumStock: z.coerce.number().int().min(0).optional(),
});

async function getOrCreateSettings() {
  const current = await prisma.setting.findFirst();
  if (current) return current;
  return prisma.setting.create({ data: {} });
}

export async function GET() {
  return ok(await getOrCreateSettings());
}

export async function PUT(request: Request) {
  try {
    const current = await getOrCreateSettings();
    const data = settingsSchema.parse(await request.json());
    const settings = await prisma.setting.update({ where: { id: current.id }, data });
    return ok(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar configurações.";
    return fail(message);
  }
}
