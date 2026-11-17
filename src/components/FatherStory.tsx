import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ease = [0.23, 1, 0.32, 1] as const;
const spring = { type: "spring" as const, duration: 0.45, bounce: 0.14 };

const FRAMES = [
  {
    src: "/historia/01.png",
    title: "O começo",
    line: "Um momento importante marcou o início dessa história.",
    pos: "center 20%",
  },
  {
    src: "/historia/02.png",
    title: "Os dias pesados",
    line: "A rotina também pedia atenção e novos hábitos.",
    pos: "center 15%",
  },
  {
    src: "/historia/03.png",
    title: "O chamado",
    line: "Um tempo para refletir sobre a rotina e os próximos passos.",
    pos: "center 30%",
  },
  {
    src: "/historia/04.png",
    title: "A decisão",
    line: "A decisão começou com movimento e disciplina.",
    pos: "center 10%",
  },
  {
    src: "/historia/05.png",
    title: "O hábito",
    line: "Treino e escolhas de rotina passaram a fazer parte do dia a dia.",
    pos: "center 18%",
  },
  {
    src: "/historia/06.png",
    title: "A constância",
    line: "Persistência, passo a passo, ao longo do tempo.",
    pos: "center 12%",
  },
  {
    src: "/historia/07.png",
    title: "Uma nova fase",
    line: "Mar, descanso e momentos em família.",
    pos: "center 35%",
  },
] as const;

export function FatherStory() {
  const [[i, dir], setPage] = useState([0, 0]);
  const reduce = useReducedMotion();
  const frame = FRAMES[i]!;

  function go(next: number, direction: number) {
    const n = FRAMES.length;
    setPage([((next % n) + n) % n, direction]);
  }

  function onDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const { offset, velocity } = info;
    if (offset.x < -64 || velocity.x < -400) go(i + 1, 1);
    else if (offset.x > 64 || velocity.x > 400) go(i - 1, -1);
  }

  return (
    <div className="min-w-0">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-primary text-primary-foreground">
        <div className="relative aspect-[4/5] min-h-[380px] touch-pan-y sm:aspect-[5/6] sm:min-h-[460px]">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={frame.src}
              className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
              custom={dir}
              variants={{
                enter: (d: number) =>
                  reduce
                    ? { opacity: 0 }
                    : { x: d > 0 ? "72%" : "-72%", opacity: 0.55 },
                center: { x: 0, opacity: 1 },
                exit: (d: number) =>
                  reduce
                    ? { opacity: 0 }
                    : { x: d > 0 ? "-72%" : "72%", opacity: 0.55 },
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduce ? { duration: 0.16, ease } : spring}
              drag="x"
              dragDirectionLock
              dragListener
              dragElastic={0.18}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={onDragEnd}
            >
              <img
                src={frame.src}
                alt={`Meu pai. ${frame.title}.`}
                draggable={false}
                className="pointer-events-none h-full w-full select-none object-cover"
                style={{ objectPosition: frame.pos }}
              />
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-primary via-primary/20 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary-foreground/70">
              {String(i + 1).padStart(2, "0")} · {String(FRAMES.length).padStart(2, "0")}
            </p>
            <h3 className="text-display mt-2 text-3xl leading-[1.1] sm:text-4xl">{frame.title}</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-primary-foreground/80">
              {frame.line}
            </p>
          </div>

          <div className="absolute right-3 top-3 z-[3] flex gap-1">
            <button
              type="button"
              aria-label="Foto anterior"
              className="flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground transition-[transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
              onClick={() => go(i - 1, -1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              className="flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground transition-[transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
              onClick={() => go(i + 1, 1)}
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
            onClick={() => go(idx, idx > i ? 1 : -1)}
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
