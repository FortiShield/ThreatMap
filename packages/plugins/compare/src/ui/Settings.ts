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
import type { CompareItem, ItemKind, Panel } from "../item.js";

export type CompareSdk = FrontendAPI<Spec, Spec["events"]>;

const KINDS: ItemKind[] = ["request", "response", "file", "clipboard"];

export default defineComponent({
  name: "CompareSettingsView",
  props: {
    sdk: { type: Object as PropType<CompareSdk>, required: true },
  },
  setup(props) {
    const panel = ref<Panel>("original");
    const items = ref<CompareItem[]>([]);
    const selected = ref<Set<number>>(new Set());
    const source = ref("");
    const data = ref("");
    const kind = ref<ItemKind>("request");
    const error = ref<string | undefined>();
    const itemsChanged = ref<{ stop: () => void } | undefined>();

    const refresh = async (): Promise<void> => {
      error.value = undefined;
      const result = await props.sdk.backend.listItems(panel.value);
      if (result.kind === "Ok") items.value = result.value;
      else error.value = result.error;
    };

    const switchPanel = async (next: Panel): Promise<void> => {
      panel.value = next;
      selected.value = new Set();
      await refresh();
    };

    const add = async (): Promise<void> => {
      const result = await props.sdk.backend.addItem({
        panel: panel.value,
        kind: kind.value,
        source: source.value,
        data: data.value,
      });
      if (result.kind === "Ok") {
        source.value = "";
        data.value = "";
        await refresh();
      } else {
        error.value = result.error;
      }
    };

    const removeSelected = async (): Promise<void> => {
      const ids = [...selected.value];
      if (ids.length === 0) return;
      const result = await props.sdk.backend.removeItems({
        panel: panel.value,
        ids,
      });
      if (result.kind !== "Ok") error.value = result.error;
      selected.value = new Set();
      await refresh();
    };

    const clear = async (): Promise<void> => {
      const result = await props.sdk.backend.clearPanel(panel.value);
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    onMounted(() => {
      void refresh();
      itemsChanged.value = props.sdk.backend.onEvent(
        "itemsChanged",
        () => void refresh(),
      );
    });

    onBeforeUnmount(() => {
      itemsChanged.value?.stop();
    });

    return () =>
      h("div", { class: "flex max-w-2xl flex-col gap-4 p-4" }, [
        h("h2", { class: "text-lg font-semibold" }, "Compare"),
        error.value !== undefined
          ? h("p", { class: "text-sm text-red-500" }, error.value)
          : null,
        h("div", { class: "flex gap-2" }, [
          h(Button, {
            label: "Original",
            severity: panel.value === "original" ? undefined : "secondary",
            onClick: () => void switchPanel("original"),
          }),
          h(Button, {
            label: "Modified",
            severity: panel.value === "modified" ? undefined : "secondary",
            onClick: () => void switchPanel("modified"),
          }),
          h(Button, {
            label: "Clear panel",
            severity: "danger",
            text: true,
            onClick: () => void clear(),
          }),
        ]),
        h("ul", { class: "flex flex-col gap-1" }, [
          ...items.value.map((item) =>
            h("li", { class: "flex items-center gap-2" }, [
              h("input", {
                type: "checkbox",
                checked: selected.value.has(item.id),
                onChange: (event: Event) => {
                  const next = new Set(selected.value);
                  if ((event.target as HTMLInputElement).checked)
                    next.add(item.id);
                  else next.delete(item.id);
                  selected.value = next;
                },
              }),
              h(Tag, { value: item.kind }),
              h("span", item.source),
              h(
                "span",
                { class: "text-sm text-surface-500" },
                `${item.data.length} bytes`,
              ),
            ]),
          ),
          selected.value.size > 0
            ? h(Button, {
                label: `Remove ${selected.value.size}`,
                severity: "danger",
                text: true,
                onClick: () => void removeSelected(),
              })
            : null,
        ]),
        h("h3", { class: "font-medium" }, "Add item"),
        h("div", { class: "flex flex-wrap gap-2" }, [
          ...KINDS.map((k) =>
            h(Button, {
              label: k,
              severity: kind.value === k ? undefined : "secondary",
              text: true,
              onClick: () => {
                kind.value = k;
              },
            }),
          ),
        ]),
        h(InputText, {
          modelValue: source.value,
          placeholder: "Source",
          "onUpdate:modelValue": (value: string) => {
            source.value = value;
          },
        }),
        h(Textarea, {
          modelValue: data.value,
          placeholder: "Data",
          rows: 4,
          "onUpdate:modelValue": (value: string) => {
            data.value = value;
          },
        }),
        h(Button, { label: "Add", onClick: () => void add() }),
      ]);
  },
});
