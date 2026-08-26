import { createFileRoute } from "@tanstack/react-router";
import { AdminWorkspaceRedirect } from "@/components/AdminWorkspaceRedirect";

export const Route = createFileRoute("/admin/produtos")({
  component: () => <AdminWorkspaceRedirect tab="catalogo" />,
});
