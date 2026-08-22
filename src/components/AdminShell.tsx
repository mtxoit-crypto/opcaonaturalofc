import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin" as const, label: "Painel", exact: true, icon: LayoutDashboard },
  { to: "/admin/pedidos" as const, label: "Pedidos", exact: false, icon: Package },
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
    <div className="min-h-[70dvh] border-t border-border/50 bg-sand/50">
      <div className="mx-auto grid max-w-6xl min-w-0 gap-6 px-4 py-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-5 lg:py-8">
        <aside className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.exact }}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              inactiveProps={{ className: "bg-card hover:bg-secondary hover:text-foreground" }}
            >
              <l.icon className="size-4" />
              {l.label}
            </Link>
          ))}
        </aside>
        <div className="min-w-0">
          <h1 className="font-sans text-2xl font-semibold tracking-tight">{title}</h1>
          {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
          {children}
        </div>
      </div>
    </div>
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
