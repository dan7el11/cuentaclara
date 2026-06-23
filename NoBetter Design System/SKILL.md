---
name: nobetter-design
description: Use this skill to generate well-branded interfaces and assets for NoBetter (CuentaClara) — a sports bet simulator and financial education product. Contains design guidelines, color/type/spacing tokens, component patterns, and UI kit screens for prototyping or production work.
user-invocable: true
---

Read the `readme.md` file within this skill to understand the brand, visual foundations, and component system.

If creating visual artifacts (slides, mocks, throwaway prototypes, UI screens):
- Copy assets and create static HTML files using React + Babel inline
- Load `styles.css` for all tokens (colors, type, spacing, effects, fonts)
- Use `window.NoBetter` components from `_ds_bundle.js` for Button, Badge, Card, Input, OddsButton, LedgerRule, Tab
- Follow the anti-casino palette strictly: ink / paper / slate / ochre / burgundy / sage only
- All monetary values must be labeled with the `ficticia` badge
- Financial numbers always in IBM Plex Mono with tabular-nums (`.figure` class)
- Use `ledger-rule` as the brand's only decorative divider
- Use Source Serif 4 for all headings; Inter for UI copy

If working on production code:
- Read the component `.prompt.md` files for usage guidance
- Reference `tailwind.config.js` in the source repo for the original Tailwind class names
- The codebase lives at https://github.com/dan7el11/cuentaclara

Key design rules:
1. Never invent a new color — use the 8-color palette only
2. Never use emoji — Unicode symbols (↗ ✓ →) and colored dots only
3. Never replace the ledger-rule dashed motif with a solid `<hr>`
4. The slate gradient is for hero/balance cards and featured match headers only
5. Burgundy is reserved for serious debt/loss alerts — use sparingly
6. All copy in Spanish (Latin American), second person informal ("voseo")
7. Tone: factual, empathetic, never alarmist — no exclamation marks in data contexts

If the user invokes this skill without other guidance, ask:
- What are they building? (prototype / production component / marketing asset / deck)
- Which product surface? (Dashboard / Apuestas / Educación / Apoyo)
- What language and fidelity level?
Then act as an expert designer who outputs HTML prototypes or production-ready code accordingly.
