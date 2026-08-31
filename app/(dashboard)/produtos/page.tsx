"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Boxes, Edit3, Plus, Search, Trash2, X } from "lucide-react";

type Product = {
  id: string;
  name: string;
  internalCode: string;
  unit: "UNIDADE" | "CAIXA" | "PACOTE" | "LITRO" | "KG";
  currentStock: number;
  minimumStock: number;
  status: "ATIVO" | "INATIVO";
};

type ProductForm = {
  name: string;
  internalCode: string;
  unit: Product["unit"];
  currentStock: number | string;
  minimumStock: number | string;
  status: Product["status"];
};

const emptyForm: ProductForm = {
  name: "",
  internalCode: "",
  unit: "UNIDADE",
  currentStock: 0,
  minimumStock: 0,
  status: "ATIVO",
};

const unitLabel = (u: string) =>
  ({
    UNIDADE: "Unidade",
    CAIXA: "Caixa",
    PACOTE: "Pacote",
    LITRO: "Litro",
    KG: "Kg",
  }[u] || u);

export default function Produtos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchProducts(): Promise<Product[]> {
    const r = await fetch("/api/products", {
      cache: "no-store",
    });

    const d = await r.json();

    return Array.isArray(d) ? d : [];
  }

  async function load() {
    const data = await fetchProducts();
    setProducts(data);
  }

  useEffect(() => {
    let cancelled = false;

    void fetchProducts().then((data) => {
      if (cancelled) return;

      setProducts(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();

    return products.filter((p) =>
      [p.name, p.internalCode, p.unit, p.status].some((v) =>
        String(v).toLowerCase().includes(t)
      )
    );
  }, [products, q]);

  async function submit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const url = editingId
      ? `/api/products/${editingId}`
      : "/api/products";

    const method = editingId ? "PUT" : "POST";

    const payload = editingId
      ? {
          name: form.name,
          internalCode: form.internalCode,
          unit: form.unit,
          minimumStock: Number(form.minimumStock),
          status: form.status,
        }
      : {
          ...form,
          currentStock: Number(form.currentStock),
          minimumStock: Number(form.minimumStock),
        };

    const r = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const d = await r.json();

    setLoading(false);

    if (!r.ok) {
      setMessage(
        d?.error || "Não foi possível salvar o produto."
      );
      return;
    }

    setForm(emptyForm);
    setEditingId(null);

    setMessage(
      editingId
        ? "Produto atualizado com sucesso."
        : "Produto cadastrado com sucesso."
    );

    await load();
  }

  function edit(p: Product) {
    setEditingId(p.id);

    setForm({
      name: p.name,
      internalCode: p.internalCode,
      unit: p.unit,
      currentStock: p.currentStock,
      minimumStock: p.minimumStock,
      status: p.status,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function remove(id: string) {
    if (
      !confirm(
        "Deseja realmente excluir/inativar este produto?"
      )
    ) {
      return;
    }

    const r = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });

    const d = await r.json();

    setMessage(
      d?.message ||
        d?.error ||
        "Operação concluída."
    );

    await load();
  }

  return (
    <div className="page-shell space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Cadastro</p>

          <h2 className="page-title">
            Produtos
          </h2>

          <p className="page-subtitle">
            Organize seu catálogo e acompanhe o saldo de cada item.
          </p>
        </div>

        <div className="relative w-full lg:w-80">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            className="input pl-10"
            placeholder="Buscar por nome ou código..."
            value={q}
            onChange={(e) =>
              setQ(e.target.value)
            }
          />
        </div>
      </header>

      <form
        onSubmit={submit}
        className="card p-5 sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
            {editingId ? (
              <Edit3 size={18} />
            ) : (
              <Plus size={18} />
            )}
          </div>

          <div>
            <h3 className="section-title">
              {editingId
                ? "Editar produto"
                : "Novo produto"}
            </h3>

            <p className="text-sm text-slate-500">
              {editingId
                ? "Atualize os dados cadastrais."
                : "Adicione um item ao estoque."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1.5 text-sm font-semibold">
            Nome

            <input
              className="input"
              required
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            Código interno

            <input
              className="input"
              required
              value={form.internalCode}
              onChange={(e) =>
                setForm({
                  ...form,
                  internalCode: e.target.value,
                })
              }
            />
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            Unidade

            <select
              className="input"
              value={form.unit}
              onChange={(e) =>
                setForm({
                  ...form,
                  unit: e.target
                    .value as Product["unit"],
                })
              }
            >
              {[
                "UNIDADE",
                "CAIXA",
                "PACOTE",
                "LITRO",
                "KG",
              ].map((u) => (
                <option key={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          {!editingId && (
            <label className="space-y-1.5 text-sm font-semibold">
              Estoque inicial

              <input
                className="input"
                type="number"
                min="0"
                value={form.currentStock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    currentStock:
                      e.target.value,
                  })
                }
              />
            </label>
          )}

          <label className="space-y-1.5 text-sm font-semibold">
            Estoque mínimo

            <input
              className="input"
              type="number"
              min="0"
              value={form.minimumStock}
              onChange={(e) =>
                setForm({
                  ...form,
                  minimumStock:
                    e.target.value,
                })
              }
            />
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            Status

            <select
              className="input"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target
                    .value as Product["status"],
                })
              }
            >
              <option>ATIVO</option>
              <option>INATIVO</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="btn btn-primary"
            disabled={loading}
          >
            {loading
              ? "Salvando..."
              : editingId
                ? "Salvar alterações"
                : "Cadastrar produto"}
          </button>

          {editingId && (
            <button
              type="button"
              className="btn btn-light"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              <X size={16} />
              Cancelar
            </button>
          )}
        </div>

        {message && (
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            {message}
          </div>
        )}
      </form>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="section-title">
              Catálogo de produtos
            </h3>

            <p className="text-sm text-slate-500">
              {filtered.length} item(ns) encontrado(s)
            </p>
          </div>

          <Boxes
            size={20}
            className="text-slate-400"
          />
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
                <th>Estoque</th>
                <th>Mínimo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => (
                <tr
                  className="border-t border-slate-100"
                  key={p.id}
                >
                  <td className="p-4">
                    <div className="font-bold text-slate-800">
                      {p.name}
                    </div>
                  </td>

                  <td>
                    {p.internalCode}
                  </td>

                  <td>
                    {unitLabel(p.unit)}
                  </td>

                  <td>
                    <span
                      className={
                        p.currentStock === 0
                          ? "font-extrabold text-rose-600"
                          : p.currentStock <=
                              p.minimumStock
                            ? "font-extrabold text-amber-600"
                            : "font-bold text-slate-800"
                      }
                    >
                      {p.currentStock}
                    </span>
                  </td>

                  <td>
                    {p.minimumStock}
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        p.status === "ATIVO"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-light !px-3 !py-2"
                        onClick={() =>
                          edit(p)
                        }
                        title="Editar"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        className="btn btn-danger !px-3 !py-2"
                        onClick={() =>
                          remove(p.id)
                        }
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <Boxes
              className="mx-auto text-slate-300"
              size={34}
            />

            <p className="mt-3 font-semibold text-slate-600">
              Nenhum produto encontrado.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}