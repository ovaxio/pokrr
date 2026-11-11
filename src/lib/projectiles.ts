// Logique pure des réactions projectiles (physique, images clés WAAPI) et données SVG des
// objets en papier (aucun accès DOM, testable en environnement node). Le calque d'animation
// (_ProjectileLayer.tsx) mesure le DOM et appelle ces fonctions.

import { LIMITS, type ReactionItem } from "../../party/types";
import type { Dict } from "../i18n/types";

export type ProjectileKind = "emoji" | "plane" | "ball";
export type PaperItem = Extract<ReactionItem, `paper-${string}`>;

type Box = { left: number; top: number; width: number; height: number };
type Viewport = { width: number; height: number };
type Dir = 1 | -1;

// Image échantillonnée : x, y = centre du sprite, angle en radians.
type Frame = { t: number; x: number; y: number; angle: number; scaleX: number; scaleY: number; opacity: number };
type Impact = { t: number; speed: number; x: number };
type Flight = { width: number; height: number; frames: Frame[]; impacts: Impact[] };

type ProjectilePlan = {
  width: number;
  height: number;
  keyframes: Keyframe[];
  durationMs: number;
  shake: { keyframes: Keyframe[]; durationMs: number; delayMs: number } | null;
};

type PaperPath = {
  d: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeLinejoin: "round";
  strokeLinecap?: "round";
};

export const MAX_ACTIVE_PROJECTILES = 12;
const ANNOUNCE_GAP_MS = 2000;
// Cooldown serveur + marge de gigue réseau : évite d'envoyer des tirs voués au refus.
export const REACTION_CLIENT_COOLDOWN_MS = LIMITS.projectileCooldownMs + 250;

// Réglage validé à l'oeil par le mainteneur sur un prototype interactif.
const STEP_MS = 16; // pas d'échantillonnage des images clés
const OFFSCREEN_PX = 10;
const LIFT_BASE_PX = 120;
const LIFT_RANGE_PX = 60;
const APEX_MARGIN_PX = 8;
const VERTICAL_MARGIN_PX = 10;
const DRIFT_MAX_PX = 40; // distance max entre le premier contact et l'arrêt
const AIM_JITTER_PX = 6; // centre visé = centre de la carte +- 6
const BOUNCE_JITTER = 0.25;
const BOUNCE_MIN_SPEED = 0.12; // px/ms
const MAX_BOUNCES = 4;
const GRAVITY = 0.0039; // px/ms²
const BALLISTIC_FLIGHT_MS = 770;
const GROUND_HIT_LOSS = 0.6;
const SQUASH_MAX = 0.05;
const IMPACT_SPEED_REF = 1.4; // px/ms, vitesse de référence de l'écrasement et de la secousse
const EMOJI_SIZE_PX = 40;
const EMOJI_RESTITUTION = 0.2;
const EMOJI_SLIDE_DECEL = 0.0031; // px/ms²
const EMOJI_TURNS = 2;
const BALL_SIZE_PX = 28;
const BALL_RESTITUTION = 0.25;
const BALL_ROLL_DECEL = 0.0011; // px/ms²
const AIM_ITERATIONS = 3;
const AIM_BISECTIONS = 30;
const BALLISTIC_HOLD_MS = 450;
const BALLISTIC_FADE_END_MS = 700;

const PLANE_WIDTH_PX = 48;
const PLANE_HEIGHT_PX = 24;
const PLANE_GLIDE_MS = 950;
const PLANE_LIFT_PX = 170;
const PLANE_LIFT_RANGE_PX = 40;
const PLANE_WAVES = 1.25;
const PLANE_WAVE_AMP_PX = 27;
const PLANE_SLIDE_DECEL = 0.0018; // px/ms²
const PLANE_KEEL_RATIO = 0.08;
const PLANE_AIM_ITERATIONS = 5;
const PLANE_NOSE_DIP_RAD = 0.1;
const PLANE_NOSE_DIP_MS = 160;
const PLANE_IMPACT_SPEED_RATIO = 0.5;
const PLANE_HOLD_MS = 500;
const PLANE_FADE_END_MS = 750;

const SHAKE_MS = 220;
const SHAKE_AMP_PX = 3;
const SHAKE_AMP_PLANE_PX = 1.5;
const REDUCED_MOTION_MS = 1300;

// Données SVG des objets en papier, mêmes couleurs dans les deux thèmes (palette stone).
const PAPER_STROKE = "#78716c";
export const PAPER_ART: Record<PaperItem, { viewBox: string; paths: readonly PaperPath[] }> = {
  "paper-ball": {
    viewBox: "0 0 30 30",
    paths: [
      {
        d: "M15 2.5 L21.5 3.8 L26.8 9.2 L27.6 16.5 L24.4 24.6 L16.6 27.8 L8.6 26.2 L3.2 19.6 L2.6 11.4 L7.6 4.4 Z",
        fill: "#f5f5f4",
        stroke: PAPER_STROKE,
        strokeWidth: 1.3,
        strokeLinejoin: "round",
      },
      {
        d: "M7.6 9.8 L14 13.2 L11.6 19.8 M14 13.2 L20.8 8.6 M14 13.2 L20 18.4 L24.6 16 M11.6 19.8 L16.8 24.2 M5 15 L11.6 19.8",
        fill: "none",
        stroke: "#a8a29e",
        strokeWidth: 1,
        strokeLinejoin: "round",
        strokeLinecap: "round",
      },
    ],
  },
  "paper-plane": {
    viewBox: "0 0 48 24",
    paths: [
      { d: "M2 3 L46 12 L15 13.5 Z", fill: "#fafaf9", stroke: PAPER_STROKE, strokeWidth: 1.1, strokeLinejoin: "round" },
      { d: "M15 13.5 L46 12 L11 21.5 Z", fill: "#d6d3d1", stroke: PAPER_STROKE, strokeWidth: 1.1, strokeLinejoin: "round" },
      { d: "M15 13.5 L9 16.5 L11 21.5", fill: "#a8a29e", stroke: PAPER_STROKE, strokeWidth: 1.1, strokeLinejoin: "round" },
    ],
  },
};

export function isPaperItem(item: ReactionItem): item is PaperItem {
  return item === "paper-plane" || item === "paper-ball";
}

export function kindOf(item: ReactionItem): ProjectileKind {
  if (item === "paper-plane") return "plane";
  if (item === "paper-ball") return "ball";
  return "emoji";
}

// Nom accessible d'une réaction : celui du dictionnaire pour un objet, l'emoji lui-même sinon.
export function reactionItemLabel(
  item: ReactionItem,
  labels: Pick<Dict, "reactionItemPlane" | "reactionItemBall">,
): string {
  if (item === "paper-plane") return labels.reactionItemPlane;
  if (item === "paper-ball") return labels.reactionItemBall;
  return item;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function intersectsViewport(target: Box, vp: Viewport): boolean {
  return (
    target.left < vp.width &&
    target.left + target.width > 0 &&
    target.top < vp.height &&
    target.top + target.height > 0
  );
}

function sizeOf(kind: ProjectileKind): { width: number; height: number } {
  if (kind === "plane") return { width: PLANE_WIDTH_PX, height: PLANE_HEIGHT_PX };
  const size = kind === "ball" ? BALL_SIZE_PX : EMOJI_SIZE_PX;
  return { width: size, height: size };
}

// Ordonnée du centre de l'objet posé : sa base sur la ligne de base de la carte (le sol),
// la quille de l'avion un peu en dessous.
function restCenterY(kind: ProjectileKind, target: Box, height: number): number {
  const restY = target.top + target.height - height / 2;
  return kind === "plane" ? restY + PLANE_KEEL_RATIO * height : restY;
}

// Emoji et boulette : parabole jusqu'à un premier contact visé sur la carte, puis rebonds,
// glissade (emoji) ou roulement (boulette) sur la ligne de base de la carte.
function ballisticFlight(kind: "emoji" | "ball", target: Box, vp: Viewport, dir: Dir, rng: () => number): Flight {
  const ball = kind === "ball";
  const size = ball ? BALL_SIZE_PX : EMOJI_SIZE_PX;
  const half = size / 2;
  const g = GRAVITY;
  const T = BALLISTIC_FLIGHT_MS;

  // Tirages dans un ordre fixe : même graine, même vol.
  const rRestitution = rng();
  const rMinBounce = rng();
  const rAim = rng();
  const rLift = rng();
  const e = (ball ? BALL_RESTITUTION : EMOJI_RESTITUTION) * (1 + BOUNCE_JITTER * (2 * rRestitution - 1));
  const minBounce = BOUNCE_MIN_SPEED * (1 + 2 * BOUNCE_JITTER * (2 * rMinBounce - 1));
  const decel = ball ? BALL_ROLL_DECEL : EMOJI_SLIDE_DECEL;
  const restY = restCenterY(kind, target, size);
  const cx = target.left + target.width / 2 + AIM_JITTER_PX * (2 * rAim - 1);
  const sx = dir > 0 ? -half - OFFSCREEN_PX : vp.width + half + OFFSCREEN_PX;

  // Départ 120 à 180 px au-dessus du sol, abaissé si l'apogée sortirait par le haut.
  const apexLimit = half + APEX_MARGIN_PX;
  const wanted = restY - LIFT_BASE_PX - LIFT_RANGE_PX * rLift;
  const apexStart =
    restY > apexLimit ? restY - T * Math.sqrt(2 * g * (restY - apexLimit)) + (g * T * T) / 2 : -Infinity;
  const sy = clamp(Math.max(wanted, apexStart), half + VERTICAL_MARGIN_PX, vp.height - half - VERTICAL_MARGIN_PX);

  // k : facteur de perte horizontale supplémentaire au premier choc (1 : aucune).
  function run(px: number, k: number): { frames: Frame[]; impacts: Impact[]; restX: number } {
    const vx = (px - sx) / T;
    const vy0 = (restY - sy - (g * T * T) / 2) / T;
    const frames: Frame[] = [];
    const impacts: Impact[] = [];
    const spin = ball ? vx / half : 0; // rad/ms : la boulette tourne comme si elle roulait
    const turn = ball ? 0 : dir * 2 * Math.PI * EMOJI_TURNS;
    const angAt = (t: number) => (ball ? spin * t : turn * Math.min(1, t / T));
    const push = (t: number, x: number, y: number, angle: number, scaleX: number, scaleY: number, opacity: number) =>
      frames.push({ t, x, y, angle, scaleX, scaleY, opacity });

    for (let t = 0; t < T; t += STEP_MS) {
      push(t, sx + vx * t, sy + vy0 * t + (g * t * t) / 2, angAt(t), 1, 1, 1);
    }

    let t = T;
    let x = px;
    let vGround = vx; // vitesse horizontale après les chocs
    let vy = vy0 + g * T;
    let a = angAt(T);
    let bounces = 0;
    for (;;) {
      impacts.push({ t, speed: vy, x });
      const c = Math.min(1, vy / IMPACT_SPEED_REF);
      const s = SQUASH_MAX * c;
      const sqMs = 30 + 30 * c;
      push(t, x, restY, a, 1, 1, 1);
      // Le choc freine tout de suite : la perte horizontale s'applique dès l'écrasement.
      vGround *= (1 - GROUND_HIT_LOSS) * (impacts.length === 1 ? k : 1);
      const squashDx = (vGround * sqMs) / 2; // avancée pendant chaque moitié de l'écrasement
      t += sqMs / 2;
      x += squashDx;
      if (ball) a += squashDx / half;
      push(t, x, restY + half * s, a, 1 + s, 1 - s, 1);
      t += sqMs / 2;
      x += squashDx;
      if (ball) a += squashDx / half;
      vy *= e;
      if (vy < minBounce || bounces >= MAX_BOUNCES) break;
      const dur = (2 * vy) / g;
      for (let tau = 0; tau < dur; tau += STEP_MS) {
        push(t + tau, x + vGround * tau, restY - vy * tau + (g * tau * tau) / 2, ball ? a + spin * tau : a, 1, 1, 1);
      }
      x += vGround * dur;
      if (ball) a += spin * dur;
      t += dur;
      bounces++;
    }
    push(t + 1, x, restY, a, 1, 1, 1);

    // Au sol : glisse (emoji) ou roule (boulette) jusqu'à l'arrêt.
    const v = vGround;
    const stop = Math.abs(v) / decel;
    const sgn = Math.sign(v);
    for (let tau = STEP_MS; tau < stop; tau += STEP_MS) {
      const dx = v * tau - (sgn * decel * tau * tau) / 2;
      push(t + tau, x + dx, restY, ball ? a + dx / half : a, 1, 1, 1);
    }
    const dist = sgn * ((v * v) / (2 * decel));
    x += dist;
    if (ball) a += dist / half;
    t += stop;
    push(t, x, restY, a, 1, 1, 1);
    push(t + BALLISTIC_HOLD_MS, x, restY, a, 1, 1, 1);
    push(t + BALLISTIC_FADE_END_MS, x, restY, a, 1, 1, 0);
    frames.sort((p, q) => p.t - q.t);
    return { frames, impacts, restX: x };
  }

  // Premier contact sur la carte, arrêt sur la carte : la dérive après contact est bornée
  // (perte horizontale plus forte au premier choc) et répartie de part et d'autre du centre.
  let px = cx;
  let k = 1;
  for (let it = 0; it < AIM_ITERATIONS; it++) {
    const natural = Math.abs(run(px, 1).restX - px);
    const D = Math.min(natural, DRIFT_MAX_PX);
    let lo = 0;
    let hi = 1;
    for (let j = 0; j < AIM_BISECTIONS && natural > DRIFT_MAX_PX; j++) {
      const mid = (lo + hi) / 2;
      if (Math.abs(run(px, mid).restX - px) > D) hi = mid;
      else lo = mid;
    }
    k = natural > DRIFT_MAX_PX ? lo : 1;
    px = cx - (dir * D) / 2;
  }
  const out = run(px, k);
  return { width: size, height: size, frames: out.frames, impacts: out.impacts };
}

// Avion : plané (descente douce, ondulation amortie, assiette qui suit la pente), toucher
// sans rebond puis glissade.
function planeFlight(target: Box, vp: Viewport, dir: Dir, rng: () => number): Flight {
  const W = PLANE_WIDTH_PX;
  const H = PLANE_HEIGHT_PX;
  const T = PLANE_GLIDE_MS;
  const rAim = rng();
  const rLift = rng();
  const restY = restCenterY("plane", target, H);
  const cx = target.left + target.width / 2 + AIM_JITTER_PX * (2 * rAim - 1);
  const sx = dir > 0 ? -W / 2 - OFFSCREEN_PX : vp.width + W / 2 + OFFSCREEN_PX;
  const sy = clamp(
    restY - PLANE_LIFT_PX - PLANE_LIFT_RANGE_PX * rLift,
    H + VERTICAL_MARGIN_PX,
    vp.height - H - VERTICAL_MARGIN_PX,
  );
  const smooth = (u: number) => u * u * (3 - 2 * u);
  const yAt = (u: number) =>
    sy + (restY - sy) * smooth(u) - PLANE_WAVE_AMP_PX * Math.sin(2 * Math.PI * PLANE_WAVES * u) * (1 - u) * (1 - u);

  // Toucher sur la carte, glissade bornée par la dérive max et centrée sur la carte.
  let px = cx;
  let dec = PLANE_SLIDE_DECEL;
  for (let i = 0; i < PLANE_AIM_ITERATIONS; i++) {
    const v = (px - sx) / T;
    const d = Math.min((v * v) / (2 * PLANE_SLIDE_DECEL), DRIFT_MAX_PX);
    dec = d > 0 ? (v * v) / (2 * d) : PLANE_SLIDE_DECEL;
    px = cx - (Math.sign(v) * d) / 2;
  }
  const vx = (px - sx) / T;

  const frames: Frame[] = [];
  const N = Math.ceil(T / STEP_MS);
  const du = 1 / N / 4; // demi-intervalle de la pente, par différences centrées
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const dy = yAt(Math.min(1, u + du)) - yAt(Math.max(0, u - du));
    const dx = Math.abs(px - sx) * (Math.min(1, u + du) - Math.max(0, u - du));
    frames.push({ t: u * T, x: sx + (px - sx) * u, y: yAt(u), angle: Math.atan2(dy, dx), scaleX: dir, scaleY: 1, opacity: 1 });
  }
  const impacts: Impact[] = [{ t: T, speed: Math.abs(vx) * PLANE_IMPACT_SPEED_RATIO, x: px }];

  // Glissade : le nez pique un peu au contact puis se redresse.
  const stop = Math.abs(vx) / dec;
  const sgn = Math.sign(vx);
  for (let tau = STEP_MS; tau < stop; tau += STEP_MS) {
    const dx = vx * tau - (sgn * dec * tau * tau) / 2;
    const nose = PLANE_NOSE_DIP_RAD * Math.max(0, 1 - tau / PLANE_NOSE_DIP_MS);
    frames.push({ t: T + tau, x: px + dx, y: restY, angle: nose, scaleX: dir, scaleY: 1, opacity: 1 });
  }
  const x = px + sgn * ((vx * vx) / (2 * dec));
  const tEnd = T + stop;
  frames.push({ t: tEnd, x, y: restY, angle: 0, scaleX: dir, scaleY: 1, opacity: 1 });
  frames.push({ t: tEnd + PLANE_HOLD_MS, x, y: restY, angle: 0, scaleX: dir, scaleY: 1, opacity: 1 });
  frames.push({ t: tEnd + PLANE_FADE_END_MS, x, y: restY, angle: 0, scaleX: dir, scaleY: 1, opacity: 0 });
  frames.sort((p, q) => p.t - q.t);
  return { width: W, height: H, frames, impacts };
}

// Simulation complète d'un vol (images numériques), null si la carte est hors de l'écran.
// dir : +1 entrée par la gauche, -1 par la droite. rng : [0, 1).
export function simulateFlight(input: {
  kind: ProjectileKind;
  target: Box;
  viewport: Viewport;
  dir: Dir;
  rng: () => number;
}): Flight | null {
  const { kind, target, viewport, dir, rng } = input;
  if (!intersectsViewport(target, viewport)) return null;
  return kind === "plane" ? planeFlight(target, viewport, dir, rng) : ballisticFlight(kind, target, viewport, dir, rng);
}

// Vol prêt pour la Web Animations API. Liste de fonctions transform identique dans chaque
// image clé (translate3d, scale, rotate) : sinon le navigateur interpole par matrices et les
// tours complets disparaissent.
export function planProjectile(input: {
  kind: ProjectileKind;
  target: Box;
  viewport: Viewport;
  reducedMotion: boolean;
  dir: Dir;
  rng: () => number;
}): ProjectilePlan | null {
  const { kind, target, viewport, reducedMotion } = input;
  if (!intersectsViewport(target, viewport)) return null;
  const { width, height } = sizeOf(kind);

  if (reducedMotion) {
    const restY = restCenterY(kind, target, height);
    const at = `translate3d(${target.left + target.width / 2 - width / 2}px, ${restY - height / 2}px, 0)`;
    return {
      width,
      height,
      durationMs: REDUCED_MOTION_MS,
      shake: null,
      keyframes: [
        { transform: at, offset: 0, opacity: 0 },
        { transform: at, offset: 0.15, opacity: 1 },
        { transform: at, offset: 0.8, opacity: 1 },
        { transform: at, offset: 1, opacity: 0 },
      ],
    };
  }

  const flight = simulateFlight(input);
  if (!flight) return null;
  const total = flight.frames[flight.frames.length - 1].t;
  const first = flight.impacts[0];
  const k = Math.min(1, first.speed / IMPACT_SPEED_REF);
  const amp = (kind === "plane" ? SHAKE_AMP_PLANE_PX : SHAKE_AMP_PX) * (0.4 + 0.6 * k);
  return {
    width: flight.width,
    height: flight.height,
    durationMs: total,
    keyframes: flight.frames.map((f) => ({
      offset: f.t / total,
      opacity: f.opacity,
      transform: `translate3d(${f.x - flight.width / 2}px, ${f.y - flight.height / 2}px, 0) scale(${f.scaleX}, ${f.scaleY}) rotate(${f.angle}rad)`,
    })),
    shake: {
      delayMs: first.t,
      durationMs: SHAKE_MS,
      keyframes: [
        { transform: "translate(0px, 0px) rotate(0deg)" },
        { transform: `translate(${amp}px, ${amp * 0.7}px) rotate(${amp * 0.6}deg)` },
        { transform: `translate(${-amp / 2}px, 0px) rotate(${-amp * 0.3}deg)` },
        { transform: "translate(0px, 0px) rotate(0deg)" },
      ],
    },
  };
}

// Une région aria-live ne réannonce pas un texte identique au précédent : on alterne
// une espace insécable finale (invisible) pour que deux annonces consécutives au même
// texte mutent quand même la région.
export function alternateAnnouncement(text: string, odd: boolean): string {
  return odd ? `${text} ` : text;
}

export function shouldAnnounce(now: number, lastAt: number | null): boolean {
  return lastAt === null || now - lastAt >= ANNOUNCE_GAP_MS;
}
