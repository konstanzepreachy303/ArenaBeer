import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Boxes },
  { href: "/movimentacoes", label: "Movimentações", icon: ClipboardList },
  { href: "/resumo-diario", label: "Resumo Diário", icon: BarChart3 },
  { href: "/auditoria", label: "Auditoria", icon: FileClock },
  { href: "/usuarios", label: "Usuários", icon: Users },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export async function Sidebar() {
  const settings = await prisma.setting.findFirst();

  return (
    <aside className="w-full border-b border-slate-800/80 bg-[#0b1220] text-white md:sticky md:top-0 md:h-screen md:min-h-screen md:w-[260px] md:shrink-0 md:border-b-0 md:border-r md:border-slate-800/80 md:p-4">
      <div className="flex items-center justify-between px-4 py-4 md:block md:px-2 md:py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/20">
            <Image
              src="/Logo-Arena-Beer.png"
              alt="Arena Beer"
              width={56}
              height={56}
              className="h-full w-full object-contain p-1"
            />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-500">
              Gestão de estoque
            </p>

            <h1 className="truncate text-base font-extrabold leading-tight text-white">
              {settings?.companyName || "Arena Estoque"}
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:mt-8 md:block md:space-y-1 md:px-1 md:pb-0">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex shrink-0 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-[13px] font-semibold text-slate-400 transition hover:border-white/5 hover:bg-white/[.07] hover:text-white md:px-3.5"
          >
            <Icon
              size={17}
              strokeWidth={2.1}
              className="text-slate-500 transition group-hover:text-slate-200"
            />

            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}