import type {
  RequestResponseResult,
  TemplateExportData,
} from "../../../src/export.js";
import type { APIResult, Config, Template } from "../../../src/index.js";
import type { AutorizeStore } from "../stores/autorizeStore.js";
import type { BackendSDK } from "../types.js";

const ok = <T>(value: T): APIResult<T> => ({ kind: "Ok", value });
const err = <T>(error: string): APIResult<T> => ({ kind: "Error", error });

export const apiGetTemplates =
  (store: AutorizeStore) => (): APIResult<Template[]> =>
    ok(store.listTemplates());

export const apiGetTemplate =
  (store: AutorizeStore) =>
  (_sdk: BackendSDK, id: number): APIResult<Template> => {
    const template = store.getTemplate(id);
    return template === undefined
      ? err(`Template ${id} not found`)
      : ok(template);
  };

export const apiCreateTemplate =
  (store: AutorizeStore) =>
  async (sdk: BackendSDK, requestID: string): Promise<APIResult<Template>> => {
    const template = store.createTemplate(requestID);
    sdk.api.send("template:created", template);
    return ok(template);
  };

export const apiDeleteTemplate =
  (store: AutorizeStore) =>
  (sdk: BackendSDK, templateId: number): APIResult<void> => {
    if (!store.deleteTemplate(templateId)) {
      return err(`Template ${templateId} not found`);
    }
    sdk.api.send("template:deleted", templateId);
    return ok(undefined);
  };

export const apiDeleteTemplates =
  (store: AutorizeStore) =>
  (sdk: BackendSDK, templateIds: number[]): APIResult<number> => {
    const count = store.deleteTemplates(templateIds);
    for (const id of templateIds) {
      sdk.api.send("template:deleted", id);
    }
    return ok(count);
  };

export const apiUpdateConfig =
  (store: AutorizeStore) =>
  (sdk: BackendSDK, config: Partial<Config>): APIResult<void> => {
    const updated = store.updateConfig(config);
    if (updated === undefined) {
      return err("No active project configuration");
    }
    return ok(undefined);
  };

export const apiGetConfig = (store: AutorizeStore) => (): APIResult<Config> => {
  const config = store.getConfig();
  return config === undefined
    ? err("No active project configuration")
    : ok(config);
};

export const apiRerunTemplate =
  (store: AutorizeStore) =>
  (sdk: BackendSDK, templateId: number): APIResult<void> => {
    const template = store.getTemplate(templateId);
    if (template === undefined) {
      return err(`Template ${templateId} not found`);
    }
    sdk.api.send("template:updated", templateId, template);
    return ok(undefined);
  };

export const apiClearQueue =
  (store: AutorizeStore) =>
  (sdk: BackendSDK): APIResult<void> => {
    store.clearQueue();
    sdk.api.send("queue:status-changed", false);
    return ok(undefined);
  };

export const apiGetRequestResponse =
  (_store: AutorizeStore) =>
  async (
    _sdk: BackendSDK,
    _requestId: string,
  ): Promise<APIResult<RequestResponseResult>> =>
    err("Request retrieval is not available in this environment");

export const apiClearAllTemplates =
  (store: AutorizeStore) =>
  (sdk: BackendSDK): APIResult<void> => {
    store.clearTemplates();
    sdk.api.send("templates:cleared");
    return ok(undefined);
  };

export const apiRescanAllTemplates =
  (_store: AutorizeStore) =>
  (_sdk: BackendSDK): APIResult<void> =>
    ok(undefined);

const matchesQuery = (haystack: string, query: string): boolean =>
  query.length === 0 || haystack.includes(query);

export const apiFilterTemplate =
  (store: AutorizeStore) =>
  async (
    _sdk: BackendSDK,
    httpqlQuery: string,
    templateId: number,
  ): Promise<APIResult<boolean>> => {
    const template = store.getTemplate(templateId);
    if (template === undefined) {
      return err(`Template ${templateId} not found`);
    }
    return ok(matchesQuery(template.request.url, httpqlQuery));
  };

export const apiFilterTemplates =
  (store: AutorizeStore) =>
  async (_sdk: BackendSDK, httpqlQuery: string): Promise<APIResult<number[]>> =>
    ok(
      store
        .listTemplates()
        .filter((template) => matchesQuery(template.request.url, httpqlQuery))
        .map((template) => template.id),
    );

export const apiGetTemplatesExportData =
  (store: AutorizeStore) =>
  async (
    _sdk: BackendSDK,
    templateIds: number[],
  ): Promise<APIResult<TemplateExportData[]>> =>
    ok(
      templateIds
        .map((id) => store.getTemplate(id))
        .filter((template): template is Template => template !== undefined)
        .map((template) => ({
          id: template.id,
          method: template.request.method,
          url: template.request.url,
          baseline: undefined,
          mutatedResults: [],
          noAuth: { data: undefined, access: undefined },
        })),
    );
