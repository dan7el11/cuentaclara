The brand's only decorative element. A dashed horizontal line that reads like a checkbook ledger stub — reinforcing "bank statement" over "casino".

```jsx
// After a page heading
<h1 style={{fontFamily:'var(--font-serif)', fontSize:'30px'}}>Tu cuenta</h1>
<LedgerRule margin="12px 0" />

// Between sections (tight)
<LedgerRule style={{margin:'8px 0', opacity:0.6}} />

// Inside a Card, flush to edges (flush + negative margin trick)
<LedgerRule style={{marginLeft:'-24px', marginRight:'-24px'}} />
```

**Color:** always `--color-paperline`. Don't change the dash color.
**Don't overuse:** one per logical section transition, not between every list item. List items use a solid 1px `border-bottom: 1px solid var(--color-border)` instead.
**CSS class alternative:** `<div class="ledger-rule"></div>` works identically with no React needed.
