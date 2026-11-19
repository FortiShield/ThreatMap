import { SettingsSlot } from "@threatmap/sdk-frontend";

import { createSettingsSlotContent } from "../../src/ui/index.js";

import type { FrontendSDK } from "./types.js";

export type { FrontendSDK } from "./types.js";
export { SettingsView } from "./views/SettingsView.js";

export const init = (sdk: FrontendSDK): void => {
  sdk.settings.addToSlot(
    SettingsSlot.PluginsSection,
    createSettingsSlotContent(),
  );
  sdk.sidebar.registerItem("Scanner", "/scanner", {
    icon: "fas fa-radar",
  });
};
