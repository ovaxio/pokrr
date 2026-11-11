# Design System — pokrr

## Overview

Two-theme (light/dark) design system built on CSS custom properties bridged into Tailwind v4. The dark theme is the primary design surface; light mode inverts the ramp. Accent color: indigo. No custom typeface: system-ui stack for zero-latency rendering. Motion is minimal and purposeful: one flip animation and a short reaction projectile, reduced-motion respected everywhere.

---

## Color Palette

All values are committed in `src/app/globals.css` as CSS custom properties and aliased into Tailwind via `@theme inline`.

### Light theme (`:root`)

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#ffffff` | Page background |
| `--surface` | `#fafafa` | Card / section background |
| `--surface-2` | `#f5f5f5` | Secondary surface (inputs, zebra rows) |
| `--elevated` | `#ffffff` | Modals, dropdowns (above surface) |
| `--border` | `#e5e5e5` | Default border |
| `--border-strong` | `#d4d4d4` | Emphasized border |
| `--fg` | `#171717` | Primary text |
| `--fg-soft` | `#404040` | Secondary text |
| `--muted` | `#525252` | Tertiary text, labels |
| `--faint` | `#737373` | Placeholder, timestamps |
| `--accent` | `#4f46e5` | Indigo — interactive, brand |
| `--accent-soft` | `#eef2ff` | Accent tint (badges, highlights) |

### Dark theme (`.dark`)

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0a0a0a` | Page background |
| `--surface` | `#171717` | Card / section background |
| `--surface-2` | `#262626` | Secondary surface |
| `--elevated` | `#171717` | Modals, dropdowns |
| `--border` | `#262626` | Default border |
| `--border-strong` | `#404040` | Emphasized border |
| `--fg` | `#ededed` | Primary text |
| `--fg-soft` | `#d4d4d4` | Secondary text |
| `--muted` | `#a3a3a3` | Tertiary text |
| `--faint` | `#737373` | Placeholder |
| `--accent` | `#6366f1` | Indigo 500 (lighter for dark bg) |
| `--accent-soft` | `#1e1b4b` | Accent tint (dark) |

### Semantic color aliases (Tailwind)

Tailwind classes map to the semantic tokens:

```
bg-bg, bg-surface, bg-surface-2, bg-elevated
border-token (→ --border), border-token-strong
text-fg, text-fg-soft, text-muted, text-faint
bg-accent, text-accent, bg-accent-soft
```

### Feedback colors

Not tokenized; used inline with Tailwind's palette:

- **Error**: `red-300/red-900/60` border · `red-50/red-950/40` bg · `red-900/red-200` text
- **Warning**: `amber-300/amber-900/60` border · `amber-50/amber-950/30` bg · `amber-900/amber-200` text
- **Accent interactive**: `indigo-500/40` border · `indigo-500/10` bg · `indigo-600/indigo-400` text

---

## Typography

### Type stack

```css
font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
```

System UI only — no web font load, no layout shift, instant render. The type system lives entirely in weight, size, and tracking contrast.

### Scale

| Usage | Tailwind | Size | Weight | Tracking |
|---|---|---|---|---|
| Brand wordmark | `text-lg font-bold tracking-tight` | ~18px | 800 | tight |
| Page hero | `text-5xl font-bold tracking-tight` | ~48px | 700 | tight |
| Section heading | `text-2xl font-bold tracking-tight` | ~24px | 700 | tight |
| Card heading | `font-semibold` | ~16px | 600 | default |
| Body | `text-sm text-muted` | ~14px | 400 | default |
| Label / meta | `text-xs` | ~12px | 400 | default |
| Uppercase divider | `text-xs uppercase tracking-wider text-muted` | ~12px | 400 | wider |
| Code / room ID | `font-mono` | inherit | 400 | default |

---

## Spacing & Layout

- **Max content width**: `max-w-md` (~448px) for landing; `max-w-3xl` (~768px) for room
- **Page padding**: `px-6 py-16` (landing) · `px-4 py-5 sm:px-6 sm:py-6` (room)
- **Section gap**: `gap-10` between major sections; `gap-5 sm:gap-6` in the room shell
- **Card padding**: `px-3 py-2` (compact alerts); `space-y-1` / `space-y-2` for stacked items

---

## Border Radius

- **Default interactive**: `rounded` (4px)
- **Card / modal**: `rounded-lg` (8px)
- **Pill / badge**: `rounded-full`
- **Flip face**: `0.5rem` (hardcoded in the flip CSS class)

---

## Shadows & Elevation

No box-shadow utilities in use — elevation is expressed through border + background contrast between `--bg`, `--surface`, and `--elevated`. Modals use `bg-bg/95 backdrop-blur` for overlay scrim.

---

## Motion

### Flip card (vote reveal)

```css
.flip-card {
  transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
.flip-card.flipped {
  transform: rotateY(180deg);
}
@media (prefers-reduced-motion: reduce) {
  .flip-card { transition: none; }
}
```

The flip and the reaction projectile (below) are the only bespoke animations. Everything else uses Tailwind's default `transition` utility (150ms ease).

### Reaction projectile

A player (voter or spectator) arms one of the 12 reactions (`REACTION_ITEMS` in `party/types.ts`: 10 emojis, then a paper plane and a paper ball) in the reaction bar under the player list, then clicks any other online player's card, spectators included, to throw it; the choice stays armed (stored in the browser) until clicked again. The object enters from the left or right edge of the screen (side and small variations drawn per throw and per client, purely decorative), on every client of the room. It is animated with the Web Animations API (`element.animate`) on nodes created imperatively inside a `fixed` layer (`[data-projectile-layer]`, `z-30`, `pointer-events-none`, `aria-hidden`); the paper objects are SVG built with `createElementNS` and presentation attributes, so no inline `style` attribute reaches the HTML (CSP `style-src`) and the layout never moves.

- Ground: the bottom edge of the target card. The throw aims at a first contact on the card (centre +/- 6 px), then drifts at most 40 px, split on both sides of the centre: contact and rest stay within 26 px of the centre of a 64 px card.
- Emoji (40 px) and paper ball (28 px): parabola under a 3900 px/s² gravity, 770 ms to the first contact, starting 120 to 180 px above the ground (lowered if the apex would leave the screen). At each contact: 60 % horizontal loss, screen-aligned squash up to 0.05 with the base kept on the ground, real bounces (restitution 0.2 for the emoji, 0.25 for the ball, +/- 25 % per throw; bounces stop under 0.12 px/ms, +/- 50 % per throw). The emoji makes 2 full turns in flight, lands upright and slides (3100 px/s²); the ball spins and rolls (1100 px/s², rotation = distance / radius). 2 or 3 ground contacts for the emoji, 2 to 4 for the ball.
- Paper plane (48 x 24 px, nose towards the walking direction): 950 ms glide from 170 to 210 px above the ground, smooth descent with a damped oscillation (1.25 waves, 27 px), pitch following the slope, touchdown without bounce, slight nose dip, then a slide (1800 px/s², shortened to stay within the drift cap).
- Then hold (450 ms, plane 500 ms) and fade out (250 ms). Total about 1.65 to 2 s.
- The target card trembles for 220 ms at the first contact (an inner element, `[data-card-shake]`), amplitude growing with the contact speed (up to 3 px and 1.8 deg, half for the plane).
- Paper colours, identical in both themes (stone ramp): fills `#f5f5f4`, `#fafaf9`, `#d6d3d1`, folds `#a8a29e`, outline `#78716c`.
- No sound, no particles, no trail. At most 12 sprites at once; an announcement through an `aria-live="polite"` region at most once every 2 s.
- `prefers-reduced-motion: reduce`: no translation. The object fades in resting on the bottom edge of the target card, holds, fades out (1.3 s), no card shake. The media query is read at each shot because the Web Animations API ignores CSS media queries.
- Reaction bar: 12 buttons of 36 px (the paper objects as SVG icons), 6 columns below 640 px and one row above, pressed state in indigo (`border-indigo-500 bg-indigo-500/20`, `aria-pressed`), a hint line always shown. Shown to voters and spectators. With nothing armed the cards are not buttons.
- Cadence: at most one throw per second per player (server side, plus a 250 ms client margin).
- The admin can switch the feature off for the room (checkbox "Reactions" in the admin bar).

### Principles

- No entrance animations on page load
- Hover states: `transition hover:bg-*` — instantaneous feel, 150ms default
- `prefers-reduced-motion`: flip becomes instant, projectiles fade in place without travelling, no card shake; all transitions respected

---

## Components

### Button (surface variant)

```html
<button class="rounded border border-token bg-surface px-2 py-1 text-fg-soft transition hover:bg-surface-2">
  Label
</button>
```

### Button (accent variant)

```html
<button class="rounded border border-indigo-500/40 bg-indigo-500/10 px-2 py-1 text-indigo-600 dark:text-indigo-400 transition hover:bg-indigo-500/20">
  Label
</button>
```

### Reaction bar (toggle buttons)

Twelve toggle buttons, `h-9 w-9` (36 px), `aria-pressed`: ten emojis (`text-xl`, named by the emoji itself) then the paper plane (30 x 15 px SVG) and the paper ball (22 x 22 px SVG), both with an `aria-label`. Rest: surface variant (`border border-token bg-surface hover:bg-surface-2`). Pressed: `border-indigo-500 bg-indigo-500/20`. Focus: `focus-visible:ring-2 focus-visible:ring-indigo-500`.

### Inline code / room ID

```html
<code class="rounded bg-surface px-2 py-1 font-mono text-fg-soft">
  CODE
</code>
```

### Alert — Error

```html
<div class="flex items-center justify-between gap-3 rounded-lg border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-900 dark:text-red-200">
  Message
</div>
```

### Alert — Warning

```html
<div class="rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
  Message
</div>
```

### Step badge (numbered list)

```html
<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
  1
</span>
```

### Divider with label

```html
<div class="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
  <span class="h-px flex-1 bg-token" />
  <span>or</span>
  <span class="h-px flex-1 bg-token" />
</div>
```

### Player card (flip-based)

The vote card uses the `.flip-card` / `.flip-face` / `.flip-face-back` CSS classes. Face-down shows a placeholder; face-up reveals the numeric vote. Driven by adding `.flipped` class on reveal.

---

## Theming

Theme is stored in `localStorage` as `"theme"` key (`"light"` | `"dark"`). `_ThemeScript.tsx` injects inline JS before hydration to apply `.dark` to `<html>` — no flash of wrong theme. `_ThemeToggle.tsx` handles runtime switching. CSS custom properties update immediately; no JS re-render needed.

---

## Iconography

`lucide-react` — used sparingly. Only `X` (dismiss) confirmed in current code. Icon-only buttons always carry `aria-label`.

---

## Favicon

SVG favicon: indigo rounded square (`rx="7"`, fill `#4f46e5`) with a white bold "p" centered at 20px font-size.
