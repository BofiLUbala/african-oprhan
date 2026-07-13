# 21st UI Design Skill

A Claude Skill that makes AI coding agents design websites with modern visual taste instead of the generic "AI SaaS template" look — grounded in research on the [21st.dev community theme ecosystem](https://21st.dev/community/themes), a platform whose stated mission is fighting AI slop in UI.

## What it does

When installed, this skill changes how Claude approaches any website UI task. Instead of assembling familiar patterns, Claude:

1. **Analyzes the product brief** — audience, emotional tone, conversion goal, surface type, constraints
2. **Commits to one visual direction** from 12 research-grounded style recipes (Modern SaaS Minimal, Warm Paper Editorial, Mono Precision, Dev-Green Terminal, Neo-Brutalist, Dark Neon, Pastel Playful, Nature Calm, Elegant Luxury, Retro Industrial, Soft Light Dashboard, High-Contrast Conversion)
3. **Builds a token system first** — complete shadcn/ui-compatible CSS variables in oklch, light and dark modes both designed, following observed community rules (tinted neutrals, one dominant accent, radius as personality, quiet tinted shadows)
4. **Composes polished components** using per-component rules for heroes, nav, cards, pricing, tables, dashboards, forms, empty states, auth, modals, and more
5. **Self-reviews against 33 anti-patterns** — the gradient-hero, glassmorphism-soup, card-grid-trilogy, centered-everything tells that mark generated UI

## When to use it

Any task like: "build a landing page", "design a dashboard", "create a theme for my app", "review this UI", "make this look less AI-generated", "pick colors and fonts for X". The skill triggers on design, redesign, review, and implementation work across marketing sites, app UIs, portfolios, and storefronts in the Tailwind + shadcn/ui + React/Next.js ecosystem.

## Installation

**Claude Code:** place the folder in `.claude/skills/` in your project (or `~/.claude/skills/` for global use):

```bash
git clone https://github.com/YOUR_USERNAME/21st-ui-design-skill.git .claude/skills/21st-ui-design
```

**Claude.ai / Claude apps:** package the folder as a `.skill` file (zip the directory) and upload it via Settings → Capabilities → Skills, or ask Claude to package and save it for you.

**Claude API / Agent SDK:** include the folder in your agent's skills directory per the [Agent Skills docs](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview).

## Example prompts

Ready-to-use templates live in [`prompts/`](prompts/). Quick versions:

- *"Using the 21st-ui-design skill, build a landing page for [product]. Audience: [who]. Goal: [conversion]. Next.js + shadcn/ui. Don't make it look like every AI SaaS page."*
- *"Review this UI against the skill's anti-pattern checklist and give me a prioritized fix list."* (attach code or screenshots)
- *"Create a complete shadcn theme system for a brand that must feel [adjective]. Light + dark, oklch, ready to paste into globals.css."*
- *"This page was AI-generated and it shows. De-generic it — minimum diff, new tokens, keep the structure."*

Worked end-to-end examples (brief → direction → deliverables → quality bar) are in [`examples/`](examples/).

## What the skill is based on

Research conducted 2026-07-04 on the 21st.dev community themes ecosystem:

- **333 published community themes** enumerated via the platform's public sitemap
- **Remix-frequency analysis** as a popularity proxy (most-remixed: modern-minimal, claude, vercel, vintage-paper, zen-linen, lime-frost, neon-onyx, sage-garden, supabase, kodama-grove…)
- **Real design-token analysis** of the open-source base presets those theme names map to: oklch color patterns, radius clusters, shadow behavior, font pairings, dark-mode construction
- The platform's confirmed style-category taxonomy (modern, professional, vibrant, playful, minimal, dark, luxury, brutalist, nature, and more)

Full methodology, data tables, and honest uncertainty labeling are in [`references/21st-theme-research.md`](references/21st-theme-research.md). Notably: the themes grid is client-rendered, so no likes/views data was available — rankings are remix-derived and labeled as such. Token values come from the MIT-licensed open-source presets the community remixes, not from scraping proprietary pages.

## Updating the research later

The theme ecosystem moves. To refresh:

1. Fetch `https://21st.dev/sitemap.xml` and re-extract `@user/themes/*` URLs
2. Re-count remix base names for updated popularity signals
3. If 21st.dev ships server-rendered listings or a public API with likes/views, prefer that data and update the tables
4. Pull tokens for any new top presets from their open-source registry
5. Update the date stamp in `references/21st-theme-research.md` and adjust `references/style-recipes.md` if a new family emerges

## Safety & quality notes

- The skill enforces WCAG-baseline contrast (4.5:1 body / 3:1 large), visible focus states, semantic HTML, and `prefers-reduced-motion` support — aesthetics never override accessibility
- It contains no proprietary 21st.dev content: only theme names, summarized observations, and tokens from open-source preset definitions
- It instructs Claude to flag invented copy facts for verification rather than shipping plausible fiction
- Style recipes are starting points with explicit "Avoid" lists — the skill tells Claude to adapt hues to the brand, not clone named products

## Repository structure

```text
21st-ui-design-skill/
├── SKILL.md                        # Skill entry point: process + token rules
├── references/
│   ├── 21st-theme-research.md      # Research data, methodology, uncertainty notes
│   ├── design-principles.md        # The nine principles behind every decision
│   ├── style-recipes.md            # 12 complete visual directions with token anchors
│   ├── component-patterns.md       # Per-component rules (hero → modals)
│   └── anti-patterns.md            # 33 failures + fixes; the shipping gate
├── examples/                       # Worked briefs: landing, dashboard, portfolio, ecommerce
├── prompts/                        # Copy-paste task templates
├── README.md
└── LICENSE
```

## License

MIT — see [LICENSE](LICENSE).
