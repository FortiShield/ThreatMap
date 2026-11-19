import type { CheckMetadata } from "../../../src/check.js";
import type { GetChecksOptions, UserConfig } from "../../../src/config.js";
import type { QueueTask } from "../../../src/queue.js";
import type { BasicRequest } from "../../../src/request.js";
import type { Result } from "../../../src/result.js";
import type { ScanRequestPayload, Session } from "../../../src/session.js";
import type { ScannerStore } from "../stores/scannerStore.js";
import type { BackendSDK } from "../types.js";

const ok = <T>(value: T): Result<T> => ({ kind: "Ok", value });
const err = <T>(error: string): Result<T> => ({ kind: "Error", error });

export const apiGetChecks =
  (store: ScannerStore) =>
  (_sdk: BackendSDK, options?: GetChecksOptions): Result<CheckMetadata[]> =>
    ok(store.listChecks(options));

export const apiGetUserConfig =
  (store: ScannerStore) => (): Result<UserConfig> => {
    const config = store.getUserConfig();
    return config === undefined
      ? err("No user config has been set.")
      : ok(config);
  };

export const apiUpdateUserConfig =
  (store: ScannerStore) =>
  (_sdk: BackendSDK, config: Partial<UserConfig>): Result<void> => {
    store.updateUserConfig(config);
    return ok(undefined);
  };

export const apiGetQueueTasks =
  (store: ScannerStore) => (): Result<QueueTask[]> =>
    ok(store.listQueueTasks());

export const apiGetQueueTask =
  (store: ScannerStore) =>
  (_sdk: BackendSDK, id: string): Result<QueueTask | undefined> =>
    ok(store.getQueueTask(id));

export const apiClearQueueTasks =
  (store: ScannerStore) =>
  (sdk: BackendSDK): Result<void> => {
    store.clearQueueTasks();
    sdk.api.send("passive:queue-updated", []);
    return ok(undefined);
  };

export const apiStartActiveScan =
  (store: ScannerStore) =>
  async (
    sdk: BackendSDK,
    payload: ScanRequestPayload,
  ): Promise<Result<Session>> => {
    if (!Array.isArray(payload.requestIDs) || payload.requestIDs.length === 0) {
      return err("At least one request ID is required.");
    }
    const session = store.createSession(payload);
    sdk.api.send("session:created", session.id, session, {
      checksTotal: undefined,
    });
    return ok(session);
  };

export const apiGetScanSession =
  (store: ScannerStore) =>
  (_sdk: BackendSDK, id: string): Result<Session> => {
    const session = store.getSession(id);
    return session === undefined ? err(`Session ${id} not found`) : ok(session);
  };

export const apiGetScanSessions =
  (store: ScannerStore) => (): Result<Session[]> =>
    ok(store.listSessions());

export const apiCancelScanSession =
  (store: ScannerStore) =>
  async (sdk: BackendSDK, id: string): Promise<Result<boolean>> => {
    const session = store.getSession(id);
    if (session === undefined) {
      return err(`Session ${id} not found`);
    }
    const updated = store.interruptSession(id, "Cancelled");
    if (updated !== undefined) {
      sdk.api.send("session:updated", id, updated);
    }
    return ok(true);
  };

export const apiDeleteScanSession =
  (store: ScannerStore) =>
  (_sdk: BackendSDK, id: string): Result<boolean> =>
    ok(store.deleteSession(id));

export const apiUpdateSessionTitle =
  (store: ScannerStore) =>
  (sdk: BackendSDK, id: string, title: string): Result<Session> => {
    const session = store.updateSession(id, { title } as Partial<Session>);
    if (session === undefined) {
      return err(`Session ${id} not found`);
    }
    sdk.api.send("session:updated", id, session);
    return ok(session);
  };

export const apiRerunScanSession =
  (store: ScannerStore) =>
  async (sdk: BackendSDK, id: string): Promise<Result<Session>> => {
    const session = store.getSession(id);
    if (session === undefined) {
      return err(`Session ${id} not found`);
    }
    const rerun = store.createSession({
      requestIDs: session.requestIDs,
      scanConfig: session.scanConfig,
      title: session.title,
    });
    sdk.api.send("session:created", rerun.id, rerun, {});
    return ok(rerun);
  };

export const apiGetRequestResponse =
  (_store: ScannerStore) =>
  async (
    _sdk: BackendSDK,
    _requestId: string,
  ): Promise<
    Result<{
      request: BasicRequest & { raw: string };
      response: { id: string; raw: string };
    }>
  > =>
    err("Request retrieval is not available in this environment");

export const apiGetExecutionTrace =
  (store: ScannerStore) =>
  (_sdk: BackendSDK, sessionId: string): Result<string> => {
    const session = store.getSession(sessionId);
    return session === undefined
      ? err(`Session ${sessionId} not found`)
      : ok("");
  };
