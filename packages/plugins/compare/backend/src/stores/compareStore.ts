import {
  type AddFileItemInput,
  type AddItemInput,
  type AddRequestsInput,
  type CompareItem,
  getOtherPanel,
  type ItemSelection,
  type Panel,
} from "../../../src/item.js";

export type CompareStore = {
  listItems(panel: Panel): CompareItem[];
  addItem(input: AddItemInput): CompareItem;
  addFileItem(input: AddFileItemInput): CompareItem;
  addRequests(input: AddRequestsInput): CompareItem[];
  removeItems(selection: ItemSelection): number[];
  moveItems(selection: ItemSelection): CompareItem[];
  clearPanel(panel: Panel): CompareItem[];
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let nextId = 0;

export const createCompareStore = (): CompareStore => {
  let panels: Record<Panel, CompareItem[]> = { original: [], modified: [] };

  const push = (input: Omit<AddItemInput, never>): CompareItem => {
    const item: CompareItem = {
      id: ++nextId,
      kind: input.kind,
      source: input.source,
      data: input.data,
      createdAt: new Date().toISOString(),
    };
    panels = { ...panels, [input.panel]: [...panels[input.panel], item] };
    return clone(item);
  };

  return {
    listItems: (panel) => clone(panels[panel]),
    addItem: (input) => push(input),
    addFileItem: (input) =>
      push({
        panel: input.panel,
        kind: input.kind,
        source: input.path,
        data: `File: ${input.path}`,
      }),
    addRequests: (input) =>
      input.requestIds.map((requestId) =>
        push({
          panel: input.panel,
          kind: "request",
          source: requestId,
          data: `Request ${requestId}`,
        }),
      ),
    removeItems: (selection) => {
      const removed = panels[selection.panel].filter((item) =>
        selection.ids.includes(item.id),
      );
      panels = {
        ...panels,
        [selection.panel]: panels[selection.panel].filter(
          (item) => !selection.ids.includes(item.id),
        ),
      };
      return removed.map((item) => item.id);
    },
    moveItems: (selection) => {
      const other = getOtherPanel(selection.panel);
      const moved = panels[selection.panel].filter((item) =>
        selection.ids.includes(item.id),
      );
      panels = {
        ...panels,
        [selection.panel]: panels[selection.panel].filter(
          (item) => !selection.ids.includes(item.id),
        ),
        [other]: [...panels[other], ...moved],
      };
      return clone(moved);
    },
    clearPanel: (panel) => {
      panels = { ...panels, [panel]: [] };
      return [];
    },
  };
};
