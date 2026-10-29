import { createFileRoute } from "@tanstack/react-router";
import { AdminWorkspaceRedirect } from "@/components/AdminWorkspaceRedirect";

export const Route = createFileRoute("/admin/estoque")({
  head: () => ({ meta: [
    { title: "Estoque · Painel Opção Natural" },
    { name: "description", content: "Gestão do estoque da Opção Natural." },
    { property: "og:title", content: "Estoque · Painel Opção Natural" },
    { property: "og:description", content: "Gestão do estoque da Opção Natural." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <AdminWorkspaceRedirect tab="estoque" />,
});
