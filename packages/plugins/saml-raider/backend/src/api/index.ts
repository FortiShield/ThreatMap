import type { CvePayload } from "../../../src/attacks/cve.js";
import type { XswVariant } from "../../../src/attacks/xsw.js";
import type { SamlBinding } from "../../../src/codec.js";
import {
  analyzeMessage,
  applyCvePayload,
  applyXsw,
  decodeMessage,
  encodeMessage,
  listEmbeddedCertificates,
  listSignatures,
  prettyPrint,
  removeSignatures,
  replaceIssuer,
  replaceNameId,
} from "../../../src/index.js";
import type { MessageInfo } from "../../../src/message.js";
import type { Result } from "../../../src/result.js";
import type { SignatureInfo } from "../../../src/signature.js";
import type { BackendSDK } from "../types.js";

const ok = <T>(value: T): Result<T> => ({ kind: "Ok", value });

export const apiDecodeMessage =
  () =>
  (_sdk: BackendSDK, input: string): Result<string> =>
    decodeMessage(input);

export const apiEncodeMessage =
  () =>
  (_sdk: BackendSDK, xml: string, binding?: SamlBinding): Result<string> =>
    encodeMessage(xml, binding);

export const apiAnalyzeMessage =
  () =>
  (sdk: BackendSDK, xml: string): Result<MessageInfo> => {
    const result = analyzeMessage(xml);
    if (result.kind === "Ok") {
      sdk.api.send("message:analyzed", result.value);
    }
    return result;
  };

export const apiRenderMessage =
  () =>
  (_sdk: BackendSDK, xml: string): Result<string> =>
    ok(prettyPrint(xml));

export const apiListSignatures =
  () =>
  (_sdk: BackendSDK, xml: string): Result<SignatureInfo[]> =>
    ok(listSignatures(xml));

export const apiListEmbeddedCertificates =
  () =>
  (_sdk: BackendSDK, xml: string): Result<string[]> =>
    ok(listEmbeddedCertificates(xml));

export const apiRemoveSignatures =
  () =>
  (_sdk: BackendSDK, xml: string): Result<string> =>
    ok(removeSignatures(xml));

export const apiApplyXsw =
  () =>
  (sdk: BackendSDK, xml: string, variant: XswVariant): Result<string> => {
    const result = applyXsw(xml, variant);
    if (result.kind === "Ok") {
      sdk.api.send("attack:applied", `xsw:${variant}`);
    }
    return result;
  };

export const apiApplyCvePayload =
  () =>
  (sdk: BackendSDK, xml: string, id: CvePayload["id"]): Result<string> => {
    const result = applyCvePayload(xml, id);
    if (result.kind === "Ok") {
      sdk.api.send("attack:applied", id);
    }
    return result;
  };

export const apiReplaceNameId =
  () =>
  (_sdk: BackendSDK, xml: string, value: string): Result<string> =>
    replaceNameId(xml, value);

export const apiReplaceIssuer =
  () =>
  (_sdk: BackendSDK, xml: string, value: string): Result<string> =>
    replaceIssuer(xml, value);
