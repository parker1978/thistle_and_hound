Circular icon-only button for compact controls (close, back, favorite).

```jsx
<IconButton icon={<HeartIcon/>} label="Save to favorites" variant="outline" />
```

Always pass `label` — used as `aria-label` since there is no visible text. Use `ghost` inside colored headers, `outline` on plain surfaces.
