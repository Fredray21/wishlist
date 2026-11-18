"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { burst, cannons, fireworks, rain, sparkle, themeColors } from "./particles";

/* ======================================================================
   Catalogue des secrets
   ====================================================================== */

export const EGGS = [
  { id: "konami", emoji: "🕹️", label: "Code Konami", hint: "↑ ↑ ↓ ↓ ← → ← → B A" },
  { id: "neige", emoji: "❄️", label: "Blizzard", hint: "Tape un mot qui tombe du ciel en hiver" },
  { id: "fete", emoji: "🎉", label: "C'est la fête", hint: "Tape « fête »" },
  { id: "cadeau", emoji: "🎁", label: "Pluie de paquets", hint: "Tape le mot le plus important du site" },
  { id: "chut", emoji: "🤫", label: "Mode murmure", hint: "Tape le premier mot du bandeau" },
  { id: "disco", emoji: "🪩", label: "Disco inferno", hint: "Tape un style musical à paillettes" },
  { id: "flip", emoji: "🙃", label: "Tête en bas", hint: "Tape « flip »" },
  { id: "owner", emoji: "👋", label: "Coucou toi", hint: "Tape le prénom du propriétaire" },
  { id: "logo", emoji: "🐣", label: "L'œuf dans le paquet", hint: "Le logo adore les clics…" },
  { id: "scatter", emoji: "🔤", label: "Lettres en vadrouille", hint: "Double-clique le grand titre" },
  { id: "marquee", emoji: "⏪", label: "Rembobinage", hint: "Clique sur le bandeau défilant" },
  { id: "price", emoji: "💸", label: "Le prix du cœur", hint: "Clique 5 fois sur un prix" },
  { id: "unwrap", emoji: "💝", label: "Déballage", hint: "Double-clique une photo" },
  { id: "promise", emoji: "🤞", label: "Promis, juré", hint: "Le 🤫 a un secret (3 clics)" },
  { id: "lock", emoji: "🔒", label: "Trop curieux·se", hint: "Garde la souris sur le cadenas" },
  { id: "tab", emoji: "🥹", label: "Le retour", hint: "Va voir un autre onglet, puis reviens" },
  { id: "idle", emoji: "💤", label: "La sieste", hint: "Ne touche plus à rien un moment" },
  { id: "bottom", emoji: "🕵️", label: "Détective", hint: "Descends tout en bas" },
  { id: "sparkle", emoji: "✨", label: "Poussière de fée", hint: "Maintiens Maj en bougeant la souris" },
  { id: "shake", emoji: "🔮", label: "Boule à neige", hint: "Secoue ton téléphone" },
  { id: "console", emoji: "💻", label: "Dev curieux·se", hint: "Ouvre la console du navigateur" },
  { id: "special", emoji: "🛷", label: "Visiteur rare", hint: "Quelque chose traverse parfois l'écran…" },
  { id: "master", emoji: "👑", label: "Grand·e maître des secrets", hint: "Trouve tous les autres" },
] as const;

export type EggId = (typeof EGGS)[number]["id"];

const STORAGE_KEY = "wishlist:eggs";

interface EggsContext {
  found: (id: EggId) => void;
  has: (id: EggId) => boolean;
  discovered: EggId[];
  stage: (emoji: string, text: string, ms?: number) => void;
}

const Ctx = createContext<EggsContext | null>(null);

export function useEggs(): EggsContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEggs doit être utilisé dans <EasterEggs>");
  return ctx;
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

interface Flyer {
  key: number;
  emoji: string;
  top: number;
  flip: boolean;
}

/* ======================================================================
   Fournisseur + déclencheurs globaux
   ====================================================================== */

export function EasterEggs({ ownerName, children }: { ownerName: string; children: React.ReactNode }) {
  const [discovered, setDiscovered] = useState<EggId[]>([]);
  const [toast, setToast] = useState<{ key: number; emoji: string; label: string } | null>(null);
  const [scene, setScene] = useState<{ key: number; emoji: string; text: string } | null>(null);
  const [sleepy, setSleepy] = useState(false);
  const [flyer, setFlyer] = useState<Flyer | null>(null);
  const discoveredRef = useRef<EggId[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) {
        const valid = saved.filter((id) => EGGS.some((e) => e.id === id)) as EggId[];
        discoveredRef.current = valid;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDiscovered(valid);
      }
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const stage = useCallback((emoji: string, text: string, ms = 2600) => {
    const key = Date.now();
    setScene({ key, emoji, text });
    window.setTimeout(() => setScene((s) => (s?.key === key ? null : s)), ms);
  }, []);

  const found = useCallback((id: EggId) => {
    if (discoveredRef.current.includes(id)) return;
    const next = [...discoveredRef.current, id];
    const others = EGGS.filter((e) => e.id !== "master");
    if (!next.includes("master") && others.every((e) => next.includes(e.id))) {
      next.push("master");
      window.setTimeout(() => {
        fireworks(10);
        setToast({ key: Date.now(), emoji: "👑", label: "Tous les secrets ! Tu es une légende." });
      }, 2500);
    }
    discoveredRef.current = next;
    setDiscovered(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignoré */
    }
    const egg = EGGS.find((e) => e.id === id)!;
    setToast({ key: Date.now(), emoji: egg.emoji, label: `${egg.label} · ${next.length}/${EGGS.length}` });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const flash = useCallback((cls: string, ms: number) => {
    document.documentElement.classList.add(cls);
    window.setTimeout(() => document.documentElement.classList.remove(cls), ms);
  }, []);

  /* ---------- Clavier : mots magiques + Konami ---------- */
  useEffect(() => {
    let buffer = "";
    let keys: string[] = [];
    const owner = normalize(ownerName).replace(/[^a-z]/g, "");

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      const k = e.key.toLowerCase();

      keys = [...keys, k].slice(-KONAMI.length);
      if (keys.join() === KONAMI.join()) {
        keys = [];
        found("konami");
        flash("legend", 12000);
        rain({ duration: 5000, colors: themeColors(), density: 5 });
        rain({ duration: 5000, snow: true, density: 3 });
        stage("🕹️", "Mode légende débloqué !", 3200);
        return;
      }

      if (k.length !== 1) return;
      buffer = (buffer + normalize(k)).slice(-24);

      const said = (word: string) => buffer.endsWith(word);
      if (said("neige") || said("snow")) {
        buffer = "";
        found("neige");
        rain({ snow: true, duration: 7000, density: 9 });
        stage("❄️", "Blizzard !");
      } else if (said("fete") || said("party")) {
        buffer = "";
        found("fete");
        cannons(themeColors());
        stage("🎉", "Que la fête commence !");
      } else if (said("cadeau")) {
        buffer = "";
        found("cadeau");
        rain({ emojis: ["🎁", "🎀", "🎁", "💝"], duration: 3500, density: 2 });
      } else if (said("chut")) {
        buffer = "";
        found("chut");
        flash("whisper", 3500);
        stage("🤫", "Chuuut… personne ne saura rien.", 3500);
      } else if (said("disco")) {
        buffer = "";
        found("disco");
        flash("disco", 8000);
        rain({ emojis: ["🪩", "🕺", "💃", "✨"], duration: 4000, density: 1 });
      } else if (said("flip")) {
        buffer = "";
        found("flip");
        flash("upside", 3500);
      } else if (owner.length > 2 && said(owner)) {
        buffer = "";
        found("owner");
        stage("👋", `C'est moi ! Mais je ne vois aucune réservation 🙈`, 3200);
        burst({ emojis: ["💛", "🫶", "😊"], count: 24, spread: 360, velocity: 8, gravity: 0.15 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [found, flash, stage, ownerName]);

  /* ---------- Onglet quitté / retrouvé ---------- */
  useEffect(() => {
    let original = document.title;
    let left = false;
    let timer = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        original = document.title.startsWith("🥹") ? original : document.title;
        left = true;
        document.title = "🎁 Reviens… il reste des cadeaux !";
      } else if (left) {
        left = false;
        document.title = "🥹 Te revoilà !";
        found("tab");
        window.clearTimeout(timer);
        timer = window.setTimeout(() => (document.title = original), 2200);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearTimeout(timer);
    };
  }, [found]);

  /* ---------- Console ---------- */
  useEffect(() => {
    const w = window as unknown as { cadeau?: () => string };
    w.cadeau = () => {
      found("console");
      burst({ emojis: ["🎁", "💻", "✨"], count: 40, spread: 360, velocity: 10 });
      return "🎁 Bien joué, petit·e curieux·se ! (Et non, les réservations ne sont pas dans la console 😉)";
    };
    console.log(
      "%c🎁 WISHLIST %c\n\nPsst… tu fouilles ? Tape %ccadeau()%c pour une surprise.\nIndice bonus : ↑ ↑ ↓ ↓ ← → ← → B A",
      "font: 700 28px Georgia, serif; color: #a4161a; padding: 8px 0",
      "font: 13px system-ui",
      "font: 700 13px monospace; background: #111; color: #ffc400; padding: 2px 6px; border-radius: 4px",
      "font: 13px system-ui",
    );
    return () => {
      delete w.cadeau;
    };
  }, [found]);

  /* ---------- Sieste (inactivité) ---------- */
  useEffect(() => {
    let timer = 0;
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSleepy(true), 45_000);
    };
    const events = ["mousemove", "keydown", "scroll", "touchstart", "pointerdown"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  /* ---------- Tout en bas ---------- */
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      if (doc.scrollHeight > window.innerHeight + 300 && window.innerHeight + window.scrollY >= doc.scrollHeight - 8) {
        found("bottom");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [found]);

  /* ---------- Poussière de fée (Maj + souris) ---------- */
  useEffect(() => {
    let moves = 0;
    let last = 0;
    const onMove = (e: MouseEvent) => {
      if (!e.shiftKey) return;
      const now = performance.now();
      if (now - last < 24) return;
      last = now;
      const t = document.documentElement.dataset.theme;
      sparkle(e.clientX, e.clientY, t === "noel" ? "❄️" : t === "anniversaire" ? "✨" : undefined);
      if (++moves === 40) found("sparkle");
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [found]);

  /* ---------- Secouer le téléphone ---------- */
  useEffect(() => {
    let hits: number[] = [];
    let cooldown = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const force = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
      const now = Date.now();
      if (force < 28 || now < cooldown) return;
      hits = [...hits.filter((t) => now - t < 1200), now];
      if (hits.length >= 3) {
        hits = [];
        cooldown = now + 5000;
        found("shake");
        rain({ snow: true, duration: 5000, density: 10 });
        stage("🔮", "Boule à neige !");
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [found, stage]);

  /* ---------- Visiteurs du jour (dates spéciales ou rareté) ---------- */
  useEffect(() => {
    const now = new Date();
    const md = `${now.getMonth() + 1}-${now.getDate()}`;
    const special: Record<string, { emoji: string; text: string }> = {
      "12-24": { emoji: "🛷", text: "Le Père Noël est passé par ici !" },
      "12-25": { emoji: "🛷", text: "Joyeux Noël ! 🎄" },
      "12-31": { emoji: "🥂", text: "Bon réveillon !" },
      "1-1": { emoji: "🎆", text: "Bonne année !" },
      "2-14": { emoji: "💘", text: "Joyeuse Saint-Valentin !" },
      "4-1": { emoji: "🐟", text: "Poisson d'avril !" },
      "10-31": { emoji: "🦇", text: "Joyeux Halloween !" },
      "6-21": { emoji: "🎸", text: "Bonne fête de la musique !" },
    };
    const today = special[md];
    if (md === "1-1" || md === "12-31") window.setTimeout(() => fireworks(5), 1200);

    const pool = ["🦄", "🎈", "🛸", "🐝", "🦋", "🚀"];
    const launch = () => {
      const emoji = today ? today.emoji : pool[Math.floor(Math.random() * pool.length)];
      setFlyer({ key: Date.now(), emoji, top: 12 + Math.random() * 55, flip: emoji === "🛷" || emoji === "🐟" });
    };
    const chance = today ? 1 : 0.35;
    const first = window.setTimeout(() => Math.random() < chance && launch(), today ? 4000 : 20_000);
    const loop = window.setInterval(() => Math.random() < chance * 0.6 && launch(), 50_000);
    (window as unknown as { __wishlistToday?: string }).__wishlistToday = today?.text;
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
  }, []);

  const value = useMemo(
    () => ({ found, has: (id: EggId) => discovered.includes(id), discovered, stage }),
    [found, discovered, stage],
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* Scène centrale (gros emoji + message) */}
      {scene && (
        <div key={scene.key} className="pointer-events-none fixed inset-0 z-[65] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="pop-in text-8xl drop-shadow-2xl sm:text-9xl">{scene.emoji}</span>
          <p className="pop-in font-display rounded-full bg-ink px-5 py-2 text-lg text-surface shadow-2xl sm:text-2xl" style={{ animationDelay: "120ms" }}>
            {scene.text}
          </p>
        </div>
      )}

      {/* Visiteur qui traverse l'écran */}
      {flyer && (
        <button
          key={flyer.key}
          type="button"
          aria-label="Attrape-moi !"
          className="fly-across"
          style={{ top: `${flyer.top}vh`, ["--flip" as string]: flyer.flip ? -1 : 1 } as React.CSSProperties}
          onAnimationEnd={() => setFlyer(null)}
          onClick={(e) => {
            found("special");
            burst({ x: e.clientX, y: e.clientY, spread: 360, velocity: 9, count: 60, colors: themeColors() });
            const today = (window as unknown as { __wishlistToday?: string }).__wishlistToday;
            stage(flyer.emoji, today ?? "Attrapé ! Tu as l'œil 👀");
            setFlyer(null);
          }}
        >
          {flyer.emoji}
        </button>
      )}

      {/* Cadeau endormi */}
      {sleepy && (
        <button
          type="button"
          className="float fixed bottom-6 left-6 z-[55] flex items-end gap-1 text-5xl"
          aria-label="Réveiller le cadeau"
          onClick={(e) => {
            setSleepy(false);
            found("idle");
            burst({ x: e.clientX, y: e.clientY, emojis: ["💖", "✨"], count: 20, spread: 120, velocity: 8 });
            stage("🎁", "Ah ! Tu m'as réveillé…");
          }}
        >
          🎁
          <span className="mb-8 animate-pulse text-xl">💤</span>
        </button>
      )}

      {/* Toast « secret trouvé » */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[66] flex justify-center px-4">
        {toast && (
          <div key={toast.key} className="pop-in flex items-center gap-3 rounded-full border border-pop/60 bg-ink py-2 pl-2 pr-5 text-sm text-surface shadow-2xl">
            <span className="flex size-8 items-center justify-center rounded-full bg-pop text-lg">{toast.emoji}</span>
            <span>
              <span className="mr-1.5 text-xs uppercase tracking-[0.2em] opacity-60">Secret trouvé</span>
              <strong>{toast.label}</strong>
            </span>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
