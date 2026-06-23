Tiny informational chip for status, labels, and metadata. Not interactive.

```jsx
// Marks fictional money — required on ALL monetary displays
<Badge variant="ficticia">ficticia</Badge>

// Live indicator in the nav bar
<Badge variant="ochre" dot>Modo simulador</Badge>

// Serious outcome badges
<Badge variant="burgundy" uppercase>DESTACADO</Badge>
<Badge variant="sage">Ganaste</Badge>

// League/competition tags
<Badge variant="slate">LaLiga</Badge>
<Badge>dinero ficticio</Badge>
```

**Variants:** `default` (bordered neutral), `slate` (tinted blue), `ochre` (warning tone), `burgundy` (filled red — alerts only), `sage` (positive/gain), `ink` (filled dark), `ficticia` (ochre-tinted, reserved for the fake-money label).

`ficticia` is a product rule, not just a style — every screen showing money must carry it.
`dot` adds the small circle indicator (ochre dot = live/active state).
Never stack more than 2 badges on one element.
