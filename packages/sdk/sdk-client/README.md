## 👋 Client SDK

[![NPM Version](https://img.shields.io/npm/v/@threatmap/sdk-client?style=for-the-badge)](https://www.npmjs.com/package/@threatmap/sdk-client)

This is repository for the Threatmap client SDK.

The goal of this SDK is to allow scripts to access Threatmap Instances. It handles authentication, graphql and rest.

We recommend you look at the [examples](https://github.com/threatcode/threatmap/tree/main/packages/sdk-client/examples) to learn how to use it.

```typescript
const client = new Client({
  url: instanceUrl,
  auth: {
    pat: "threatmap_xxxxxx",
    cache: {
      file: ".secrets.json",
    },
  },
});

await client.connect();

const viewer = await client.user.viewer();
console.log("Viewer: ", JSON.stringify(viewer, null, 2));
```
