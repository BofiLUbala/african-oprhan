# Example: E-commerce Product Pages

## User prompt

> "We sell small-batch olive oil and vinegars direct to consumer — premium but approachable, farm-to-table story. Need the storefront: home, product listing, product detail, cart. Shopify Hydrogen (React), Tailwind. Should feel expensive but warm, not sterile luxury."

## Expected design direction

- **Recipe:** Nature Calm (primary) with Elegant Luxury contributing type scale and restraint. Rationale: "expensive but warm" is precisely the seam between those two families — olive/linen palette carries farm provenance, serif display and whitespace carry premium.
- **Tokens:** warm linen bg `oklch(0.975 0.006 90)`, olive primary ≈ `oklch(0.55 0.08 125)`, deep ink fg, radius 0.375rem, warm/green-tinted shadows ≤ 12%, Merriweather or Fraunces display + a quiet humanist sans, warm dark mode optional (light-first commerce).
- **Home:** full-bleed photography hero (real groves/bottles — flag if only stock exists), provenance strip ("Single estate · Pressed October 2025 · 400 bottles"), featured products as an asymmetric editorial grid, one farmer-story split section, quiet newsletter footer block.
- **PLP:** 2–3 col grid on background (no card chrome — image, name, varietal note, price), filter chips (varietal, intensity, size), no aggressive sale badges.
- **PDP:** 55/45 gallery/details split; price prominent but not shouting; harvest/tasting notes in a tabbed spec block; single olive-solid "Add to cart" (sticky on mobile); pairing suggestions as an editorial row; concrete reviews near the buy box.
- **Cart:** slide-over drawer, line items with quantity steppers, shipping-threshold progress bar, one checkout CTA — zero competing promos inside the drawer.

## Expected deliverables

1. Direction statement
2. Token system + photography art direction notes (natural light, texture, no white-void packshots)
3. Page-by-page section breakdown with product-true copy
4. Hydrogen/React components on request
5. Anti-pattern review (explicitly: CTA dominance on PDP, no discount-store urgency patterns, contrast on linen surfaces, mobile sticky buy bar)

## Quality bar

Feels like a farm shop run by a design studio: warm, specific, calm. The buy action is unmistakable on every page. Provenance details (harvest dates, batch counts) do the persuading — not badges and countdown timers.
