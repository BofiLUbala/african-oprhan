# Example: SaaS Landing Page

## User prompt

> "Build a landing page for Ledgerline, an AI bookkeeping tool for solo consultants and freelancers. It auto-categorizes transactions and drafts quarterly tax estimates. Audience is non-finance people who find bookkeeping stressful. Goal: free-trial signups. Next.js + Tailwind + shadcn/ui. I don't want it to look like every AI SaaS page."

## Expected design direction

- **Recipe:** Warm Paper Editorial (primary). Rationale: the audience's core emotion is *stress about money*; the product's promise is calm. Warm cream surfaces, serif display, terracotta primary directly counter the cold "fintech blue" every competitor uses — and the user explicitly asked not to look like generic AI SaaS.
- **Tokens:** paper bg `oklch(0.98 0.005 95)`, warm ink fg, terracotta primary ≈ `oklch(0.62 0.14 45)`, radius 0.375rem, warm-tinted shadows ≤ 12%, Source Serif 4 display + Inter UI, warm dark mode.
- **Page structure:** editorial hero (left-aligned serif headline ≤ 9 words, e.g. "Your books, quietly handled." + proof line "Trusted by 2,300 solo consultants"), product screenshot in warm frame, alternating split feature sections (no card-grid trilogy), one featured testimonial with a specific dollar/time claim, 2-tier pricing with one highlighted, warm dark CTA band, quiet footer.
- **Mobile:** copy-first hero, sticky bottom CTA, splits stack image-under-copy.

## Expected deliverables

1. Direction statement (recipe + rationale, ~4 sentences)
2. Full token system: CSS variables light + dark, type scale, spacing rhythm, 3–5 signature component rules
3. Section-by-section page breakdown with copy drafted in-product-voice
4. Implemented Next.js/Tailwind/shadcn components on request
5. Anti-pattern review report (explicitly confirming: no gradient hero, CTA dominance, contrast pass, mobile spec)

## Quality bar

Cover-the-logo test passes: this page could not be mistaken for a Linear/Stripe clone. Copy names real outcomes ("quarterly estimates drafted before you remember they're due"), not "seamless solutions." Zero blue anywhere. Both modes ≥ 4.5:1 body contrast.
