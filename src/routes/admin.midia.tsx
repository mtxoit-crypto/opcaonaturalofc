import { createFileRoute } from "@tanstack/react-router";
import { AdminWorkspaceRedirect } from "@/components/AdminWorkspaceRedirect";

export const Route = createFileRoute("/admin/midia")({
  component: () => <AdminWorkspaceRedirect tab="midia" />,
});
