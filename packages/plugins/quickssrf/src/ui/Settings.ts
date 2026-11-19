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

import type { Spec } from "../index.js";
import type { Session } from "../session.js";

export type QuickSSRFSdk = FrontendAPI<Spec, Spec["events"]>;

export default defineComponent({
  name: "QuickSSRFSettingsView",
  props: {
    sdk: { type: Object as PropType<QuickSSRFSdk>, required: true },
  },
  setup(props) {
    const sessions = ref<Session[]>([]);
    const providers = ref<{ id: string; name: string; enabled: boolean }[]>([]);
    const config = ref("");
    const interactions = ref<number | undefined>();
    const error = ref<string | undefined>();
    const handles: { stop: () => void }[] = [];

    const refresh = async (): Promise<void> => {
      error.value = undefined;
      try {
        const sessionResult = await props.sdk.backend.getSessions();
        if (sessionResult.kind === "Ok") sessions.value = sessionResult.value;
        else error.value = sessionResult.error;

        const providerResult = await props.sdk.backend.getProviders();
        if (providerResult.kind === "Ok") {
          providers.value = providerResult.value.map((provider) => ({
            id: provider.id,
            name: provider.name,
            enabled: provider.enabled,
          }));
        }

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

    const create = async (): Promise<void> => {
      const result = await props.sdk.backend.createSession();
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    const stop = async (sessionId: string): Promise<void> => {
      const result = await props.sdk.backend.stopSession(sessionId);
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    const resume = async (sessionId: string): Promise<void> => {
      const result = await props.sdk.backend.resumeSession(sessionId);
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    const remove = async (sessionId: string): Promise<void> => {
      const result = await props.sdk.backend.deleteSession(sessionId);
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    const poll = async (sessionId: string): Promise<void> => {
      const result = await props.sdk.backend.pollSession(sessionId);
      if (result.kind === "Ok") interactions.value = result.value.length;
      else error.value = result.error;
    };

    const saveConfig = async (): Promise<void> => {
      try {
        const parsed = JSON.parse(config.value) as Parameters<
          QuickSSRFSdk["backend"]["updateConfig"]
        >[0];
        const result = await props.sdk.backend.updateConfig(parsed);
        if (result.kind !== "Ok") error.value = result.error;
      } catch {
        error.value = "Config is not valid JSON";
      }
    };

    onMounted(() => {
      void refresh();
      handles.push(
        props.sdk.backend.onEvent("session:created", () => void refresh()),
        props.sdk.backend.onEvent("session:updated", () => void refresh()),
        props.sdk.backend.onEvent("session:deleted", () => void refresh()),
        props.sdk.backend.onEvent("config:updated", () => void refresh()),
      );
    });

    onBeforeUnmount(() => {
      for (const handle of handles) handle.stop();
    });

    return () =>
      h("div", { class: "flex max-w-2xl flex-col gap-4 p-4" }, [
        h("h2", { class: "text-lg font-semibold" }, "QuickSSRF"),
        error.value !== undefined
          ? h("p", { class: "text-sm text-red-500" }, error.value)
          : null,
        h("div", { class: "flex gap-2" }, [
          h(Button, { label: "New session", onClick: () => void create() }),
        ]),
        h("h3", { class: "font-medium" }, "Sessions"),
        h(
          "ul",
          { class: "flex flex-col gap-1" },
          sessions.value.map((session) =>
            h("li", { class: "flex flex-wrap items-center gap-2" }, [
              h("span", session.title || session.id),
              h(Tag, { value: session.status }),
              h(Button, {
                label: "Poll",
                text: true,
                onClick: () => void poll(session.id),
              }),
              h(Button, {
                label: "Stop",
                text: true,
                onClick: () => void stop(session.id),
              }),
              h(Button, {
                label: "Resume",
                text: true,
                onClick: () => void resume(session.id),
              }),
              h(Button, {
                label: "Delete",
                severity: "danger",
                text: true,
                onClick: () => void remove(session.id),
              }),
            ]),
          ),
        ),
        interactions.value !== undefined
          ? h("p", { class: "text-sm" }, `Interactions: ${interactions.value}`)
          : null,
        h("h3", { class: "font-medium" }, "Providers"),
        h(
          "ul",
          {},
          providers.value.map((provider) =>
            h(
              "li",
              {},
              `${provider.name} (${provider.enabled ? "enabled" : "disabled"})`,
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
