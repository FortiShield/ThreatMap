import {
  apiCancelScanSession,
  apiClearQueueTasks,
  apiDeleteScanSession,
  apiGetChecks,
  apiGetExecutionTrace,
  apiGetQueueTask,
  apiGetQueueTasks,
  apiGetRequestResponse,
  apiGetScanSession,
  apiGetScanSessions,
  apiGetUserConfig,
  apiRerunScanSession,
  apiStartActiveScan,
  apiUpdateSessionTitle,
  apiUpdateUserConfig,
} from "./api/index.js";
import { setSDK } from "./sdk.js";
import { createScannerStore } from "./stores/scannerStore.js";
import type { BackendSDK } from "./types.js";

export async function init(sdk: BackendSDK): Promise<void> {
  setSDK(sdk);

  const store = createScannerStore();

  sdk.api.register("getChecks", apiGetChecks(store));
  sdk.api.register("getUserConfig", apiGetUserConfig(store));
  sdk.api.register("updateUserConfig", apiUpdateUserConfig(store));
  sdk.api.register("getQueueTasks", apiGetQueueTasks(store));
  sdk.api.register("getQueueTask", apiGetQueueTask(store));
  sdk.api.register("clearQueueTasks", apiClearQueueTasks(store));
  sdk.api.register("startActiveScan", apiStartActiveScan(store));
  sdk.api.register("getScanSession", apiGetScanSession(store));
  sdk.api.register("getScanSessions", apiGetScanSessions(store));
  sdk.api.register("cancelScanSession", apiCancelScanSession(store));
  sdk.api.register("deleteScanSession", apiDeleteScanSession(store));
  sdk.api.register("updateSessionTitle", apiUpdateSessionTitle(store));
  sdk.api.register("rerunScanSession", apiRerunScanSession(store));
  sdk.api.register("getRequestResponse", apiGetRequestResponse(store));
  sdk.api.register("getExecutionTrace", apiGetExecutionTrace(store));
}
