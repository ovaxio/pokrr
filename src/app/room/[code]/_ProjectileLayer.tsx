"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerView, ProjectileThrownMessage } from "../../../../party/types";
import { useDict } from "@/i18n/DictContext";
import { interpolate } from "@/i18n/shared";
import {
  MAX_ACTIVE_PROJECTILES,
  PAPER_ART,
  alternateAnnouncement,
  isPaperItem,
  kindOf,
  planProjectile,
  reactionItemLabel,
  shouldAnnounce,
  type PaperItem,
} from "@/lib/projectiles";

const SVG_NS = "http://www.w3.org/2000/svg";

// SVG d'un objet en papier, par createElementNS et attributs de présentation (aucun attribut
// style, aucun HTML injecté : la CSP style-src n'a rien à bloquer).
function createPaperSvg(item: PaperItem): SVGSVGElement {
  const art = PAPER_ART[item];
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", art.viewBox);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  for (const p of art.paths) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", p.d);
    path.setAttribute("fill", p.fill);
    path.setAttribute("stroke", p.stroke);
    path.setAttribute("stroke-width", String(p.strokeWidth));
    path.setAttribute("stroke-linejoin", p.strokeLinejoin);
    if (p.strokeLinecap) path.setAttribute("stroke-linecap", p.strokeLinecap);
    svg.appendChild(path);
  }
  return svg;
}

function targetCard(voterId: string) {
  const el = document.querySelector(`[data-voter-card="${CSS.escape(voterId)}"]`);
  if (!el) return null;
  return { rect: el.getBoundingClientRect(), shakeEl: el.querySelector("[data-card-shake]") };
}

// Calque fixe qui joue les vols des réactions (emojis et objets en papier SVG). Les noeuds
// sont créés impérativement (SVG par createElementNS, tailles du sprite par CSSOM, jamais
// de style inline dans le markup) et animés par Web Animations API.
export default function ProjectileLayer({
  subscribe,
  players,
  meVoterId,
}: {
  subscribe: (listener: (shot: ProjectileThrownMessage) => void) => () => void;
  players: PlayerView[];
  meVoterId: string;
}) {
  const d = useDict();
  const dictRef = useRef(d);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const playersRef = useRef(players);
  const meRef = useRef(meVoterId);
  const lastAnnouncedAtRef = useRef<number | null>(null);
  const announceOddRef = useRef(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    dictRef.current = d;
    playersRef.current = players;
    meRef.current = meVoterId;
  });

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const shakes = new Set<Animation>();

    const onShot = (shot: ProjectileThrownMessage) => {
      // Onglet caché : ni visuel ni annonce, rien ne s'accumule ni ne se rejoue au retour.
      if (document.visibilityState === "hidden") return;

      const now = Date.now();
      if (shouldAnnounce(now, lastAnnouncedAtRef.current)) {
        const from = playersRef.current.find((p) => p.voterId === shot.fromVoterId);
        const to = playersRef.current.find((p) => p.voterId === shot.toVoterId);
        if (from && to) {
          lastAnnouncedAtRef.current = now;
          const dict = dictRef.current;
          announceOddRef.current = !announceOddRef.current;
          const label = reactionItemLabel(shot.item, dict);
          const text =
            shot.toVoterId === meRef.current
              ? interpolate(dict.reactionAnnounceToYou, { from: from.name, item: label })
              : interpolate(dict.reactionAnnounce, { from: from.name, to: to.name, item: label });
          setAnnouncement(alternateAnnouncement(text, announceOddRef.current));
        }
      }

      if (layer.childElementCount >= MAX_ACTIVE_PROJECTILES) return;

      const target = targetCard(shot.toVoterId);
      if (!target) return;
      // Côté d'entrée et aléas du vol tirés par client : purement décoratif.
      const kind = kindOf(shot.item);
      // Lu à chaque tir : le WAAPI n'obéit pas aux media queries CSS.
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const plan = planProjectile({
        kind,
        target: target.rect,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        reducedMotion,
        dir: Math.random() < 0.5 ? 1 : -1,
        rng: Math.random,
      });
      if (!plan) return;

      const el = document.createElement("span");
      el.setAttribute("data-projectile", kind);
      el.className =
        "fixed left-0 top-0 flex items-center justify-center leading-none select-none" +
        (kind === "emoji" ? " text-3xl" : "");
      el.style.width = `${plan.width}px`;
      el.style.height = `${plan.height}px`;
      if (isPaperItem(shot.item)) el.appendChild(createPaperSvg(shot.item));
      else el.textContent = shot.item;
      layer.appendChild(el);

      // finished rejette à l'annulation (démontage) : le noeud part dans les deux cas.
      const remove = () => el.remove();
      const anim = el.animate(plan.keyframes, { duration: plan.durationMs, easing: "linear", fill: "both" });
      anim.finished.then(remove, remove);
      // Secousse de la carte cible, calée sur le premier contact (même timeline, sans setTimeout).
      if (plan.shake && target.shakeEl) {
        const shake = target.shakeEl.animate(plan.shake.keyframes, {
          duration: plan.shake.durationMs,
          delay: plan.shake.delayMs,
          easing: "ease-out",
        });
        shakes.add(shake);
        const done = () => shakes.delete(shake);
        shake.finished.then(done, done);
      }
    };

    const unsubscribe = subscribe(onShot);
    return () => {
      unsubscribe();
      for (const child of Array.from(layer.children)) {
        for (const a of child.getAnimations()) a.cancel();
      }
      for (const shake of shakes) shake.cancel();
      layer.replaceChildren();
    };
  }, [subscribe]);

  return (
    <>
      <div
        ref={layerRef}
        data-projectile-layer
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      />
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </>
  );
}
