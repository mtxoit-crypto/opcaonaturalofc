import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
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
import { cn } from "@/lib/utils";
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
      <div className="min-h-[70dvh] border-t border-border/50 bg-sand/50">
        <div className="mx-auto grid max-w-7xl min-w-0 gap-6 px-4 py-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-5 lg:py-8">
          <aside className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {links.map((link) => (
              <AdminNavLink key={`${link.to}-${link.label}`} link={link} />
            ))}
          </aside>
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

export function AdminTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mt-5 flex gap-0 overflow-x-auto border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "shrink-0 border-b-2 px-3 py-2.5 text-sm transition-[color,border-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
            value === t.id
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
          {typeof t.count === "number" ? (
            <span className="ml-1.5 tabular-nums text-muted-foreground">{t.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
