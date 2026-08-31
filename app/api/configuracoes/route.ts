import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getSettings() {
  let settings = await prisma.setting.findFirst();

  if (!settings) {
    settings = await prisma.setting.create({
      data: {
        companyName: "Arena Estoque",
      },
    });
  }

  return settings;
}

export async function PUT(req: Request) {
  const body = await req.json();

  const currentSettings = await getSettings();

  const updatedSettings = await prisma.setting.update({
    where: {
      id: currentSettings.id,
    },
    data: {
      companyName: body.companyName,
    },
  });

  return NextResponse.json(updatedSettings);
}