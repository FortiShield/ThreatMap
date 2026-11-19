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

export type ParamFinderSdk = FrontendAPI<Spec, Spec["events"]>;

const DEFAULT_REQUEST = JSON.stringify(
  {
    id: "req-1",
    host: "example.com",
    port: 443,
    url: "/",
    path: "/",
    query: "",
    method: "GET",
    headers: {},
    body: "",
    tls: true,
    raw: "",
    context: "discovery",
  },
  null,
  2,
);

export default defineComponent({
  name: "ParamFinderSettingsView",
  props: {
    sdk: { type: Object as PropType<ParamFinderSdk>, required: true },
  },
  setup(props) {
    const request = ref(DEFAULT_REQUEST);
    const config = ref("{}");
    const words = ref("");
    const sessionId = ref<string | undefined>();
    const log = ref<string[]>([]);
    const findings = ref<string>("");
    const error = ref<string | undefined>();
    const miningHandle = ref<{ stop: () => void }>();

    const appendLog = (line: string): void => {
      log.value = [...log.value.slice(-49), line];
    };

    const common = async (): Promise<
      { ok: true; request: unknown; config: unknown } | { ok: false }
    > => {
      try {
        return {
          ok: true,
          request: JSON.parse(request.value),
          config: JSON.parse(config.value),
        };
      } catch {
        error.value = "Request or config JSON is invalid";
        return { ok: false };
      }
    };

    const mine = async (): Promise<void> => {
      const parsed = await common();
      if (!parsed.ok) return;
      const result = await props.sdk.backend.startMining(
        parsed.request as Parameters<
          ParamFinderSdk["backend"]["startMining"]
        >[0],
        parsed.config as Parameters<
          ParamFinderSdk["backend"]["startMining"]
        >[1],
      );
      if (result.kind === "Ok") {
        sessionId.value = result.value.id;
        appendLog(`Session ${result.value.id} (${result.value.phase})`);
      } else {
        error.value = result.error;
      }
    };

    const discover = async (): Promise<void> => {
      const parsed = await common();
      if (!parsed.ok) return;
      const wordList = words.value
        .split(/[\n,]/u)
        .map((word) => word.trim())
        .filter((word) => word.length > 0);
      const result = await props.sdk.backend.discover(
        parsed.request as Parameters<ParamFinderSdk["backend"]["discover"]>[0],
        wordList,
        parsed.config as Parameters<ParamFinderSdk["backend"]["discover"]>[2],
      );
      if (result.kind === "Ok") {
        findings.value = JSON.stringify(result.value, null, 2);
        appendLog(`${result.value.length} finding(s)`);
      } else {
        error.value = result.error;
      }
    };

    const cancel = async (): Promise<void> => {
      if (sessionId.value === undefined || sessionId.value.length === 0) return;
      const result = await props.sdk.backend.cancelSession(sessionId.value);
      if (result.kind !== "Ok") error.value = result.error;
      appendLog(`Canceled ${sessionId.value}`);
      sessionId.value = undefined;
    };

    onMounted(() => {
      miningHandle.value = props.sdk.backend.onEvent(
        "mining:event",
        (event) => {
          if (event.type === "log")
            appendLog(`[${event.level}] ${event.message}`);
          else if (event.type === "state")
            appendLog(`state: ${event.state}/${event.phase}`);
          else if (event.type === "finding")
            appendLog(
              `finding: ${JSON.stringify(event.finding).slice(0, 120)}`,
            );
          else if (event.type === "completed") appendLog("completed");
        },
      );
    });

    onBeforeUnmount(() => {
      miningHandle.value?.stop();
    });

    return () =>
      h("div", { class: "flex max-w-2xl flex-col gap-4 p-4" }, [
        h("h2", { class: "text-lg font-semibold" }, "ParamFinder"),
        error.value !== undefined
          ? h("p", { class: "text-sm text-red-500" }, error.value)
          : null,
        h("h3", { class: "font-medium" }, "Engine request (JSON)"),
        h(Textarea, {
          modelValue: request.value,
          rows: 10,
          "onUpdate:modelValue": (value: string) => {
            request.value = value;
          },
        }),
        h("h3", { class: "font-medium" }, "Engine config (JSON)"),
        h(Textarea, {
          modelValue: config.value,
          rows: 4,
          "onUpdate:modelValue": (value: string) => {
            config.value = value;
          },
        }),
        h("h3", { class: "font-medium" }, "Words"),
        h(InputText, {
          modelValue: words.value,
          placeholder: "Comma or newline separated",
          "onUpdate:modelValue": (value: string) => {
            words.value = value;
          },
        }),
        h("div", { class: "flex gap-2" }, [
          h(Button, { label: "Start mining", onClick: () => void mine() }),
          h(Button, { label: "Discover", onClick: () => void discover() }),
          h(Button, {
            label: "Cancel",
            severity: "danger",
            text: true,
            onClick: () => void cancel(),
          }),
        ]),
        h("h3", { class: "font-medium" }, "Event log"),
        h(
          "pre",
          { class: "max-h-40 overflow-auto text-xs" },
          log.value.join("\n"),
        ),
        findings.value.length > 0
          ? h(
              "pre",
              { class: "max-h-60 overflow-auto text-xs" },
              findings.value,
            )
          : null,
      ]);
  },
});
