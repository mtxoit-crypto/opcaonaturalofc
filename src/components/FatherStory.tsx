import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ease = [0.23, 1, 0.32, 1] as const;

const FRAMES = [
  {
    src: "/historia/01.png",
    title: "O começo",
    line: "A vida pedia outra direção. Ele ainda não sabia o tamanho da virada.",
    pos: "center 20%",
  },
  {
    src: "/historia/02.png",
    title: "Os dias pesados",
    line: "O corpo acompanhava o cansaço. Os hábitos também.",
    pos: "center 15%",
  },
  {
    src: "/historia/03.png",
    title: "O chamado",
    line: "Água, sol, e a certeza de que algo precisava mudar.",
    pos: "center 30%",
  },
  {
    src: "/historia/04.png",
    title: "A decisão",
    line: "Luvas no chão de casa. Disciplina antes de qualquer fórmula.",
    pos: "center 10%",
  },
  {
    src: "/historia/05.png",
    title: "O hábito",
    line: "Treino virou rotina. Alimentação e suplementos naturais, no mesmo passo.",
    pos: "center 18%",
  },
  {
    src: "/historia/06.png",
    title: "O novo corpo",
    line: "Não foi milagre. Foi persistência, dia após dia.",
    pos: "center 12%",
  },
  {
    src: "/historia/07.png",
    title: "A vida que voltou",
    line: "Mar, descanso, leveza. O pai que inspirou esta casa.",
    pos: "center 35%",
  },
] as const;

export function FatherStory() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const startX = useRef(0);
  const startT = useRef(0);
  const frame = FRAMES[i]!;

  function go(next: number) {
    const n = FRAMES.length;
    setI(((next % n) + n) % n);
  }

  return (
    <div className="min-w-0">
      <div
        className="relative overflow-hidden rounded-[1.75rem] bg-primary text-primary-foreground"
        onPointerDown={(e) => {
          startX.current = e.clientX;
          startT.current = Date.now();
        }}
        onPointerUp={(e) => {
          const dx = e.clientX - startX.current;
          const dt = Math.max(Date.now() - startT.current, 1);
          const velocity = Math.abs(dx) / dt;
          if (Math.abs(dx) > 48 || velocity > 0.11) go(i + (dx < 0 ? 1 : -1));
        }}
      >
        <div className="relative aspect-[4/5] min-h-[380px] sm:aspect-[5/6] sm:min-h-[460px]">
          <AnimatePresence mode="wait">
            <motion.img
              key={frame.src}
              src={frame.src}
              alt={`Meu pai. ${frame.title}.`}
              draggable={false}
              className="absolute inset-0 h-full w-full select-none object-cover"
              style={{ objectPosition: frame.pos }}
              initial={
                reduce ? { opacity: 0 } : { opacity: 0, scale: 1.04, filter: "blur(6px)" }
              }
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, filter: "blur(4px)" }}
              transition={{ duration: reduce ? 0.16 : 0.38, ease }}
            />
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary-foreground/70">
              {String(i + 1).padStart(2, "0")} · {String(FRAMES.length).padStart(2, "0")}
            </p>
            <h3 className="text-display mt-2 text-3xl leading-[1.1] sm:text-4xl">{frame.title}</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-primary-foreground/80">
              {frame.line}
            </p>
          </div>

          <div className="absolute right-3 top-3 z-10 flex gap-1">
            <button
              type="button"
              aria-label="Foto anterior"
              className="flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground transition-[transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
              onClick={() => go(i - 1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              className="flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground transition-[transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
              onClick={() => go(i + 1)}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FRAMES.map((f, idx) => (
          <button
            key={f.src}
            type="button"
            aria-label={f.title}
            aria-current={idx === i}
            onClick={() => setI(idx)}
            className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] sm:h-[4.5rem] sm:w-16"
            style={{ opacity: idx === i ? 1 : 0.45 }}
          >
            <img src={f.src} alt="" className="h-full w-full object-cover" style={{ objectPosition: f.pos }} />
            {idx === i ? <span className="absolute inset-0 ring-2 ring-inset ring-accent" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
