"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { answerQuestion, type ChatTurn } from "@/lib/guideBot";

type Turn = ChatTurn;

const SUGGESTIONS = [
  "What has Kiran built?",
  "What's the tech stack?",
  "How do I get in touch?",
];

const GREETING: Turn = {
  role: "assistant",
  content:
    "I can point you to any part of this portfolio — projects, skills, experience, education, achievements, or contact details.",
};

/**
 * GuideBot (spec §29).
 *
 * Redesigned as a small navigation artifact rather than a floating chat bubble:
 * a docked capsule with a signal light, and a panel that borrows the site's own
 * surfaces, hairlines and mono metadata so it belongs to the same world.
 *
 * Answers are produced locally by src/lib/guideBot.ts, straight from
 * src/data/portfolio.ts. No API key, no network request, no model call.
 */
export function GuideBot() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([GREETING]);
  const [input, setInput] = useState("");

  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Keep the newest message in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [turns]);

  const send = (raw: string) => {
    const message = raw.trim();
    if (!message) return;

    const result = answerQuestion(message, turns.slice(-6));
    const next: Turn[] = [{ role: "user", content: message }];
    next.push(
      result.ok
        ? { role: "assistant", content: result.reply }
        : { role: "assistant", content: result.error },
    );

    setInput("");
    setTurns((prev) => [...prev, ...next]);

    // Take the visitor to the section the answer is about. The guide stays
    // open so the reply remains visible; the targets carry `scroll-margin-top`,
    // so each one lands clear of the fixed navbar.
    if (result.ok && result.section) {
      document.getElementById(result.section)?.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[125] sm:bottom-8 sm:left-8">
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panelRef}
            id="guidebot-panel"
            role="dialog"
            aria-label="GuideBot, a portfolio navigation assistant"
            initial={reduced ? false : { opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 flex h-[min(30rem,70vh)] w-[min(22rem,calc(100vw-3rem))] flex-col border border-line-strong bg-ink/95 backdrop-blur-xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-accent" />
                  {!reduced ? (
                    <motion.span
                      className="absolute inline-flex h-full w-full rounded-full bg-accent"
                      animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                    />
                  ) : null}
                </span>
                <span className="t-meta">Guidebot</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toggleRef.current?.focus();
                }}
                className="t-meta transition-colors hover:text-accent"
              >
                Close
              </button>
            </header>

            <div
              ref={logRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
            >
              {turns.map((turn, index) => (
                <div key={index}>
                  <p className="t-meta mb-1.5 text-fg-faint">
                    {turn.role === "user" ? "You" : "Guidebot"}
                  </p>
                  <p
                    className={[
                      "text-sm leading-relaxed",
                      turn.role === "user" ? "text-fg-muted" : "text-fg",
                    ].join(" ")}
                  >
                    {turn.content}
                  </p>
                </div>
              ))}

              {turns.length === 1 ? (
                <ul className="flex flex-wrap gap-1.5 pt-1">
                  {SUGGESTIONS.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => send(suggestion)}
                        className="border border-line px-2.5 py-1.5 font-mono text-[10px] tracking-wide text-fg-muted transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
              className="shrink-0 border-t border-line p-3"
            >
              <div className="flex items-center gap-2">
                <label htmlFor="guidebot-input" className="sr-only">
                  Ask about this portfolio
                </label>
                <input
                  id="guidebot-input"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  maxLength={500}
                  placeholder="Ask about the portfolio…"
                  className="min-w-0 flex-1 border border-line bg-transparent px-3 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={input.trim().length === 0}
                  className="shrink-0 border border-line-strong px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fg transition-colors hover:border-accent/60 hover:text-accent disabled:opacity-45"
                >
                  Send
                </button>
              </div>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* The capsule. Small on purpose — a navigation artifact, not a chatbot
          launcher. */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="guidebot-panel"
        className="group flex items-center gap-2.5 border border-line-strong bg-ink/85 px-3.5 py-2.5 backdrop-blur-md transition-colors hover:border-accent/60"
      >
        <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-accent" />
          {!reduced && !open ? (
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-accent"
              animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
        </span>
        <span className="t-meta transition-colors group-hover:text-accent">
          {open ? "Hide guide" : "Guide"}
        </span>
      </button>
    </div>
  );
}
