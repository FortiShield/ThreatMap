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
import type { Theme } from "../theme.js";

export type ThemesSdk = FrontendAPI<Spec, Spec["events"]>;

export default defineComponent({
  name: "ThemesSettingsView",
  props: {
    sdk: { type: Object as PropType<ThemesSdk>, required: true },
  },
  setup(props) {
    const themes = ref<Theme[]>([]);
    const activeId = ref<string | undefined>();
    const newTheme = ref("{}");
    const error = ref<string | undefined>();
    const handles: { stop: () => void }[] = [];

    const refresh = async (): Promise<void> => {
      error.value = undefined;
      try {
        const themeResult = await props.sdk.backend.getThemes();
        if (themeResult.kind === "Ok") themes.value = themeResult.value;
        else error.value = themeResult.error;

        const activeResult = await props.sdk.backend.getActiveThemeId();
        if (activeResult.kind === "Ok") activeId.value = activeResult.value;
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : String(cause);
      }
    };

    const activate = async (themeId: string | undefined): Promise<void> => {
      const result = await props.sdk.backend.setActiveTheme(themeId);
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    const remove = async (themeId: string): Promise<void> => {
      const result = await props.sdk.backend.removeTheme(themeId);
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    const reset = async (): Promise<void> => {
      const result = await props.sdk.backend.resetThemes();
      if (result.kind !== "Ok") error.value = result.error;
      await refresh();
    };

    const add = async (): Promise<void> => {
      try {
        const parsed = JSON.parse(newTheme.value) as Parameters<
          ThemesSdk["backend"]["addTheme"]
        >[0];
        const result = await props.sdk.backend.addTheme(parsed);
        if (result.kind !== "Ok") error.value = result.error;
      } catch {
        error.value = "Theme JSON is invalid";
      }
      await refresh();
    };

    onMounted(() => {
      void refresh();
      handles.push(
        props.sdk.backend.onEvent("theme:created", () => void refresh()),
        props.sdk.backend.onEvent("theme:updated", () => void refresh()),
        props.sdk.backend.onEvent("theme:deleted", () => void refresh()),
        props.sdk.backend.onEvent("themes:reset", () => void refresh()),
        props.sdk.backend.onEvent("theme:activated", () => void refresh()),
      );
    });

    onBeforeUnmount(() => {
      for (const handle of handles) handle.stop();
    });

    return () =>
      h("div", { class: "flex max-w-2xl flex-col gap-4 p-4" }, [
        h("h2", { class: "text-lg font-semibold" }, "Themes"),
        error.value !== undefined
          ? h("p", { class: "text-sm text-red-500" }, error.value)
          : null,
        activeId.value !== undefined
          ? h(Tag, { value: `Active: ${activeId.value}`, severity: "success" })
          : h(Tag, { value: "No active theme", severity: "secondary" }),
        h(
          "ul",
          { class: "flex flex-col gap-1" },
          themes.value.map((theme) =>
            h("li", { class: "flex items-center gap-2" }, [
              h("span", `${theme.name} — ${theme.description}`),
              h(Button, {
                label: "Activate",
                text: true,
                onClick: () => void activate(theme.id),
              }),
              h(Button, {
                label: "Remove",
                text: true,
                severity: "danger",
                onClick: () => void remove(theme.id),
              }),
            ]),
          ),
        ),
        h("div", { class: "flex gap-2" }, [
          h(Button, {
            label: "Reset themes",
            severity: "secondary",
            onClick: () => void reset(),
          }),
        ]),
        h("h3", { class: "font-medium" }, "Add theme (JSON)"),
        h(Textarea, {
          modelValue: newTheme.value,
          rows: 6,
          "onUpdate:modelValue": (value: string) => {
            newTheme.value = value;
          },
        }),
        h(Button, { label: "Add theme", onClick: () => void add() }),
      ]);
  },
});
