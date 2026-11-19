import type {
  AddFileItemInput,
  AddItemInput,
  AddRequestsInput,
  CompareItem,
  ItemSelection,
  Panel,
} from "../../../src/item.js";
import type { Result } from "../../../src/result.js";
import type { CompareStore } from "../stores/compareStore.js";
import type { BackendSDK } from "../types.js";

const ok = <T>(value: T): Result<T> => ({ kind: "Ok", value });
const err = <T>(error: string): Result<T> => ({ kind: "Error", error });

export const apiListItems =
  (store: CompareStore) =>
  async (_sdk: BackendSDK, panel: Panel): Promise<Result<CompareItem[]>> =>
    ok(store.listItems(panel));

export const apiAddItem =
  (store: CompareStore) =>
  async (
    sdk: BackendSDK,
    input: AddItemInput,
  ): Promise<Result<CompareItem>> => {
    if (input.data.length === 0) {
      return err("The item is empty.");
    }
    const item = store.addItem(input);
    sdk.api.send("itemsChanged");
    return ok(item);
  };

export const apiAddFileItem =
  (store: CompareStore) =>
  async (
    sdk: BackendSDK,
    input: AddFileItemInput,
  ): Promise<Result<CompareItem>> => {
    if (input.path.length === 0) {
      return err("The uploaded file has no path.");
    }
    const item = store.addFileItem(input);
    sdk.api.send("itemsChanged");
    return ok(item);
  };

export const apiAddRequests =
  (store: CompareStore) =>
  async (
    sdk: BackendSDK,
    input: AddRequestsInput,
  ): Promise<Result<CompareItem[]>> => {
    const items = store.addRequests(input);
    sdk.api.send("itemsChanged");
    return ok(items);
  };

export const apiRemoveItems =
  (store: CompareStore) =>
  async (
    sdk: BackendSDK,
    selection: ItemSelection,
  ): Promise<Result<number[]>> => {
    const ids = store.removeItems(selection);
    sdk.api.send("itemsChanged");
    return ok(ids);
  };

export const apiMoveItems =
  (store: CompareStore) =>
  async (
    sdk: BackendSDK,
    selection: ItemSelection,
  ): Promise<Result<CompareItem[]>> => {
    const items = store.moveItems(selection);
    sdk.api.send("itemsChanged");
    return ok(items);
  };

export const apiClearPanel =
  (store: CompareStore) =>
  async (sdk: BackendSDK, panel: Panel): Promise<Result<Panel>> => {
    store.clearPanel(panel);
    sdk.api.send("itemsChanged");
    return ok(panel);
  };
