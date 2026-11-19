import type {
  ChatSession,
  CreateSession,
  SendMessage,
} from "../../../src/message.js";
import type {
  ModelItem,
  ModelUserConfig,
  Provider,
} from "../../../src/model.js";
import type { Result } from "../../../src/result.js";
import type { ChatSettings } from "../../../src/settings.js";
import type { ChatIoStore } from "../stores/chatStore.js";
import type { BackendSDK } from "../types.js";

const ok = <T>(value: T): Result<T> => ({ kind: "Ok", value });
const err = <T>(error: string): Result<T> => ({ kind: "Error", error });

export const apiGetSessions =
  (store: ChatIoStore) => (): Result<ChatSession[]> =>
    ok(store.listSessions());

export const apiGetSession =
  (store: ChatIoStore) =>
  (_sdk: BackendSDK, sessionId: string): Result<ChatSession> => {
    const session = store.getSession(sessionId);
    return session === undefined
      ? err(`Session ${sessionId} not found`)
      : ok(session);
  };

export const apiCreateSession =
  (store: ChatIoStore) =>
  async (
    sdk: BackendSDK,
    input: CreateSession,
  ): Promise<Result<ChatSession>> => {
    const session = store.createSession(input.title, input.model);
    sdk.api.send("session:created", session);
    return ok(session);
  };

export const apiDeleteSession =
  (store: ChatIoStore) =>
  async (sdk: BackendSDK, sessionId: string): Promise<Result<void>> => {
    if (!store.deleteSession(sessionId)) {
      return err(`Session ${sessionId} not found`);
    }
    sdk.api.send("session:deleted", sessionId);
    return ok(undefined);
  };

export const apiSendMessage =
  (store: ChatIoStore) =>
  async (sdk: BackendSDK, input: SendMessage): Promise<Result<ChatSession>> => {
    const session = store.appendMessage(input.sessionId, "user", input.text);
    if (session === undefined) {
      return err(`Session ${input.sessionId} not found`);
    }
    sdk.api.send("session:updated", session);
    sdk.api.send("message:streamed", input.sessionId, input.text);
    return ok(session);
  };

export const apiGetModels = (store: ChatIoStore) => (): Result<ModelItem[]> =>
  ok(store.listModels());

export const apiSetModelConfig =
  (store: ChatIoStore) =>
  (_sdk: BackendSDK, config: ModelUserConfig): Result<void> => {
    const model = store.setModelEnabled(config);
    return model === undefined
      ? err(`Model ${config.id} not found`)
      : ok(undefined);
  };

export const apiGetSettings =
  (store: ChatIoStore) => (): Result<ChatSettings> =>
    ok(store.getSettings());

export const apiUpdateSettings =
  (store: ChatIoStore) =>
  (_sdk: BackendSDK, updates: Partial<ChatSettings>): Result<ChatSettings> =>
    ok(store.updateSettings(updates));

export const apiGetProviderStatuses =
  (store: ChatIoStore) =>
  (): Result<{ id: Provider; isConfigured: boolean }[]> =>
    ok(store.getProviderStatuses());
