# 21st.dev Community Theme Research

**Date researched:** 2026-07-04
**Source page:** https://21st.dev/community/themes
**Researcher method:** static HTML fetch, sitemap analysis, and open-source token registry cross-reference (details and limitations below).

## How this data was gathered — and what it can and cannot claim

The 21st.dev themes grid is client-rendered JavaScript. Static fetching returns only the page shell, so **no on-page likes, views, or trending-sort data was retrievable**. Individual theme pages also load their design tokens client-side.

However, the site's public sitemap enumerates every published theme URL. At research time it contained **333 community theme URLs**. Remixed themes carry their base theme's name in the slug (e.g. `modern-minimal-remix-…`, `claude-azure-remix-…`), so **remix frequency is a genuine, data-derived popularity proxy** — it measures which themes the community actively chooses as starting points.

Additionally, most top base-theme names map directly to presets in the open-source tweakcn theme registry (MIT-licensed), whose complete token definitions are public. Token values cited below come from those open-source base presets matching the names observed on 21st.dev — **not** from scraping 21st.dev's proprietary pages, and **not** necessarily identical to any individual remix's modified values.

**Explicit uncertainty labels:**

- Remix count ≠ likes/views. Treat rankings below as "most remixed," not "most liked."
- Remixes may alter tokens from the base preset. Token analysis reflects the base designs the community anchors on.
- 21st.dev exposes style-category SEO routes (`/s/modern`, `/s/professional`, `/s/vibrant`, `/s/cool`, `/s/playful`, `/s/minimal`, `/s/dark`, `/s/light`, `/s/luxury`, `/s/retro`, `/s/pastel`, `/s/monochrome`, `/s/brutalist`, `/s/elegant`, `/s/warm`, `/s/nature`, `/s/corporate` — all live at research time). These confirm the platform's category taxonomy but their theme membership was not readable; they may be programmatic routes.
- The platform's own positioning ("Crafted React components and templates that fight AI slop") is quoted from its public homepage metadata and informs this skill's anti-generic stance.

## Most-remixed base themes (sitemap-derived, n=333)

| Remixes | Base theme | Remixes | Base theme |
|---|---|---|---|
| 15 | modern-minimal | 3 | claude-amber |
| 8 | claude | 3 | candyland |
| 7 | vercel | 3 | amber-glow |
| 4 | vintage-paper | 3 | claude-azure |
| 4 | zen-linen | 3 | kodama-grove |
| 4 | lime-frost | 2 | graphite-mono |
| 4 | neon-onyx | 2 | indigo-harbor |
| 3 | sage-garden | 2 | neon-magenta |
| 3 | supabase | 2 | scarlet-snow |

Long tail (1 remix each) includes: cyberpunk, neo-brutalism, caffeine, elegant-luxury, mocha-mousse, doom-64, pastel-dreams, northern-lights, solar-dusk, mint-signal, azure-mist, matrix-green, neon-cyber, amber-slate, indigo-mono, azure-mono, amber-mono-linen, linen-stone, amber-hearth, northern-lights, pastel-dreams, zachix-mono, supabase-sage.

## Observed theme families (recurring patterns, not objective rankings)

Clustering the 333 slugs by name semantics plus token analysis yields these families, roughly by prevalence:

1. **Modern minimal / neutral SaaS** — modern-minimal and descendants. Pure or near-pure white, gray scale, single blue accent, Inter.
2. **Warm paper / cream editorial** — the largest non-minimal cluster: claude, claude-amber, claude-azure, vintage-paper, zen-linen, linen-stone, mocha-mousse, caffeine, amber-glow, amber-hearth, amber-slate, solar-dusk, kodama-grove. Warm-tinted backgrounds (hue 84–103), earthy or terracotta accents, frequent serif usage.
3. **Brand-mimicry themes** — claude, vercel, supabase, t3-chat. The community explicitly wants "make it feel like X product." Vercel = pure black/white monochrome; Supabase = dev-dark with signature green.
4. **Monochrome precision** — graphite-mono, zachix-mono, indigo-mono, azure-mono, vercel lineage. Neutral-only or neutral-plus-one-cold-hue.
5. **Dark neon / cyber** — neon-onyx, neon-magenta, neon-cyber, cyberpunk, matrix-green. Near-black tinted backgrounds, one electric accent at very high chroma (up to 0.29).
6. **Nature calm** — sage-garden, kodama-grove, mint-signal, lime-frost. Desaturated greens, low-chroma accents, soft or offset organic shadows.
7. **Playful pastel** — candyland, pastel-dreams. High-lightness multi-pastel palettes, large radius (up to 1.5rem), rounded friendly sans (Poppins, Open Sans).
8. **Retro / industrial** — doom-64, retro-arcade, neo-brutalism. Zero radius, hard shadows, display or mono fonts.
9. **Luxury / elegant** — elegant-luxury, scarlet-snow. Deep wine/oxblood accents, cream surfaces, Baskerville-class serifs, red-tinted shadows.
10. **Cool light dashboard** — northern-lights, azure-mist, indigo-harbor, clean-slate, ocean-breeze. Cool-tinted off-whites, calm blue/green primaries, Plus Jakarta Sans-style geometry.

## Token analysis (from open-source base presets matching observed names)

Key light-mode values for the most-remixed themes:

| Theme | Light bg | Light primary | Dark bg | Radius | Sans |
|---|---|---|---|---|---|
| modern-minimal | oklch(1.0000 0 0) | oklch(0.6231 0.1880 259.8145) | oklch(0.2046 0 0) | 0.375rem | Inter |
| claude | oklch(0.9818 0.0054 95.0986) | oklch(0.6171 0.1375 39.0427) | oklch(0.2679 0.0036 106.6427) | 0.5rem | system stack |
| vercel | oklch(0.9900 0 0) | oklch(0 0 0) | — near-black | 0.5rem | Geist |
| supabase | oklch(0.9911 0 0) | oklch(0.8348 0.1302 160.9080) | — dev-dark | 0.5rem | Outfit |
| vintage-paper | oklch(0.9582 0.0152 90.2357) | oklch(0.6180 0.0778 65.5444) | — warm dark | 0.25rem | Libre Baskerville |
| sage-garden | oklch(0.9761 0.0041 91.4461) | oklch(0.6333 0.0309 154.9039) | — | 0.35rem | Antic |
| kodama-grove | oklch(0.8798 0.0534 91.7893) | oklch(0.6657 0.1050 118.9078) | oklch(0.3303 0.0214 88.0737) | 0.425rem | Merriweather |
| neo-brutalism | oklch(1.0000 0 0) | oklch(0.6489 0.2370 26.9728) | oklch(0 0 0) | 0px | DM Sans |
| elegant-luxury | oklch(0.9779 0.0042 56.3756) | oklch(0.4650 0.1470 24.9381) | oklch(0.2161 0.0061 56.0434) | 0.375rem | Poppins |
| mocha-mousse | oklch(0.9529 0.0146 102.4597) | oklch(0.6083 0.0623 44.3588) | oklch(0.2721 0.0141 48.1783) | 0.5rem | DM Sans |
| doom-64 | oklch(0.8452 0 0) | oklch(0.5016 0.1887 27.4816) | oklch(0.2178 0 0) | 0px | Oxanium |
| pastel-dreams | oklch(0.9689 0.0090 314.7819) | oklch(0.7090 0.1592 293.5412) | — | 1.5rem | Open Sans |
| northern-lights | oklch(0.9824 0.0013 286.3757) | oklch(0.6487 0.1538 150.3071) | oklch(0.2303 0.0125 264.2926) | 0.5rem | Plus Jakarta Sans |
| cyberpunk | oklch(0.9816 0.0017 247.8390) | oklch(0.6726 0.2904 341.4084) | oklch(0.1649 0.0352 281.8285) | 0.5rem | Outfit |
| candyland | oklch(0.9809 0.0025 228.7836) | oklch(0.8677 0.0735 7.0855) | — | 0.5rem | Poppins |

### Color patterns

- **oklch is the universal token format** across the ecosystem.
- Light backgrounds cluster at **L 0.95–0.99, chroma 0.001–0.015**, hue-tinted to match the theme's temperature. Truly pure white (`oklch(1 0 0)`) appears only in deliberate minimal/brutalist themes.
- Foregrounds are **never pure black** outside brutalism/vercel: L 0.20–0.43, usually hue-matched to the background (claude's warm text on warm paper).
- The dominant pattern is **neutral-everything plus one saturated primary** (chroma 0.13–0.29). Multi-hue palettes appear only in the pastel-playful family.
- Dark modes: bg L 0.16–0.33 (hue-tinted, never pure black except brutalism), fg L 0.81–0.95, primaries frequently *brightened* relative to light mode (caffeine: 0.43 → 0.92 L).

### Typography patterns

- Sans workhorses: **Inter, Geist, Outfit, DM Sans, Poppins, Plus Jakarta Sans, Open Sans, Oxanium** (techy), **Antic** (organic).
- Serif themes are a first-class citizen, not a niche: **Libre Baskerville, Merriweather, Source Serif 4, Georgia** headline the paper/luxury/nature families.
- Monos: **JetBrains Mono, Fira Code, Space Mono, IBM Plex Mono, Source Code Pro** — every theme declares one.

### Radius & shadow patterns

- Radius clusters: **0px** (doom-64, neo-brutalism), **0.25–0.425rem** (editorial/organic precision), **0.5rem** (the modal default), **1.5rem** (pastel-dreams playfulness). Radius is treated as a personality axis.
- Shadows run **8–15% opacity** and are frequently **hue-tinted**: elegant-luxury uses `hsl(0 63% 18%)` red-tinted shadows, kodama-grove `hsl(88 22% 35%)` green-tinted with a 3px offset, mocha-mousse warm-tinted. Neo-brutalism uses hard `4px 4px 0px 0px hsl(0 0% 0% / 1.00)`. Doom-64 uses heavy 40%-opacity industrial shadows.

### Layout & component signals

Direct layout data wasn't retrievable from the JS-gated grid, but the ecosystem context is strong: everything is **shadcn/ui + Radix + Tailwind** convention — CSS-variable tokens, card/popover surface separation, muted/destructive semantic states, border/input/ring triplets, and a five-slot chart palette are structural expectations, not options.

## How to refresh this research

1. Fetch `https://21st.dev/sitemap.xml`, extract `@user/themes/slug` URLs, re-count remix bases.
2. If the grid becomes server-rendered or an API appears, prefer real likes/views over remix counts and update the table.
3. Re-pull matching open-source preset tokens for any new top names.
4. Update the date stamp and re-verify the style-category routes.
