# CLAUDE.md

Bilingual (AR/EN) product showcase for fire-alarm equipment. Static Next.js site on GitHub Pages, Supabase backend, free tiers only.

## Always do first
1. Read `PROJECT_SPEC.md` in full before starting any task. It is the single source of truth.
2. Check `docs/PROGRESS.md` to see which phase we are in.
3. For any UI work, read `docs/DESIGN.md`. `docs/design-reference/` is a visual mockup only — read its `README.md` before using it.
4. Verify current versions/APIs of Next.js, next-intl, Tailwind and supabase-js from their official docs, not from memory. Record versions in `docs/DECISIONS.md`.

## Precedence when files disagree
`PROJECT_SPEC.md` > `CLAUDE.md` > `docs/DESIGN.md` > `docs/design-reference/` mockup. Flag the conflict; never silently deviate.

## Non-negotiable rules
- **Static export only** (`output: 'export'`): no server runtime, no API routes, no middleware, no request-time SSR.
- **Security lives in Supabase RLS**, never in hidden UI or hidden URLs. Never expose `service_role` or any GitHub token to the client or repo.
- **No prices, no cart, no real stock counts** anywhere in the public data.
- Every user-facing string exists in **Arabic and English**. Arabic/RTL is designed first.
- Use **CSS logical properties** (`ms-*`, `pe-*`, `text-start`), never `left/right` for layout.
- Phone numbers are stored in E.164 and rendered with `dir="ltr"`.
- Admin edit pages use `?id=` query params, not dynamic route segments.
- TypeScript strict, no `any`, zod for validation, generated Supabase types.

## Workflow
- Work phase by phase as defined in the spec. Do not skip ahead.
- Log decisions and assumptions in `docs/DECISIONS.md`; update `docs/PROGRESS.md` after each phase.
- Before declaring a phase done: `npm run build` passes, lint/type checks pass, RTL and LTR verified.
- At the end of each phase, stop and report (what was built, how it was verified, decisions, open questions). Wait for approval before the next phase.
- If something in the spec is ambiguous or conflicts with a request, flag it instead of silently deviating.
