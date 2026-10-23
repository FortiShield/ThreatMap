import type { API } from "@threatmap/sdk-frontend";

import type { DevtoolsAPI } from "./api.js";
import type { Events } from "./events.js";

export type ThreatmapDevtoolsSdk = API<DevtoolsAPI, Events>;

let scopeTabObserver: MutationObserver | undefined;
let cancelListener: { stop: () => void } | undefined;
const scopeButtons: HTMLElement[] = [];

const addImportButton = (sdk: ThreatmapDevtoolsSdk): void => {
  const topbarLeft = document.querySelector(".c-topbar .c-topbar__left");
  if (
    topbarLeft === null ||
    document.querySelector("#devtools-scope-import") !== null
  ) {
    return;
  }

  const importButton = sdk.ui.button({
    label: "Import",
    leadingIcon: "fas fa-file-upload",
    variant: "tertiary",
    size: "small",
  });
  importButton.id = "devtools-scope-import";
  importButton.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          void sdk.scopes.createScope({
            name: data.name,
            allowlist: data.allowlist,
            denylist: data.denylist,
          });
        } catch {
          // Ignore invalid scope files
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });

  scopeButtons.push(importButton);

  setTimeout(() => {
    topbarLeft?.appendChild(importButton);
  }, 0);
};

const attachDownloadButton = (sdk: ThreatmapDevtoolsSdk): void => {
  document.querySelector("#devtools-scope-download")?.remove();

  const presetCreateHeader = document.querySelector(
    ".c-preset-form-create__header",
  );

  const downloadButton = sdk.ui.button({
    label: "Download",
    leadingIcon: "fas fa-file-arrow-down",
    variant: "tertiary",
    size: "small",
  });
  downloadButton.id = "devtools-scope-download";
  scopeButtons.push(downloadButton);

  const button = downloadButton.querySelector("button");
  if (button === null) {
    return;
  }

  button.addEventListener("click", () => {
    const presetId = getActiveScopePreset(sdk);
    if (presetId === undefined) {
      return;
    }

    const scopes = sdk.scopes.getScopes();
    const scope = scopes.find((s: { id: string }) => s.id === presetId);
    if (scope === undefined) {
      return;
    }

    const blob = new Blob([JSON.stringify(scope)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `scope-${scope.name}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  });

  presetCreateHeader?.appendChild(downloadButton);
};

const getActiveScopePreset = (
  sdk: ThreatmapDevtoolsSdk,
): string | undefined => {
  const selectedPreset = document.querySelector(
    '.c-preset[data-is-selected="true"]',
  );
  const presetId = selectedPreset?.getAttribute("data-preset-id");
  return presetId ?? undefined;
};

export const initShareScope = (sdk: ThreatmapDevtoolsSdk): void => {
  cancelListener = sdk.navigation.onPageChange((event: { path: string }) => {
    if (event.path !== "#/scope") {
      return;
    }

    attachDownloadButton(sdk);
    addImportButton(sdk);
  });

  const presetForm = document.querySelector(
    ".c-preset-form-create",
  )?.parentElement;
  if (presetForm === null || presetForm === undefined) {
    return;
  }

  if (scopeTabObserver !== undefined) {
    scopeTabObserver.disconnect();
    scopeTabObserver = undefined;
  }

  scopeTabObserver = new MutationObserver(() => {
    attachDownloadButton(sdk);
  });

  scopeTabObserver.observe(presetForm, {
    childList: true,
    attributes: true,
    subtree: true,
  });
};
