import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";

export async function GET() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalProducts, activeProducts, lowStockProducts, todayMovements, recentMovements] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "ATIVO" } }),
    prisma.product.findMany({
      where: { status: "ATIVO" },
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({ where: { createdAt: { gte: startOfDay } } }),
    prisma.stockMovement.findMany({
      include: { product: { select: { name: true, internalCode: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const entradaHoje = todayMovements
    .filter((m) => m.type === "ENTRADA")
    .reduce((sum, m) => sum + m.quantity, 0);

  const saidaHoje = todayMovements
    .filter((m) => m.type === "SAIDA")
    .reduce((sum, m) => sum + m.quantity, 0);

  return ok({
    totalProducts,
    activeProducts,
    lowStockCount: lowStockProducts.filter((p) => p.currentStock <= p.minimumStock).length,
    lowStockProducts: lowStockProducts.filter((p) => p.currentStock <= p.minimumStock).slice(0, 20),
    entradaHoje,
    saidaHoje,
    recentMovements,
  });
}
