import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api";

const productSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório"),
  internalCode: z.string().trim().min(1, "Código interno obrigatório"),
  unit: z.enum(["UNIDADE", "CAIXA", "PACOTE", "LITRO", "KG"]),
  minimumStock: z.coerce.number().int().min(0).default(0),
  currentStock: z.coerce.number().int().min(0).default(0),
  status: z.enum(["ATIVO", "INATIVO"]).default("ATIVO"),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status") as "ATIVO" | "INATIVO" | null;
  const lowStock = searchParams.get("lowStock") === "true";

  const products = await prisma.product.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { internalCode: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  const filtered = lowStock
    ? products.filter((p) => p.currentStock <= p.minimumStock)
    : products;

  return ok(filtered);
}

export async function POST(request: Request) {
  try {
    const body = productSchema.parse(await request.json());

    const existingProduct = await prisma.product.findFirst({
      where: {
        internalCode: body.internalCode,
      },
    });

    if (existingProduct) {
      return fail(
        "Não foi possível cadastrar o produto. Já existe outro produto cadastrado com este código."
      );
    }

    const product = await prisma.product.create({
      data: body,
    });

    return ok(product, 201);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao criar produto.";

    return fail(message);
  }
}