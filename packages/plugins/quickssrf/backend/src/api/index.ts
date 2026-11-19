import type { QuickSSRFConfig, UpdateConfig } from "../../../src/config.js";
import type { Interaction } from "../../../src/interaction.js";
import type {
  CreateProvider,
  Provider,
  UpdateProvider,
} from "../../../src/provider.js";
import type { Result } from "../../../src/result.js";
import type { Session } from "../../../src/session.js";
import type { QuickSSRFStore } from "../stores/quickssrfStore.js";
import type { BackendSDK } from "../types.js";

const ok = <T>(value: T): Result<T> => ({ kind: "Ok", value });
const err = <T>(error: string): Result<T> => ({ kind: "Error", error });

export const apiCreateSession =
  (store: QuickSSRFStore) =>
  async (sdk: BackendSDK, providerId?: string): Promise<Result<Session>> => {
    const session = store.createSession(providerId);
    if (session === undefined) {
      return err("No provider available");
    }
    sdk.api.send("session:created", session);
    return ok(session);
  };

export const apiGetSessions =
  (store: QuickSSRFStore) => async (): Promise<Result<Session[]>> =>
    ok(store.listSessions());

export const apiGetSession =
  (store: QuickSSRFStore) =>
  async (_sdk: BackendSDK, sessionId: string): Promise<Result<Session>> => {
    const session = store.getSession(sessionId);
    return session === undefined
      ? err(`Session ${sessionId} not found`)
      : ok(session);
  };

export const apiDeleteSession =
  (store: QuickSSRFStore) =>
  async (sdk: BackendSDK, sessionId: string): Promise<Result<void>> => {
    if (!store.deleteSession(sessionId)) {
      return err(`Session ${sessionId} not found`);
    }
    sdk.api.send("session:deleted", sessionId);
    return ok(undefined);
  };

export const apiStopSession =
  (store: QuickSSRFStore) =>
  async (sdk: BackendSDK, sessionId: string): Promise<Result<void>> => {
    const session = store.updateSession(sessionId, { status: "stopped" });
    if (session === undefined) {
      return err(`Session ${sessionId} not found`);
    }
    sdk.api.send("session:updated", session);
    return ok(undefined);
  };

export const apiResumeSession =
  (store: QuickSSRFStore) =>
  (sdk: BackendSDK, sessionId: string): Result<void> => {
    const session = store.updateSession(sessionId, { status: "active" });
    if (session === undefined) {
      return err(`Session ${sessionId} not found`);
    }
    sdk.api.send("session:updated", session);
    return ok(undefined);
  };

export const apiPollSession =
  (store: QuickSSRFStore) =>
  async (
    _sdk: BackendSDK,
    sessionId: string,
  ): Promise<Result<Interaction[]>> => {
    const session = store.getSession(sessionId);
    if (session === undefined) {
      return err(`Session ${sessionId} not found`);
    }
    return ok(store.listInteractions(sessionId));
  };

export const apiUpdateSessionTitle =
  (store: QuickSSRFStore) =>
  async (
    sdk: BackendSDK,
    sessionId: string,
    title: string,
  ): Promise<Result<Session>> => {
    const session = store.updateSession(sessionId, { title });
    if (session === undefined) {
      return err(`Session ${sessionId} not found`);
    }
    sdk.api.send("session:updated", session);
    return ok(session);
  };

export const apiGetActiveSessionIds =
  (store: QuickSSRFStore) => (): Result<string[]> =>
    ok(
      store
        .listSessions()
        .filter(
          (session) =>
            session.status === "active" || session.status === "polling",
        )
        .map((session) => session.id),
    );

export const apiGetProviders =
  (store: QuickSSRFStore) => (): Result<Provider[]> =>
    ok(store.listProviders());

export const apiGetProvider =
  (store: QuickSSRFStore) =>
  (_sdk: BackendSDK, providerId: string): Result<Provider> => {
    const provider = store.getProvider(providerId);
    return provider === undefined
      ? err(`Provider ${providerId} not found`)
      : ok(provider);
  };

export const apiAddProvider =
  (store: QuickSSRFStore) =>
  async (sdk: BackendSDK, input: CreateProvider): Promise<Result<Provider>> => {
    const provider = store.addProvider(input);
    sdk.api.send("provider:created", provider);
    return ok(provider);
  };

export const apiUpdateProvider =
  (store: QuickSSRFStore) =>
  async (
    sdk: BackendSDK,
    providerId: string,
    updates: UpdateProvider,
  ): Promise<Result<Provider>> => {
    const provider = store.updateProvider(providerId, updates);
    if (provider === undefined) {
      return err(`Provider ${providerId} not found`);
    }
    sdk.api.send("provider:updated", provider);
    return ok(provider);
  };

export const apiDeleteProvider =
  (store: QuickSSRFStore) =>
  async (sdk: BackendSDK, providerId: string): Promise<Result<void>> => {
    if (!store.deleteProvider(providerId)) {
      return err(`Provider ${providerId} not found`);
    }
    sdk.api.send("provider:deleted", providerId);
    return ok(undefined);
  };

export const apiGetInteractions =
  (store: QuickSSRFStore) =>
  async (_sdk: BackendSDK, sessionId: string): Promise<Result<Interaction[]>> =>
    ok(store.listInteractions(sessionId));

export const apiDeleteInteraction =
  (store: QuickSSRFStore) =>
  async (
    _sdk: BackendSDK,
    sessionId: string,
    interactionId: string,
  ): Promise<Result<void>> => {
    if (!store.deleteInteraction(sessionId, interactionId)) {
      return err(`Interaction ${interactionId} not found`);
    }
    return ok(undefined);
  };

export const apiClearInteractions =
  (store: QuickSSRFStore) =>
  async (_sdk: BackendSDK, sessionId: string): Promise<Result<void>> => {
    store.clearInteractions(sessionId);
    return ok(undefined);
  };

export const apiGetConfig =
  (store: QuickSSRFStore) => (): Result<QuickSSRFConfig> =>
    ok(store.getConfig());

export const apiUpdateConfig =
  (store: QuickSSRFStore) =>
  async (
    sdk: BackendSDK,
    updates: UpdateConfig,
  ): Promise<Result<QuickSSRFConfig>> => {
    const config = store.updateConfig(updates);
    sdk.api.send("config:updated", config);
    return ok(config);
  };

export const apiStartPolling = (store: QuickSSRFStore) => (): Result<void> => {
  store.polling = true;
  return ok(undefined);
};

export const apiStopPolling = (store: QuickSSRFStore) => (): Result<void> => {
  store.polling = false;
  return ok(undefined);
};

export const apiGetPollingStatus =
  (store: QuickSSRFStore) => (): Result<boolean> =>
    ok(store.polling);
