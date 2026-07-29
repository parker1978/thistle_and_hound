Modal for confirmations and short forms (cancel appointment, add a pet).

```jsx
<Dialog open={open} title="Cancel this visit?" onClose={close} footer={<><Button variant="ghost" onClick={close}>Keep it</Button><Button variant="primary" onClick={confirm}>Cancel visit</Button></>}>
  Your groomer won't be notified until you confirm.
</Dialog>
```
