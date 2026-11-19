import type { API as FrontendAPI } from "@threatmap/sdk-frontend";
import Button from "primevue/button";
import InputSwitch from "primevue/inputswitch";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
} from "vue";

import type { Spec } from "../index.js";
import type { TorSettings, TorStatus } from "../types.js";

export type TorSdk = FrontendAPI<Spec, Spec["events"]>;

const stateSeverity = (
  state: TorStatus["state"] | undefined,
): "success" | "warn" | "danger" | "secondary" | "info" => {
  switch (state) {
    case "running":
      return "success";
    case "starting":
    case "stopping":
      return "warn";
    case "error":
      return "danger";
    default:
      return "secondary";
  }
};

export default defineComponent({
  name: "TorSettingsView",
  props: {
    sdk: { type: Object as PropType<TorSdk>, required: true },
  },
  setup(props) {
    const status = ref<TorStatus | undefined>();
    const settings = ref<TorSettings | undefined>();
    const error = ref<string | undefined>();
    const busy = ref(false);

    const autoStart = ref(false);
    const autoCheckUpdates = ref(true);
    const port = ref("9050");
    const binaryPath = ref("");
    const testResult = ref<string | undefined>();

    let stopHandle: { stop: () => void } | undefined;

    const refresh = async (): Promise<void> => {
      error.value = undefined;
      try {
        status.value = await props.sdk.backend.getStatus();
        settings.value = await props.sdk.backend.getSettings();
        autoStart.value = settings.value.autoStart;
        autoCheckUpdates.value = settings.value.autoCheckUpdates;
        port.value = String(settings.value.port);
        binaryPath.value = settings.value.binaryPath ?? "";
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : String(cause);
      }
    };

    const run = async (
      action: () => Promise<{ kind: string; error?: string }>,
      onOk?: () => void,
    ): Promise<void> => {
      busy.value = true;
      error.value = undefined;
      try {
        const result = await action();
        if (result.kind === "Ok") {
          onOk?.();
        } else {
          error.value = result.error ?? "Operation failed";
        }
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : String(cause);
      } finally {
        busy.value = false;
      }
    };

    const saveSettings = (): Promise<void> =>
      run(
        () =>
          props.sdk.backend.updateSettings({
            autoStart: autoStart.value,
            autoCheckUpdates: autoCheckUpdates.value,
            port: Number.parseInt(port.value, 10),
            binaryPath:
              binaryPath.value.length > 0 ? binaryPath.value : undefined,
          }),
        () => {
          if (settings.value) {
            settings.value.autoStart = autoStart.value;
          }
        },
      );

    const testConnection = (): Promise<void> =>
      run(
        () => props.sdk.backend.testConnection(),
        () => undefined,
      ).then(async () => {
        if (error.value === undefined) {
          const result = await props.sdk.backend.testConnection();
          testResult.value =
            result.kind === "Ok"
              ? `IP: ${result.value.ip} (Tor: ${result.value.isTor ? "yes" : "no"})`
              : result.error;
        }
      });

    onMounted(() => {
      void refresh();
      stopHandle = props.sdk.backend.onEvent("status:changed", (next) => {
        status.value = next;
      });
    });

    onBeforeUnmount(() => {
      stopHandle?.stop();
    });

    return () =>
      h("div", { class: "flex max-w-xl flex-col gap-4 p-4" }, [
        h("h2", { class: "text-lg font-semibold" }, "Tor"),
        error.value !== undefined
          ? h("p", { class: "text-sm text-red-500" }, error.value)
          : null,
        h("div", { class: "flex items-center gap-2" }, [
          h("span", "Status:"),
          h(Tag, {
            value: status.value?.state ?? "unknown",
            severity: stateSeverity(status.value?.state),
          }),
          status.value?.version !== undefined
            ? h(
                "span",
                { class: "text-sm text-surface-500" },
                status.value.version,
              )
            : null,
        ]),
        h("div", { class: "flex flex-wrap gap-2" }, [
          h(Button, {
            label: "Start",
            disabled: busy.value,
            onClick: () =>
              void run(
                () => props.sdk.backend.start(),
                () => void refresh(),
              ),
          }),
          h(Button, {
            label: "Stop",
            severity: "secondary",
            disabled: busy.value,
            onClick: () =>
              void run(
                () => props.sdk.backend.stop(),
                () => void refresh(),
              ),
          }),
          h(Button, {
            label: "Reload",
            severity: "secondary",
            disabled: busy.value,
            onClick: () =>
              void run(
                () => props.sdk.backend.reload(),
                () => void refresh(),
              ),
          }),
          h(Button, {
            label: "Test connection",
            severity: "info",
            disabled: busy.value,
            onClick: () => void testConnection(),
          }),
        ]),
        testResult.value !== undefined
          ? h("p", { class: "text-sm" }, testResult.value)
          : null,
        h("div", { class: "flex flex-col gap-2" }, [
          h("label", { class: "flex items-center gap-2" }, [
            h("span", { class: "w-32" }, "Port"),
            h(InputText, {
              modelValue: port.value,
              "onUpdate:modelValue": (value: string) => {
                port.value = value;
              },
            }),
          ]),
          h("label", { class: "flex items-center gap-2" }, [
            h("span", { class: "w-32" }, "Binary path"),
            h(InputText, {
              modelValue: binaryPath.value,
              "onUpdate:modelValue": (value: string) => {
                binaryPath.value = value;
              },
            }),
          ]),
          h("label", { class: "flex items-center gap-2" }, [
            h("span", { class: "w-32" }, "Auto start"),
            h(InputSwitch, {
              modelValue: autoStart.value,
              "onUpdate:modelValue": (value: boolean) => {
                autoStart.value = value;
              },
            }),
          ]),
          h("label", { class: "flex items-center gap-2" }, [
            h("span", { class: "w-32" }, "Auto check updates"),
            h(InputSwitch, {
              modelValue: autoCheckUpdates.value,
              "onUpdate:modelValue": (value: boolean) => {
                autoCheckUpdates.value = value;
              },
            }),
          ]),
          h(Button, {
            label: "Save settings",
            onClick: () => void saveSettings(),
          }),
        ]),
      ]);
  },
});
