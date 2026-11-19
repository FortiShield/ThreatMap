import {
  apiCancelSession,
  apiDiscover,
  apiLearn,
  apiStartMining,
} from "./api/index.js";
import { setSDK } from "./sdk.js";
import { createParamFinderStore } from "./stores/paramfinderStore.js";
import type { BackendSDK } from "./types.js";

export async function init(sdk: BackendSDK): Promise<void> {
  setSDK(sdk);

  const store = createParamFinderStore();

  sdk.api.register("startMining", apiStartMining(store));
  sdk.api.register("cancelSession", apiCancelSession(store));
  sdk.api.register("learn", apiLearn(store));
  sdk.api.register("discover", apiDiscover(store));
}
