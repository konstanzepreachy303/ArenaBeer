import { NextResponse } from "next/server";
import { prisma } from "./prisma";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getUserId(request: Request) {
  const headerUserId = request.headers.get("x-user-id");
  if (headerUserId) return headerUserId;

  const user = await prisma.user.findFirst({
    where: { status: "ATIVO" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!user) throw new Error("Nenhum usuário ativo encontrado.");
  return user.id;
}

export function asPositiveInt(value: unknown, field: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${field} precisa ser um número inteiro maior que zero.`);
  }
  return number;
}

export function asNonNegativeInt(value: unknown, field: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${field} precisa ser um número inteiro maior ou igual a zero.`);
  }
  return number;
}
