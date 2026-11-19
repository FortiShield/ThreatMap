import type { SettingsPluginSlotContent } from "@threatmap/sdk-frontend";

import SettingsView from "./Settings.js";

export { default as SettingsView } from "./Settings.js";
export type { ChatIoSdk } from "./Settings.js";

export const createSettingsSlotContent = (): SettingsPluginSlotContent => ({
  type: "Custom",
  name: "Chat.io",
  definition: {
    component:
      SettingsView as unknown as SettingsPluginSlotContent["definition"]["component"],
  },
});
