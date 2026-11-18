"use client";

import { useCallback, useRef } from "react";

/**
 * N clics / tapes rapprochés → callback. Fonctionne à la souris ET au doigt
 * (l'événement natif dblclick n'est pas fiable sur mobile).
 */
export function useMultiTap<E extends React.MouseEvent>(count: number, onHit: (e: E) => void, windowMs = 380) {
  const taps = useRef<number[]>([]);
  return useCallback(
    (e: E) => {
      const now = performance.now();
      taps.current = [...taps.current.filter((t) => now - t < windowMs * (count - 1)), now];
      if (taps.current.length >= count) {
        taps.current = [];
        onHit(e);
      }
    },
    [count, onHit, windowMs],
  );
}

/** Appui long (souris ou doigt). Renvoie les handlers + un drapeau pour annuler le clic qui suit. */
export function useLongPress(onLong: (e: React.PointerEvent) => void, ms = 900) {
  const timer = useRef(0);
  const fired = useRef(false);
  const start = useCallback(
    (e: React.PointerEvent) => {
      fired.current = false;
      const ev = { clientX: e.clientX, clientY: e.clientY } as React.PointerEvent;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLong(ev);
      }, ms);
    },
    [onLong, ms],
  );
  const cancel = useCallback(() => window.clearTimeout(timer.current), []);
  return {
    handlers: { onPointerDown: start, onPointerUp: cancel, onPointerLeave: cancel, onPointerCancel: cancel },
    /** true si le dernier appui était un appui long (à vérifier dans onClick). */
    fired,
  };
}
