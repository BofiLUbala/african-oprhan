# Style Recipes

Twelve reusable visual directions, grounded in the theme families observed in the 21st.dev community research (`21st-theme-research.md`). Each recipe is a complete aesthetic commitment: pick one, follow all of its rows, and honor its **Avoid** list.

Token values marked "anchor" are real values from the open-source presets the community remixes most — use them as starting points, then adjust hue/chroma toward the specific brand.

---

## 1. Modern SaaS Minimal

*Lineage: modern-minimal — the single most-remixed theme in the research (15 remixes).*

- **Best for:** B2B SaaS, productivity tools, fintech, anything selling trust to professionals
- **Visual mood:** Clean, confident, quietly competent
- **Palette:** Pure or near-pure white bg (`oklch(1 0 0)` anchor), neutral gray scale, one saturated blue primary (`oklch(0.62 0.19 260)` anchor). Nothing else saturated.
- **Type:** Inter or Geist. Semibold headings, regular body, tight tracking on display sizes. Scale ratio ~1.2.
- **Layout:** Generous whitespace, 12-col grid, max-w-6xl content, 96–128px section padding. Alternating full-width and split sections.
- **Components:** Radius 0.375rem. 1px `--border` on cards, shadow-sm at 10% opacity only on hover/elevation. Solid primary CTA, ghost secondary.
- **Motion:** Fade+4px rise on scroll-in, 200ms color transitions. Nothing decorative.
- **Avoid:** Gradients, glassmorphism, more than one accent hue, drop shadows on everything.

## 2. Warm Paper Editorial

*Lineage: the claude / vintage-paper / zen-linen / mocha-mousse cluster — the largest non-minimal family in the research.*

- **Best for:** AI products, writing tools, wellness, education, brands that must feel human and calm
- **Visual mood:** Cream paper, warm ink, a fireplace-adjacent seriousness
- **Palette:** Warm-tinted paper bg (`oklch(0.982 0.005 95)` anchor), warm dark-brown foreground (`oklch(0.34 0.027 96)` anchor), terracotta/clay primary (`oklch(0.62 0.14 39)` anchor). Warm dark mode (`oklch(0.27 0.004 107)`), never blue-black.
- **Type:** Serif-forward: Libre Baskerville, Source Serif 4, or Merriweather for display; humanist sans for UI. Generous line-height (1.6+ body).
- **Layout:** Editorial: strong left-aligned columns, max-w-prose text blocks, ample margins, section breaks with rules or ornaments rather than background flips.
- **Components:** Radius 0.25–0.5rem. Borders over shadows; when shadowed, warm-tinted at ≤ 12%. Buttons feel like stamps: solid clay, subtle press state.
- **Motion:** Minimal — opacity fades, 250ms. The calm *is* the motion design.
- **Avoid:** Neon anything, pure white surfaces, cold grays, techno gradients, cramped line-height.

## 3. Mono Precision

*Lineage: vercel (7 remixes) + graphite/zachix/indigo/azure-mono cluster.*

- **Best for:** Developer tools, infrastructure, design portfolios, technical brands
- **Visual mood:** Swiss, exacting, zero decoration — the confidence of black on white
- **Palette:** Near-white bg (`oklch(0.99 0 0)` anchor), **primary is pure black** (`oklch(0 0 0)` anchor) or one cold hue at low chroma. Grays do all secondary work. Dark mode is true near-black.
- **Type:** Geist or Inter, plus a proud monospace (Geist Mono, JetBrains Mono) used visibly — labels, numbers, nav.
- **Layout:** Hairline 1px borders everywhere as structure; grid lines may be visible. Dense but ordered. Tables and specs are aesthetic features.
- **Components:** Radius 0–0.5rem, small. No shadows or nearly none; borders define elevation. CTA is solid black (inverts in dark mode).
- **Motion:** Instant or near-instant (100–150ms), precise. Underline slides, no bounces.
- **Avoid:** Color used decoratively, soft shadows, rounded-friendly radii, any gradient.

## 4. Dev-Green Terminal

*Lineage: supabase (3+ remixes incl. supabase-sage) and matrix-green.*

- **Best for:** Developer platforms, databases, APIs, open-source products
- **Visual mood:** Dark IDE at midnight, one glowing signal color
- **Palette:** Dev-dark bg (L ~0.18–0.22, slightly cool), light-gray fg, **signature green primary** (`oklch(0.83 0.13 161)` anchor) used sparingly and therefore powerfully. Light mode exists but dark is the hero.
- **Type:** Outfit or Inter for UI, monospace prominent in content (code samples are hero content).
- **Layout:** Code blocks as first-class layout citizens; terminal-window cards; dense docs-like structure with strong sidebar patterns.
- **Components:** Radius 0.5rem. Subtle 1px borders in dark (border L ~0.3), green reserved for CTAs, active states, and success. Green-tinted focus ring.
- **Motion:** Typing effects and cursor blinks acceptable *once* (hero); otherwise crisp 150ms.
- **Avoid:** Green overuse (it must stay rare to stay electric), light-mode-first thinking, marketing fluff imagery instead of real code.

## 5. Neo-Brutalist

*Lineage: neo-brutalism preset, remixed in the community.*

- **Best for:** Portfolios, creative agencies, event sites, brands that profit from attitude
- **Visual mood:** Loud, flat, unapologetic — a zine with a design system
- **Palette:** Pure white bg, **pure black** text and borders, 1–2 shameless brights (red `oklch(0.65 0.24 27)` anchor, plus yellow/blue block colors).
- **Type:** DM Sans or Space Grotesk at heavy weights; Space Mono for accents. Oversized display sizes.
- **Layout:** Visible structure: thick 2–3px borders, offset panels, stickers/badges, deliberate slight rotations (±1–2°).
- **Components:** **Radius 0px.** Signature shadow: hard `4px 4px 0px 0px black`, no blur — buttons translate into their shadow on press.
- **Motion:** Snappy and physical: instant press-displacement, marquees allowed.
- **Avoid:** Soft shadows, gradients, gray anything, subtlety in general, and — critically — using this recipe for trust-sensitive products.

## 6. Dark Neon Futuristic

*Lineage: neon-onyx (4 remixes), neon-magenta, neon-cyber, cyberpunk.*

- **Best for:** Gaming, web3, AI-hype launches, music/events, consumer apps chasing energy
- **Visual mood:** Night city; one electric color humming against onyx
- **Palette:** Near-black tinted bg (`oklch(0.16 0.035 282)` anchor), one very-high-chroma accent — magenta `oklch(0.67 0.29 341)` anchor, or cyan/lime. Chroma up to 0.29 is period-correct here and only here.
- **Type:** Outfit, Space Grotesk, or Oxanium. Wide tracking on uppercase labels.
- **Layout:** Dark full-bleed sections, glow used as hierarchy (the CTA glows, nothing else does), thin luminous dividers.
- **Components:** Radius 0.5rem. Borders at low-opacity accent color; glow = tight accent-colored shadow, ≤ 2 elements per viewport.
- **Motion:** Slightly more theatrical: 300–400ms entrances, gradient shimmer on the primary CTA only.
- **Avoid:** Multiple competing neons, glow on everything, unreadable neon-on-black body text (body stays light-gray), light mode as an afterthought.

## 7. Pastel Playful

*Lineage: candyland (3 remixes), pastel-dreams.*

- **Best for:** Consumer apps, kids/family products, creator tools, community platforms
- **Visual mood:** Soft, sweet, optimistic — serious about being fun
- **Palette:** High-lightness tinted bg (`oklch(0.97 0.009 315)` anchor), soft multi-pastel system (pink `oklch(0.87 0.07 7)`, lavender `oklch(0.71 0.16 294)` anchors) — the one recipe where multiple hues are allowed, all at matched lightness.
- **Type:** Poppins, Open Sans, or Quicksand. Rounded, medium weights; avoid harsh bolds.
- **Layout:** Blobby organic section dividers, generous padding, illustration-friendly.
- **Components:** **Radius 1–1.5rem** (pastel-dreams anchors 1.5rem). Pill buttons, soft tinted shadows, chips and badges everywhere.
- **Motion:** Springy: gentle scale on hover (1.02–1.05), soft bounces, 300ms.
- **Avoid:** Low-contrast pastel-on-pastel text (the classic failure — keep fg dark), corporate stock imagery, sharp corners sneaking in.

## 8. Nature Calm

*Lineage: sage-garden (3 remixes), kodama-grove (3), zen-linen (4), mint-signal, lime-frost (4).*

- **Best for:** Sustainability, health, food, outdoors, slow-living brands
- **Visual mood:** Moss, linen, and morning light
- **Palette:** Warm-neutral bg (`oklch(0.976 0.004 91)` anchor), desaturated green primary (`oklch(0.63 0.03 155)` sage anchor up to `oklch(0.67 0.11 119)` kodama), earthy support tones. Chroma stays modest.
- **Type:** Organic pairings: Antic or Merriweather with a quiet sans. Roomy line-height.
- **Layout:** Asymmetric, breathing layouts; photography of real texture (linen, leaves) over illustration.
- **Components:** Radius 0.35–0.425rem (the observed organic-precision band). Signature: slightly **offset, green/warm-tinted shadows** (`3px 3px 2px hsl(88 22% 35% / 0.15)` kodama anchor) that feel hand-placed.
- **Motion:** Slow and soft: 300–500ms fades, gentle parallax on imagery only.
- **Avoid:** Neon greens, pure white sterility, tech-gradient heroes, cramped density.

## 9. Elegant Luxury

*Lineage: elegant-luxury preset, scarlet-snow.*

- **Best for:** Fashion, jewelry, hospitality, premium services, wine/spirits
- **Visual mood:** Oxblood and cream; a hotel lobby with perfect lighting
- **Palette:** Warm cream bg (`oklch(0.978 0.004 56)` anchor), near-black ink, **deep wine/oxblood primary** (`oklch(0.465 0.147 25)` anchor — note the low lightness; luxury accents are dark, not bright). Gold used only as a hairline garnish if at all.
- **Type:** Libre Baskerville or Playfair display with generous size; Poppins or a neutral sans for UI. Wide letter-spaced uppercase labels.
- **Layout:** Editorial whitespace bordering on extravagant; large imagery; centered display type is permitted here (short lines only).
- **Components:** Radius 0.375rem or less. Signature: **red-tinted shadows** (`hsl(0 63% 18% / 0.12)` anchor). Buttons understated — outline or dark solid, never loud.
- **Motion:** Slow reveals (400–500ms), subtle image scale-on-hover (1.03), nothing bouncy.
- **Avoid:** Bright saturated accents, discount-store urgency patterns, heavy borders, cluttered density — scarcity of elements *is* the luxury signal.

## 10. Retro Industrial

*Lineage: doom-64, retro-arcade.*

- **Best for:** Games, dev side-projects, music, streetwear, anything nostalgic-technical
- **Visual mood:** 90s hardware manual meets cartridge console
- **Palette:** Flat mid-gray bg (`oklch(0.845 0 0)` doom anchor — notably *not* white), dark ink, blood-red or CRT-amber primary (`oklch(0.50 0.19 27)` anchor).
- **Type:** Oxanium, VT323, or Source Code Pro — display and mono do the talking.
- **Layout:** Panel-based, HUD-like; visible bezels, scanline or dither textures at low opacity.
- **Components:** **Radius 0px.** Heavy shadows at 40% opacity (doom anchor) — chunky, industrial. Beveled/pressed button states.
- **Motion:** Steppy and mechanical: frame-like transitions, blinking cursors, no smooth easings.
- **Avoid:** Softness of any kind, pastel tints, modern glassmorphism — commitment is the whole recipe.

## 11. Soft Light Dashboard

*Lineage: northern-lights, azure-mist, indigo-harbor, clean-slate, ocean-breeze.*

- **Best for:** Analytics products, admin panels, CRMs, internal tools — long-session app UIs
- **Visual mood:** Cool, airy, fatigue-free
- **Palette:** Cool-tinted off-white bg (`oklch(0.982 0.001 286)` anchor), calm green or blue primary (`oklch(0.65 0.15 150)` northern-lights anchor), disciplined 5-slot chart palette at matched lightness.
- **Type:** Plus Jakarta Sans or Inter. Small, crisp UI sizes (13–14px body in-app), tabular numerals for data.
- **Layout:** Sidebar + topbar shell; card-based content zones with *restrained* card usage — tables and lists live directly on the background where possible. 16–24px density rhythm.
- **Components:** Radius 0.5rem. Shadow-sm on interactive surfaces only; hairline borders carry structure. Muted-foreground does heavy lifting for labels.
- **Motion:** Utilitarian: 150ms state changes, skeleton loaders, no scroll theatrics.
- **Avoid:** Marketing-hero drama inside the app, cards-in-cards-in-cards, saturated backgrounds behind data, rainbow chart palettes.

## 12. High-Contrast Conversion

*A composite recipe for offer/launch/landing pages where one action is everything.*

- **Best for:** Launch pages, webinar signups, single-product offers, waitlists
- **Visual mood:** Direct, urgent but credible
- **Palette:** Take any host recipe above, then push contrast: darker ink, larger muted-vs-emphasis gap, and a CTA color reserved *exclusively* for CTAs — appearing nowhere else on the page.
- **Type:** The host recipe's fonts at amplified scale contrast (display ratio up to 1.333); benefit-led headline ≤ 9 words.
- **Layout:** Single column narrative, one idea per viewport, sticky CTA on mobile, social proof adjacent to every ask.
- **Components:** CTA is the largest, highest-contrast interactive element — verify by squint test. Forms minimal (≤ 3 fields visible). Directional cues point at the action.
- **Motion:** Only what draws the eye to the CTA once (a single subtle pulse or entrance); zero competing animation.
- **Avoid:** Nav menus that leak attention (strip nav to logo + CTA), equal-weight button pairs, testimonials carousel that auto-rotates past its point, any element you can't justify against "does this help the click?"

---

## Choosing and combining

- Pick **one** primary recipe. A secondary recipe may contribute only an accent behavior (e.g., Mono Precision structure with a Warm Paper palette) — never both surface *and* type from two recipes.
- If the brief matches nothing cleanly, choose the nearest recipe and shift its hue/chroma anchors toward the brand rather than inventing a fusion.
- State the choice out loud with a one-sentence rationale before generating tokens.
