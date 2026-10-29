import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { loadConsent, decideConsent } from "@/lib/oauth-consent";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ authorization_id: typeof s['authorization_id'] === "string" ? s['authorization_id'] : "" }),
  head: () => ({ meta: [
    { title: "Conectar agente · Opção Natural" },
    { name: "description", content: "Confirme ou cancele o acesso de um agente ao catálogo Opção Natural." },
    { property: "og:title", content: "Conectar agente · Opção Natural" },
    { property: "og:description", content: "Autorize consultas ao catálogo mantendo suas permissões." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Solicitação ausente. Inicie a conexão novamente pelo agente.");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error("Não foi possível verificar seu acesso. Tente novamente.");
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr + location.hash } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.searchStr).get("authorization_id") ?? "";
    const result = await loadConsent(supabase.auth.oauth, id);
    if (result.redirect) throw redirect({ href: result.redirect });
    return result.details;
  },
  pendingComponent: () => <main className="mx-auto max-w-lg px-5 py-20"><p role="status">Carregando solicitação…</p></main>,
  errorComponent: ({ error, reset }) => <main className="mx-auto max-w-lg px-5 py-20 space-y-5">
    <h1 className="text-3xl">Não foi possível conectar</h1>
    <p role="alert">{error instanceof Error ? error.message : "Não foi possível carregar a solicitação."}</p>
    <Button variant="outline" onClick={reset}>Tentar novamente</Button>
  </main>,
  component: ConsentPage,
});

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!details) return <main className="mx-auto max-w-lg px-5 py-20">Solicitação indisponível.</main>;
  const clientName = details.client.name || "este agente";
  const labels: Record<string, string> = { openid: "Identificar sua conta", email: "Compartilhar seu e-mail", profile: "Compartilhar seu perfil básico" };

  async function decide(approve: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      window.location.assign(await decideConsent(supabase.auth.oauth, authorization_id, approve));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível confirmar sua decisão.");
      setBusy(false);
    }
  }

  async function switchAccount() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.assign(`/auth?next=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`);
    } catch {
      setError("Não foi possível trocar de conta. Tente novamente.");
      setBusy(false);
    }
  }

  return <main className="mx-auto max-w-lg px-5 py-20 space-y-6">
    <h1 className="text-3xl">Conectar {clientName} à Opção Natural</h1>
    <div className="space-y-2">
      <p className="break-all">Conta: {details.user.email}</p>
      <Button variant="outline" disabled={busy} onClick={switchAccount}>Trocar conta</Button>
    </div>
    <p>Isso permite que {clientName} consulte os produtos cadastrados usando seu acesso.</p>
    <p className="break-all text-sm text-muted-foreground">Endereço do agente: {details.redirect_uri}</p>
    <ul className="list-disc pl-5 space-y-2">
      {details.scope.split(/\s+/).filter(Boolean).map(scope => <li key={scope}>{labels[scope] ?? `Permissão adicional solicitada: ${scope}`}</li>)}
      <li>Consultar a lista e os detalhes dos produtos ativos.</li>
    </ul>
    <p className="text-sm text-muted-foreground">Suas permissões continuam valendo. Este acesso não permite alterar produtos, acessar pedidos ou realizar pagamentos.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <Button disabled={busy} onClick={() => decide(true)}>{busy ? "Aguarde…" : "Permitir conexão"}</Button>
      <Button variant="outline" disabled={busy} onClick={() => decide(false)}>Cancelar conexão</Button>
    </div>
  </main>;
}