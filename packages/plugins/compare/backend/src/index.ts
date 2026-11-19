import {
  apiAddFileItem,
  apiAddItem,
  apiAddRequests,
  apiClearPanel,
  apiListItems,
  apiMoveItems,
  apiRemoveItems,
} from "./api/index.js";
import { setSDK } from "./sdk.js";
import { createCompareStore } from "./stores/compareStore.js";
import type { BackendSDK } from "./types.js";

export async function init(sdk: BackendSDK): Promise<void> {
  setSDK(sdk);

  const store = createCompareStore();

  sdk.api.register("listItems", apiListItems(store));
  sdk.api.register("addItem", apiAddItem(store));
  sdk.api.register("addFileItem", apiAddFileItem(store));
  sdk.api.register("addRequests", apiAddRequests(store));
  sdk.api.register("removeItems", apiRemoveItems(store));
  sdk.api.register("moveItems", apiMoveItems(store));
  sdk.api.register("clearPanel", apiClearPanel(store));
}
