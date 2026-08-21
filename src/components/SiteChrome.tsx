import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Leaf, LogOut, Menu, ShieldCheck, Truck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartSync } from "@/hooks/useCartSync";
import { cn } from "@/lib/utils";

const navClass =
  "rounded-full px-3 py-2 text-sm tracking-[0.14em] text-muted-foreground transition-[color,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-secondary [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  useCartSync();

  const links = (
    <>
      <Link
        to="/"
        className={navClass}
        activeOptions={{ exact: true }}
        activeProps={{ className: "bg-secondary text-foreground" }}
        onClick={() => setOpen(false)}
      >
        Início
      </Link>
      <Link
        to="/produtos"
        className={navClass}
        activeProps={{ className: "bg-secondary text-foreground" }}
        onClick={() => setOpen(false)}
      >
        Produtos
      </Link>
      <Link
        to="/kits"
        className={navClass}
        activeProps={{ className: "bg-secondary text-foreground" }}
        onClick={() => setOpen(false)}
      >
        Kits
      </Link>
      {isAdmin ? (
        <Link
          to="/admin"
          className={navClass}
          activeProps={{ className: "bg-secondary text-foreground" }}
          onClick={() => setOpen(false)}
        >
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-4" /> Admin
          </span>
        </Link>
      ) : null}
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-4" />
          </span>
          <span className="leading-none">
            <span className="text-display block text-lg tracking-[0.04em]">Opção Natural</span>
            <span className="block text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Suplementos naturais
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="hidden items-center gap-1 md:flex">{links}</nav>
          <CartDrawer />
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
            <Link to="/auth" className={cn(navClass, "hidden sm:inline-flex")} onClick={() => setOpen(false)}>
              Entrar
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-x-4 top-[4.5rem] z-40 origin-top rounded-2xl border border-foreground/10 p-6 md:hidden"
            style={{
              background: "color-mix(in oklch, var(--color-card) 78%, transparent)",
              backdropFilter: "blur(20px)",
            }}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex flex-col items-center gap-3 text-lg">{links}</div>
            {!user ? (
              <Link
                to="/auth"
                className="mt-4 block text-center text-sm tracking-[0.14em] text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                Entrar
              </Link>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
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
