Odds selector for 1X2 (and similar) markets. Appears in two visual modes: standard light list rows and the dark gradient featured-match header.

```jsx
// Standard fixture row (light background)
<div style={{display:'flex', gap:'8px'}}>
  <OddsButton label="1" odds={2.10} active={pick==='home'} onClick={() => setPick('home')} />
  <OddsButton label="X" odds={3.30} active={pick==='draw'} onClick={() => setPick('draw')} />
  <OddsButton label="2" odds={3.40} active={pick==='away'} onClick={() => setPick('away')} />
</div>

// On the dark gradient header (featured match)
<OddsButton label="1" odds={1.85} onDark active={pick==='home'} onClick={() => setPick('home')} />
```

**Label:** short outcome identifier (1, X, 2). Omit for markets with named outcomes.
**Active state (light):** slate fill, paper text.
**Active state (dark):** white fill, ink text.
**Odds format:** always 2 decimal places (the component calls `.toFixed(2)` automatically if `odds` is a number).
**Never** use this component for non-betting interactions — use `Button` instead.
