The dark-theme odds selector. The single most-tapped element in a sportsbook — keep it dense and reactive.

```jsx
<div style={{display:'flex', gap:'6px'}}>
  <SbOddsTile label="1" odds={2.35} move="up"   active={pick==='1'} onClick={() => pick('1')} />
  <SbOddsTile label="X" odds={3.10}              active={pick==='X'} onClick={() => pick('X')} />
  <SbOddsTile label="2" odds={2.95} move="down"  active={pick==='2'} onClick={() => pick('2')} />
</div>
```

**Active:** violet fill + glow.
**`move`:** the up/down arrow signals live odds drift (green up, red down) — a hallmark of real books. Use it on the live/featured match for authenticity.
**Odds always 2 decimals**, mono font — the component formats numbers automatically.
