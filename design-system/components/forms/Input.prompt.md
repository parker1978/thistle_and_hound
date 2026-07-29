Single-line text field with an optional label, help text and error message.

```jsx
<Input label="Pet's name" placeholder="Biscuit" value={name} onChange={setName} />
<Input label="Phone" error="Enter a valid phone number" />
```

Use `helpText` for neutral guidance, `error` (overrides helpText) for validation problems shown in `--color-danger`.
