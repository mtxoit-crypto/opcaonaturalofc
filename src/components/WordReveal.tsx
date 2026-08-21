import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Word = { text: string; dim?: boolean; italic?: boolean; accent?: boolean };

const ease = [0.23, 1, 0.32, 1] as const;

export function WordReveal({
  lines,
  className,
}: {
  lines: Word[][];
  className?: string;
}) {
  const reduce = useReducedMotion();
  let i = 0;
  return (
    <h1 className={cn("max-w-full text-[2.15rem] leading-[1.15] sm:text-5xl md:text-6xl", className)}>
      {lines.map((line, li) => (
        <span key={li} className="block pb-1">
          {line.map((word, wi) => {
            const delay = 0.2 + i * 0.055;
            i += 1;
            return (
              <span
                key={`${li}-${wi}`}
                className={cn("inline-block overflow-hidden align-bottom", wi < line.length - 1 && "mr-[0.28em]")}
              >
                <motion.span
                  className={cn(
                    "inline-block",
                    word.dim && "text-foreground/45",
                    word.italic && "text-display italic font-normal leading-[1.15]",
                    word.accent && "text-accent",
                  )}
                  initial={reduce ? false : { y: "100%", opacity: 0, filter: "blur(4px)" }}
                  animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: reduce ? 0.2 : 0.62, delay: reduce ? 0 : delay, ease }}
                >
                  {word.text}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
