---
name: 21st-ui-design
description: Use this skill when designing, redesigning, reviewing, or implementing modern website UI, landing pages, dashboards, product pages, portfolios, SaaS interfaces, marketing sites, or shadcn/ui-inspired design systems. Trigger it whenever the user asks to "build a website", "make a landing page", "design a dashboard", "create a theme", "pick colors/fonts", "make this look better", or complains that a UI looks generic or AI-generated — even if they never say the word "design". It applies 21st.dev community theme research, modern visual taste, strong layout rules, oklch design tokens, component composition, and anti-generic UI checks.
license: MIT
---

# 21st UI Design Skill

This skill makes Claude design websites the way a design engineer would: pick one deliberate aesthetic direction, build a token system before touching components, and review the result against a checklist of "AI slop" tells. It is grounded in research on the 21st.dev community theme ecosystem (see `references/21st-theme-research.md`), whose entire premise is fighting the bland AI average.

**The core rule:** every design decision must be traceable to a chosen style recipe and a product reason. If you can't say *why* a color, radius, or layout choice serves this specific product, you're assembling a template, not designing.

## When this skill fires, follow this process in order

1. **Understand the product** (below)
2. **Select a visual direction** → read `references/style-recipes.md`
3. **Generate the theme system** (token rules below)
4. **Build the UI** → read `references/component-patterns.md`
5. **Review against anti-patterns** → read `references/anti-patterns.md` before finalizing
6. **Ship implementation-ready output**

Read `references/design-principles.md` once per project for the underlying philosophy. Read `references/21st-theme-research.md` when you need evidence for a direction choice or real token values to anchor on.

---

## Step 1 — Understand the product

Extract these from the brief. If the user gave a one-liner, infer sensible answers and state your assumptions in one short block — do not interrogate them with a questionnaire.

| Dimension | What to determine |
|---|---|
| Product type | SaaS tool, dev tool, e-commerce, portfolio, agency, content site, internal app |
| Audience | Developers, executives, consumers, creatives, enterprise buyers |
| Emotional tone | Trustworthy, energetic, calm, premium, playful, technical, warm |
| Conversion goal | Signup, demo booking, purchase, contact, credibility |
| Brand maturity | Established brand assets vs. blank slate |
| Surface type | Marketing page, app shell, dashboard, docs, checkout |
| User journey | Cold visitor → convert, or returning user → do work fast |
| Constraints | Framework (Next.js/React), Tailwind version, shadcn/ui, accessibility level, mobile-first, existing tokens |

**Decision rule:** marketing surfaces optimize for emotion and one conversion action. App surfaces optimize for scanning speed and low visual fatigue. Never style them identically — a dashboard wearing a landing page's dramatic hero treatment is a classic AI tell.

## Step 2 — Select a visual direction

Open `references/style-recipes.md` and choose **one primary recipe** (optionally one secondary for accents). The research shows the community gravitates to a small set of proven families; the recipes encode them with real token anchors.

Fast-mapping heuristics:

- Developer tool → Mono Precision, Dev-Green Terminal, or Dark Neon
- B2B SaaS, fintech, general startup → Modern SaaS Minimal or Soft Light Dashboard
- AI product, writing tool, wellness, anything "human" → Warm Paper Editorial (the single biggest non-minimal cluster in the research)
- Luxury, fashion, hospitality → Elegant Luxury or Luxury Monochrome
- Creator, kids, community, consumer social → Pastel Playful
- Sustainability, health, food, outdoors → Nature Calm
- Portfolio for a designer/engineer → Minimal Portfolio or Neo-Brutalist
- High-stakes conversion page (webinar, launch, offer) → High-Contrast Conversion

**Never blend three or more recipes.** One aesthetic voice per page. State the chosen recipe and a one-sentence rationale before generating anything.

## Step 3 — Generate the theme system

Output a complete shadcn/ui-compatible token set as CSS variables in **oklch** (the observed community standard). Rules derived from the research:

### Non-negotiable token rules

1. **Never pure white / pure black for surfaces and text.** Light backgrounds live at L 0.97–0.99 with a subtle hue tint matching the recipe (warm hue 90–105 for paper themes, cool hue 250–290 for tech themes). Foregrounds live at L 0.20–0.40, tinted toward the same hue. Exceptions: brutalism and mono-precision may use true `oklch(0 0 0)` deliberately.
2. **One dominant accent.** Neutral everything, one saturated primary (chroma 0.13–0.29). Secondary and accent tokens stay muted. Two competing saturated hues is a template tell.
3. **Radius is a personality decision, not a default.** Observed clusters: `0px` (brutalist/industrial), `0.25–0.375rem` (editorial, precise), `0.5rem` (friendly default — most common), `1–1.5rem` (playful/soft). Pick one value; derive sm/md/lg from it (`calc(var(--radius) - 4px)` etc.). Never mix radius families on one page.
4. **Shadows are tinted and quiet.** Community shadows run 8–15% opacity, often hue-tinted to the palette (a green theme uses green-gray shadows, not pure black). Brutalism inverts this: hard `4px 4px 0px 0px` at 100% opacity, no blur.
5. **Dark mode is designed, not inverted.** Dark backgrounds at L 0.17–0.27, tinted; foregrounds at L 0.92–0.95; primaries usually *brightened* in dark mode to hold contrast. Muted text must stay ≥ 4.5:1 against its surface.
6. **Fonts carry the recipe.** Observed pairings: Inter/Geist (minimal, mono-precision), Outfit/Plus Jakarta Sans (modern SaaS), DM Sans/Poppins (friendly), Oxanium/Space Mono (technical/retro), Libre Baskerville/Merriweather/Source Serif 4 (editorial, luxury, paper). Always declare sans + serif + mono, max 2 display-visible families.

### Required token template

```css
:root {
  --background: ; --foreground: ;
  --card: ; --card-foreground: ;
  --popover: ; --popover-foreground: ;
  --primary: ; --primary-foreground: ;
  --secondary: ; --secondary-foreground: ;
  --muted: ; --muted-foreground: ;
  --accent: ; --accent-foreground: ;
  --destructive: ; --destructive-foreground: ;
  --border: ; --input: ; --ring: ;
  --chart-1: ; --chart-2: ; --chart-3: ; --chart-4: ; --chart-5: ;
  --radius: ;
  --font-sans: ; --font-serif: ; --font-mono: ;
  --shadow-sm: ; --shadow-md: ; --shadow-lg: ;
}
.dark { /* full re-specification, same keys */ }
```

Also emit: a type scale (1.125–1.25 ratio for apps, up to 1.333 for marketing; ≤ 6 sizes total), a spacing rhythm statement (4px base grid; section padding 96–128px desktop / 48–64px mobile for marketing, 16–24px density for apps), and 3–5 component styling rules that make this theme recognizably itself (e.g. "buttons have no shadow, 1px inner border, and tighten letter-spacing on hover").

## Step 4 — Build the UI

Read `references/component-patterns.md` for the per-component rules (hero, nav, cards, pricing, testimonials, forms, dashboard shell, tables, sidebars, modals, empty states, CTAs, footers, auth). Key global rules:

- **Hierarchy first.** Each viewport has exactly one primary focal point. If everything is bold, nothing is.
- **The CTA must be the most visually dominant interactive element** on a marketing page — by color, size, or isolation. Verify this explicitly.
- **Break the card-grid reflex.** Alternate section rhythms: full-bleed, split, asymmetric, editorial list. Three identical 3-col card grids in a row is the #1 AI tell.
- **Left-align long-form content.** Centered text is for short heroes and section intros only.
- **Motion is one language:** pick one easing (e.g. `cubic-bezier(0.16, 1, 0.3, 1)`), 150–250ms for micro, 300–500ms for entrances, subtle translate+fade only. No parallax soup.
- **Mobile is designed at the same time**, not shrunk after. State the mobile behavior for every major section.

## Step 5 — Review before shipping

Run the checklist in `references/anti-patterns.md` against your own output. Report the review in 3–6 bullets: what you checked, what you changed. Minimum gates that must pass:

- No generic blue-purple gradient hero unless the recipe explicitly calls for gradients with a purpose
- Text contrast ≥ 4.5:1 (body) / 3:1 (large text) in both modes
- Radius, shadow, and spacing consistent with the single chosen recipe
- CTA dominance verified
- Copy is specific to the product, never lorem-flavored placeholder ("Empower your workflow" is placeholder)
- Mobile layout described or implemented, not implied

## Step 6 — Ship implementation-ready output

Match the deliverable to the ask. Options: design brief · full token system (CSS vars + Tailwind config) · shadcn/ui theme · component plan · page section breakdown · React/Next.js code · UI review report · redesign plan with before/after. When writing code: Tailwind + shadcn/ui conventions, tokens referenced via CSS variables (never hardcoded hex in components), semantic HTML, focus-visible states, `prefers-reduced-motion` respected.

For worked end-to-end examples of briefs → directions → deliverables, see `examples/`. For copy-paste task prompts, see `prompts/`.
