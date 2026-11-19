export type Settings = {
  serverUrl: string | undefined;
  packageId: string | undefined;
  forceUninstall: boolean;
  restoreNavigation: boolean;
  customFont: string;
  quickDecode: boolean;
  quickMar: boolean;
};

export type Log = {
  kind: "Log";
  origin: string;
  timestamp: number;
  message: string;
};

export type DevtoolsAPI = {
  setSettings: (settings: Settings) => void;
  getSettings: () => Settings;
  addLog: (log: Log) => void;
  getLogs: () => Log[];
  clearLogs: () => void;
};

export type API = {
  setSettings: (settings: Settings) => void;
  getSettings: () => Settings;
  addLog: (log: Log) => void;
  getLogs: () => Log[];
  clearLogs: () => void;
};
