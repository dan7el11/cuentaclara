The standard surface for any grouped content, data table, or UI section.

```jsx
// Titled section card
<Card header="Extracto resumido">
  <dl>…</dl>
</Card>

// Full-bleed table (no internal padding)
<Card flush header="Actividad reciente">
  <ul>…</ul>
</Card>

// Hero/balance card with slate gradient
<Card gradient>
  <p style={{color:'#fff', fontFamily:'var(--font-mono)', fontSize:'36px'}}>$100.00</p>
</Card>

// Opportunity cost callout (tinted paper bg)
<Card tinted style={{border:'1px solid var(--color-success-border)'}}>
  <p>Si invertías en un fondo indexado…</p>
</Card>
```

**Shadow:** `var(--shadow-card)` — deep, soft, anchored. Don't override with flat or colored shadows; the tuned value is what gives the "bank statement" feel.
**Gradient:** used exclusively for balance/hero headers (Dashboard top card, featured match).
**Rule:** keep cards white (`tinted=false`) unless the content is a tinted callout or education block.
