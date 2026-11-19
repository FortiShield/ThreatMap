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

import type { CustomAgent } from "../custom-agents.js";
import type { Spec } from "../index.js";

export type ShiftSdk = FrontendAPI<Spec, Spec["events"]>;

export default defineComponent({
  name: "ShiftSettingsView",
  props: {
    sdk: { type: Object as PropType<ShiftSdk>, required: true },
  },
  setup(props) {
    const agents = ref<CustomAgent[]>([]);
    const models = ref("");
    const settings = ref("");
    const learnings = ref<string[]>([]);
    const newLearning = ref("");
    const error = ref<string | undefined>();
    const handles: { stop: () => void }[] = [];

    const refresh = async (): Promise<void> => {
      error.value = undefined;
      try {
        const agentResult = await props.sdk.backend.getAgents();
        if (agentResult.kind === "Ok") agents.value = agentResult.value;

        const modelResult = await props.sdk.backend.getModels();
        if (modelResult.kind === "Ok")
          models.value = JSON.stringify(modelResult.value, null, 2);

        const settingsResult = await props.sdk.backend.getSettings();
        if (settingsResult.kind === "Ok")
          settings.value = JSON.stringify(settingsResult.value, null, 2);

        const learningsResult = await props.sdk.backend.getLearnings();
        if (learningsResult.kind === "Ok") {
          const value = learningsResult.value as unknown;
          learnings.value =
            value !== null &&
            typeof value === "object" &&
            Array.isArray((value as { entries?: unknown }).entries)
              ? (value as { entries: string[] }).entries
              : [];
        }
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : String(cause);
      }
    };

    const saveModels = async (): Promise<void> => {
      try {
        const parsed = JSON.parse(models.value) as Parameters<
          ShiftSdk["backend"]["setModels"]
        >[0];
        const result = await props.sdk.backend.setModels(parsed);
        if (result.kind !== "Ok") error.value = result.error;
      } catch {
        error.value = "Models JSON is invalid";
      }
    };

    const saveSettings = async (): Promise<void> => {
      try {
        const parsed = JSON.parse(settings.value) as Parameters<
          ShiftSdk["backend"]["updateSettings"]
        >[0];
        const result = await props.sdk.backend.updateSettings(parsed);
        if (result.kind !== "Ok") error.value = result.error;
      } catch {
        error.value = "Settings JSON is invalid";
      }
    };

    const addLearning = async (): Promise<void> => {
      const content = newLearning.value.trim();
      if (content.length === 0) return;
      const result = await props.sdk.backend.addLearning(content);
      if (result.kind !== "Ok") error.value = result.error;
      newLearning.value = "";
      await refresh();
    };

    const removeLearning = async (index: number): Promise<void> => {
      const result = await props.sdk.backend.removeLearnings([index]);
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    const deleteAgent = async (id: string): Promise<void> => {
      const result = await props.sdk.backend.deleteAgent(id);
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    onMounted(() => {
      void refresh();
      handles.push(
        props.sdk.backend.onEvent("agent:created", () => void refresh()),
        props.sdk.backend.onEvent("agent:deleted", () => void refresh()),
        props.sdk.backend.onEvent("settings:updated", () => void refresh()),
        props.sdk.backend.onEvent("models:updated", () => void refresh()),
      );
    });

    onBeforeUnmount(() => {
      for (const handle of handles) handle.stop();
    });

    return () =>
      h("div", { class: "flex max-w-2xl flex-col gap-4 p-4" }, [
        h("h2", { class: "text-lg font-semibold" }, "Shift"),
        error.value !== undefined
          ? h("p", { class: "text-sm text-red-500" }, error.value)
          : null,
        h("h3", { class: "font-medium" }, `Agents (${agents.value.length})`),
        h(
          "ul",
          { class: "flex flex-col gap-1" },
          agents.value.map((agent) =>
            h("li", { class: "flex items-center gap-2" }, [
              h("span", agent.name),
              h(Button, {
                label: "Delete",
                text: true,
                severity: "danger",
                onClick: () => void deleteAgent(agent.id),
              }),
            ]),
          ),
        ),
        h("h3", { class: "font-medium" }, "Learnings"),
        h(
          "ul",
          { class: "flex flex-col gap-1" },
          learnings.value.map((learning, index) =>
            h("li", { class: "flex items-center gap-2" }, [
              h("span", learning),
              h(Button, {
                label: "Remove",
                text: true,
                severity: "danger",
                onClick: () => void removeLearning(index),
              }),
            ]),
          ),
        ),
        h("div", { class: "flex gap-2" }, [
          h(Textarea, {
            modelValue: newLearning.value,
            rows: 2,
            placeholder: "New learning",
            "onUpdate:modelValue": (value: string) => {
              newLearning.value = value;
            },
          }),
          h(Button, { label: "Add", onClick: () => void addLearning() }),
        ]),
        h("h3", { class: "font-medium" }, "Models (JSON)"),
        h(Textarea, {
          modelValue: models.value,
          rows: 6,
          "onUpdate:modelValue": (value: string) => {
            models.value = value;
          },
        }),
        h(Button, { label: "Save models", onClick: () => void saveModels() }),
        h("h3", { class: "font-medium" }, "Settings (JSON)"),
        h(Textarea, {
          modelValue: settings.value,
          rows: 6,
          "onUpdate:modelValue": (value: string) => {
            settings.value = value;
          },
        }),
        h(Button, {
          label: "Save settings",
          onClick: () => void saveSettings(),
        }),
      ]);
  },
});
