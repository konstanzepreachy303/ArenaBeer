import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { isAdmin, requireSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!isAdmin(String(session.role))) return fail("Acesso restrito a administradores.", 403);
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity") || undefined;
    const logs = await prisma.auditLog.findMany({
      where: entity ? { entity } : undefined,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return ok(logs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao consultar auditoria.";
    return fail(message, message === "UNAUTHORIZED" ? 401 : 400);
  }
}
