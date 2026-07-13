# Prompt: Review an Existing UI

Copy, fill the brackets, attach code/screenshots/URL, and send.

---

Using the 21st-ui-design skill, run a full design review of this UI.

**What it is:** [product + surface type]
**Audience & goal:** [who uses it, what one action or job matters most]
**Attached:** [screenshots / component code / live URL / tokens file]
**Depth:** [quick pass / full audit]

Structure the review as:

1. **Verdict (3 sentences):** what aesthetic direction this UI is currently attempting, whether it's committed to it, and the single highest-impact fix.
2. **Anti-pattern audit:** check against the skill's full anti-patterns checklist (AI-design tells, visual, UX, accessibility, Tailwind/shadcn). For each hit: name the pattern, point to where it occurs, give the concrete fix — not "improve hierarchy" but "drop the subhead from 24px semibold to 18px regular muted-foreground so the headline wins."
3. **Token health:** are colors/radius/shadows/spacing behaving like a system or a collection of accidents? Propose corrected token values in oklch where broken.
4. **Hierarchy & conversion:** squint-test result — reading order, focal point per viewport, CTA dominance verdict.
5. **Both-modes + mobile check:** contrast failures with the specific pairs and ratios; mobile behaviors that were crushed rather than designed.
6. **Prioritized fix list:** ranked by impact/effort, top 5 first, each ≤ 2 lines.

Be blunt. Praise only what genuinely works, in one line. Do not soften findings.
