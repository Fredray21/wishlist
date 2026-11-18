"use client";

import { Fragment, useEffect, useRef } from "react";

/** Active les éléments [data-reveal] quand ils entrent dans l'écran. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Texte découpé lettre par lettre pour l'animation d'entrée. */
export function SplitText({ text, offset = 0 }: { text: string; offset?: number }) {
  let i = offset;
  return (
    <>
      {text.split(" ").map((word, w, words) => (
        <Fragment key={w}>
          <span className="split-word">
            {Array.from(word).map((ch, c) => (
              <span
                key={c}
                className="split-char"
                style={
                  {
                    "--i": i++,
                    "--sx": `${Math.round(Math.sin(i * 12.9898) * 220)}px`,
                    "--sy": `${Math.round(Math.cos(i * 78.233) * 160)}px`,
                    "--sr": `${Math.round(Math.sin(i * 3.7) * 180)}deg`,
                  } as React.CSSProperties
                }
              >
                {ch}
              </span>
            ))}
          </span>
          {w < words.length - 1 && " "}
        </Fragment>
      ))}
    </>
  );
}

/** Nombre animé (compte de 0 à value à l'apparition). */
export function CountUp({ value, pad = 2 }: { value: number; pad?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(value * eased)).padStart(pad, "0");
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, pad]);
  return (
    <span ref={ref} className="tabular">
      {String(value).padStart(pad, "0")}
    </span>
  );
}
