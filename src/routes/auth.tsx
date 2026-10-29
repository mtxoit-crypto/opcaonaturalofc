import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { oauthReturnPath } from "@/lib/oauth-return-path";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({ next: oauthReturnPath(search['next']) }),
  head: () => ({
    meta: [
      { title: "Entrar · Opção Natural" },
      { name: "description", content: "Acesse o painel administrativo do catálogo Opção Natural." },
      { property: "og:title", content: "Entrar · Opção Natural" },
      { property: "og:description", content: "Acesso ao painel administrativo do catálogo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const { user, isAdmin, isAdminLoading } = useAuth();
  const navigate = useNavigate();
  const { next = "/" } = Route.useSearch();

  useEffect(() => {
    if (!user || isAdminLoading) return;
    if (next !== "/") {
      window.location.assign(next);
      return;
    }
    navigate({ to: isAdmin ? "/admin" : "/" });
  }, [user, isAdmin, isAdminLoading, navigate, next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        toast.error(
          error.message.toLowerCase().includes("not confirmed")
            ? "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada."
            : "E-mail ou senha inválidos.",
        );
        return;
      }
      toast.success("Bem-vindo de volta!");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: new URL(next, window.location.origin).href },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Supabase devolve identities vazio quando o e-mail já possui conta.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("Este e-mail já possui uma conta. Faça login ou recupere a senha.");
      setMode("login");
      return;
    }
    setPending(true);
    toast.success("Enviamos um e-mail de confirmação. Confirme para ativar sua conta.");
  }

  async function resend() {
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: new URL(next, window.location.origin).href },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("E-mail de confirmação reenviado.");
  }


  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: new URL(next, window.location.origin).href,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com Google.");
      return;
    }
    // O redirecionamento final é tratado pelo useEffect de acordo com o perfil (admin ou cliente).
    if (result.redirected) return;
  }

  if (pending) {
    return (
      <div className="mx-auto flex max-w-md flex-col px-5 py-20">
        <h1 className="text-3xl">Confirme seu e-mail</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enviamos um link de confirmação para <strong>{email}</strong>. Abra o e-mail e confirme
          para ativar sua conta — só é possível uma conta por e-mail.
        </p>
        <div className="surface-card mt-8 space-y-3 p-6">
          <Button className="w-full" onClick={resend} disabled={busy}>
            Reenviar e-mail de confirmação
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setPending(false);
              setMode("login");
            }}
          >
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-20">
      <h1 className="text-3xl">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "login"
          ? "Acesse sua conta para acompanhar seus pedidos."
          : "Uma conta por e-mail, confirmada por e-mail de verificação."}
      </p>


      <form onSubmit={submit} className="surface-card mt-8 space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            required
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "login" ? "Entrar" : "Criar conta"}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={google}>
          Continuar com Google
        </Button>
      </form>

      <button
        className="mt-4 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}
