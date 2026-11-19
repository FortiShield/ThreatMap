import type { CreateTheme, Theme, UpdateTheme } from "../../../src/theme.js";
import type { ThemesStore } from "../stores/themesStore.js";
import type { BackendSDK } from "../types.js";

type Result<T> = { kind: "Ok"; value: T } | { kind: "Error"; error: string };

const ok = <T>(value: T): Result<T> => ({ kind: "Ok", value });
const err = <T>(error: string): Result<T> => ({ kind: "Error", error });

export const apiGetThemes = (store: ThemesStore) => (): Result<Theme[]> =>
  ok(store.list());

export const apiGetTheme =
  (store: ThemesStore) =>
  (_sdk: BackendSDK, themeId: string): Result<Theme> => {
    const theme = store.get(themeId);
    return theme === undefined ? err(`Theme ${themeId} not found`) : ok(theme);
  };

export const apiAddTheme =
  (store: ThemesStore) =>
  async (sdk: BackendSDK, input: CreateTheme): Promise<Result<Theme>> => {
    const theme = store.add(input);
    sdk.api.send("theme:created", theme);
    return ok(theme);
  };

export const apiUpdateTheme =
  (store: ThemesStore) =>
  async (
    sdk: BackendSDK,
    themeId: string,
    updates: UpdateTheme,
  ): Promise<Result<Theme>> => {
    const theme = store.update(themeId, updates);
    if (theme === undefined) {
      return err(`Theme ${themeId} not found`);
    }
    sdk.api.send("theme:updated", theme);
    return ok(theme);
  };

export const apiRemoveTheme =
  (store: ThemesStore) =>
  async (sdk: BackendSDK, themeId: string): Promise<Result<void>> => {
    if (!store.remove(themeId)) {
      return err(`Theme ${themeId} not found`);
    }
    sdk.api.send("theme:deleted", themeId);
    return ok(undefined);
  };

export const apiResetThemes =
  (store: ThemesStore) =>
  async (sdk: BackendSDK): Promise<Result<Theme[]>> => {
    const themes = store.reset();
    sdk.api.send("themes:reset", themes);
    return ok(themes);
  };

export const apiGetActiveThemeId =
  (store: ThemesStore) => (): Result<string | undefined> =>
    ok(store.getActiveId());

export const apiSetActiveTheme =
  (store: ThemesStore) =>
  (sdk: BackendSDK, themeId: string | undefined): Result<void> => {
    if (!store.setActiveId(themeId)) {
      return err(`Theme ${themeId ?? ""} not found`);
    }
    sdk.api.send("theme:activated", themeId);
    return ok(undefined);
  };
