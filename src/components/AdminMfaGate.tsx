import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TotpEnrollment = { factorId: string; qrCode: string; secret: string };

export function AdminMfaGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [factorId, setFactorId] = useState("");
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function prepare() {
      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw assuranceError;
      if (assurance.currentLevel === "aal2") {
        if (!cancelled) {
          setReady(true);
          setBusy(false);
        }
        return;
      }

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      const verified = factors.totp.find((factor) => factor.status === "verified");
      if (verified) {
        if (!cancelled) setFactorId(verified.id);
      } else {
        for (const factor of factors.all) {
          if (factor.status === "unverified") {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Opção Natural",
        });
        if (enrollError) throw enrollError;
        if (!cancelled) {
          setFactorId(data.id);
          setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
        }
      }
      if (!cancelled) setBusy(false);
    }
    void prepare().catch(() => {
      if (!cancelled) {
        setError("Não foi possível preparar a verificação. Atualize a página ou entre novamente.");
        setBusy(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code) || !factorId) return;
    setBusy(true);
    setError("");
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    if (verifyError) {
      setError("Código inválido ou expirado. Confira o autenticador e tente de novo.");
      setBusy(false);
      return;
    }
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel !== "aal2") {
      setError("A verificação ainda não foi confirmada. Tente novamente.");
      setBusy(false);
      return;
    }
    setEnrollment(null);
    setReady(true);
    setBusy(false);
  }

  if (ready) return children;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-5 py-12">
      <section className="surface-card space-y-5 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">Verificação do administrador</h1>
        </div>
        {busy ? (
          <p className="text-sm text-muted-foreground">Preparando verificação segura…</p>
        ) : null}
        {!busy && enrollment ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR code com um app autenticador (Google Authenticator, 1Password ou
              similar). Depois informe o código de seis dígitos.
            </p>
            <img
              className="mx-auto size-48 rounded bg-white p-2"
              src={enrollment.qrCode}
              alt="QR code para configurar autenticação em duas etapas"
            />
            <details>
              <summary className="cursor-pointer text-sm">Não consegue escanear?</summary>
              <code className="mt-2 block break-all rounded bg-muted p-3 text-xs">
                {enrollment.secret}
              </code>
            </details>
          </div>
        ) : null}
        {!busy && !enrollment && factorId ? (
          <p className="text-sm text-muted-foreground">
            Digite o código de seis dígitos do app autenticador para liberar o painel.
          </p>
        ) : null}
        {!busy && factorId ? (
          <form className="space-y-3" onSubmit={verify}>
            <div className="space-y-2">
              <Label htmlFor="admin-totp">Código temporário</Label>
              <Input
                id="admin-totp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </div>
            <Button type="submit" disabled={busy || code.length !== 6} className="w-full">
              Ativar e continuar
            </Button>
          </form>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
