import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { AdminTab } from "@/components/AdminShell";

export function AdminWorkspaceRedirect({ tab }: { tab: AdminTab }) {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({
      to: "/admin",
      search: { tab },
      replace: true,
    });
  }, [navigate, tab]);

  return <p className="mx-auto max-w-2xl px-5 py-20 text-sm text-muted-foreground">Abrindo painel…</p>;
}
