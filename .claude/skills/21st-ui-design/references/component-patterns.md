# Component Patterns

Per-component rules that produce designed-feeling UI in the shadcn/ui + Tailwind idiom. Every rule assumes the token system from SKILL.md Step 3 already exists — components consume tokens, never invent values.

## Hero

The hero answers, in order: what is this → who is it for → why care → act. Structure:

- **Headline:** benefit-led, ≤ 9 words, largest text on the page (clamp between 2.5rem mobile and 4.5rem desktop). One weight jump above everything else — not a gradient text effect unless the recipe (Dark Neon) earns it.
- **Subhead:** one or two sentences, `--muted-foreground`, max-w-prose.
- **CTA pair:** one solid primary, one ghost/link secondary. Never two solids.
- **Proof line:** logos, star rating, or a concrete number directly under the CTAs — trust at the moment of decision.
- **Visual:** real product screenshot in a token-styled frame beats abstract 3D blobs every time. If no product visual exists, use typographic heroes (Mono Precision, Warm Paper) rather than stock illustration.
- Layout options by recipe: centered stack (short copy only), split 55/45, or full-bleed with left-anchored copy. **Mobile:** copy first, visual second, CTA above the fold.

## Navbar

- Height 56–64px. Logo left, 4–6 links center or left-adjacent, single CTA right. More than 6 items → group into one dropdown, don't widen.
- Background: transparent over hero → gains `--background` at 95% opacity + hairline `--border` + shadow-sm on scroll. Blur only if the recipe tolerates it (never in Brutalist/Retro).
- Active link state must exist (weight or 2px underline offset — pick per recipe). Mobile: sheet/drawer from the right, CTA visible in the bar, not buried in the menu.

## CTA (component and section)

- The primary CTA color appears **only** on primary CTAs. The instant it also paints icons and links, dominance dies.
- Button anatomy: 40–48px height (44px+ touch), padding-x ≈ 2.5× padding-y, radius from `--radius`, label is a verb ("Start free", not "Submit").
- Hover: one effect from the recipe's motion language (darken 5–8%, lift 1–2px, or brutalist press). Focus: visible `--ring` offset ring.
- CTA *sections*: full-width band near page end, background flip (dark band on light page or `--primary` at full strength), one headline + one button. No feature lists inside it.

## Cards

- A card earns its surface: it must group ≥ 2 related elements or be interactive. Text that merely sits near other text belongs on the background with spacing — not boxed.
- Anatomy: `--card` surface, 1px `--border`, radius `--radius`, padding 24px (marketing) / 16px (app), shadow only per recipe (hover-elevation in SaaS Minimal, hard-offset in Brutalist, none in Mono).
- Interactive cards: whole card clickable, lift/tint on hover, title is the link semantically.
- **Grid discipline:** max one uniform card grid per page region; alternate with lists, splits, and full-bleed sections. Vary card sizes (featured 2-col span) when content rank differs.

## Pricing

- 2–4 tiers; highlight exactly one ("Most popular") via border in `--primary`, slight scale (1.02–1.05) or elevated shadow — one of these, not all three.
- Price is the largest number on the page; billing-period toggle above the grid; per-tier CTA with only the highlighted tier using the solid primary style.
- Feature lists: 5–8 rows visible, check icons in `--primary` for included, `--muted-foreground` dashes for excluded. Full comparison table collapses below.
- Enterprise tier: "Talk to sales" ghost treatment — don't fake a price. **Mobile:** highlighted tier first in the stack.

## Feature grid

- Icon (in a tinted `--primary`/10 container, radius matching system) + 4–7 word bold claim + ≤ 2 line explanation.
- 3 columns max desktop, 6 features max per grid; more features → tabbed or alternating split sections ("zig-zag") with real screenshots.
- All cells equal height, icons from one family at one stroke width. If every feature "matters", alternate one large split-section feature between grids to restore rhythm.

## Testimonials

- Best pattern: one *featured* quote (large serif or display text, portrait, name/title/company) + optional compact grid of 2–4 short quotes. Wall-of-cards carousels read as filler.
- Quotes must contain specifics (numbers, product nouns). "Great tool, highly recommend!" is anti-copy — flag it and request or draft a concrete quote.
- Logos: monochrome at matched optical size, 5–7 max per row.
- Place adjacent to doubt: after pricing, before the final CTA, beside the signup form.

## Footer

- Structure: brand column (logo, one-line mission, socials) + 2–4 link columns + legal bar (copyright, privacy, terms).
- Surface: flip to dark (`--foreground`-derived) or deepen the background one step; the footer should feel like the page's basement, not a continuation.
- Optional newsletter block at top of footer — single inline input + button, not a whole form. This is also the home for secondary CTAs that would leak attention elsewhere.

## Dashboard shell

- Canonical: fixed sidebar (240–280px, collapsible to 64px icon rail) + 56–64px topbar (breadcrumb/search left, actions/avatar right) + content area on `--background` with 24px gutters.
- Content hierarchy: page title + primary action top-right of content, KPI row (3–5 stat cards max), then main work surface (table/chart). Only one primary action per screen.
- Density: 13–14px body, 16–24px component gaps, tabular numerals. No marketing-scale headings inside the app.

## Sidebar

- Sections: primary nav (icon + label rows, 36–40px tall), grouped with 11px uppercase `--muted-foreground` section labels, pinned bottom block (settings, user).
- Active state: tinted `--primary`/10 background + `--primary` text or 2px left rail — per recipe, one style only.
- Collapse behavior designed, not clipped: icon rail with tooltips. Mobile: off-canvas drawer, same component.

## Data table

- Header row: 12–13px medium `--muted-foreground` labels, sortable columns with direction indicator; sticky on scroll.
- Rows 44–52px, hairline `--border` separators (skip zebra unless > 8 columns), hover tint, numeric columns right-aligned in tabular figures.
- Row actions in a trailing kebab menu; bulk actions appear in a toolbar when checkboxes activate. Status via tinted badges from a *restrained* semantic set.
- Pagination or virtualization past ~50 rows. **Mobile:** the table becomes cards or a two-line list — never a horizontal scroll of 9 columns.

## Forms

- Single column, always. Labels above inputs (never placeholder-as-label), 13–14px medium.
- Inputs: 40–48px, `--input` border, `--ring` focus ring, radius from system. Group related fields with 24–32px section gaps and small headings.
- Inline validation on blur, error in `--destructive` with icon + message under the field; never color-only.
- Submit button full-width (auth/checkout) or right-aligned (settings), disabled state honest (with reason), loading state built in.
- Multi-step > long single page past ~7 fields; show progress.

## Empty state

An empty state is onboarding, not an apology. Anatomy: small on-recipe illustration or icon (not a giant sad clipart), one-line headline stating what *will* live here, one sentence of value, primary action button, optional secondary "Learn how" link. Center-aligned inside its container. Distinct variants for: first-use, no-search-results (offer to clear filters), and error (offer retry) — never one generic void.

## Auth screens

- Single centered card (max-w-sm/md) on a `--muted` or recipe-textured background; logo above; card carries the trust of the brand — this is many users' first product screen.
- Order: SSO buttons (real brand marks, neutral styling) → divider ("or") → email/password → submit → switch link (sign in ↔ sign up) → legal microcopy.
- Password: visibility toggle, requirements shown *before* failure. Errors inline, generic on credentials ("email or password incorrect") for security.
- No marketing content bolted on; at most a split layout with one quiet brand panel (quote or gradient per recipe) that disappears on mobile.

## Modals

- Sizes: sm (400px confirm), md (560px form), lg (720px content); beyond that, use a page or drawer.
- Anatomy: title + optional one-line description, body, footer with actions right-aligned — primary rightmost, cancel as ghost. Destructive confirms use `--destructive` solid and name the object ("Delete 'Q3 report'?").
- Overlay at 40–60% `--foreground`-tint, radius one step larger than buttons, entrance 200ms fade+scale(0.98→1). Focus trapped, Esc closes, focus returns on close. Never stack modals.
