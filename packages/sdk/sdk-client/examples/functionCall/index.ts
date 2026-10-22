import { Client } from "@threatmap/sdk-client";

type Result<T> =
  | {
      kind: "Ok";
      value: T;
    }
  | {
      kind: "Error";
      error: string;
    };

type QuickSSRFProvider = {
  id: string;
  name: string;
  kind: string;
  url: string;
  enabled: boolean;
  token?: string | undefined;
};

type QuickSSRFSession = {
  id: string;
  providerId: string;
  providerKind: string;
  title: string;
  url: string;
  status: string;
  createdAt: string;
  interactionCount: number;
};

async function main() {
  // Get the Threatmap instance URL from environment or use default
  const instanceUrl =
    process.env["THREATMAP_INSTANCE_URL"] ?? "http://localhost:8080";

  // Get the Personal Access Token from environment
  const pat = process.env["THREATMAP_PAT"];
  if (pat === undefined || pat === "") {
    console.error("❌ Error: THREATMAP_PAT environment variable is required");
    console.error("   Set it with: export THREATMAP_PAT=threatmap_xxxxx");
    process.exit(1);
  }

  const client = new Client({
    url: instanceUrl,
    auth: {
      pat: pat,
      cache: {
        file: ".secrets.json",
      },
    },
  });

  await client.connect();
  console.log("✅ Connected to Threatmap instance");

  const pluginPackage = await client.plugin.pluginPackage("quickssrf");
  if (pluginPackage === undefined) {
    console.error("❌ Error: Plugin package not found");
    process.exit(1);
  }

  // Get the providers
  const providers = await pluginPackage.callFunction<
    Result<QuickSSRFProvider[]>
  >({
    name: "getProviders",
  });
  if (providers.kind === "Error") {
    console.error("❌ Error: Failed to get providers");
    console.error("   Error:", providers.error);
    process.exit(1);
  }
  if (providers.value.length === 0) {
    console.error("❌ Error: No providers found");
    process.exit(1);
  }
  console.log("✅ Providers:", providers.value);

  // Create a session
  const session = await pluginPackage.callFunction<Result<QuickSSRFSession>>({
    name: "createSession",
    arguments: [providers.value[0]!.id],
  });
  if (session.kind === "Error") {
    console.error("❌ Error: Failed to create session");
    console.error("   Error:", session.error);
    process.exit(1);
  }
  console.log("✅ Session:", session.value);
}

main().catch((error: unknown) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
