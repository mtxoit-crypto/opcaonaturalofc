import { createFileRoute } from "@tanstack/react-router";
import { AdminWorkspaceRedirect } from "@/components/AdminWorkspaceRedirect";

export const Route = createFileRoute("/admin/midia")({
  head: () => ({ meta: [
    { title: "Mídias · Painel Opção Natural" },
    { name: "description", content: "Gestão de fotos, vídeos e modelos 3D da Opção Natural." },
    { property: "og:title", content: "Mídias · Painel Opção Natural" },
    { property: "og:description", content: "Gestão de fotos, vídeos e modelos 3D da Opção Natural." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <AdminWorkspaceRedirect tab="midia" />,
});
