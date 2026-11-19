import type { API as FrontendAPI } from "@threatmap/sdk-frontend";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
} from "vue";

import type { Spec } from "../index.js";

export type SamlRaiderSdk = FrontendAPI<Spec, Spec["events"]>;

const XSW_VARIANTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const CVE_IDS = ["null-byte-issuer", "duplicate-attribute"] as const;

export default defineComponent({
  name: "SamlRaiderSettingsView",
  props: {
    sdk: { type: Object as PropType<SamlRaiderSdk>, required: true },
  },
  setup(props) {
    const xml = ref("");
    const output = ref("");
    const analysis = ref("");
    const signatures = ref<string>("");
    const nameId = ref("");
    const log = ref<string[]>([]);
    const error = ref<string | undefined>();
    const handles: { stop: () => void }[] = [];

    const appendLog = (line: string): void => {
      log.value = [...log.value.slice(-19), line];
    };

    const analyze = async (): Promise<void> => {
      error.value = undefined;
      const result = await props.sdk.backend.analyzeMessage(xml.value);
      if (result.kind === "Ok")
        analysis.value = JSON.stringify(result.value, null, 2);
      else error.value = result.error;
    };

    const listSignatures = async (): Promise<void> => {
      error.value = undefined;
      const result = await props.sdk.backend.listSignatures(xml.value);
      if (result.kind === "Ok")
        signatures.value = JSON.stringify(result.value, null, 2);
      else error.value = result.error;
    };

    const encode = async (): Promise<void> => {
      error.value = undefined;
      const result = await props.sdk.backend.encodeMessage(xml.value);
      if (result.kind === "Ok") output.value = result.value;
      else error.value = result.error;
    };

    const applyXsw = async (variant: number): Promise<void> => {
      error.value = undefined;
      const result = await props.sdk.backend.applyXsw(
        xml.value,
        variant as Parameters<SamlRaiderSdk["backend"]["applyXsw"]>[1],
      );
      if (result.kind === "Ok") output.value = result.value;
      else error.value = result.error;
      appendLog(`applyXsw(${variant})`);
    };

    const applyCve = async (id: (typeof CVE_IDS)[number]): Promise<void> => {
      error.value = undefined;
      const result = await props.sdk.backend.applyCvePayload(xml.value, id);
      if (result.kind === "Ok") output.value = result.value;
      else error.value = result.error;
      appendLog(`applyCvePayload(${id})`);
    };

    const replaceNameId = async (): Promise<void> => {
      error.value = undefined;
      const result = await props.sdk.backend.replaceNameId(
        xml.value,
        nameId.value,
      );
      if (result.kind === "Ok") output.value = result.value;
      else error.value = result.error;
    };

    onMounted(() => {
      handles.push(
        props.sdk.backend.onEvent("message:analyzed", () =>
          appendLog("message:analyzed"),
        ),
        props.sdk.backend.onEvent("attack:applied", (attack) =>
          appendLog(`attack:applied ${attack}`),
        ),
      );
    });

    onBeforeUnmount(() => {
      for (const handle of handles) handle.stop();
    });

    return () =>
      h("div", { class: "flex max-w-2xl flex-col gap-4 p-4" }, [
        h("h2", { class: "text-lg font-semibold" }, "SAML Raider"),
        error.value !== undefined
          ? h("p", { class: "text-sm text-red-500" }, error.value)
          : null,
        h("h3", { class: "font-medium" }, "Message XML"),
        h(Textarea, {
          modelValue: xml.value,
          rows: 8,
          placeholder: "Paste SAML message",
          "onUpdate:modelValue": (value: string) => {
            xml.value = value;
          },
        }),
        h("div", { class: "flex flex-wrap gap-2" }, [
          h(Button, { label: "Analyze", onClick: () => void analyze() }),
          h(Button, {
            label: "Signatures",
            severity: "secondary",
            onClick: () => void listSignatures(),
          }),
          h(Button, {
            label: "Encode",
            severity: "secondary",
            onClick: () => void encode(),
          }),
        ]),
        analysis.value.length > 0
          ? h(
              "pre",
              { class: "max-h-40 overflow-auto text-xs" },
              analysis.value,
            )
          : null,
        signatures.value.length > 0
          ? h(
              "pre",
              { class: "max-h-40 overflow-auto text-xs" },
              signatures.value,
            )
          : null,
        h("h3", { class: "font-medium" }, "XSW variants"),
        h(
          "div",
          { class: "flex flex-wrap gap-1" },
          XSW_VARIANTS.map((variant) =>
            h(Button, {
              key: variant,
              label: String(variant),
              text: true,
              onClick: () => void applyXsw(variant),
            }),
          ),
        ),
        h("h3", { class: "font-medium" }, "CVE payloads"),
        h(
          "div",
          { class: "flex flex-wrap gap-2" },
          CVE_IDS.map((id) =>
            h(Button, {
              key: id,
              label: id,
              severity: "warn",
              text: true,
              onClick: () => void applyCve(id),
            }),
          ),
        ),
        h("h3", { class: "font-medium" }, "Replace NameID"),
        h("div", { class: "flex gap-2" }, [
          h(InputText, {
            modelValue: nameId.value,
            placeholder: "New NameID",
            "onUpdate:modelValue": (value: string) => {
              nameId.value = value;
            },
          }),
          h(Button, { label: "Apply", onClick: () => void replaceNameId() }),
        ]),
        output.value.length > 0
          ? h("pre", { class: "max-h-60 overflow-auto text-xs" }, output.value)
          : null,
        log.value.length > 0
          ? h(
              "pre",
              { class: "text-xs text-surface-500" },
              log.value.join("\n"),
            )
          : null,
      ]);
  },
});
