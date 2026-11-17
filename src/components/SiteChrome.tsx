import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Leaf, LogOut, Menu, MessageCircle, ShieldCheck, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT, FREE_SHIPPING_TEXT, whatsappLink } from "@/lib/site";

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 md:right-5 md:bottom-24"
    >
      <MessageCircle className="size-6" aria-hidden />
    </a>
  );
}
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/CartDrawer";
import { cn } from "@/lib/utils";

const navClass =
  "rounded-full px-3 py-2 text-sm tracking-[0.14em] text-muted-foreground transition-[color,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [@media(hover:hover)_and_(pointer:fine)]:hover:bg-secondary [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const links = (
    <>
      <Link
        to="/"
        className={navClass}
        activeOptions={{ exact: true }}
        activeProps={{ className: "bg-secondary text-foreground" }}
        aria-current={pathname === "/" ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        Início
      </Link>
      <Link
        to="/produtos"
        className={navClass}
        activeProps={{ className: "bg-secondary text-foreground" }}
        aria-current={pathname.startsWith("/produtos") ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        Produtos
      </Link>
      <Link
        to="/kits"
        className={navClass}
        activeProps={{ className: "bg-secondary text-foreground" }}
        aria-current={pathname.startsWith("/kits") ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        Kits
      </Link>
      <Link
        to="/nossa-historia"
        className={navClass}
        activeProps={{ className: "bg-secondary text-foreground" }}
        aria-current={pathname.startsWith("/nossa-historia") ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        Nossa história
      </Link>
      <Link to="/" hash="duvidas" className={navClass} onClick={() => setOpen(false)}>
        Dúvidas
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
      <p className="bg-primary px-4 py-1.5 text-center text-xs tracking-[0.08em] text-primary-foreground">
        Frete grátis acima de R$ {FREE_SHIPPING_TEXT}
      </p>
      <div className="mx-auto flex h-14 max-w-6xl min-w-0 items-center justify-between gap-3 px-4 sm:px-5">
        <Link to="/" className="flex min-w-0 items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 leading-none">
            <span className="text-display block truncate text-lg tracking-[0.04em]">Opção Natural</span>
            <span className="block truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:tracking-[0.28em]">
              Suplementos naturais
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {links}
          </nav>
          <Button asChild className="hidden min-h-10 md:inline-flex" size="sm">
            <Link to="/produtos">Ver produtos</Link>
          </Button>
          <CartDrawer />
          {user ? (
            <Button variant="ghost" size="sm" className="min-h-11 min-w-11" onClick={() => supabase.auth.signOut()} aria-label="Sair">
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
            className="min-h-11 min-w-11 lg:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="menu-mobile"
            className="fixed inset-x-4 top-16 z-40 origin-top rounded-2xl border border-border bg-card p-6 shadow-lg lg:hidden"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            {...(!reduce ? { exit: { opacity: 0, y: -6 } } : {})}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col items-center gap-3 text-lg" aria-label="Mobile">
              {links}
            </nav>
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
    <footer className="mt-0 border-t border-border/60 bg-sand">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-display text-lg text-foreground">Opção Natural</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Suplementos naturais em cápsulas. Pagamento seguro processado pela Stripe.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Loja</p>
          <nav className="mt-3 flex flex-col gap-2 text-sm">
            <Link to="/produtos" className="text-muted-foreground hover:text-foreground">
              Produtos
            </Link>
            <Link to="/kits" className="text-muted-foreground hover:text-foreground">
              Kits
            </Link>
            <Link to="/nossa-historia" className="text-muted-foreground hover:text-foreground">
              Nossa história
            </Link>
            <Link to="/" hash="duvidas" className="text-muted-foreground hover:text-foreground">
              Dúvidas
            </Link>
            <Link to="/checkout" className="text-muted-foreground hover:text-foreground">
              Carrinho
            </Link>
          </nav>
        </div>
        <div>
          <p className="text-sm font-medium">Institucional</p>
          <nav className="mt-3 flex flex-col gap-2 text-sm">
            <Link to="/privacidade" className="text-muted-foreground hover:text-foreground">
              Política de privacidade
            </Link>
            <Link to="/termos" className="text-muted-foreground hover:text-foreground">
              Termos de uso
            </Link>
            <Link to="/trocas" className="text-muted-foreground hover:text-foreground">
              Trocas e devoluções
            </Link>
            <Link to="/entrega" className="text-muted-foreground hover:text-foreground">
              Política de entrega
            </Link>
          </nav>
        </div>
        <div>
          <p className="text-sm font-medium">Contato</p>
          <nav className="mt-3 flex flex-col gap-2 text-sm" aria-label="Contato">
            <a href={whatsappLink()} className="text-muted-foreground hover:text-foreground" rel="noreferrer" target="_blank">
              WhatsApp {CONTACT.whatsappLabel}
            </a>
            <a href={CONTACT.instagramUrl} className="text-muted-foreground hover:text-foreground" rel="noreferrer" target="_blank">
              Instagram {CONTACT.instagram}
            </a>
            {CONTACT.email ? (
              <a href={`mailto:${CONTACT.email}`} className="text-muted-foreground hover:text-foreground">
                {CONTACT.email}
              </a>
            ) : null}
          </nav>
          <p className="mt-4 text-sm text-muted-foreground">
            Suplementos não substituem uma alimentação equilibrada.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 pb-28 pt-5 text-xs md:pb-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Opção Natural. Todos os direitos reservados.</p>
          <p>Pagamento processado com segurança pela Stripe.</p>
        </div>
      </div>
    </footer>
  );
}
