import type { DefinePluginPackageSpec } from "@threatmap/sdk-shared";

import type { API } from "./api.js";
import { init } from "./backend.js";
import type { Events } from "./events.js";

export { init } from "./backend.js";
export type { API } from "./api.js";
export type { Events } from "./events.js";

export type Spec = DefinePluginPackageSpec<{
  manifestId: "devtools";
  api: API;
  events: Events;
}>;
