# Design Principles

The philosophy behind every decision this skill makes. When two rules conflict, the earlier principle wins.

## 1. Taste over templates

A template answers "what do websites look like?" Taste answers "what should *this* website look like?" Before generating anything, name the one adjective this product must own (calm, precise, warm, electric, expensive) and make every token serve it. If a design choice would look equally at home on any other product in the category, it's a template choice — replace it. The 21st.dev ecosystem exists explicitly to fight the bland AI average; this skill inherits that mandate.

**Test:** cover the logo. Can you still tell whose site this is? If not, the design has no taste yet.

## 2. Visual hierarchy first

Layout is the art of making the second-most-important thing visibly less important. Every viewport gets exactly one focal point; everything else is graded downward through size, weight, contrast, and whitespace — in that order of preference. Reach for color emphasis last. If a stakeholder squints at the page, the intended reading order should survive.

Practical corollaries: never two headlines of equal weight in one viewport; never a hero image that outshouts the hero headline; muted-foreground exists so that 40–60% of your text can recede.

## 3. One strong aesthetic direction per page

Pick one style recipe and commit. Mixing warm-paper serifs with neon accents and glassmorphic cards produces the visual equivalent of five people talking at once — which is exactly what generated UI tends to do, because each section was reasoned about independently. Secondary recipes may contribute at most an accent behavior, never a competing surface or type treatment.

## 4. Tokens before components

Never style a component ad hoc. The order is: palette → surfaces → type scale → radius → shadow → spacing rhythm → *then* components consume tokens. This is what makes shadcn/ui-style systems coherent: a button and a card look related because they drink from the same variables, not because someone eyeballed them into agreement. If a component "needs" a value that isn't a token, either the token system is incomplete (fix it there) or the component is wrong.

## 5. Accessibility as a baseline, not a feature

Contrast ≥ 4.5:1 for body text and ≥ 3:1 for large text and UI boundaries, in both modes. Focus states visible and on-brand (`--ring` is a design token, style it deliberately). Hit targets ≥ 44px on touch. Semantic HTML before ARIA. `prefers-reduced-motion` respected. Color never the sole carrier of meaning. None of this is negotiable for aesthetics — the research shows the best community themes hold beauty *and* contrast simultaneously; muddy low-contrast "premium" gray-on-gray is a failure of craft, not a style.

## 6. Mobile-first thinking

Design the constraint first. On mobile, hierarchy is enforced by the viewport: only one thing fits, so you're forced to decide what matters. Desktop then becomes an expansion problem (what earns the extra space?) rather than mobile a compression problem (what do we cruelly shrink?). Every section spec in this skill must state its mobile behavior; a design without one is half a design.

## 7. Conversion-aware layout

Marketing surfaces exist to cause one action. The CTA must be the most visually dominant interactive element on the page — verify it, don't assume it. Everything above the fold answers three questions in order: what is this, who is it for, why should I care — then offers the action. Social proof sits adjacent to moments of doubt (near pricing, near the form), not quarantined in its own carousel. Friction is design: every extra field, choice, or equally-weighted button is a leak.

## 8. Consistent interaction language

Motion, hover, and focus behavior form a single vocabulary. One easing curve, two duration tiers (micro ~150–250ms, entrance ~300–500ms), one hover philosophy (lift, or tint, or underline — not all three scattered around). Interactive elements of the same rank respond identically everywhere. A user should be able to predict what any element does from having touched one like it.

## 9. Specificity is credibility

Placeholder-flavored copy ("Empower your workflow with seamless solutions") and stock-generic imagery undo everything the tokens achieved. Real numbers, real product nouns, real screenshots. If the user hasn't supplied specifics, write copy so concretely product-shaped that they only need to swap facts, and say so.
