import { type API, type Log, type Settings } from "./api.js";
import { type Events } from "./events.js";

type BackendSDK = {
  api: {
    register: (name: string, callback: (...args: any[]) => any) => void;
  };
};

const settings: Settings = {
  serverUrl: undefined,
  packageId: undefined,
  forceUninstall: false,
  restoreNavigation: true,
};

const logs: Log[] = [];

export const setSettings = (newSettings: Settings): void => {
  Object.assign(settings, newSettings);
};

export const getSettings = (): Settings => {
  return settings;
};

export const addLog = (log: Log): void => {
  logs.push(log);
};

export const getLogs = (): Log[] => {
  return logs;
};

export const clearLogs = (): void => {
  logs.length = 0;
};

export function init(sdk: BackendSDK): void {
  sdk.api.register("setSettings", setSettings);
  sdk.api.register("getSettings", getSettings);
  sdk.api.register("addLog", addLog);
  sdk.api.register("getLogs", getLogs);
  sdk.api.register("clearLogs", clearLogs);
}
