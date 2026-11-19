import type { API as FrontendAPI } from "@threatmap/sdk-frontend";

import type { Spec } from "../../src/index.js";

export type FrontendSDK = FrontendAPI<Spec, Spec["events"]>;
