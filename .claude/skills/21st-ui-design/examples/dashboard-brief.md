# Example: Analytics Dashboard

## User prompt

> "Design the main dashboard for Fieldsight, a B2B platform where property managers track maintenance requests across buildings. Users live in this thing all day. Needs: KPI overview, requests table with statuses, per-building filtering, dark mode. React + shadcn/ui, Tailwind v4."

## Expected design direction

- **Recipe:** Soft Light Dashboard. Rationale: all-day usage means fatigue-free cool neutrals, restrained elevation, and data-forward density — not marketing drama.
- **Tokens:** cool off-white bg `oklch(0.982 0.002 260)`, calm blue-teal primary ≈ `oklch(0.60 0.13 220)`, radius 0.5rem, hairline borders carry structure, shadow-sm only on interactive/overlay surfaces, Plus Jakarta Sans, tabular numerals, 5-slot matched-lightness chart palette. Designed dark mode: bg `oklch(0.20 0.012 260)`, brightened primary, lifted borders.
- **Shell:** 260px collapsible sidebar (grouped nav: Overview / Requests / Buildings / Reports, pinned settings+user), 60px topbar with global search and building-switcher combobox.
- **Content:** page title + one primary action ("New request"); 4 KPI stat cards (open, overdue, avg resolution, satisfaction — trend deltas with icon+text, never color-only); requests table directly on background (44–48px rows, tinted status badges from a 4-state semantic set, sortable, kebab row actions, bulk toolbar on select); filter bar as chips, not a wall of dropdowns.
- **States designed, not implied:** first-use empty state ("No requests yet — connect your first building"), no-results state (clear-filters action), skeleton loaders.
- **Mobile:** drawer sidebar, KPI 2×2 grid, table collapses to two-line request cards.

## Expected deliverables

1. Direction statement
2. Token system (both modes) + density spec (13–14px body, 16–24px gaps)
3. Shell + screen breakdown (sidebar map, topbar spec, content hierarchy)
4. Component implementations on request (stat card, requests table, status badge variants via cva)
5. Anti-pattern review (explicitly: no cards-in-cards, one primary action, dark mode designed, table mobile behavior)

## Quality bar

A property manager can find "overdue requests in Building C" in two interactions. Nothing in the app shouts; status badges are the loudest color on screen. Dark mode passes contrast on muted text. Zero marketing-scale type inside the shell.
