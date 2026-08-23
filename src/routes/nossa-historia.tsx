import { createFileRoute } from "@tanstack/react-router";
import { StorySection } from "@/components/landing/StorySection";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/nossa-historia")({
  head: () => ({
    meta: [
      { title: "Nossa história · Opção Natural" },
      {
        name: "description",
        content:
          "A história da Opção Natural: mudança de hábitos, rotina e suplementos naturais em cápsulas. Resultados individuais, sem promessa de produto.",
      },
      { property: "og:title", content: "Nossa história · Opção Natural" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/nossa-historia") }],
  }),
  component: NossaHistoriaPage,
});

function NossaHistoriaPage() {
  return (
    <div className="pb-10">
      <StorySection />
    </div>
  );
}
