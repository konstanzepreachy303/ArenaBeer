import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import {
AlertTriangle,
ArrowDownToLine,
ArrowUpFromLine,
Boxes,
PackageCheck,
PackageX,
Activity,
} from "lucide-react";
import { brazilDateKey, parseDateOnly } from "@/lib/dates";

function fmtDate(d: Date) {
return new Intl.DateTimeFormat("pt-BR").format(d);
}

type DashboardProps = {
  searchParams: Promise<{
    data?: string;
  }>;
};

export default async function Dashboard({
  searchParams,
}: DashboardProps) {
const params = await searchParams;

const today = brazilDateKey();

const selectedDate =
  params.data && /^\d{4}-\d{2}-\d{2}$/.test(params.data)
    ? params.data
    : today;

const selectedDateObj = parseDateOnly(selectedDate);

const hour = Number(
new Intl.DateTimeFormat("pt-BR", {
hour: "2-digit",
hour12: false,
timeZone: "America/Sao_Paulo",
}).format(new Date())
);

const greeting =
hour >= 5 && hour < 12
? "Bom dia"
: hour >= 12 && hour < 18
? "Boa tarde"
: "Boa noite";

const [products, movements] = await Promise.all([
  prisma.product.findMany({
    orderBy: { name: "asc" },
  }),

  prisma.stockMovement.findMany({
    where: {
        movementDate: selectedDateObj,
      },
    include: {
      product: {
        select: {
          name: true,
          unit: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8,
  }),
]);

const active = products.filter((p) => p.status === "ATIVO");

const totalStock = active.reduce(
(sum, product) => sum + product.currentStock,
0
);

const low = active.filter(
(product) =>
product.currentStock > 0 &&
product.currentStock <= product.minimumStock
);

const zero = active.filter(
(product) => product.currentStock === 0
);

const entrada = movements
.filter((movement) => movement.type === "ENTRADA")
.reduce(
(sum, movement) => sum + movement.quantity,
0
);

const saida = movements
.filter((movement) => movement.type === "SAIDA")
.reduce(
(sum, movement) => sum + movement.quantity,
0
);

const normal = active.filter(
(product) =>
product.currentStock > product.minimumStock
);

return (
  <div className="page-shell space-y-5">
    <header className="dashboard-hero">
  <div className="grid gap-5 xl:grid-cols-[1fr_auto_1fr] xl:items-center">

    {/* COLUNA ESQUERDA - EQUILIBRA O CENTRO */}
    <div className="hidden xl:block" />

    {/* TÍTULO CENTRALIZADO */}
    <div className="text-center">
      <p className="eyebrow">
        Visão geral
      </p>

      <h2 className="page-title whitespace-nowrap">
        {greeting}! Aqui está o seu estoque.
      </h2>

      <p className="page-subtitle">
        Acompanhe a posição atual e o que aconteceu em{" "}
        {fmtDate(selectedDateObj)}.
      </p>
    </div>

    {/* DATA */}
    <form
      method="GET"
      className="flex items-end justify-center gap-2 xl:justify-self-end"
    >
      <div>
        <label
          htmlFor="data"
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          Data de referência
        </label>

        <input
          id="data"
          name="data"
          type="date"
          defaultValue={selectedDate}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <button
        type="submit"
        className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
      >
        Consultar
      </button>
    </form>

  </div>
</header>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <StatCard
      title="Produtos ativos"
      value={active.length}
      description="Itens disponíveis no cadastro"
      icon={Boxes}
    />

    <StatCard
      title="Itens em estoque"
      value={totalStock}
      description="Saldo atual dos produtos ativos"
      icon={PackageCheck}
      tone="emerald"
    />

    <StatCard
      title="Estoque baixo"
      value={low.length}
      description="Atingiram o estoque mínimo"
      icon={AlertTriangle}
      tone="amber"
    />

    <StatCard
      title="Estoque zerado"
      value={zero.length}
      description="Precisam de reposição"
      icon={PackageX}
      tone="rose"
    />
  </div>

  <div className="grid gap-4 lg:grid-cols-3">
    <div className="card p-5 lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">
            Movimentação do dia
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Entradas e saídas registradas em{" "}
          {fmtDate(selectedDateObj)}.
          </p>
        </div>

        <Activity
          className="text-slate-400"
          size={21}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <ArrowDownToLine size={17} />

            <span className="text-xs font-bold uppercase tracking-wider">
              Entradas
            </span>
          </div>

          <strong className="mt-2 block text-2xl font-extrabold text-emerald-800">
            {entrada}
          </strong>

          <span className="text-xs text-emerald-700">
            unidades movimentadas
          </span>
        </div>

        <div className="rounded-2xl bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-rose-700">
            <ArrowUpFromLine size={17} />

            <span className="text-xs font-bold uppercase tracking-wider">
              Saídas
            </span>
          </div>

          <strong className="mt-2 block text-2xl font-extrabold text-rose-800">
            {saida}
          </strong>

          <span className="text-xs text-rose-700">
            unidades movimentadas
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full min-w-0 text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="p-3">Produto</th>
              <th>Tipo</th>
              <th>Qtd.</th>
              <th>Usuário</th>
            </tr>
          </thead>

          <tbody>
            {movements.map((movement) => (
              <tr
                key={movement.id}
                className="border-t border-slate-100"
              >
                <td className="p-3 font-semibold">
                  {movement.product.name}
                </td>

                <td>
                  <span
                    className={`badge ${
                      movement.type === "ENTRADA"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {movement.type === "ENTRADA"
                      ? "Entrada"
                      : "Saída"}
                  </span>
                </td>

                <td className="font-semibold">
                  {movement.quantity}{" "}
                  {movement.product.unit}
                </td>

                <td className="text-slate-500">
                  {movement.user.name}
                </td>
              </tr>
            ))}

            {movements.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-sm text-slate-400"
                >
                  Nenhuma movimentação registrada em{" "} {fmtDate(selectedDateObj)}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    <div className="card p-5">
      <div>
        <p className="section-title">
          Resumo do estoque
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Situação atual dos produtos ativos.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Produtos ativos
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Disponíveis para movimentação
            </p>
          </div>

          <strong className="text-xl font-extrabold text-slate-800">
            {active.length}
          </strong>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Estoque normal
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              Acima do mínimo
            </p>
          </div>

          <strong className="text-xl font-extrabold text-emerald-800">
            {normal.length}
          </strong>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Estoque baixo
            </p>

            <p className="mt-1 text-xs text-amber-700">
              Próximos do limite mínimo
            </p>
          </div>

          <strong className="text-xl font-extrabold text-amber-800">
            {low.length}
          </strong>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-rose-50 p-4">
          <div>
            <p className="text-sm font-semibold text-rose-800">
              Estoque zerado
            </p>

            <p className="mt-1 text-xs text-rose-700">
              Necessitam reposição
            </p>
          </div>

          <strong className="text-xl font-extrabold text-rose-800">
            {zero.length}
          </strong>
        </div>
       </div>
    </div>
  </div>
</div>

);
}