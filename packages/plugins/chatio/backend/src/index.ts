import {
  apiCreateSession,
  apiDeleteSession,
  apiGetModels,
  apiGetProviderStatuses,
  apiGetSession,
  apiGetSessions,
  apiGetSettings,
  apiSendMessage,
  apiSetModelConfig,
  apiUpdateSettings,
} from "./api/index.js";
import { setSDK } from "./sdk.js";
import { createChatIoStore } from "./stores/chatStore.js";
import type { BackendSDK } from "./types.js";

export async function init(sdk: BackendSDK): Promise<void> {
  setSDK(sdk);

  const store = createChatIoStore();

  sdk.api.register("getSessions", apiGetSessions(store));
  sdk.api.register("getSession", apiGetSession(store));
  sdk.api.register("createSession", apiCreateSession(store));
  sdk.api.register("deleteSession", apiDeleteSession(store));
  sdk.api.register("sendMessage", apiSendMessage(store));
  sdk.api.register("getModels", apiGetModels(store));
  sdk.api.register("setModelConfig", apiSetModelConfig(store));
  sdk.api.register("getSettings", apiGetSettings(store));
  sdk.api.register("updateSettings", apiUpdateSettings(store));
  sdk.api.register("getProviderStatuses", apiGetProviderStatuses(store));
}
