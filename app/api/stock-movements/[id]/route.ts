import { prisma } from "@/lib/prisma";
import { fail, getUserId, ok } from "@/lib/api";
import { revertLatestMovement } from "@/lib/stock";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(request);
    const { id } = await params;
    const result = await prisma.$transaction((tx) => revertLatestMovement(tx, id, userId));
    return ok({ message: "Movimentação estornada com sucesso.", ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao estornar movimentação.";
    return fail(message, message === "UNAUTHORIZED" ? 401 : 400);
  }
}
