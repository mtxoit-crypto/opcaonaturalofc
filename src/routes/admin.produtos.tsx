import { createFileRoute } from "@tanstack/react-router";
import { AdminWorkspaceRedirect } from "@/components/AdminWorkspaceRedirect";

export const Route = createFileRoute("/admin/produtos")({
  head: () => ({ meta: [
    { title: "Produtos · Painel Opção Natural" },
    { name: "description", content: "Gestão dos produtos da Opção Natural." },
    { property: "og:title", content: "Produtos · Painel Opção Natural" },
    { property: "og:description", content: "Gestão dos produtos da Opção Natural." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <AdminWorkspaceRedirect tab="catalogo" />,
});
