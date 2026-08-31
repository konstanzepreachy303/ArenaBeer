import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: { name: string; email: string; role: Role; passwordHash?: string } = {
    name: body.name,
    email: body.email,
    role: body.role as Role,
  };
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true } });
  return NextResponse.json(user);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
