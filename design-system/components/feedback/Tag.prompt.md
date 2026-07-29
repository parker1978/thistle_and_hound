Selectable/removable chip — used for service add-ons and filters, distinct from the read-only status Badge.

```jsx
<Tag selected={picked.has('nail-trim')} onClick={()=>toggle('nail-trim')}>Nail trim</Tag>
<Tag onRemove={()=>removeFilter('small-dogs')}>Small dogs</Tag>
```
