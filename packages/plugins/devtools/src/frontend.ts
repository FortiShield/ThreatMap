import type { API } from "@threatmap/sdk-frontend";

import type { Log, Settings } from "./api.js";
import type { Events } from "./events.js";

type DevtoolsAPI = {
  setSettings: (settings: Settings) => void;
  getSettings: () => Settings;
  addLog: (log: Log) => void;
  getLogs: () => Log[];
  clearLogs: () => void;
};

type WorkflowCatalogEntry = {
  manifestId: string;
  name?: string | null;
  description?: string | null;
  version: string;
  quality?: string;
  downloads?: number;
  official?: boolean;
  license?: string;
  repository?: string;
  readmeUrl?: string | null;
  changelogUrl?: string | null;
  author?: {
    name?: string | null;
    email?: string | null;
    url?: string | null;
  } | null;
};

const getDownloadUrl = (
  originalUrl: string,
  serverUrl: string | undefined,
): string => {
  if (serverUrl === undefined) {
    return originalUrl;
  }

  try {
    const original = new URL(originalUrl);
    const server = new URL(serverUrl);
    return originalUrl.replace(original.origin, server.origin);
  } catch {
    return originalUrl;
  }
};

const toWebSocketUrl = (serverUrl: string): string => {
  return serverUrl.replace(/^http/, "ws");
};

export const init = async (sdk: API<DevtoolsAPI, Events>): Promise<void> => {
  const root = document.createElement("div");
  root.id = "devtools-root";

  const container = document.createElement("div");
  container.id = "devtools-container";

  const serverUrlInput = document.createElement("input");
  serverUrlInput.id = "devtools-server-url";
  serverUrlInput.type = "text";
  serverUrlInput.placeholder = "http://localhost:3000";

  const connectButton = document.createElement("button");
  connectButton.id = "devtools-connect";
  connectButton.textContent = "Connect";

  const logsTextarea = document.createElement("textarea");
  logsTextarea.id = "devtools-logs";
  logsTextarea.readOnly = true;

  const forceUninstallCheckbox = document.createElement("input");
  forceUninstallCheckbox.id = "devtools-force-uninstall";
  forceUninstallCheckbox.type = "checkbox";

  const restoreNavigationCheckbox = document.createElement("input");
  restoreNavigationCheckbox.id = "devtools-restore-navigation";
  restoreNavigationCheckbox.type = "checkbox";

  const workflowsContainer = document.createElement("div");
  workflowsContainer.id = "devtools-workflows";

  container.appendChild(serverUrlInput);
  container.appendChild(connectButton);
  container.appendChild(logsTextarea);
  container.appendChild(forceUninstallCheckbox);
  container.appendChild(restoreNavigationCheckbox);
  container.appendChild(workflowsContainer);
  root.appendChild(container);

  sdk.navigation.addPage("/devtools", { body: root });
  sdk.sidebar.registerItem("Devtools", "/devtools", {
    icon: "fas fa-plug",
    group: "Devtools",
  });

  const settings: Settings = await sdk.backend.getSettings();
  const logsList: Log[] = await sdk.backend.getLogs();
  const workflows: WorkflowCatalogEntry[] = [];

  const renderWorkflows = (): void => {
    workflowsContainer.innerHTML = "";
    for (const workflow of workflows) {
      const installButton = document.createElement("button");
      installButton.id = `devtools-install-${workflow.manifestId}`;
      installButton.textContent = `Install ${workflow.name ?? workflow.manifestId}`;
      installButton.addEventListener("click", () => {
        void onInstallWorkflow(workflow);
      });
      workflowsContainer.appendChild(installButton);
    }
  };

  const onInstallWorkflow = async (
    workflow: WorkflowCatalogEntry,
  ): Promise<void> => {
    const result = await sdk.graphql.installPluginPackages({
      input: { sources: [{ manifestId: workflow.manifestId }] },
    });

    const packageId = result.installPluginPackages.packages[0]?.id;
    if (packageId === undefined) {
      addLog("Devtools", "Failed to install workflow");
      return;
    }

    const newSettings: Settings = { ...settings, packageId };
    settings.packageId = packageId;
    await sdk.backend.setSettings(newSettings);
    window.location.reload();
  };

  const renderLogs = (): void => {
    logsTextarea.value = logsList
      .map(
        (log) =>
          `${new Date(log.timestamp).toISOString()} | ${log.origin} | ${log.message}`,
      )
      .join("\n");
  };

  const addLog = (origin: string, message: string): void => {
    const log: Log = { kind: "Log", origin, timestamp: Date.now(), message };
    void sdk.backend.addLog(log);
    logsList.push(log);
    renderLogs();
  };

  const fetchWorkflows = async (): Promise<void> => {
    const result = await sdk.graphql.storePluginPackages({});
    workflows.length = 0;
    for (const workflow of result.store.pluginPackages) {
      workflows.push(workflow);
    }
    renderWorkflows();
  };

  await fetchWorkflows();
  renderLogs();

  const install = async (downloadUrl: string): Promise<string | undefined> => {
    const effectiveUrl = getDownloadUrl(downloadUrl, settings.serverUrl);
    addLog("Devtools", `Installing plugin from ${effectiveUrl}`);

    const result = await sdk.graphql.installPluginPackages({
      input: { force: true, sources: [{ url: effectiveUrl }] },
    });

    const packageId = result.installPluginPackages.packages[0]?.id;
    if (packageId === undefined) {
      addLog("Devtools", "Failed to install plugin package");
      return undefined;
    }

    const newSettings: Settings = { ...settings, packageId };
    settings.packageId = packageId;
    await sdk.backend.setSettings(newSettings);

    if (settings.restoreNavigation) {
      const currentPath = window.location.hash.substring(1);
      if (currentPath) {
        window.localStorage.setItem("devtools_navigation_restore", currentPath);
      }
    }

    window.location.reload();
    return packageId;
  };

  const uninstall = async (packageId: string): Promise<void> => {
    addLog("Devtools", `Uninstalling ${packageId}`);
    const result = await sdk.graphql.uninstallPluginPackage({ id: packageId });
    const deletedId = result.uninstallPluginPackage.deletedId;
    if (deletedId !== undefined && deletedId !== null) {
      const newSettings: Settings = { ...settings, packageId: undefined };
      await sdk.backend.setSettings(newSettings);
    }
  };

  const onRebuild = async (downloadUrl: string): Promise<void> => {
    if (settings.forceUninstall && settings.packageId !== undefined) {
      await uninstall(settings.packageId);
    }
    await install(downloadUrl);
  };

  const onMessage = async (event: MessageEvent): Promise<void> => {
    let message: any;
    try {
      message = JSON.parse(event.data as string);
    } catch {
      addLog("WatchServer", String(event.data));
      return;
    }

    switch (message?.kind) {
      case "connected": {
        addLog(
          "WatchServer",
          JSON.stringify({
            ...message,
            downloadUrl: getDownloadUrl(
              message.downloadUrl,
              settings.serverUrl,
            ),
          }),
        );
        await install(message.downloadUrl);
        break;
      }
      case "rebuild": {
        addLog(
          "WatchServer",
          JSON.stringify({
            ...message,
            downloadUrl: getDownloadUrl(
              message.downloadUrl,
              settings.serverUrl,
            ),
          }),
        );
        await onRebuild(message.downloadUrl);
        break;
      }
      case "error":
        addLog("WatchServer", message.error);
        break;
      default:
        addLog("WatchServer", JSON.stringify(message));
        break;
    }
  };

  const connect = async (url: string): Promise<void> => {
    const newSettings: Settings = { ...settings, serverUrl: url };
    settings.serverUrl = url;
    await sdk.backend.setSettings(newSettings);

    addLog("Devtools", `Connecting to ${url}`);
    const socket = new WebSocket(toWebSocketUrl(url));
    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => {
        resolve();
      };
      socket.onerror = () => {
        reject(new Error("Failed to connect to watch server"));
      };
    });
    socket.onmessage = (event) => {
      void onMessage(event);
    };
    socket.onclose = () => {
      addLog("Devtools", "Disconnected from watch server");
    };
    socket.onerror = () => {
      addLog("Devtools", "Error connecting to watch server");
    };
  };

  const onConnect = async (): Promise<void> => {
    const serverUrl = serverUrlInput.value;
    if (serverUrl === "") {
      return;
    }
    await connect(serverUrl);
  };

  connectButton.addEventListener("click", () => {
    void onConnect();
  });

  forceUninstallCheckbox.addEventListener("change", () => {
    const newSettings: Settings = {
      ...settings,
      forceUninstall: forceUninstallCheckbox.checked,
    };
    void sdk.backend.setSettings(newSettings);
  });

  restoreNavigationCheckbox.addEventListener("change", () => {
    const newSettings: Settings = {
      ...settings,
      restoreNavigation: restoreNavigationCheckbox.checked,
    };
    void sdk.backend.setSettings(newSettings);
  });

  renderLogs();
};
