import type { Result } from "../../../src/result.js";
import type {
  TestConnectionResult,
  TorSettings,
  TorStatus,
  TorVersionInfo,
  UpdateTorSettings,
} from "../../../src/types.js";
import type { TorStore } from "../stores/torStore.js";
import type { BackendSDK } from "../types.js";

const ok = <T>(value: T): Result<T> => ({ kind: "Ok", value });
const err = <T>(error: string): Result<T> => ({ kind: "Error", error });

export const apiGetSettings =
  (store: TorStore) => async (): Promise<TorSettings> =>
    store.getSettings();

export const apiUpdateSettings =
  (store: TorStore) =>
  async (
    sdk: BackendSDK,
    settings: UpdateTorSettings,
  ): Promise<Result<TorSettings>> => {
    const updated = store.updateSettings(settings);
    sdk.api.send("config:changed");
    return ok(updated);
  };

export const apiGetStatus = (store: TorStore) => async (): Promise<TorStatus> =>
  store.getStatus();

export const apiStart =
  (store: TorStore) =>
  async (sdk: BackendSDK): Promise<Result<TorStatus>> => {
    const status = store.setState("running");
    sdk.api.send("status:changed", status);
    return ok(status);
  };

export const apiStop =
  (store: TorStore) =>
  async (sdk: BackendSDK): Promise<Result<TorStatus>> => {
    const status = store.setState("idle");
    sdk.api.send("status:changed", status);
    return ok(status);
  };

export const apiReload =
  (store: TorStore) =>
  async (sdk: BackendSDK): Promise<Result<TorStatus>> => {
    const status = store.setState(store.getStatus().state);
    sdk.api.send("status:changed", status);
    return ok(status);
  };

export const apiTestConnection =
  (store: TorStore) => async (): Promise<Result<TestConnectionResult>> =>
    ok(store.testConnection());

export const apiCheckForUpdates =
  (store: TorStore) =>
  async (): Promise<
    Result<{ updateAvailable: boolean; latestVersion?: string }>
  > =>
    ok(store.availableUpdate());

export const apiDownloadBinary =
  (store: TorStore) =>
  async (
    _sdk: BackendSDK,
    version?: string,
  ): Promise<Result<TorVersionInfo>> => {
    const info = store.downloadBinary(version);
    return info === undefined
      ? err("A version string is required to download the Tor binary.")
      : ok(info);
  };
