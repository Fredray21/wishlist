"use client";

/**
 * Mini moteur de particules sur <canvas> (zéro dépendance) :
 * confettis, neige, emojis, pluie de pièces…
 */

type Shape = "rect" | "circle" | "ribbon";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  shape: Shape;
  emoji?: string;
  gravity: number;
  drag: number;
  wobble: number;
}

export interface BurstOptions {
  x?: number;
  y?: number;
  count?: number;
  /** angle central en degrés (−90 = vers le haut) */
  angle?: number;
  spread?: number;
  velocity?: number;
  gravity?: number;
  colors?: string[];
  emojis?: string[];
  size?: number;
  life?: number;
}

const DEFAULT_COLORS = ["#ff2e63", "#ffc400", "#12a150", "#2f80ff", "#6c3cff", "#d4a72c", "#ffffff"];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let raf = 0;
let dpr = 1;
const MAX_PARTICLES = 320;
const emojiCache = new Map<string, HTMLCanvasElement>();

/** Emoji pré-rendu une fois sur un petit canvas (fillText à chaque image est très coûteux). */
function emojiSprite(emoji: string): HTMLCanvasElement {
  let sprite = emojiCache.get(emoji);
  if (!sprite) {
    sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    const c = sprite.getContext("2d")!;
    c.font = '52px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(emoji, 32, 36);
    emojiCache.set(emoji, sprite);
  }
  return sprite;
}

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "70",
  });
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  const resize = () => {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  };
  resize();
  window.addEventListener("resize", resize);
}

function tick() {
  if (!ctx || !canvas) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const h = window.innerHeight;

  particles = particles.filter((p) => p.life < p.maxLife && p.y < h + 60);
  for (const p of particles) {
    p.life++;
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.gravity;
    p.x += p.vx + Math.sin((p.life + p.wobble) / 12) * 0.6;
    p.y += p.vy;
    p.rot += p.vr;
    const fade = Math.min(1, (p.maxLife - p.life) / 30);

    ctx.globalAlpha = fade;
    const cos = Math.cos(p.rot) * dpr;
    const sin = Math.sin(p.rot) * dpr;
    ctx.setTransform(cos, sin, -sin, cos, p.x * dpr, p.y * dpr);
    if (p.emoji) {
      ctx.drawImage(emojiSprite(p.emoji), -p.size / 2, -p.size / 2, p.size, p.size);
    } else {
      ctx.fillStyle = p.color;
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "ribbon") {
        ctx.scale(1, Math.cos(p.life / 6));
        ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3);
      } else {
        ctx.scale(Math.cos(p.life / 8), 1);
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, (p.size * 2) / 3);
      }
    }
  }
  ctx.globalAlpha = 1;

  if (particles.length) raf = requestAnimationFrame(tick);
  else {
    raf = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function room() {
  return MAX_PARTICLES - particles.length;
}

function start() {
  if (!raf) raf = requestAnimationFrame(tick);
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** Explosion de particules depuis un point. */
export function burst(opts: BurstOptions = {}) {
  if (typeof window === "undefined" || reducedMotion()) return;
  ensureCanvas();
  const {
    x = window.innerWidth / 2,
    y = window.innerHeight / 2,
    count = 80,
    angle = -90,
    spread = 70,
    velocity = 12,
    gravity = 0.28,
    colors = DEFAULT_COLORS,
    emojis,
    size = 10,
    life = 180,
  } = opts;
  for (let i = 0; i < Math.min(count, room()); i++) {
    const a = ((angle + rand(-spread / 2, spread / 2)) * Math.PI) / 180;
    const v = velocity * rand(0.45, 1.1);
    particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.2, 0.2),
      size: emojis ? size * rand(1.6, 2.6) : size * rand(0.6, 1.3),
      life: 0,
      maxLife: life * rand(0.7, 1.2),
      color: pick(colors),
      shape: pick<Shape>(["rect", "circle", "ribbon"]),
      emoji: emojis ? pick(emojis) : undefined,
      gravity,
      drag: 0.985,
      wobble: rand(0, 100),
    });
  }
  start();
}

/** Pluie continue depuis le haut de l'écran pendant `duration` ms. */
export function rain(opts: { duration?: number; emojis?: string[]; colors?: string[]; density?: number; snow?: boolean } = {}) {
  if (typeof window === "undefined" || reducedMotion()) return;
  ensureCanvas();
  const { duration = 4000, emojis, colors = DEFAULT_COLORS, density = 6, snow = false } = opts;
  const end = performance.now() + duration;
  const spawn = () => {
    for (let i = 0; i < Math.min(density, room()); i++) {
      particles.push({
        x: rand(-20, window.innerWidth + 20),
        y: -20,
        vx: rand(-1, 1),
        vy: snow ? rand(1, 2.6) : rand(2, 5),
        rot: rand(0, Math.PI * 2),
        vr: snow ? 0 : rand(-0.1, 0.1),
        size: snow ? rand(3, 8) : emojis ? rand(18, 30) : rand(6, 12),
        life: 0,
        maxLife: 900,
        color: snow ? "rgba(255,255,255,0.92)" : pick(colors),
        shape: snow ? "circle" : pick<Shape>(["rect", "ribbon", "circle"]),
        emoji: emojis ? pick(emojis) : undefined,
        gravity: snow ? 0.002 : 0.04,
        drag: 0.999,
        wobble: rand(0, 100),
      });
    }
    if (performance.now() < end) requestAnimationFrame(spawn);
  };
  spawn();
  start();
}

/** Canons à confettis depuis les deux coins inférieurs. */
export function cannons(colors?: string[]) {
  const h = window.innerHeight;
  burst({ x: 0, y: h, angle: -60, spread: 40, velocity: 22, count: 120, colors });
  burst({ x: window.innerWidth, y: h, angle: -120, spread: 40, velocity: 22, count: 120, colors });
}

/** Feu d'artifice : plusieurs explosions circulaires. */
export function fireworks(times = 6) {
  for (let i = 0; i < times; i++) {
    window.setTimeout(() => {
      burst({
        x: rand(window.innerWidth * 0.15, window.innerWidth * 0.85),
        y: rand(window.innerHeight * 0.15, window.innerHeight * 0.5),
        spread: 360,
        velocity: 9,
        gravity: 0.12,
        count: 90,
        size: 6,
        life: 120,
        colors: [pick(DEFAULT_COLORS), pick(DEFAULT_COLORS), "#ffffff"],
      });
    }, i * 380);
  }
}

/** Petite traînée d'étincelles (curseur). */
export function sparkle(x: number, y: number, emoji?: string) {
  burst({
    x,
    y,
    count: 2,
    spread: 360,
    velocity: 1.6,
    gravity: 0.05,
    size: emoji ? 6 : 5,
    life: 50,
    emojis: emoji ? [emoji] : undefined,
    colors: ["#ffd86b", "#ffffff", "#ff9ecf"],
  });
}

/** Thème courant (lu sur <html data-theme>). */
export function themeColors(): string[] {
  const t = document.documentElement.dataset.theme;
  if (t === "noel") return ["#a4161a", "#d4a72c", "#1f6f4a", "#fffaf0", "#e8c766"];
  if (t === "anniversaire") return ["#ff2e63", "#ffc400", "#6c3cff", "#12a150", "#2f80ff"];
  return ["#121110", "#d4351c", "#c9b78f", "#f3efe7", "#6f6a60"];
}
