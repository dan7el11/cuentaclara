# NoBetter Design System

Design system for **NoBetter** (working name: *CuentaClara*) — a sports bet web simulator without real money, built to expose the financial mechanics of gambling and direct players toward healthier financial habits.

---

## Product Overview

NoBetter is a browser-based simulator that lets users experience the full cycle of sports betting using **fictional money** with **real market odds**. Every monetary figure is labeled as fictional throughout the UI, yet the financial math (house margin, implied probability, opportunity cost) is completely real. The product has four core areas:

| Route | Name | Purpose |
|---|---|---|
| `/` | **Cuenta** | Wallet dashboard — balance, virtual card, transaction ledger |
| `/apuestas` | **Apuestas** | Live odds, match selection, bet slip, bet history |
| `/educacion` | **Educación financiera** | Simulator comparing gambling vs. investing; house-edge explainer |
| `/apoyo` | **Apoyo y recursos** | Gambling addiction screening (BBGS), warning signs, help links |

**Stack:** React + TypeScript + Tailwind CSS, Firebase (Auth + Firestore), Cloud Functions for odds resolution.

---

## Sources

- **Primary codebase:** [dan7el11/cuentaclara](https://github.com/dan7el11/cuentaclara) — full React/TypeScript source. All token values and component patterns in this design system are derived directly from that repo.
- All color values are from `tailwind.config.js`; typography stacks from the same file; spacing patterns from class usage throughout `src/`.
- No Figma file was provided. All design decisions below are inferred from the codebase.

---

## Content Fundamentals

### Language
All UI copy is **Spanish (Latin American, Ecuador region)**. Date formatting uses `es-EC` locale; currency is always `USD`.

### Tone
Deliberate, factual, and empathetic — not alarmist. The product does not lecture or moralize. It states financial realities plainly and trusts the user to draw their own conclusions.

- ✅ "Apostaste $24. Si ese dinero hubiera ido a un fondo indexado, en 20 años valdría $111.73."
- ✅ "Cuotas representativas del mercado. El dinero, no."
- ❌ "¡ESTÁS PERDIENDO TU DINERO! (alarming red banner)"
- ❌ Emoji used decoratively or as icons

### Voice characteristics
- **Second person informal:** "tu cuenta", "apostaste", "podés", "tenés" (River Plate voseo)
- **Short sentences.** Financial data speaks for itself; copy doesn't editorialize.
- **No exclamation marks** in data-driven contexts. Reserve for confirmation actions only.
- **Numbers always in monospace** (`.figure` class) — never in the main serif or sans font.
- **Labels in small-caps uppercase** — e.g., "SALDO FICTICIO", "DINERO FICTICIO · SIN VALOR REAL"
- **"Ficticio/ficticia"** is a legal/product requirement: every monetary value must be labeled.

### Casing
- Navigation and section headers: **sentence case** ("Educación financiera", not "EDUCACIÓN FINANCIERA")
- Chip/badge labels: **uppercase** when they signal status ("MODO SIMULADOR", "DESTACADO", "FICTICIA")
- Button labels: **sentence case** ("Realizar apuesta ficticia")

### Emoji policy
**None.** The product uses Unicode symbols (↗ ✓ → ·) and small colored spans as visual accents, never emoji. Emoji would undercut the financial-seriousness tone.

---

## Visual Foundations

### Color Philosophy
Deliberately anti-casino. No neon greens, no reds-for-excitement, no gold gradients. The palette is derived from **bank statement / accountant's office** aesthetics: warm paper, steel blue, muted gold, library green.

**Never invent a new color.** All interactive states, status indicators, and feedback colors must map to the eight palette values.

| Name | Hex | Role |
|---|---|---|
| `ink` | `#1C2430` | All text (opacity-ramped for hierarchy) |
| `paper` | `#F3EFE6` | Page background — warm off-white, like a printed statement |
| `paperline` | `#E3DCC9` | Dividers, borders, ledger lines |
| `slate` | `#3D5A73` | Primary action — the only strong blue; buttons, active tabs, selected odds |
| `slate-dark` | `#2C4356` | Hover state on slate; gradient start |
| `ochre` | `#B98B3E` | Warnings, house margin callouts, the "Modo simulador" indicator |
| `burgundy` | `#7A2E2E` | Reserved exclusively for serious debt/loss alerts. Use sparingly. |
| `sage` | `#5B6B4F` | Gains, won bets, opportunity-cost positive projections |

### Typography
Three-stack system with strict role separation:

- **Source Serif 4** (Google Fonts) — all page headings and section titles. Signals "document" over "dashboard."
- **Inter** (Google Fonts) — all UI copy, labels, buttons, navigation.
- **IBM Plex Mono** (Google Fonts) — **all numbers without exception**: odds, balances, dates, percentages. The `.figure` CSS class applies this globally. Tabular-nums variant always on.

### Backgrounds & Surfaces
- Page background: `#F3EFE6` (paper) — never pure white
- Cards / panels: `#FFFFFF` with `border: 1px solid paperline` and `box-shadow: var(--shadow-card)`
- Featured/hero areas: the slate gradient (`linear-gradient(118deg, #2C4356 0%, #34506A 55%, #3D5A73 100%)`)
- Top ledger bar: solid `#1C2430` (ink) with paper text

### The Ledger Rule
The brand's single decorative motif: a dashed horizontal line made with `repeating-linear-gradient`, exactly 6px dash / 6px gap, in `paperline` color. Used as section separators inside cards and after page headings — evoking a checkbook stub or bank statement perforation. Never substitute with a solid `<hr>`.

### Cards
All content surfaces follow one pattern:
- Background: white
- Border: `1px solid paperline`
- Border radius: `12px` (--radius-xl)
- Shadow: `0 18px 50px -26px rgba(28,36,48,0.45)` — deep, soft, anchored

### Shadows
One shadow system only (`--shadow-card`). No colored shadows, no multi-layer shadows outside this token. The header has a separate lighter shadow (`--shadow-header`).

### Animations & Transitions
Minimal. `transition: 0.12s ease` on interactive elements (buttons, odds buttons). No entrance animations, no bounce, no spring. The UI is a financial tool, not a game.

### Hover & Press States
- Buttons: background darkens (primary → slate-dark on hover)
- Tabs: text lightens to full ink opacity on hover
- Odds buttons: border color shifts slate on hover; fill on active/selected
- No scale transforms, no glow effects

### Corner Radii
- Interactive chips/tags: `999px` (pill)
- Buttons: `6–8px` depending on size
- Cards: `12px`
- Small UI elements (code spans, badges): `4–6px`

### Imagery & Illustrations
None in the current product. Country flags are loaded from a CDN (`flagcdn.com`) for team identification. No photography, no illustrations. The "visual weight" comes from typography and data.

### Transparency & Blur
- Header uses `background-color: paper/95` + `backdrop-filter: blur` for the sticky nav — creates depth without obscuring content
- Overlay modals: `background: rgba(28,36,48,0.60)` scrim
- Featured match header uses a subtle diagonal stripe texture at `opacity: 0.06` for depth

---

## Iconography

The product has **no custom icon set**. Icon usage is minimal and functional:

### Real flags, never emoji
Team identity is shown with **real national-flag SVGs from flagcdn.com** — never emoji flags (which render inconsistently across platforms and undercut the serious tone). This is shipped as a reusable module:

- **`assets/flags.js`** — ported verbatim from the codebase's `src/utils/flag.ts`. Exports `flagUrl(team)` (returns the flagcdn SVG URL or `null`), `displayTeam(team)` (English→Spanish team name), `localize(text)`, `teamsFromLabel(label)`, `outcomeSymbol(code)`, and `initials(team)`. Also attaches to `window.NoBetterFlags`.
- **Fallback rule:** when `flagUrl` returns `null` (unknown team), render a small initials box — **never** a broken image. The flagship UI kit's `Flag` component implements exactly this.
- The flagship kit uses national-team fixtures (Argentina, Brazil, Spain, France, …) so every flag resolves.

### Financial engine
- **`assets/financialMath.js`** — ported from `src/utils/financialMath.ts`. The educational core: `bookmakerMargin`, `impliedProbability`, `estimateOpportunityCost`, `futureValueOfContributions`, `expectedLossFromWagering`, `probabilityOfRepeatingStreak`, `combinedOdds`. Deliberately conservative; every estimate carries its assumption. Also on `window.NoBetterMath`.

### What's used
| Element | Usage |
|---|---|
| Unicode symbols (↗ ✓ → · §) | Decorative accents in card headers (Apoyo page, opportunity-cost callout) |
| Colored dot spans | Status indicator: 6px filled circle in ochre for "Modo simulador", ochre/green for bet outcomes |
| Country flag images | Team identification — real SVGs from `flagcdn.com` via `assets/flags.js`; initials box as fallback |
| Text codes | League abbreviations rendered as small `<span>` elements (e.g., "LL", "PL", "SA") |

### Recommended icon library (not yet in codebase)
If icons are needed beyond the above, use **Lucide** (CDN: `https://unpkg.com/lucide@latest`). It matches the stroke weight and visual simplicity of the brand. Load via CDN — do not bundle.

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

**Never** use emoji as icons. **Never** use filled/rounded icon styles — Lucide's default thin stroke is the match.

---

## File Index

```
NoBetter Design System
│
├── styles.css                  ← Global entry point. Link this one file.
│
├── tokens/
│   ├── fonts.css               ← Google Fonts @import (Source Serif 4, Inter, IBM Plex Mono)
│   ├── colors.css              ← All color custom properties (palette + semantic)
│   ├── typography.css          ← Font stacks, type scale, weights, tracking
│   ├── spacing.css             ← 4px-grid space scale + layout constants
│   ├── effects.css             ← Radius, shadows, transitions, ledger-rule motif
│   └── base.css                ← Body reset, .figure, .ledger-rule utility classes
│
├── components/core/            ← Reusable React primitives
│   ├── Button.jsx / .d.ts / .prompt.md
│   ├── Badge.jsx / .d.ts / .prompt.md
│   ├── Card.jsx / .d.ts / .prompt.md
│   ├── Input.jsx / .d.ts / .prompt.md
│   ├── OddsButton.jsx / .d.ts / .prompt.md
│   ├── LedgerRule.jsx / .d.ts / .prompt.md
│   ├── Tab.jsx / .d.ts / .prompt.md
│   └── core.card.html          ← Component specimen card (DS tab)
│
├── guidelines/                 ← Foundation specimen cards (DS tab)
│   ├── colors-palette.card.html
│   ├── colors-semantic.card.html
│   ├── colors-states.card.html
│   ├── ink-ramps.card.html
│   ├── type-display.card.html
│   ├── type-body.card.html
│   ├── type-mono.card.html
│   ├── spacing-scale.card.html
│   ├── effects.card.html
│   └── brand-motifs.card.html
│
├── ui_kits/cuentaclara/
│   └── index.html              ← Interactive hi-fi prototype (Dashboard + Apuestas + Educación)
│
├── readme.md                   ← This file
└── SKILL.md                    ← Claude Code skill definition
```

### Components

| Component | Purpose |
|---|---|
| `Button` | Primary/secondary/ghost/danger/success actions |
| `Badge` | Status chips — ficticia label, mode indicators, outcomes |
| `Card` | White surface container with optional header/footer |
| `Input` | Text field with label, prefix/suffix, error state |
| `OddsButton` | 1/X/2 odds selector (light and dark variants) |
| `LedgerRule` | Dashed section divider — brand signature motif |
| `Tab` | Sticky-nav route tab with active underline |

---

*Source: [github.com/dan7el11/cuentaclara](https://github.com/dan7el11/cuentaclara) — explore the repo for full component implementations, Firebase schema, and Cloud Functions logic.*

---

## The flagship: one unified product

`ui_kits/nobetter/index.html` is the **merged, definitive UI kit** — it resolves the tension between the two skins. It takes the **professional dark sportsbook look** (because that realism is the whole point) but makes the **mission impossible to ignore**, so it never reads as "just another betting site":

- **Persistent mission bar** under the nav — frames the simulation and, once you start, tracks your running loss vs. what that money would be worth invested.
- **Truth-first bet slip** — the "La cuenta real" panel (real win probability, house commission, expected long-run loss) leads; the potential winnings are demoted to secondary.
- **Reality-check modal on every bet** — the unmask moment. Outcome is weighted by *true* probability (implied minus house edge). Win or lose, it explains what actually happened: a loss shows the opportunity cost; a win warns that early wins are exactly the hook.
- **Three screens in one shell** — Apuestas (the book), Aprendé (house-edge explainer + apostar-vs-invertir simulator), Apoyo (warning signs + help lines) — all in the same professional dark styling.
- **Accent switcher** retained (Violet / Green / Amber).

This is the recommended starting point. The two single-purpose kits below remain as references.

---

## Two themes: Sober & Sportsbook

NoBetter ships **two visual skins** that share the same tokens architecture and editorial substance:

### 1. Sober (`:root`) — the original
Anti-casino, warm paper, accountant aesthetic. The product's "honest" face. This is everything documented above.

### 2. Sportsbook (`.sb-theme`) — the real-bookmaker skin
A dark, energetic, **convincingly real** sportsbook (think bet365 density + Stake darkness + a violet accent). The point: make the simulation feel exactly like the real thing — because that realism is what exposes the trap. The uncomfortable truths are woven *into* the same convincing UI rather than bolted on:

- **Truth ticker** — styled like a promo strip, but states cumulative loss vs. what that money would be worth invested.
- **House-margin chips** (`SbBadge variant="truth"`) — every market shows the bookmaker's cut in amber, in the same register as a real book's odds-boost badges.
- **Bet slip "Lo que no te dicen"** — implied probability, house commission, and expected long-run loss, shown live as you build the slip.
- **`ficticia` everywhere** — the balance is always labeled fictional.

**Tokens:** scoped under `.sb-theme` in `tokens/sportsbook.css` (prefix `--sb-*`). Wrap any sportsbook surface in `<div class="sb-theme">`.
**Accent exploration:** the UI kit ships a live accent switcher (Violet / Green / Amber) in the top bar — flip between directions to compare. Violet is the default.

| Sportsbook component | Purpose |
|---|---|
| `SbButton` | Dark CTA — violet primary with optional `glow` |
| `SbOddsTile` | Odds tile with live up/down market-movement arrows |
| `SbBadge` | Status/live/truth chips (`live`, `accent`, `truth`, `cash`, `ficticia`) |

**Sportsbook files:**
```
tokens/sportsbook.css                  ← dark theme tokens (.sb-theme scope)
components/sportsbook/                  ← SbButton, SbOddsTile, SbBadge (+ .d.ts / .prompt.md)
guidelines/sportsbook-palette.card.html ← dark palette specimen
ui_kits/sportsbook/index.html           ← real betting-site prototype (live match, bet slip, accent switcher)
```
