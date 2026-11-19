import type { CustomAgent } from "../../../src/custom-agents.js";
import type { LearningsConfig } from "../../../src/learnings.js";
import type { Model, ModelsConfig } from "../../../src/models.js";
import type { Result } from "../../../src/result.js";
import type { SettingsConfig } from "../../../src/settings.js";
import type { AgentSkillDefinition } from "../../../src/skills.js";
import type { ShiftStore } from "../stores/shiftStore.js";
import type { BackendSDK } from "../types.js";

const ok = <T>(value: T): Result<T> => ({ kind: "Ok", value });
const err = <T>(error: string): Result<T> => ({ kind: "Error", error });

export const apiGetModels = (store: ShiftStore) => (): Result<ModelsConfig> =>
  ok(store.getModels());

export const apiSetModels =
  (store: ShiftStore) =>
  async (
    sdk: BackendSDK,
    config: ModelsConfig,
  ): Promise<Result<ModelsConfig>> => {
    const updated = store.setModels(config);
    sdk.api.send("models:updated");
    return ok(updated);
  };

export const apiAddModel =
  (store: ShiftStore) =>
  async (sdk: BackendSDK, model: Model): Promise<Result<Model>> => {
    const added = store.addModel(model);
    sdk.api.send("models:updated");
    return ok(added);
  };

export const apiRemoveModel =
  (store: ShiftStore) =>
  async (sdk: BackendSDK, modelKey: string): Promise<Result<void>> => {
    if (!store.removeModel(modelKey)) {
      return err(`Model ${modelKey} not found`);
    }
    sdk.api.send("models:updated");
    return ok(undefined);
  };

export const apiGetAgents = (store: ShiftStore) => (): Result<CustomAgent[]> =>
  ok(store.listAgents());

export const apiCreateAgent =
  (store: ShiftStore) =>
  async (
    sdk: BackendSDK,
    agent: Omit<CustomAgent, "id">,
  ): Promise<Result<CustomAgent>> => {
    const created = store.createAgent(agent);
    sdk.api.send("agent:created", created.id);
    return ok(created);
  };

export const apiUpdateAgent =
  (store: ShiftStore) =>
  async (
    _sdk: BackendSDK,
    id: string,
    updates: Partial<Omit<CustomAgent, "id">>,
  ): Promise<Result<CustomAgent>> => {
    const updated = store.updateAgent(id, updates);
    if (updated === undefined) {
      return err(`Agent ${id} not found`);
    }
    return ok(updated);
  };

export const apiDeleteAgent =
  (store: ShiftStore) =>
  async (sdk: BackendSDK, id: string): Promise<Result<void>> => {
    if (!store.deleteAgent(id)) {
      return err(`Agent ${id} not found`);
    }
    sdk.api.send("agent:deleted", id);
    return ok(undefined);
  };

export const apiGetSkills =
  (store: ShiftStore) => (): Result<AgentSkillDefinition[]> =>
    ok(store.listSkills());

export const apiGetLearnings =
  (store: ShiftStore) => (): Result<LearningsConfig> =>
    ok(store.getLearnings());

export const apiAddLearning =
  (store: ShiftStore) =>
  async (
    sdk: BackendSDK,
    content: string,
  ): Promise<Result<LearningsConfig>> => {
    if (content.length === 0) {
      return err("Learning content is required.");
    }
    const updated = store.addLearning(content);
    sdk.api.send("settings:updated");
    return ok(updated);
  };

export const apiRemoveLearnings =
  (store: ShiftStore) =>
  async (
    sdk: BackendSDK,
    indexes: number[],
  ): Promise<Result<LearningsConfig>> => {
    const updated = store.removeLearnings(indexes);
    sdk.api.send("settings:updated");
    return ok(updated);
  };

export const apiGetSettings =
  (store: ShiftStore) => (): Result<SettingsConfig> =>
    ok(store.getSettings());

export const apiUpdateSettings =
  (store: ShiftStore) =>
  async (
    sdk: BackendSDK,
    updates: Partial<SettingsConfig>,
  ): Promise<Result<SettingsConfig>> => {
    const updated = store.updateSettings(updates);
    sdk.api.send("settings:updated");
    return ok(updated);
  };
