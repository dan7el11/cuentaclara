Standard text field. Financial inputs should always use `mono` + a currency `prefix`.

```jsx
// Email login
<Input label="Correo" type="email" value={email} onChange={e => setEmail(e.target.value)} />

// Stake amount — financial field
<Input
  label="Monto (ficticio)"
  type="number"
  mono
  prefix="$"
  suffix="USD"
  value={stake}
  onChange={e => setStake(Number(e.target.value))}
/>

// With validation error
<Input
  label="Contraseña"
  type="password"
  value={pw}
  onChange={e => setPw(e.target.value)}
  error="Contraseña incorrecta"
/>
```

**`mono` prop:** required on all inputs that accept monetary values or numeric odds — keeps numbers legible and prevents layout shift.
**Labels** are rendered in small-caps uppercase tracking — don't override this; it signals "form field" consistently.
**Errors** use `--color-danger` (burgundy) and appear inline below the field, not in a toast.
