import {
  apiCheckForUpdates,
  apiDownloadBinary,
  apiGetSettings,
  apiGetStatus,
  apiReload,
  apiStart,
  apiStop,
  apiTestConnection,
  apiUpdateSettings,
} from "./api/index.js";
import { setSDK } from "./sdk.js";
import { createTorStore } from "./stores/torStore.js";
import type { BackendSDK } from "./types.js";

export async function init(sdk: BackendSDK): Promise<void> {
  setSDK(sdk);

  const store = createTorStore();

  sdk.api.register("getSettings", apiGetSettings(store));
  sdk.api.register("updateSettings", apiUpdateSettings(store));
  sdk.api.register("getStatus", apiGetStatus(store));
  sdk.api.register("start", apiStart(store));
  sdk.api.register("stop", apiStop(store));
  sdk.api.register("reload", apiReload(store));
  sdk.api.register("testConnection", apiTestConnection(store));
  sdk.api.register("checkForUpdates", apiCheckForUpdates(store));
  sdk.api.register("downloadBinary", apiDownloadBinary(store));
}
