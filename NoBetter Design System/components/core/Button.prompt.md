Use `<Button>` for every clickable action. Default `variant="primary"` uses slate — the single strong blue in the palette. Never invent a new color; choose the nearest semantic variant.

```jsx
// Primary CTA
<Button onClick={handleBet}>Realizar apuesta ficticia</Button>

// Subdued / cancel
<Button variant="secondary" size="sm">Cancelar</Button>

// Text-only link-like
<Button variant="ghost">Ver historial completo</Button>

// Destructive
<Button variant="danger">Eliminar cuenta</Button>

// Full-width (modals, forms)
<Button fullWidth>Crear cuenta con $100 ficticios</Button>

// On dark gradient backgrounds (featured match header)
<Button variant="dark" size="sm">+ Recargar</Button>
```

**Variants:** `primary` (slate fill), `secondary` (border only), `ghost` (text-only), `danger` (burgundy), `success` (sage), `outline` (slate border), `dark` (semi-transparent white, for use on slate gradient).
**Sizes:** `sm` (12 px), `md` (13 px, default), `lg` (14 px).
**Rule:** disabled state is conveyed by `disabled` prop → `opacity: 0.5` — never change the color manually.
