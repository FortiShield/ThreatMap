import type { Config, Template } from "../../../src/index.js";

export type AutorizeStore = {
  getConfig(): Config | undefined;
  updateConfig(config: Partial<Config>): Config | undefined;
  listTemplates(): Template[];
  getTemplate(id: number): Template | undefined;
  createTemplate(requestID: string): Template;
  deleteTemplate(id: number): boolean;
  deleteTemplates(ids: number[]): number;
  clearTemplates(): number;
  clearQueue(): void;
  queueActive: boolean;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const createAutorizeStore = (): AutorizeStore => {
  let config: Config | undefined;
  let templates: Template[] = [];
  let nextId = 1;
  const store: AutorizeStore = {
    queueActive: false,
    getConfig: () => (config === undefined ? undefined : clone(config)),
    updateConfig: (updates) => {
      config =
        config === undefined
          ? undefined
          : ({ ...config, ...updates } as Config);
      return config === undefined ? undefined : clone(config);
    },
    listTemplates: () => clone(templates),
    getTemplate: (id) => {
      const template = templates.find((candidate) => candidate.id === id);
      return template === undefined ? undefined : clone(template);
    },
    createTemplate: (requestID) => {
      const template: Template = {
        id: nextId++,
        key: `template-${nextId}`,
        request: { id: requestID, method: "GET", url: `/${requestID}` },
        results: [],
      };
      templates = [...templates, template];
      return clone(template);
    },
    deleteTemplate: (id) => {
      const before = templates.length;
      templates = templates.filter((template) => template.id !== id);
      return templates.length < before;
    },
    deleteTemplates: (ids) => {
      const before = templates.length;
      templates = templates.filter((template) => !ids.includes(template.id));
      return before - templates.length;
    },
    clearTemplates: () => {
      const count = templates.length;
      templates = [];
      return count;
    },
    clearQueue: () => {
      store.queueActive = false;
    },
  };
  return store;
};
