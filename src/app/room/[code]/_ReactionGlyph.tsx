import type { ReactionItem } from "../../../../party/types";
import { PAPER_ART, isPaperItem } from "@/lib/projectiles";

const SIZES = {
  "paper-plane": { bar: [30, 15], hint: [16, 8] },
  "paper-ball": { bar: [22, 22], hint: [12, 12] },
} as const;

// Icône d'une réaction : le texte de l'emoji (le style vient du parent) ou le SVG de l'objet
// en papier, dessiné depuis les mêmes données que le calque de vol (aucun attribut style).
export default function ReactionGlyph({ item, size }: { item: ReactionItem; size: "bar" | "hint" }) {
  if (!isPaperItem(item)) return <>{item}</>;
  const art = PAPER_ART[item];
  const [w, h] = SIZES[item][size];
  return (
    <svg viewBox={art.viewBox} width={w} height={h} aria-hidden="true" focusable="false" className="block">
      {art.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          strokeLinejoin={p.strokeLinejoin}
          strokeLinecap={p.strokeLinecap}
        />
      ))}
    </svg>
  );
}
