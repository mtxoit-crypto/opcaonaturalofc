import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { FatherStory } from "@/components/FatherStory";
import { landing } from "@/lib/landing-copy";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

export function StorySection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          track({ name: "view_story" });
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="historia" ref={ref} className="mx-auto max-w-6xl px-5 py-14">
      <div className="grid items-start gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)]">
        <div className="md:sticky md:top-24">
          <h2 className="text-display text-3xl leading-[1.15] md:text-4xl">{landing.story.title}</h2>
          <p className="mt-5 max-w-[42ch] text-muted-foreground">{landing.story.p1}</p>
          <p className="mt-3 max-w-[42ch] text-muted-foreground">{landing.story.p2}</p>
          <Button asChild className="mt-6">
            <Link to="/produtos">{landing.story.cta}</Link>
          </Button>
        </div>
        <FatherStory />
      </div>
    </section>
  );
}
