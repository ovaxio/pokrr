# Product

## Register

product

## Users

Scrum Masters and tech leads who run sprint ceremonies. They're in a meeting, on a call, already sharing their screen. They need to open a room, share the link, and start voting in under 30 seconds. No account creation, no tutorial, no setup friction. On the admin side: one person in control; everyone else just shows up and votes.

A secondary audience is the entire team invited into the room: developers, designers, QA — people who follow a link on a mobile phone or a second screen and need to understand the interface instantly without any onboarding.

## Product Purpose

pokrr is free online planning poker with no signup, no ads, and no install. It exists because every alternative is either paywalled, ad-cluttered, or requires an account. Success looks like a team completing a sprint estimation session entirely inside pokrr without once thinking about the tool — only about the stories.

## Brand Personality

Confident, craftsman, elegant. The product does one thing and does it well. It has the self-assurance of a tool built with care, not a SaaS MVP pushed out quickly. Tone is dry and direct — never cheerful, never corporate, never breathless about features.

## Anti-references

- **Jira / Linear**: dense, cold, optimized for enterprise command-and-control. pokrr has zero hierarchy overhead.
- **PointingPoker / PlanITpoker**: UI circa 2010 — cluttered, visually noisy, low-contrast, maintenance-mode feeling.
- **SaaS cream AI aesthetic**: the warm beige/off-white body, large gradient headings, and saturated testimonials grid that every AI-generated landing defaults to in 2025–2026.
- **Excessive gamification**: confetti, badges, celebration animations, sound effects. pokrr respects that estimation is work, not play.

## Design Principles

1. **Zero visible tool**: the interface should recede the moment the session starts. Players see the deck; the tool disappears.
2. **Trust through restraint**: every element that isn't essential is a distraction. Earn the user's trust by not asking for attention you don't need.
3. **Keyboard-native**: the tool should be fully operable without a mouse, because the admin is often already hands-on a keyboard managing a screen share.
4. **Dual surface, single identity**: the landing page is brand-register (convert, explain, reassure) and the room is product-register (do the job, stay out of the way). Both read as unambiguously pokrr — same tokens, same restraint, different density.
5. **Dark-first craft**: the dark theme is the primary design surface (most estimation sessions happen on a focused screen in a dim room). Light mode is first-class but derives from dark decisions, not the reverse.

## Accessibility & Inclusion

WCAG AA minimum across both themes. Keyboard navigation is core functionality (0–9 vote, Space reveal, R reset). `prefers-reduced-motion` disables the flip animation. All icon-only buttons carry `aria-label`. Vote deck uses `role="radiogroup"` with `aria-checked`. Live region announces vote counts.
