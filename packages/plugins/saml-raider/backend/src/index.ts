import {
  apiAnalyzeMessage,
  apiApplyCvePayload,
  apiApplyXsw,
  apiDecodeMessage,
  apiEncodeMessage,
  apiListEmbeddedCertificates,
  apiListSignatures,
  apiRemoveSignatures,
  apiRenderMessage,
  apiReplaceIssuer,
  apiReplaceNameId,
} from "./api/index.js";
import { setSDK } from "./sdk.js";
import type { BackendSDK } from "./types.js";

export async function init(sdk: BackendSDK): Promise<void> {
  setSDK(sdk);

  sdk.api.register("decodeMessage", apiDecodeMessage());
  sdk.api.register("encodeMessage", apiEncodeMessage());
  sdk.api.register("analyzeMessage", apiAnalyzeMessage());
  sdk.api.register("renderMessage", apiRenderMessage());
  sdk.api.register("listSignatures", apiListSignatures());
  sdk.api.register("listEmbeddedCertificates", apiListEmbeddedCertificates());
  sdk.api.register("removeSignatures", apiRemoveSignatures());
  sdk.api.register("applyXsw", apiApplyXsw());
  sdk.api.register("applyCvePayload", apiApplyCvePayload());
  sdk.api.register("replaceNameId", apiReplaceNameId());
  sdk.api.register("replaceIssuer", apiReplaceIssuer());
}
