import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, getUserId, ok } from "@/lib/api";
import { applyStockMovement } from "@/lib/stock";
import { parseDateOnly } from "@/lib/dates";

const movementSchema = z.object({
  productId: z.string().min(1, "Selecione um produto."),
  type: z.enum(["ENTRADA", "SAIDA"]),
  reason: z.enum(["COMPRA", "AJUSTE", "DEVOLUCAO", "VENDA", "PERDA", "QUEBRA", "CONSUMO_INTERNO"]),
  quantity: z.coerce.number().int().positive("A quantidade deve ser maior que zero."),
  movementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  observation: z.string().trim().max(1000, "A observação deve ter no máximo 1000 caracteres.").optional(),
}).superRefine((data, ctx) => {
  const entrada = ["COMPRA", "AJUSTE", "DEVOLUCAO"];
  const saida = ["VENDA", "AJUSTE", "PERDA", "QUEBRA", "CONSUMO_INTERNO"];
  const valid = data.type === "ENTRADA" ? entrada.includes(data.reason) : saida.includes(data.reason);
  if (!valid) ctx.addIssue({ code: "custom", path: ["reason"], message: "Motivo incompatível com o tipo de movimentação." });
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") || undefined;
  const type = searchParams.get("type") as "ENTRADA" | "SAIDA" | null;

  const movements = await prisma.stockMovement.findMany({
    where: { ...(productId ? { productId } : {}), ...(type ? { type } : {}) },
    include: {
      product: { select: { name: true, internalCode: true, unit: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: [{ movementDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: 200,
  });

  return ok(movements);
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request);
    const body = movementSchema.parse(await request.json());

    const result = await prisma.$transaction((tx) =>
      applyStockMovement(tx, {
        productId: body.productId,
        userId,
        type: body.type,
        reason: body.reason,
        quantity: body.quantity,
        movementDate: parseDateOnly(body.movementDate),
        observation: body.observation,
      })
    );

    return ok(result, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message || "Dados inválidos.", 400);
    const message = error instanceof Error ? error.message : "Erro ao movimentar estoque.";
    return fail(message, message === "UNAUTHORIZED" ? 401 : 400);
  }
}
