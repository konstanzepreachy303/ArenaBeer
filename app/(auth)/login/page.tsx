"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LockKeyhole, LogIn, Mail } from "lucide-react";

export default function Login() {
  const r = useRouter();

  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (res.ok) {
        r.push("/dashboard");
      } else {
        setError("E-mail ou senha inválidos.");
      }
    } catch {
      setError("Não foi possível conectar ao sistema.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto flex h-24 w-56 items-center justify-center">
            <Image
              src="/Logo-Arena-Beer.png"
              alt="Arena Beer"
              width={224}
              height={96}
              className="max-h-24 w-auto object-contain drop-shadow-2xl"
              priority
            />
          </div>

          <h1 className="mt-4 text-2xl font-extrabold">
            Arena Estoque
          </h1>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[26px] border border-white/50 bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,.28)] sm:p-8"
        >
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-900">
              Acesse sua conta
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Informe seus dados para continuar.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block space-y-1.5 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <Mail size={15} />
                E-mail
              </span>

              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </label>

            <label className="block space-y-1.5 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <LockKeyhole size={15} />
                Senha
              </span>

              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />
            </label>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn size={17} />
                  Entrar no sistema
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>© 2026 Arena Beer — Todos os direitos reservados</p>

          <p className="mt-1">
            Desenvolvido por: Gabriel Honorato
          </p>
        </div>
      </div>
    </main>
  );
}