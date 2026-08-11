import { Link } from "@tanstack/react-router";
import { Leaf, LogOut, ShieldCheck, Truck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-4" />
          </span>
          <span className="leading-none">
            <span className="text-display block text-lg">Opção Natural</span>
            <span className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Suplementos naturais
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-secondary text-foreground" }}
          >
            Início
          </Link>
          <Link
            to="/produtos"
            className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-secondary text-foreground" }}
          >
            Produtos
          </Link>
          {isAdmin ? (
            <Link
              to="/admin"
              className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-4" /> Admin
              </span>
            </Link>
          ) : null}
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => supabase.auth.signOut()}
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </Button>
          ) : (
            <Link
              to="/auth"
              className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-sand">
      <div className="mx-auto grid max-w-6xl gap-4 px-5 py-8 text-sm sm:grid-cols-3">
        {[
          { icon: Leaf, t: "Produtos naturais", d: "de qualidade" },
          { icon: ShieldCheck, t: "Fórmulas eficazes", d: "e seguras" },
          { icon: Truck, t: "Envio para", d: "todo o Brasil" },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
            <span>
              <span className="block text-foreground">{t}</span>
              <span className="block text-muted-foreground">{d}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="text-display text-base text-foreground">
            Opção Natural · Suplementos naturais
          </p>
          <p>Suplementos não substituem uma alimentação equilibrada.</p>
        </div>
      </div>
    </footer>
  );
}
