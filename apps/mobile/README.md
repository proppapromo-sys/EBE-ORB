# ORB Mobile App Placeholder

Build with Expo / React Native.

Recommended screens:

1. Home Briefing
2. Ask ORB
3. Priorities
4. Approvals
5. Connectors
6. Memory
7. Tasks
8. Settings

First API call:

```ts
await fetch('http://localhost:8080/api/orb/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'demo-user',
    message: 'What needs my attention today?'
  })
});
```
