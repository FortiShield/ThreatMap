import type { API } from "@threatmap/sdk-frontend";
import { Routes } from "@threatmap/sdk-frontend";

import type { DevtoolsAPI } from "./api.js";
import type { Events } from "./events.js";

export type ThreatmapDevtoolsSdk = API<DevtoolsAPI, Events>;

export const sendToMatchAndReplace = async (
  selection: string,
  sdk: ThreatmapDevtoolsSdk,
  type: "request" | "response",
): Promise<void> => {
  if (!selection) {
    return;
  }

  sdk.navigation.goTo({ id: Routes.MatchReplace });

  const collections = sdk.matchReplace.getCollections();

  let collectionId: string;
  if (collections.length === 0) {
    const newCollection = await sdk.matchReplace.createCollection({
      name: "Devtools Collection",
    });

    collectionId = newCollection.id;
  } else {
    const firstCollection = collections[0];
    if (!firstCollection) {
      return;
    }

    collectionId = firstCollection.id;
  }

  let name = selection;
  if (selection.length > 30) {
    name = selection.substring(0, 30) + "...";
  }

  await sdk.matchReplace.createRule({
    name,
    query: "",
    section: {
      kind: type === "request" ? "SectionRequestBody" : "SectionResponseBody",
      operation: {
        kind: "OperationBodyRaw",
        matcher: {
          kind: "MatcherRawValue",
          value: selection,
        },
        replacer: {
          kind: "ReplacerTerm",
          term: "",
        },
      },
    },
    collectionId,
    sources: ["PLUGIN"],
  });
};

let enabled = true;

export const setQuickMarEnabled = (value: boolean): void => {
  enabled = value;
};

export const initQuickMar = (sdk: ThreatmapDevtoolsSdk): void => {
  if (!enabled) {
    return;
  }

  sdk.commands.register("devtools:quickmar", {
    name: "Send to Match & Replace",
    run: (context) => {
      if (!enabled) {
        return;
      }

      if (
        context.type === "RequestContext" ||
        context.type === "ResponseContext"
      ) {
        const selection = context.selection;
        if (selection === "") {
          return;
        }

        void sendToMatchAndReplace(
          selection,
          sdk,
          context.type === "RequestContext" ? "request" : "response",
        );
      }
    },
    group: "Devtools",
  });

  sdk.menu.registerItem({
    commandId: "devtools:quickmar",
    leadingIcon: "fas fa-wrench",
    type: "Request",
  });

  sdk.menu.registerItem({
    commandId: "devtools:quickmar",
    leadingIcon: "fas fa-wrench",
    type: "Response",
  });
};
