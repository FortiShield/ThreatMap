import {
  DEFAULT_SETTINGS,
  type TestConnectionResult,
  type TorSettings,
  type TorStatus,
  type TorVersionInfo,
  type UpdateTorSettings,
} from "../../../src/types.js";

export type TorStore = {
  getSettings(): TorSettings;
  updateSettings(settings: Partial<TorSettings>): TorSettings;
  getStatus(): TorStatus;
  setState(state: TorStatus["state"]): TorStatus;
  testConnection(): TestConnectionResult;
  availableUpdate(): { updateAvailable: boolean; latestVersion?: string };
  downloadBinary(version?: string): TorVersionInfo | undefined;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const createTorStore = (): TorStore => {
  let settings: TorSettings = clone(DEFAULT_SETTINGS);
  let status: TorStatus = {
    state: "idle",
    version: settings.installedVersion,
    updateAvailable: false,
    latestVersion: undefined,
    error: undefined,
  };

  return {
    getSettings: () => clone(settings),
    updateSettings: (updates) => {
      settings = { ...settings, ...updates };
      return clone(settings);
    },
    getStatus: () => clone(status),
    setState: (state) => {
      status = { ...status, state };
      return clone(status);
    },
    testConnection: () => ({
      isTor: status.state === "running",
      ip: "0.0.0.0",
    }),
    availableUpdate: () => ({
      updateAvailable: false,
      latestVersion: undefined,
    }),
    downloadBinary: (version) =>
      typeof version === "string" && version.length > 0
        ? { binary: "", version }
        : undefined,
  };
};
