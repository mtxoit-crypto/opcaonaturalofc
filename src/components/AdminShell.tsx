import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Boxes,
  ClipboardList,
  Images,
  LayoutDashboard,
  Package,
  ScrollText,
  Settings,
  ShoppingBag,
  Star,
  TicketPercent,
  UserRoundCog,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminMfaGate } from "@/components/AdminMfaGate";

export type AdminTab =
  | "visao"
  | "catalogo"
  | "estoque"
  | "kits"
  | "avaliacoes"
  | "clientes"
  | "cupons"
  | "midia"
  | "configuracoes"
  | "equipe"
  | "auditoria";

type AdminNavLink =
  | {
      to: "/admin";
      label: string;
      icon: typeof LayoutDashboard;
      search?: { tab: AdminTab };
    }
  | {
      to: "/admin/pedidos";
      label: string;
      icon: typeof Package;
    };

const links: AdminNavLink[] = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { to: "/admin", search: { tab: "catalogo" }, label: "Produtos", icon: ShoppingBag },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/admin", search: { tab: "estoque" }, label: "Estoque", icon: Boxes },
  { to: "/admin", search: { tab: "kits" }, label: "Kits", icon: Package },
  { to: "/admin", search: { tab: "avaliacoes" }, label: "Avaliações", icon: Star },
  { to: "/admin", search: { tab: "clientes" }, label: "Clientes", icon: Users },
  { to: "/admin", search: { tab: "cupons" }, label: "Cupons", icon: TicketPercent },
  { to: "/admin", search: { tab: "midia" }, label: "Mídias", icon: Images },
  { to: "/admin", search: { tab: "configuracoes" }, label: "Configurações", icon: Settings },
  { to: "/admin", search: { tab: "equipe" }, label: "Equipe", icon: UserRoundCog },
  { to: "/admin", search: { tab: "auditoria" }, label: "Auditoria", icon: ScrollText },
];

export function AdminShell({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <AdminMfaGate>
      <div className="min-h-screen bg-sand/50">
        <header className="border-b bg-card">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-5">
            <Link to="/admin" className="flex items-center gap-3 text-primary">
              <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="size-4" aria-hidden />
              </span>
              <span className="font-semibold">
                Opção Natural{" "}
                <span className="ml-1 text-xs font-normal text-muted-foreground">Admin</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Ver loja <ArrowUpRight className="size-4" aria-hidden />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const { error } = await supabase.auth.signOut({ scope: "local" });
                  if (error) toast.error("Não foi possível sair. Tente novamente.");
                }}
              >
                Sair
              </Button>
            </div>
          </div>
        </header>
        <div className="mx-auto grid max-w-7xl min-w-0 gap-6 px-4 py-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-5 lg:py-8">
          <nav
            aria-label="Administração da loja"
            className="flex self-start gap-1 overflow-x-auto rounded-2xl border bg-card p-2 lg:flex-col lg:overflow-visible"
          >
            {links.map((link) => (
              <AdminNavLink key={`${link.to}-${link.label}`} link={link} />
            ))}
          </nav>
          <div className="min-w-0">
            <h1 className="font-sans text-2xl font-semibold tracking-tight">{title}</h1>
            {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
            {children}
          </div>
        </div>
      </div>
    </AdminMfaGate>
  );
}

function AdminNavLink({ link }: { link: AdminNavLink }) {
  const Icon = link.icon;
  const className =
    "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]";

  if (link.to === "/admin") {
    return (
      <Link
        to={link.to}
        {...(link.search ? { search: link.search } : {})}
        activeOptions={{ exact: true, includeSearch: true }}
        className={className}
        activeProps={{ className: "bg-primary text-primary-foreground" }}
        inactiveProps={{ className: "bg-card hover:bg-secondary hover:text-foreground" }}
      >
        <Icon className="size-4" />
        {link.label}
      </Link>
    );
  }

  return (
    <Link
      to={link.to}
      activeOptions={{ exact: true }}
      className={className}
      activeProps={{ className: "bg-primary text-primary-foreground" }}
      inactiveProps={{ className: "bg-card hover:bg-secondary hover:text-foreground" }}
    >
      <Icon className="size-4" />
      {link.label}
    </Link>
  );
}
