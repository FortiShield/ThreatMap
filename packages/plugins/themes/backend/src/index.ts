import {
  apiAddTheme,
  apiGetActiveThemeId,
  apiGetTheme,
  apiGetThemes,
  apiRemoveTheme,
  apiResetThemes,
  apiSetActiveTheme,
  apiUpdateTheme,
} from "./api/index.js";
import { setSDK } from "./sdk.js";
import { createThemesStore } from "./stores/themesStore.js";
import type { BackendSDK } from "./types.js";

export async function init(sdk: BackendSDK): Promise<void> {
  setSDK(sdk);

  const store = createThemesStore();

  sdk.api.register("getThemes", apiGetThemes(store));
  sdk.api.register("getTheme", apiGetTheme(store));
  sdk.api.register("addTheme", apiAddTheme(store));
  sdk.api.register("updateTheme", apiUpdateTheme(store));
  sdk.api.register("removeTheme", apiRemoveTheme(store));
  sdk.api.register("resetThemes", apiResetThemes(store));
  sdk.api.register("getActiveThemeId", apiGetActiveThemeId(store));
  sdk.api.register("setActiveTheme", apiSetActiveTheme(store));
}
