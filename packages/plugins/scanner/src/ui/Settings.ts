import type { API as FrontendAPI } from "@threatmap/sdk-frontend";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
} from "vue";

import type { CheckMetadata } from "../check.js";
import type { Spec } from "../index.js";
import type { QueueTask } from "../queue.js";
import type { Session } from "../session.js";

export type ScannerSdk = FrontendAPI<Spec, Spec["events"]>;

export default defineComponent({
  name: "ScannerSettingsView",
  props: {
    sdk: { type: Object as PropType<ScannerSdk>, required: true },
  },
  setup(props) {
    const checks = ref<CheckMetadata[]>([]);
    const sessions = ref<Session[]>([]);
    const queueTasks = ref<QueueTask[]>([]);
    const config = ref("");
    const payload = ref("{}");
    const error = ref<string | undefined>();
    const handles: { stop: () => void }[] = [];

    const refresh = async (): Promise<void> => {
      error.value = undefined;
      try {
        const checkResult = await props.sdk.backend.getChecks();
        if (checkResult.kind === "Ok") checks.value = checkResult.value;

        const sessionResult = await props.sdk.backend.getScanSessions();
        if (sessionResult.kind === "Ok") sessions.value = sessionResult.value;

        const queueResult = await props.sdk.backend.getQueueTasks();
        if (queueResult.kind === "Ok") queueTasks.value = queueResult.value;

        const configResult = await props.sdk.backend.getUserConfig();
        if (configResult.kind === "Ok") {
          config.value = JSON.stringify(configResult.value, null, 2);
        }
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : String(cause);
      }
    };

    const startScan = async (): Promise<void> => {
      try {
        const parsed = JSON.parse(payload.value) as Parameters<
          ScannerSdk["backend"]["startActiveScan"]
        >[0];
        const result = await props.sdk.backend.startActiveScan(parsed);
        if (result.kind !== "Ok") error.value = result.error;
      } catch {
        error.value = "Payload JSON is invalid";
      }
      await refresh();
    };

    const cancel = async (sessionId: string): Promise<void> => {
      const result = await props.sdk.backend.cancelScanSession(sessionId);
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    const clearQueue = async (): Promise<void> => {
      const result = await props.sdk.backend.clearQueueTasks();
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    const saveConfig = async (): Promise<void> => {
      try {
        const parsed = JSON.parse(config.value) as Parameters<
          ScannerSdk["backend"]["updateUserConfig"]
        >[0];
        const result = await props.sdk.backend.updateUserConfig(parsed);
        if (result.kind !== "Ok") error.value = result.error;
      } catch {
        error.value = "Config JSON is invalid";
      }
    };

    onMounted(() => {
      void refresh();
      handles.push(
        props.sdk.backend.onEvent("session:created", () => void refresh()),
        props.sdk.backend.onEvent("session:updated", () => void refresh()),
        props.sdk.backend.onEvent("passive:queue-updated", (tasks) => {
          queueTasks.value = tasks;
        }),
        props.sdk.backend.onEvent("config:updated", () => void refresh()),
      );
    });

    onBeforeUnmount(() => {
      for (const handle of handles) handle.stop();
    });

    return () =>
      h("div", { class: "flex max-w-2xl flex-col gap-4 p-4" }, [
        h("h2", { class: "text-lg font-semibold" }, "Scanner"),
        error.value !== undefined
          ? h("p", { class: "text-sm text-red-500" }, error.value)
          : null,
        h("h3", { class: "font-medium" }, `Checks (${checks.value.length})`),
        h(
          "ul",
          { class: "max-h-32 overflow-auto" },
          checks.value.map((check) =>
            h("li", {}, `${check.id}: ${check.name}`),
          ),
        ),
        h("h3", { class: "font-medium" }, `Queue (${queueTasks.value.length})`),
        h(Button, {
          label: "Clear queue",
          severity: "secondary",
          onClick: () => void clearQueue(),
        }),
        h(
          "h3",
          { class: "font-medium" },
          `Sessions (${sessions.value.length})`,
        ),
        h(
          "ul",
          { class: "flex flex-col gap-1" },
          sessions.value.map((session) =>
            h("li", { class: "flex items-center gap-2" }, [
              h("span", session.id),
              h(Tag, { value: session.kind }),
              h(Button, {
                label: "Cancel",
                text: true,
                severity: "danger",
                onClick: () => void cancel(session.id),
              }),
            ]),
          ),
        ),
        h("h3", { class: "font-medium" }, "Start active scan (JSON payload)"),
        h(Textarea, {
          modelValue: payload.value,
          rows: 4,
          "onUpdate:modelValue": (value: string) => {
            payload.value = value;
          },
        }),
        h(Button, { label: "Start scan", onClick: () => void startScan() }),
        h("h3", { class: "font-medium" }, "User config (JSON)"),
        h(Textarea, {
          modelValue: config.value,
          rows: 6,
          "onUpdate:modelValue": (value: string) => {
            config.value = value;
          },
        }),
        h(Button, { label: "Save config", onClick: () => void saveConfig() }),
      ]);
  },
});
