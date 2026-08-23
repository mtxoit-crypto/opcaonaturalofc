import { Link } from "@tanstack/react-router";
import { landing } from "@/lib/landing-copy";
import { Button } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-display max-w-[18ch] text-3xl md:text-4xl">{landing.close.title}</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="secondary" className="min-h-11">
            <Link to="/produtos">{landing.close.primary}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-h-11 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link to="/kits">{landing.close.secondary}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
