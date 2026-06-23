Top-level navigation tab for the sticky header. Active state: slate underline + full ink text. Inactive: 60% ink opacity, transparent underline.

```jsx
// Controlled (SPA routing)
<div style={{display:'flex', gap:'24px'}}>
  <Tab active={route==='/'} onClick={() => setRoute('/')}>Cuenta</Tab>
  <Tab active={route==='/apuestas'} onClick={() => setRoute('/apuestas')}>Apuestas</Tab>
  <Tab active={route==='/educacion'} onClick={() => setRoute('/educacion')}>Educación financiera</Tab>
  <Tab active={route==='/apoyo'} onClick={() => setRoute('/apoyo')}>Apoyo</Tab>
</div>

// Anchor-based (traditional nav)
<Tab href="/apuestas" active>Apuestas</Tab>
```

**Only for top-level navigation.** For in-page section switching, use a different pattern (pills or segment control).
**Label casing:** sentence case, not ALL CAPS.
**Active underline:** 2px solid `--color-primary` — never change the color or thickness.
