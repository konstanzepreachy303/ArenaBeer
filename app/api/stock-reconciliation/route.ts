import { prisma } from "@/lib/prisma";
import { fail, getUserId, ok } from "@/lib/api";
import { reconcileProduct } from "@/lib/stock";

export async function GET(request: Request) {
  try {
    await getUserId(request);
    const products = await prisma.product.findMany({ select: { id: true }, orderBy: { name: "asc" } });
    const results = [];
    for (const product of products) {
      results.push(await prisma.$transaction((tx) => reconcileProduct(tx, product.id)));
    }
    return ok({
      checkedAt: new Date().toISOString(),
      consistent: results.every((r) => r.consistent),
      divergences: results.filter((r) => !r.consistent),
      products: results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao conferir estoque.";
    return fail(message, message === "UNAUTHORIZED" ? 401 : 400);
  }
}
