import { prisma } from "@/lib/prisma";
import ConfiguracoesForm from "./ConfiguracoesForm";

export default async function Configuracoes() {
  const settings = await prisma.setting.findFirst();

  return (
    <ConfiguracoesForm companyName={settings?.companyName || "Arena Estoque"} />
  );
}