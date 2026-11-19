import {
  BUILTIN_THEMES,
  type CreateTheme,
  type Theme,
  type UpdateTheme,
} from "../../../src/theme.js";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export type ThemesStore = {
  list(): Theme[];
  get(themeId: string): Theme | undefined;
  add(input: CreateTheme): Theme;
  update(themeId: string, updates: UpdateTheme): Theme | undefined;
  remove(themeId: string): boolean;
  reset(): Theme[];
  getActiveId(): string | undefined;
  setActiveId(themeId: string | undefined): boolean;
};

let counter = 0;
const nextId = (): string => `theme-${Date.now()}-${++counter}`;

export const createThemesStore = (): ThemesStore => {
  let themes: Theme[] = clone(BUILTIN_THEMES);
  let activeId: string | undefined = BUILTIN_THEMES[0]?.id;

  return {
    list: () => themes.map((theme) => clone(theme)),
    get: (themeId) => {
      const theme = themes.find((candidate) => candidate.id === themeId);
      return theme === undefined ? undefined : clone(theme);
    },
    add: (input) => {
      const theme: Theme = { id: nextId(), ...input };
      themes = [...themes, theme];
      return clone(theme);
    },
    update: (themeId, updates) => {
      const existing = themes.find((candidate) => candidate.id === themeId);
      if (existing === undefined) {
        return undefined;
      }
      const updated: Theme = { ...existing, ...updates, id: existing.id };
      themes = themes.map((theme) => (theme.id === themeId ? updated : theme));
      return clone(updated);
    },
    remove: (themeId) => {
      const before = themes.length;
      themes = themes.filter((theme) => theme.id !== themeId);
      if (activeId === themeId) {
        activeId = undefined;
      }
      return themes.length < before;
    },
    reset: () => {
      themes = clone(BUILTIN_THEMES);
      activeId = BUILTIN_THEMES[0]?.id;
      return clone(themes);
    },
    getActiveId: () => activeId,
    setActiveId: (themeId) => {
      if (themeId === undefined) {
        activeId = undefined;
        return true;
      }
      if (themes.some((theme) => theme.id === themeId)) {
        activeId = themeId;
        return true;
      }
      return false;
    },
  };
};
