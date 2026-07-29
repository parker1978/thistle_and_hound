Primary call-to-action button, in four variants: primary (solid green), accent (solid plum, used sparingly), secondary (outlined), ghost (text-only).

```jsx
<Button variant="primary" size="md" onClick={bookNow}>Book a visit</Button>
<Button variant="secondary" size="md">Learn more</Button>
```

Variants: `primary` for the one main action per screen; `accent` for a single moment of delight (e.g. "Meet your groomer"); `secondary` for paired secondary actions; `ghost` for low-emphasis inline actions. Sizes: `sm`, `md`, `lg`. Always pass `disabled` rather than removing onClick.
