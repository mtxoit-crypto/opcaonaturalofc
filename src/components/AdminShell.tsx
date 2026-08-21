import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin" as const, label: "Painel", exact: true },
  { to: "/admin/pedidos" as const, label: "Pedidos", exact: false },
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
    <div className="mx-auto max-w-6xl min-w-0 px-5 py-10">
      <nav className="mb-8 flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            activeOptions={l.exact ? { exact: true } : undefined}
            className="rounded-full px-4 py-2 text-sm tracking-[0.08em] text-muted-foreground transition-[color,background-color] duration-150"
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            inactiveProps={{ className: "bg-secondary hover:text-foreground" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <h1 className="text-4xl">{title}</h1>
      {hint ? <p className="mt-2 text-muted-foreground">{hint}</p> : null}
      {children}
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
    <div className="mt-8 flex gap-1 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm transition-[color,background-color,transform] duration-150 active:scale-[0.97]",
            value === t.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {t.label}
          {typeof t.count === "number" ? (
            <span className="ml-2 tabular-nums opacity-70">{t.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
