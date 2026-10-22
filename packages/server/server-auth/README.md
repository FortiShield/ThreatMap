## 👋 Server Auth

[![NPM Version](https://img.shields.io/npm/v/@threatmap/server-auth?style=for-the-badge)](https://www.npmjs.com/package/@threatmap/server-auth)

Authenticate with a Threatmap instance using device code flow.

```typescript
import { ThreatmapAuth, BrowserApprover } from "@threatmap/server-auth";

const auth = new ThreatmapAuth(
  "http://localhost:8080",
  new BrowserApprover((request) => {
    console.log(`Visit ${request.verificationUrl}`);
    console.log(`Enter code: ${request.userCode}`);
  }),
);

const token = await auth.startAuthenticationFlow();
console.log("Access token:", token.accessToken);
```

## Examples

See the [examples](./examples/) directory for complete working examples:

- [Browser Authentication](./examples/browser/) - Manual approval via browser
- [PAT Authentication](./examples/pat/) - Automated approval using Personal Access Token
