"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  CalendarDays,
  Search,
} from "lucide-react";

type Row = {
  id: string;
  name: string;
  internalCode: string;
  unit: string;
  currentStock: number;
  entrada: number;
  saida: number;
};

function todayKey() {
  const d = new Date();
  const off = d.getTimezoneOffset();

  return new Date(d.getTime() - off * 60000)
    .toISOString()
    .slice(0, 10);
}

export default function ResumoDiario() {
  const [start, setStart] = useState(todayKey);
  const [end, setEnd] = useState(todayKey);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(s = start, e = end) {
    setLoading(true);
    setError("");

    try {
      const r = await fetch(
        `/api/daily-summary?start=${s}&end=${e}`,
        {
          cache: "no-store",
        }
      );

      const d = await r.json();

      if (!r.ok) {
        setError(
          d?.error ||
            "Não foi possível consultar o período."
        );
        return;
      }

      setRows(d.products || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const today = todayKey();

    void fetch(
      `/api/daily-summary?start=${today}&end=${today}`,
      {
        cache: "no-store",
      }
    )
      .then(async (r) => {
        const d = await r.json();

        if (cancelled) {
          return;
        }

        if (!r.ok) {
          setError(
            d?.error ||
              "Não foi possível consultar o período."
          );
          return;
        }

        setRows(d.products || []);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    void load();
  }

  const te = rows.reduce(
    (a, r) => a + r.entrada,
    0
  );

  const ts = rows.reduce(
    (a, r) => a + r.saida,
    0
  );

  return (
    <div className="page-shell space-y-6">
      <header>
        <p className="eyebrow">
          Consulta
        </p>

        <h2 className="page-title">
          Resumo Diário
        </h2>

        <p className="page-subtitle">
          Veja o saldo atual e tudo que entrou ou saiu em qualquer período.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="card p-5"
      >
        <div className="flex items-end gap-3 flex-wrap">
          <label className="min-w-48 flex-1 space-y-1.5 text-sm font-semibold">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={15} />
              Data inicial
            </span>

            <input
              className="input"
              type="date"
              value={start}
              onChange={(e) =>
                setStart(e.target.value)
              }
              required
            />
          </label>

          <label className="min-w-48 flex-1 space-y-1.5 text-sm font-semibold">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={15} />
              Data final
            </span>

            <input
              className="input"
              type="date"
              value={end}
              onChange={(e) =>
                setEnd(e.target.value)
              }
              required
            />
          </label>

          <button
            className="btn btn-primary"
            disabled={loading}
          >
            <Search size={16} />

            {loading
              ? "Consultando..."
              : "Aplicar filtro"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100">
              <BarChart3 size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Produtos ativos
              </p>

              <strong className="text-2xl">
                {rows.length}
              </strong>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <ArrowDownToLine size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Entradas no período
              </p>

              <strong className="text-2xl text-emerald-700">
                {te}
              </strong>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700">
              <ArrowUpFromLine size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Saídas no período
              </p>

              <strong className="text-2xl text-rose-700">
                {ts}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="section-title">
            Posição dos produtos ativos
          </h3>

          <p className="text-sm text-slate-500">
            A quantidade atual é sempre o saldo real do estoque.
          </p>
        </div>

        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-4">
                  Produto
                </th>
                <th>Código</th>
                <th>Unidade</th>
                <th>
                  Quantidade atual
                </th>
                <th>Entrou</th>
                <th>Saiu</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr
                  className="border-t border-slate-100"
                  key={r.id}
                >
                  <td className="p-4 font-bold text-slate-800">
                    {r.name}
                  </td>

                  <td>
                    {r.internalCode}
                  </td>

                  <td>
                    {r.unit}
                  </td>

                  <td className="font-extrabold">
                    {r.currentStock}
                  </td>

                  <td className="font-bold text-emerald-700">
                    +{r.entrada}
                  </td>

                  <td className="font-bold text-rose-700">
                    -{r.saida}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading &&
          rows.length === 0 && (
            <p className="p-8 text-center text-slate-500">
              Nenhum produto ativo encontrado.
            </p>
          )}
      </section>
    </div>
  );
}