import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  internalCode: z.string().trim().min(1).optional(),
  unit: z.enum(["UNIDADE", "CAIXA", "PACOTE", "LITRO", "KG"]).optional(),
  minimumStock: z.coerce.number().int().min(0).optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return fail("Produto não encontrado.", 404);
  return ok(product);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = updateSchema.parse(await request.json());
    const product = await prisma.product.update({ where: { id }, data });
    return ok(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar produto.";
    return fail(message);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const hasMovements = await prisma.stockMovement.count({ where: { productId: id } });

    if (hasMovements > 0) {
      const product = await prisma.product.update({ where: { id }, data: { status: "INATIVO" } });
      return ok({ message: "Produto possui histórico e foi inativado.", product });
    }

    await prisma.product.delete({ where: { id } });
    return ok({ message: "Produto excluído." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir produto.";
    return fail(message);
  }
}
