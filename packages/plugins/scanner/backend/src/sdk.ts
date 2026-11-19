import type { BackendSDK } from "./types.js";

let sdk: BackendSDK | undefined;

export const setSDK = (value: BackendSDK): void => {
  sdk = value;
};
