export type Settings = {
  serverUrl: string | undefined;
  packageId: string | undefined;
  forceUninstall: boolean;
  restoreNavigation: boolean;
};

export type Log = {
  kind: "Log";
  origin: string;
  timestamp: number;
  message: string;
};

export type API = {
  setSettings: (settings: Settings) => void;
  getSettings: () => Settings;
  addLog: (log: Log) => void;
  getLogs: () => Log[];
  clearLogs: () => void;
};
