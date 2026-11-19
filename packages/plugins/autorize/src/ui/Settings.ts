import type { API as FrontendAPI } from "@threatmap/sdk-frontend";
import Button from "primevue/button";
import Textarea from "primevue/textarea";
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
} from "vue";

import type { Spec, Template } from "../index.js";

export type AutorizeSdk = FrontendAPI<Spec, Spec["events"]>;

export default defineComponent({
  name: "AutorizeSettingsView",
  props: {
    sdk: { type: Object as PropType<AutorizeSdk>, required: true },
  },
  setup(props) {
    const templates = ref<Template[]>([]);
    const config = ref("");
    const queueActive = ref(false);
    const error = ref<string | undefined>();
    const handles: { stop: () => void }[] = [];

    const refresh = async (): Promise<void> => {
      error.value = undefined;
      try {
        const templateResult = await props.sdk.backend.getTemplates();
        if (templateResult.kind === "Ok")
          templates.value = templateResult.value;
        else error.value = templateResult.error;

        const configResult = await props.sdk.backend.getConfig();
        if (configResult.kind === "Ok") {
          config.value = JSON.stringify(configResult.value, null, 2);
        } else {
          error.value = configResult.error;
        }
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : String(cause);
      }
    };

    const saveConfig = async (): Promise<void> => {
      try {
        const parsed = JSON.parse(config.value) as Parameters<
          AutorizeSdk["backend"]["updateConfig"]
        >[0];
        const result = await props.sdk.backend.updateConfig(parsed);
        if (result.kind !== "Ok") error.value = result.error;
      } catch {
        error.value = "Config is not valid JSON";
      }
    };

    const run = async (
      action: () => Promise<{ kind: string; error?: string }>,
    ): Promise<void> => {
      const result = await action();
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    onMounted(() => {
      void refresh();
      handles.push(
        props.sdk.backend.onEvent("template:created", () => void refresh()),
        props.sdk.backend.onEvent("template:updated", () => void refresh()),
        props.sdk.backend.onEvent("template:completed", () => void refresh()),
        props.sdk.backend.onEvent("template:deleted", () => void refresh()),
        props.sdk.backend.onEvent("templates:cleared", () => void refresh()),
        props.sdk.backend.onEvent("queue:status-changed", (hasActiveJobs) => {
          queueActive.value = hasActiveJobs;
        }),
      );
    });

    onBeforeUnmount(() => {
      for (const handle of handles) handle.stop();
    });

    return () =>
      h("div", { class: "flex max-w-2xl flex-col gap-4 p-4" }, [
        h("h2", { class: "text-lg font-semibold" }, "Autorize"),
        error.value !== undefined
          ? h("p", { class: "text-sm text-red-500" }, error.value)
          : null,
        h(
          "p",
          { class: "text-sm" },
          `Queue: ${queueActive.value ? "running" : "idle"}`,
        ),
        h("div", { class: "flex flex-wrap gap-2" }, [
          h(Button, {
            label: "Clear queue",
            severity: "secondary",
            onClick: () => void run(() => props.sdk.backend.clearQueue()),
          }),
          h(Button, {
            label: "Rescan all",
            onClick: () =>
              void run(() => props.sdk.backend.rescanAllTemplates()),
          }),
          h(Button, {
            label: "Clear all templates",
            severity: "danger",
            onClick: () =>
              void run(() => props.sdk.backend.clearAllTemplates()),
          }),
        ]),
        h(
          "h3",
          { class: "font-medium" },
          `Templates (${templates.value.length})`,
        ),
        h(
          "ul",
          { class: "flex flex-col gap-1" },
          templates.value.map((template) =>
            h(
              "li",
              {},
              `#${template.id} ${template.request.method} ${template.request.url}`,
            ),
          ),
        ),
        h("h3", { class: "font-medium" }, "Config (JSON)"),
        h(Textarea, {
          modelValue: config.value,
          rows: 8,
          "onUpdate:modelValue": (value: string) => {
            config.value = value;
          },
        }),
        h(Button, { label: "Save config", onClick: () => void saveConfig() }),
      ]);
  },
});
