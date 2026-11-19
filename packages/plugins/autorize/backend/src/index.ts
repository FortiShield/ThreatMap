import {
  apiClearAllTemplates,
  apiClearQueue,
  apiCreateTemplate,
  apiDeleteTemplate,
  apiDeleteTemplates,
  apiFilterTemplate,
  apiFilterTemplates,
  apiGetConfig,
  apiGetRequestResponse,
  apiGetTemplate,
  apiGetTemplates,
  apiGetTemplatesExportData,
  apiRerunTemplate,
  apiRescanAllTemplates,
  apiUpdateConfig,
} from "./api/index.js";
import { setSDK } from "./sdk.js";
import { createAutorizeStore } from "./stores/autorizeStore.js";
import type { BackendSDK } from "./types.js";

export async function init(sdk: BackendSDK): Promise<void> {
  setSDK(sdk);

  const store = createAutorizeStore();

  sdk.api.register("getTemplates", apiGetTemplates(store));
  sdk.api.register("getTemplate", apiGetTemplate(store));
  sdk.api.register("createTemplate", apiCreateTemplate(store));
  sdk.api.register("deleteTemplate", apiDeleteTemplate(store));
  sdk.api.register("deleteTemplates", apiDeleteTemplates(store));
  sdk.api.register("updateConfig", apiUpdateConfig(store));
  sdk.api.register("getConfig", apiGetConfig(store));
  sdk.api.register("rerunTemplate", apiRerunTemplate(store));
  sdk.api.register("clearQueue", apiClearQueue(store));
  sdk.api.register("getRequestResponse", apiGetRequestResponse(store));
  sdk.api.register("clearAllTemplates", apiClearAllTemplates(store));
  sdk.api.register("rescanAllTemplates", apiRescanAllTemplates(store));
  sdk.api.register("filterTemplate", apiFilterTemplate(store));
  sdk.api.register("filterTemplates", apiFilterTemplates(store));
  sdk.api.register("getTemplatesExportData", apiGetTemplatesExportData(store));
}
