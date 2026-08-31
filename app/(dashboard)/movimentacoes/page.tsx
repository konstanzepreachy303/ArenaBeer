"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  CheckCircle2,
  Eye,
  History,
  Loader2,
  Package,
  Plus,
  TriangleAlert,
  X,
} from "lucide-react";

type MovementType = "ENTRADA" | "SAIDA";

type MovementReason =
  | "COMPRA"
  | "AJUSTE"
  | "DEVOLUCAO"
  | "VENDA"
  | "PERDA"
  | "QUEBRA"
  | "CONSUMO_INTERNO";

const reasonsByType: Record<MovementType, MovementReason[]> = {
  ENTRADA: ["COMPRA", "AJUSTE", "DEVOLUCAO"],
  SAIDA: ["VENDA", "AJUSTE", "PERDA", "QUEBRA", "CONSUMO_INTERNO"],
};

const labels: Record<string, string> = {
  COMPRA: "Compra",
  AJUSTE: "Ajuste",
  DEVOLUCAO: "Devolução",
  VENDA: "Venda",
  PERDA: "Perda",
  QUEBRA: "Quebra",
  CONSUMO_INTERNO: "Consumo interno",
};

function todayKey() {
  const d = new Date();
  const off = d.getTimezoneOffset();

  return new Date(d.getTime() - off * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatDate(v: string) {
  const [, m, d] = v.slice(0, 10).split("-");
  return `${d}/${m}/${v.slice(0, 4)}`;
}

type Product = {
  id: string;
  name: string;
  internalCode: string;
  currentStock: number;
  unit: string;
  status: string;
};

type Movement = {
  id: string;
  movementDate: string;
  type: string;
  reason: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  observation?: string | null;

  product: {
    name: string;
    internalCode: string;
    unit: string;
  };

  user: {
    name: string;
  };
};

export default function Movimentacoes() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedObservation, setSelectedObservation] =
    useState<string | null>(null);

  const lock = useRef(false);

  const [form, setForm] = useState({
    productId: "",
    type: "ENTRADA" as MovementType,
    reason: "COMPRA" as MovementReason,
    quantity: 1,
    movementDate: todayKey(),
    observation: "",
  });

  async function fetchData() {
    const [p, m] = await Promise.all([
      fetch("/api/products", {
        cache: "no-store",
      }),
      fetch("/api/stock-movements", {
        cache: "no-store",
      }),
    ]);

    const pd = await p.json();
    const md = await m.json();

    return {
      products: (Array.isArray(pd) ? pd : []).filter(
        (x: Product) => x.status === "ATIVO"
      ),
      movements: Array.isArray(md) ? md : [],
    };
  }

  async function load() {
    const data = await fetchData();

    setProducts(data.products);
    setMovements(data.movements);
  }

  useEffect(() => {
    let cancelled = false;

    void fetchData().then((data) => {
      if (cancelled) return;

      setProducts(data.products);
      setMovements(data.movements);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedObservation(null);
      }
    };

    window.addEventListener("keydown", f);

    return () => {
      window.removeEventListener("keydown", f);
    };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (lock.current) return;

    lock.current = true;

    setIsSubmitting(true);
    setMsg("");
    setMsgType("");

    try {
      const r = await fetch("/api/stock-movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
        }),
      });

      const d = await r.json();

      if (!r.ok) {
        setMsg(
          d?.error ||
            "Não foi possível registrar a movimentação."
        );

        setMsgType("error");
        return;
      }

      setMsg("Movimentação registrada com sucesso.");
      setMsgType("success");

      setForm((c) => ({
        ...c,
        quantity: 1,
        observation: "",
      }));

      await load();
    } catch {
      setMsg(
        "Não foi possível concluir a movimentação. Tente novamente."
      );

      setMsgType("error");
    } finally {
      lock.current = false;
      setIsSubmitting(false);
    }
  }

  const selected = products.find(
    (p) => p.id === form.productId
  );

  return (
    <div className="page-shell space-y-6">
      <header>
        <p className="eyebrow">Operação</p>

        <h2 className="page-title">
          Movimentações
        </h2>

        <p className="page-subtitle">
          Registre entradas e saídas mantendo o histórico do estoque em ordem.
        </p>
      </header>

      <form
        onSubmit={submit}
        className={`card p-5 sm:p-6 ${
          isSubmitting ? "ring-2 ring-slate-200" : ""
        }`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-11 w-11 place-items-center rounded-2xl ${
                form.type === "ENTRADA"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {form.type === "ENTRADA" ? (
                <ArrowDownToLine size={21} />
              ) : (
                <ArrowUpFromLine size={21} />
              )}
            </div>

            <div>
              <h3 className="section-title">
                Novo lançamento
              </h3>

              <p className="text-sm text-slate-500">
                A data é editável, mas não pode voltar antes do histórico do produto.
              </p>
            </div>
          </div>

          {selected && (
            <span className="hidden rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 sm:block">
              Saldo atual: {selected.currentStock}{" "}
              {selected.unit}
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1.5 text-sm font-semibold xl:col-span-2">
            Produto

            <select
              required
              className="input"
              value={form.productId}
              disabled={isSubmitting}
              onChange={(e) =>
                setForm({
                  ...form,
                  productId: e.target.value,
                })
              }
            >
              <option value="">
                Selecione o produto...
              </option>

              {products.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.name} — estoque {p.currentStock}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={15} />
              Data
            </span>

            <input
              className="input"
              type="date"
              required
              value={form.movementDate}
              disabled={isSubmitting}
              onChange={(e) =>
                setForm({
                  ...form,
                  movementDate: e.target.value,
                })
              }
            />
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            Tipo

            <select
              className="input"
              value={form.type}
              disabled={isSubmitting}
              onChange={(e) => {
                const t =
                  e.target.value as MovementType;

                setForm({
                  ...form,
                  type: t,
                  reason: reasonsByType[t][0],
                });
              }}
            >
              <option value="ENTRADA">
                Entrada
              </option>

              <option value="SAIDA">
                Saída
              </option>
            </select>
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            Motivo

            <select
              className="input"
              value={form.reason}
              disabled={isSubmitting}
              onChange={(e) =>
                setForm({
                  ...form,
                  reason:
                    e.target
                      .value as MovementReason,
                })
              }
            >
              {reasonsByType[form.type].map(
                (r) => (
                  <option key={r} value={r}>
                    {labels[r]}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            Quantidade

            <input
              className="input"
              type="number"
              min="1"
              required
              value={form.quantity}
              disabled={isSubmitting}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity: Number(
                    e.target.value
                  ),
                })
              }
            />
          </label>
        </div>

        <label className="mt-4 block space-y-1.5 text-sm font-semibold">
          Observação
          <span className="font-normal text-slate-400">
            {" "}
            (opcional)
          </span>

          <textarea
            className="input min-h-24 resize-y"
            maxLength={1000}
            value={form.observation}
            disabled={isSubmitting}
            placeholder="Adicione uma observação para este lançamento..."
            onChange={(e) =>
              setForm({
                ...form,
                observation: e.target.value,
              })
            }
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary min-w-48"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Registrando...
              </>
            ) : (
              <>
                <Plus size={17} />
                Registrar movimentação
              </>
            )}
          </button>

          {isSubmitting && (
            <span className="text-sm font-medium text-slate-500">
              Aguarde a conclusão para evitar lançamentos duplicados.
            </span>
          )}
        </div>

        {msg && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
              msgType === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {msgType === "error" ? (
              <TriangleAlert size={17} />
            ) : (
              <CheckCircle2 size={17} />
            )}

            {msg}
          </div>
        )}
      </form>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="section-title">
              Histórico de movimentações
            </h3>

            <p className="text-sm text-slate-500">
              Exibindo os lançamentos mais recentes.
            </p>
          </div>

          <History
            size={20}
            className="text-slate-400"
          />
        </div>

        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-4">Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Qtd.</th>
                <th>Antes</th>
                <th>Depois</th>
                <th>Usuário</th>
                <th>Obs.</th>
              </tr>
            </thead>

            <tbody>
              {movements.map((m) => (
                <tr
                  className="border-t border-slate-100"
                  key={m.id}
                >
                  <td className="p-4 whitespace-nowrap font-semibold text-slate-600">
                    {formatDate(m.movementDate)}
                  </td>

                  <td>
                    <div className="font-bold text-slate-800">
                      {m.product?.name}
                    </div>

                    <div className="text-xs text-slate-400">
                      {m.product?.internalCode}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        m.type === "ENTRADA"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {m.type === "ENTRADA"
                        ? "Entrada"
                        : "Saída"}
                    </span>
                  </td>

                  <td className="font-medium">
                    {labels[m.reason] ||
                      m.reason}
                  </td>

                  <td className="font-extrabold">
                    {m.quantity}
                  </td>

                  <td>{m.previousStock}</td>

                  <td className="font-bold">
                    {m.newStock}
                  </td>

                  <td className="text-slate-500">
                    {m.user?.name}
                  </td>

                  <td>
                    {m.observation ? (
                      <button
                        type="button"
                        className="btn btn-light !rounded-full !px-3 !py-1.5 text-xs"
                        onClick={() =>
                          setSelectedObservation(
                            m.observation || ""
                          )
                        }
                      >
                        <Eye size={14} />
                        Ver
                      </button>
                    ) : (
                      <span className="text-slate-300">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {movements.length === 0 && (
          <div className="p-10 text-center">
            <Package
              className="mx-auto text-slate-300"
              size={34}
            />

            <p className="mt-3 font-semibold text-slate-600">
              Nenhuma movimentação registrada.
            </p>
          </div>
        )}
      </section>

      {selectedObservation !== null && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setSelectedObservation(
                null
              );
            }
          }}
        >
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">
                  Detalhe do lançamento
                </p>

                <h3 className="mt-1 text-xl font-extrabold">
                  Observação
                </h3>
              </div>

              <button
                className="btn btn-light !p-2"
                onClick={() =>
                  setSelectedObservation(
                    null
                  )
                }
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 max-h-[55vh] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 whitespace-pre-wrap">
              {selectedObservation ||
                "Nenhuma observação informada."}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                className="btn btn-primary"
                onClick={() =>
                  setSelectedObservation(
                    null
                  )
                }
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}