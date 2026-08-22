import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { landing } from "@/lib/landing-copy";
import { track } from "@/lib/analytics";

export function HomeFaq() {
  return (
    <section id="duvidas" className="mx-auto max-w-6xl px-5 py-14">
      <h2 className="text-display text-3xl">Dúvidas</h2>
      <Accordion type="single" collapsible className="mt-6">
        {landing.faq.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger
              className="min-h-11 text-base"
              onClick={() => track({ name: "open_faq", question: item.q })}
            >
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
