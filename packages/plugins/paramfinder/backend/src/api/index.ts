import type { SessionDescriptor } from "../../../src/api.js";
import type { EngineConfig } from "../../../src/config-schema.js";
import type { Result } from "../../../src/result.js";
import type {
  BaselineProfile,
  EngineRequest,
  Finding,
} from "../../../src/types.js";
import type { ParamFinderStore } from "../stores/paramfinderStore.js";
import type { BackendSDK } from "../types.js";

const ok = <T>(value: T): Result<T> => ({ kind: "Ok", value });
const err = <T>(error: string): Result<T> => ({ kind: "Error", error });

const ENGINE_UNAVAILABLE =
  "The paramfinder engine is not available in this environment.";

export const apiStartMining =
  (store: ParamFinderStore) =>
  async (
    sdk: BackendSDK,
    target: EngineRequest,
    config: EngineConfig,
  ): Promise<Result<SessionDescriptor>> => {
    if (typeof target.url !== "string" || target.url.length === 0) {
      return err("A target request with a URL is required.");
    }
    const session = store.createSession(target, config);
    sdk.api.send("mining:event", {
      type: "state",
      state: "running",
      phase: "learning",
    });
    sdk.api.send("mining:event", {
      type: "log",
      level: "info",
      message: `Started mining session ${session.id}`,
    });
    return ok(session);
  };

export const apiCancelSession =
  (store: ParamFinderStore) =>
  async (sdk: BackendSDK, id: string): Promise<Result<void>> => {
    const session = store.cancelSession(id);
    if (session === undefined) {
      return err(`Session ${id} not found`);
    }
    sdk.api.send("mining:event", {
      type: "state",
      state: "canceled",
      phase: "learning",
    });
    return ok(undefined);
  };

export const apiLearn =
  (_store: ParamFinderStore) =>
  async (
    _sdk: BackendSDK,
    _request: EngineRequest,
    _config: EngineConfig,
  ): Promise<Result<BaselineProfile>> =>
    err(ENGINE_UNAVAILABLE);

export const apiDiscover =
  (_store: ParamFinderStore) =>
  async (
    _sdk: BackendSDK,
    _request: EngineRequest,
    _words: string[],
    _config: EngineConfig,
  ): Promise<Result<Finding[]>> =>
    err(ENGINE_UNAVAILABLE);
