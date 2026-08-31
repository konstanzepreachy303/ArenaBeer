"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Edit3,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type Role = "ADMIN" | "OPERADOR";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("OPERADOR");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchUsers(): Promise<User[]> {
    const r = await fetch("/api/users", {
      cache: "no-store",
    });

    const d = await r.json();

    return Array.isArray(d) ? d : [];
  }

  async function load() {
    const data = await fetchUsers();
    setUsers(data);
  }

  useEffect(() => {
    let cancelled = false;

    void fetchUsers().then((data) => {
      if (cancelled) return;

      setUsers(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function reset() {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("OPERADOR");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    const r = await fetch(
      editingId
        ? `/api/users/${editingId}`
        : "/api/users",
      {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      }
    );

    const d = await r.json();

    setSaving(false);

    if (!r.ok) {
      setMessage(
        d?.error ||
          "Não foi possível salvar o usuário."
      );
      return;
    }

    setMessage(
      editingId
        ? "Usuário atualizado com sucesso."
        : "Usuário criado com sucesso."
    );

    reset();

    await load();
  }

  function edit(u: User) {
    setEditingId(u.id);
    setName(u.name);
    setEmail(u.email);
    setPassword("");
    setRole(u.role);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function del(id: string) {
    if (
      !confirm(
        "Deseja realmente excluir este usuário?"
      )
    ) {
      return;
    }

    const r = await fetch(
      `/api/users/${id}`,
      {
        method: "DELETE",
      }
    );

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
      <header>
        <p className="eyebrow">
          Acesso
        </p>

        <h2 className="page-title">
          Usuários
        </h2>

        <p className="page-subtitle">
          Controle quem pode acessar e operar o sistema.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="card p-5 sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100">
            <UserPlus size={18} />
          </div>

          <div>
            <h3 className="section-title">
              {editingId
                ? "Editar usuário"
                : "Novo usuário"}
            </h3>

            <p className="text-sm text-slate-500">
              Defina os dados de acesso e o perfil.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold">
            Nome

            <input
              className="input"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            E-mail

            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            {editingId
              ? "Nova senha"
              : "Senha"}

            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder={
                editingId
                  ? "Deixe vazio para manter"
                  : "Digite uma senha"
              }
              required={!editingId}
            />
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            Perfil

            <select
              className="input"
              value={role}
              onChange={(e) =>
                setRole(
                  e.target.value as Role
                )
              }
            >
              <option value="ADMIN">
                Administrador
              </option>

              <option value="OPERADOR">
                Operador
              </option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? "Salvando..."
              : editingId
                ? "Salvar alterações"
                : "Criar usuário"}
          </button>

          {editingId && (
            <button
              type="button"
              className="btn btn-light"
              onClick={reset}
            >
              <X size={16} />
              Cancelar
            </button>
          )}
        </div>

        {message && (
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            {message}
          </p>
        )}
      </form>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <Users
              size={20}
              className="text-slate-400"
            />

            <div>
              <h3 className="section-title">
                Usuários cadastrados
              </h3>

              <p className="text-sm text-slate-500">
                {users.length} acesso(s) configurado(s)
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 font-extrabold text-slate-600">
                  {u.name
                    .slice(0, 1)
                    .toUpperCase()}
                </div>

                <div>
                  <p className="font-bold text-slate-800">
                    {u.name}
                  </p>

                  <p className="text-sm text-slate-500">
                    {u.email}
                  </p>

                  <span
                    className={`badge mt-2 ${
                      u.role === "ADMIN"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {u.role === "ADMIN" ? (
                      <ShieldCheck
                        size={13}
                      />
                    ) : null}

                    {u.role === "ADMIN"
                      ? "Administrador"
                      : "Operador"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="btn btn-light !px-3 !py-2"
                  onClick={() =>
                    edit(u)
                  }
                >
                  <Edit3 size={15} />
                  Editar
                </button>

                <button
                  className="btn btn-danger !px-3 !py-2"
                  onClick={() =>
                    del(u.id)
                  }
                >
                  <Trash2 size={15} />
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <p className="p-10 text-center text-slate-500">
              Nenhum usuário cadastrado.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}