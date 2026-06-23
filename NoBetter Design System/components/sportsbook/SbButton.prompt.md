Primary CTA for the dark sportsbook skin. Must live inside `<div class="sb-theme">` so the `--sb-*` tokens resolve.

```jsx
<SbButton glow fullWidth>Apostar $10 (ficticio)</SbButton>
<SbButton variant="secondary" size="sm">Depositar</SbButton>
<SbButton variant="success">Retirar ganancia</SbButton>
<SbButton variant="ghost">Ver más mercados</SbButton>
```

**`glow`** is reserved for the single most important action on screen (the bet-slip "Apostar" button) — it adds the violet halo. Don't glow secondary actions.
**Variants:** `primary` (violet), `secondary` (raised surface), `ghost` (text), `success` (cash-out green), `outline`.
