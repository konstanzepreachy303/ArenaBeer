import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { brazilDateKey, parseDateOnly } from "@/lib/dates";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start") || brazilDateKey();
    const end = searchParams.get("end") || start;
    if (start > end) return fail("A data inicial não pode ser maior que a data final.", 400);
    const startDate = parseDateOnly(start);
    const endDate = parseDateOnly(end);

    const products = await prisma.product.findMany({
      where: { status: "ATIVO" },
      select: { id: true, name: true, internalCode: true, unit: true, currentStock: true },
      orderBy: { name: "asc" },
    });

    const grouped = await prisma.stockMovement.groupBy({
      by: ["productId", "type"],
      where: { movementDate: { gte: startDate, lte: endDate }, product: { status: "ATIVO" } },
      _sum: { quantity: true },
    });

    const totals = new Map<string, { entrada: number; saida: number }>();
    for (const row of grouped) {
      const value = totals.get(row.productId) || { entrada: 0, saida: 0 };
      if (row.type === "ENTRADA") value.entrada = row._sum.quantity || 0;
      else value.saida = row._sum.quantity || 0;
      totals.set(row.productId, value);
    }

    return ok({
      start,
      end,
      products: products.map((p) => ({ ...p, entrada: totals.get(p.id)?.entrada || 0, saida: totals.get(p.id)?.saida || 0 })),
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao gerar resumo.", 400);
  }
}
