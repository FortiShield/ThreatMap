import {
  apiAddLearning,
  apiAddModel,
  apiCreateAgent,
  apiDeleteAgent,
  apiGetAgents,
  apiGetLearnings,
  apiGetModels,
  apiGetSettings,
  apiGetSkills,
  apiRemoveLearnings,
  apiRemoveModel,
  apiSetModels,
  apiUpdateAgent,
  apiUpdateSettings,
} from "./api/index.js";
import { setSDK } from "./sdk.js";
import { createShiftStore } from "./stores/shiftStore.js";
import type { BackendSDK } from "./types.js";

export async function init(sdk: BackendSDK): Promise<void> {
  setSDK(sdk);

  const store = createShiftStore();

  sdk.api.register("getModels", apiGetModels(store));
  sdk.api.register("setModels", apiSetModels(store));
  sdk.api.register("addModel", apiAddModel(store));
  sdk.api.register("removeModel", apiRemoveModel(store));

  sdk.api.register("getAgents", apiGetAgents(store));
  sdk.api.register("createAgent", apiCreateAgent(store));
  sdk.api.register("updateAgent", apiUpdateAgent(store));
  sdk.api.register("deleteAgent", apiDeleteAgent(store));

  sdk.api.register("getSkills", apiGetSkills(store));
  sdk.api.register("getLearnings", apiGetLearnings(store));
  sdk.api.register("addLearning", apiAddLearning(store));
  sdk.api.register("removeLearnings", apiRemoveLearnings(store));

  sdk.api.register("getSettings", apiGetSettings(store));
  sdk.api.register("updateSettings", apiUpdateSettings(store));
}
