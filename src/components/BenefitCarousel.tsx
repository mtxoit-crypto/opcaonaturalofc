import { useEffect, useState } from "react";
import { FlaskConical, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const CARDS = [
  { icon: Sparkles, t: "Fórmulas limpas", d: "Sem corantes nem excipientes dispensáveis." },
  { icon: ShieldCheck, t: "Testado em lote", d: "Cada lote com laudo de pureza e potência." },
  { icon: Leaf, t: "Cápsulas veganas", d: "Invólucro vegetal, fácil de digerir." },
  { icon: FlaskConical, t: "O que usamos em casa", d: "Selecionados com cuidado para o dia a dia." },
] as const;

const ease = [0.23, 1, 0.32, 1] as const;

export function BenefitCarousel() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    let id: number;
    const start = () => {
      id = window.setInterval(() => setI((n) => (n + 1) % CARDS.length), 3800);
    };
    const stop = () => window.clearInterval(id);
    const onVis = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduce]);

  const card = CARDS[i]!;
  const Icon = card.icon;

  return (
    <div className="relative flex min-h-[148px] flex-col justify-between bg-card p-6">
      <div className="relative min-h-[88px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.t}
            initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(2px)" }}
            transition={{ duration: reduce ? 0.15 : 0.22, ease }}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon className="size-4" />
            </span>
            <p className="mt-3 text-display text-lg leading-tight">{card.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.d}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex gap-1">
        {CARDS.map((c, idx) => (
          <button
            key={c.t}
            type="button"
            aria-label={c.t}
            aria-current={idx === i}
            className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/15"
            onClick={() => setI(idx)}
          >
            <span
              className="block h-full origin-left rounded-full bg-foreground transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ transform: `scaleX(${idx === i ? 1 : 0.28})` }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
