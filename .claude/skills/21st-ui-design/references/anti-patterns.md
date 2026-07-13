# Anti-Patterns

The review checklist. Run every design through this before shipping — the whole 21st.dev ecosystem exists because generated UI keeps making these exact mistakes. Format: **the tell → why it fails → the fix.**

## AI-generated design tells

1. **The generic blue-purple gradient hero.** The single strongest "a model made this" signal. → Pick a recipe with a real palette position; if a gradient survives, it must be brand-hued, subtle, and appear exactly once with a job to do.
2. **Random glassmorphism.** Frosted cards floating over gradient blobs, everywhere, meaning nothing. → Blur is an elevation tool for overlays (nav-on-scroll, modals) in recipes that tolerate it — not a card style.
3. **Three identical 3-column card grids in a row.** Section rhythm flatlines. → Alternate: split section, full-bleed band, editorial list, featured asymmetric grid.
4. **Everything centered.** Center-aligned headline, subhead, features, testimonials, footer — the layout of no decisions. → Center only short heroes and section intros; left-align everything longform; introduce split and asymmetric structures.
5. **Emoji as icon system / mismatched icon soup.** → One icon family, one stroke weight, one optical size, consistently containered.
6. **Placeholder-flavored copy.** "Empower your workflow with seamless, innovative solutions." → Every headline names a concrete outcome; every feature claim survives the question "could a competitor say the opposite?"
7. **Decorative gradients and blobs with no purpose.** Background noise standing in for taste. → Delete; recover hierarchy through type scale and spacing. Whitespace is not emptiness to fill.
8. **Uniform section padding forever.** Identical 80px gaps make pages scroll like a metronome. → Vary rhythm deliberately: tight pairing between related sections, expansive breaks at narrative turns.

## Visual mistakes

9. **Too many font sizes.** 9+ sizes = no scale at all. → One scale ratio, ≤ 6 sizes, weights doing hierarchy work before sizes multiply.
10. **Weak visual hierarchy.** Two same-weight headlines fighting; hero image outshouting headline. → One focal point per viewport; grade everything else down via size → weight → contrast → whitespace, in that order.
11. **Inconsistent radius.** 4px inputs, 12px cards, 24px buttons, pill toggles. → One `--radius` family, derived sm/md/lg, applied by component rank.
12. **Excessive shadows.** Every element floating at a different altitude. → Shadows per recipe: quiet 8–15% tinted (most), hard-offset (brutalist), or none (mono). Elevation must mean something (interactivity, overlay).
13. **Poor spacing rhythm.** 13px here, 22px there, 37px somewhere. → 4px base grid, a fixed spacing scale, section padding tokens.
14. **Two saturated hues fighting.** Blue primary + orange accent + teal links. → One dominant accent (see token rules); the second hue must justify its existence or die.
15. **Pure black text on pure white everywhere.** Harsh and characterless outside deliberate mono/brutalist recipes. → Tinted near-white surfaces, tinted dark foregrounds (the observed community standard).

## UX mistakes

16. **CTA not visually dominant.** Primary action same weight as nav links, or three equal buttons. → Squint test: the CTA must win. Its color appears nowhere else.
17. **Every element animated.** Scroll-triggered zoo. → One motion language: single easing, two duration tiers, entrance animations for hero + at most one signature moment.
18. **Auto-rotating carousels for critical content.** Testimonials and features users never finish reading. → Static featured quote + grid; carousels only for genuinely browsable galleries, user-controlled.
19. **Navigation bloat.** 9 top-level links leaking attention. → 4–6 links + one CTA; conversion pages strip to logo + CTA.
20. **Placeholder-as-label forms.** Labels vanish on focus; users forget the question. → Labels above inputs, always; helper text below.
21. **Mobile as an afterthought.** Desktop grid crushed to one column, tables scrolling sideways into oblivion, hover-only interactions. → Design mobile behavior per section up front: stack order, sticky CTA, tables→cards, drawer nav, 44px targets.

## Accessibility mistakes

22. **Low-contrast "premium" gray text.** `#999` on white (≈2.8:1) reads as sophistication and works as exclusion. → 4.5:1 body / 3:1 large text minimum; `--muted-foreground` must be *tested*, not vibed.
23. **Dark mode with muddy contrast.** Inverted colors, gray-on-gray soup, dimmed accents vanishing. → Dark mode designed separately: bg L 0.17–0.27, fg L 0.92+, primaries brightened, borders lifted.
24. **Focus states removed.** `outline: none` and nothing else. → `--ring` is a brand token; style a visible offset ring on every interactive element.
25. **Color-only meaning.** Red/green status dots with no text; required fields marked only by hue. → Pair color with icon, label, or text everywhere meaning is carried.
26. **Fake buttons and divs-as-controls.** Click handlers on divs, no keyboard path. → Semantic HTML first: `button`, `a`, `label`; ARIA only to fill real gaps.
27. **Motion without mercy.** Parallax and auto-play ignoring vestibular users. → Respect `prefers-reduced-motion` with a genuine reduced experience.

## Tailwind / shadcn mistakes

28. **Hardcoded hex in components.** `bg-[#3b82f6]` scattered through JSX. → All color through CSS variables/semantic tokens; components never know hex values.
29. **Overriding shadcn components inline until they're unrecognizable.** 14 utility classes fighting the variant system. → Extend via `cva` variants and token changes; if you're fighting a component, re-theme it once at the source.
30. **Ignoring the semantic slots.** Using `--primary` for backgrounds, `--destructive` for "warning-ish", skipping `--muted`. → Slots have meanings; `--muted`/`--muted-foreground` exist precisely so 40–60% of UI can recede.
31. **Arbitrary values as a lifestyle.** `mt-[13px]`, `text-[15.5px]`, `w-[347px]`. → If a value recurs, it's a token; if it doesn't recur, question it.
32. **One default ring/border left factory-blue** while the brand is terracotta. → Theme `--border`, `--input`, `--ring` together with the palette — they're the most-forgotten personality tokens.
33. **Chart colors from five unrelated hues.** → Use the 5-slot `--chart-*` tokens at matched lightness, derived from the recipe.

## The final gate

Before shipping, answer honestly:

- Cover the logo — is this distinguishable from a template? (Principle 1)
- Squint — does the intended reading order survive, and does the CTA win?
- Read the copy aloud — would a competitor's page say the same words?
- Toggle dark mode — was it designed or inverted?
- Shrink to 375px — was mobile designed or crushed?

Any "no" → return to the relevant step, don't ship.
