# Example: Design Engineer Portfolio

## User prompt

> "Make me a portfolio site. I'm a design engineer — I ship React components and motion work. I want it to have actual personality, maybe a bit loud. Case studies, an about page, and a components playground. Astro or Next, Tailwind."

## Expected design direction

- **Recipe:** Neo-Brutalist (primary), with Mono Precision contributing the type discipline for code/specs. Rationale: "actual personality, a bit loud" + a maker audience that rewards attitude; brutalism also *demonstrates* craft because it has nowhere to hide — spacing and alignment must be perfect.
- **Tokens:** pure white bg, pure black ink and 2px borders, one shameless red ≈ `oklch(0.65 0.24 27)` + one yellow block color, **radius 0px**, signature `4px 4px 0 0 black` shadows with press-displacement buttons, Space Grotesk display + Space Mono for labels/metadata.
- **Structure:** oversized typographic hero (name as display type, rotating role ticker in mono), sticker-badge tech tags, case study cards as offset panels with ±1° rotation, marquee divider used exactly once, playground page where components render live inside bordered "spec sheets" with mono annotations.
- **Restraint inside the loudness:** body text stays black-on-white at comfortable measure; the brutalist devices frame content, never bury it. Case study interiors calm down to near-Mono-Precision reading layouts.
- **Mobile:** panels stack, rotations reduced, hard shadows shrink to 3px, marquee honors `prefers-reduced-motion`.

## Expected deliverables

1. Direction statement (including why brutalism is *earned* here and where it's deliberately suspended)
2. Token system + the 3–5 signature rules (press-displacement, sticker badges, spec-sheet frames)
3. Page map: home, case study template, about, playground
4. Implemented components on request
5. Anti-pattern review (explicitly: no soft shadows leaking in, no gray, readability of long-form preserved, motion reduced-safe)

## Quality bar

Instantly memorable in a tab full of minimal grey portfolios, yet a hiring manager can read a full case study without fatigue. Every border, offset, and rotation is consistent — sloppy brutalism reads as broken, exact brutalism reads as intent.
