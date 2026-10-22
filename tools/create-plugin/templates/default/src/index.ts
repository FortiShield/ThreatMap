import type { DefinePluginPackageSpec } from "@threatmap/sdk-shared";

import type { API } from "./api.js";
import type { Events } from "./events.js";

export type Spec = DefinePluginPackageSpec<{
  manifestId: "__plugin_id__";
  api: API;
  events: Events;
}>;

export type { API } from "./api.js";
export type { Events } from "./events.js";

export type APIResult<T> =
  { kind: "Error"; error: string } | { kind: "Ok"; value: T };
