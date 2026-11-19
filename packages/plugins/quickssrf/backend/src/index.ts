import {
  apiAddProvider,
  apiClearInteractions,
  apiCreateSession,
  apiDeleteInteraction,
  apiDeleteProvider,
  apiDeleteSession,
  apiGetActiveSessionIds,
  apiGetConfig,
  apiGetInteractions,
  apiGetPollingStatus,
  apiGetProvider,
  apiGetProviders,
  apiGetSession,
  apiGetSessions,
  apiPollSession,
  apiResumeSession,
  apiStartPolling,
  apiStopPolling,
  apiStopSession,
  apiUpdateConfig,
  apiUpdateProvider,
  apiUpdateSessionTitle,
} from "./api/index.js";
import { setSDK } from "./sdk.js";
import { createQuickSSRFStore } from "./stores/quickssrfStore.js";
import type { BackendSDK } from "./types.js";

export async function init(sdk: BackendSDK): Promise<void> {
  setSDK(sdk);

  const store = createQuickSSRFStore();

  sdk.api.register("createSession", apiCreateSession(store));
  sdk.api.register("getSessions", apiGetSessions(store));
  sdk.api.register("getSession", apiGetSession(store));
  sdk.api.register("deleteSession", apiDeleteSession(store));
  sdk.api.register("stopSession", apiStopSession(store));
  sdk.api.register("resumeSession", apiResumeSession(store));
  sdk.api.register("pollSession", apiPollSession(store));
  sdk.api.register("updateSessionTitle", apiUpdateSessionTitle(store));
  sdk.api.register("getActiveSessionIds", apiGetActiveSessionIds(store));

  sdk.api.register("getProviders", apiGetProviders(store));
  sdk.api.register("getProvider", apiGetProvider(store));
  sdk.api.register("addProvider", apiAddProvider(store));
  sdk.api.register("updateProvider", apiUpdateProvider(store));
  sdk.api.register("deleteProvider", apiDeleteProvider(store));

  sdk.api.register("getInteractions", apiGetInteractions(store));
  sdk.api.register("deleteInteraction", apiDeleteInteraction(store));
  sdk.api.register("clearInteractions", apiClearInteractions(store));

  sdk.api.register("getConfig", apiGetConfig(store));
  sdk.api.register("updateConfig", apiUpdateConfig(store));

  sdk.api.register("startPolling", apiStartPolling(store));
  sdk.api.register("stopPolling", apiStopPolling(store));
  sdk.api.register("getPollingStatus", apiGetPollingStatus(store));
}
