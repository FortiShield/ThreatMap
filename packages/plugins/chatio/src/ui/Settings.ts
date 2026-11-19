import type { API as FrontendAPI } from "@threatmap/sdk-frontend";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
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
import type { ChatSession } from "../message.js";

export type ChatIoSdk = FrontendAPI<Spec, Spec["events"]>;

export default defineComponent({
  name: "ChatioSettingsView",
  props: {
    sdk: { type: Object as PropType<ChatIoSdk>, required: true },
  },
  setup(props) {
    const sessions = ref<ChatSession[]>([]);
    const selectedId = ref<string | undefined>();
    const newTitle = ref("");
    const message = ref("");
    const providers = ref<{ id: string; isConfigured: boolean }[]>([]);
    const models = ref<{ id?: string; name?: string }[]>([]);
    const error = ref<string | undefined>();
    const output = ref("");

    const handles: { stop: () => void }[] = [];

    const refresh = async (): Promise<void> => {
      error.value = undefined;
      try {
        const result = await props.sdk.backend.getSessions();
        if (result.kind === "Ok") sessions.value = result.value;
        else error.value = result.error;

        const providerResult = await props.sdk.backend.getProviderStatuses();
        if (providerResult.kind === "Ok")
          providers.value = providerResult.value;

        const modelResult = await props.sdk.backend.getModels();
        if (modelResult.kind === "Ok") models.value = modelResult.value;
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : String(cause);
      }
    };

    const createSession = async (): Promise<void> => {
      const title = newTitle.value.trim() || "New session";
      const result = await props.sdk.backend.createSession({
        title,
        messages: [],
      });
      if (result.kind === "Ok") {
        newTitle.value = "";
        selectedId.value = result.value.id;
        await refresh();
      } else {
        error.value = result.error;
      }
    };

    const deleteSession = async (sessionId: string): Promise<void> => {
      const result = await props.sdk.backend.deleteSession(sessionId);
      if (result.kind !== "Ok") error.value = result.error;
      if (selectedId.value === sessionId) selectedId.value = undefined;
      await refresh();
    };

    const send = async (): Promise<void> => {
      const sessionId = selectedId.value;
      const text = message.value.trim();
      if (
        sessionId === undefined ||
        sessionId.length === 0 ||
        text.length === 0
      )
        return;
      const result = await props.sdk.backend.sendMessage({ sessionId, text });
      if (result.kind === "Ok") {
        message.value = "";
        await refresh();
      } else {
        error.value = result.error;
      }
    };

    onMounted(() => {
      void refresh();
      handles.push(
        props.sdk.backend.onEvent("session:created", () => void refresh()),
        props.sdk.backend.onEvent("session:updated", () => void refresh()),
        props.sdk.backend.onEvent("session:deleted", () => void refresh()),
      );
    });

    onBeforeUnmount(() => {
      for (const handle of handles) handle.stop();
    });

    const selected = () =>
      sessions.value.find((session) => session.id === selectedId.value);

    return () =>
      h("div", { class: "flex max-w-2xl flex-col gap-4 p-4" }, [
        h("h2", { class: "text-lg font-semibold" }, "Chat.io"),
        error.value !== undefined
          ? h("p", { class: "text-sm text-red-500" }, error.value)
          : null,
        h("h3", { class: "font-medium" }, "Sessions"),
        h("div", { class: "flex gap-2" }, [
          h(InputText, {
            modelValue: newTitle.value,
            placeholder: "Session title",
            "onUpdate:modelValue": (value: string) => {
              newTitle.value = value;
            },
          }),
          h(Button, { label: "Create", onClick: () => void createSession() }),
        ]),
        h(
          "ul",
          { class: "flex flex-col gap-1" },
          sessions.value.map((session) =>
            h("li", { class: "flex items-center gap-2" }, [
              h(Button, {
                label: `${session.title} (${session.messages.length} msg)`,
                text: true,
                onClick: () => {
                  selectedId.value = session.id;
                },
              }),
              h(Button, {
                label: "Delete",
                severity: "danger",
                text: true,
                onClick: () => void deleteSession(session.id),
              }),
            ]),
          ),
        ),
        selected()
          ? h("div", { class: "flex flex-col gap-2" }, [
              h(
                "h3",
                { class: "font-medium" },
                `Session: ${selected()?.title}`,
              ),
              h(
                "ul",
                {},
                selected()?.messages.map((msg) =>
                  h(
                    "li",
                    {},
                    `${msg.role}: ${msg.parts
                      .map((part) =>
                        part.type === "text" ? part.text : "[image]",
                      )
                      .join(" ")}`,
                  ),
                ) ?? [],
              ),
              h("div", { class: "flex gap-2" }, [
                h(InputText, {
                  modelValue: message.value,
                  placeholder: "Message",
                  "onUpdate:modelValue": (value: string) => {
                    message.value = value;
                  },
                }),
                h(Button, { label: "Send", onClick: () => void send() }),
              ]),
            ])
          : null,
        h("h3", { class: "font-medium" }, "Providers"),
        h(
          "ul",
          {},
          providers.value.map((provider) =>
            h("li", { class: "flex items-center gap-2" }, [
              h("span", provider.id),
              h(Tag, {
                value: provider.isConfigured ? "configured" : "missing",
                severity: provider.isConfigured ? "success" : "warn",
              }),
            ]),
          ),
        ),
        h("h3", { class: "font-medium" }, "Models"),
        h(
          "ul",
          {},
          models.value.map((model, index) =>
            h("li", { key: index }, model.name ?? model.id ?? "unknown"),
          ),
        ),
      ]);
  },
});
