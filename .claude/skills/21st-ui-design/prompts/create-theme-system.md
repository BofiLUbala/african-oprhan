# Prompt: Create a Theme System

Copy, fill the brackets, and send. Output drops into a shadcn/ui project's `globals.css`.

---

Using the 21st-ui-design skill, create a complete shadcn/ui-compatible theme system.

**Brand/product:** [name + what it does]
**Personality target:** [the ONE adjective this brand must own, plus 2 supporting ones]
**Starting point:** [existing brand hex values if any / a style recipe from the skill / "closest to (theme name) but warmer/darker/etc." / blank slate]
**Stack:** Tailwind [v3/v4] + shadcn/ui
**Must support:** [light + dark / light-first / dark-first]

Deliver:

1. **Recipe declaration:** which style recipe anchors this theme and why, in two sentences.
2. **Full CSS variable set in oklch** — every shadcn slot: background/foreground, card, popover, primary, secondary, muted, accent, destructive (each with its -foreground), border/input/ring, chart-1 through chart-5, radius, font-sans/serif/mono, shadow-sm/md/lg. Complete `:root` AND complete `.dark` — the dark mode designed, not inverted (tinted dark surfaces, brightened primary, lifted borders).
3. **Tailwind wiring:** the `@theme` block (v4) or `tailwind.config` extension (v3) mapping the variables.
4. **Type system:** font pairing with loading strategy, scale ratio, ≤ 6 sizes with their use.
5. **Spacing & rhythm:** base grid, component gap tokens, section padding tokens (marketing vs app density).
6. **Signature rules:** 3–5 component-level rules that make this theme recognizably itself (button behavior, card treatment, focus ring personality, hover language).
7. **Self-check:** confirm token rules from the skill — no pure black/white outside deliberate recipes, one dominant accent, single radius family, tinted quiet shadows, 4.5:1 body contrast verified in both modes (state the actual pairs you checked).

Give me real values I can paste, not ranges or placeholders.
