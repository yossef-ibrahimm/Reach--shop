# design-reference — READ BEFORE USING

`index.html` + `styles.css` are a **static visual mockup** of the "Control Panel" direction in `../DESIGN.md`.
They exist so you can see the intended look, spacing, hierarchy and component shapes.

## How to use it
- Treat it as a **picture**, not as code to copy. Rebuild everything as React components + Tailwind
  (map the CSS variables in `styles.css` to the Tailwind theme / CSS variables). Do not ship this HTML/CSS.
- Open `index.html` in a browser (it expects `styles.css` next to it) to see the target look in RTL.
- Where the mockup and `PROJECT_SPEC.md` / `DESIGN.md` disagree, the spec and DESIGN.md win.

## Placeholder content in the mockup that MUST NOT ship
- Category product counts ("12 منتج"…) → compute from real data.
- Phone numbers, hours, company name, address → come from Supabase (`contact_numbers`, `site_settings`).
- Brand chips "GST" → not a brand in this project. Real brands: HST, Snower, Apollo, ATS, HLT (to confirm), Conway, Tanda, Generic (Chinese).
- Sample products and specs (e.g. "58°C") → real seeded data only.
- "Why choose us" text → admin-editable `site_settings`, no invented statistics.
- The hero "control panel" illustration is decorative (`aria-hidden`); keep it free of invented figures.

## Missing from the mockup but required by the spec
Brands strip, certificate section with lightbox, past projects, breadcrumbs, product gallery,
filters sidebar/drawer, language switcher behavior, empty states, 404, the whole admin area.
Design these in the same visual language using `../DESIGN.md`.

## Known mockup issues to fix when rebuilding
- Only 6 categories are shown; the spec has ~17. Make the tiles data-driven and pick lucide icons for the rest (log choices in DECISIONS.md).
- `.input` is a styled `div`; use real `<input>` with a label.
- `--slate-400` (#8A94AB) on white is only ~3:1 → fine on navy backgrounds, but do not use it for text that needs AA on light surfaces (placeholders, small meta). Use `--slate-600`.
- White text on `--whatsapp` (#1FAF5A) is only ~2.9:1 (approx.; verify) → pick a darker green or dark text so the WhatsApp button passes AA.
- Add `<Suspense>`-safe, keyboard-accessible versions of every interactive element (drawer, lightbox, tabs).
