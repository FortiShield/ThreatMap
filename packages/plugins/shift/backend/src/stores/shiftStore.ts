import { type CustomAgent } from "../../../src/custom-agents.js";
import {
  defaultLearningsConfig,
  type LearningsConfig,
} from "../../../src/learnings.js";
import { type Model, type ModelsConfig } from "../../../src/models.js";
import {
  defaultSettingsConfig,
  type SettingsConfig,
} from "../../../src/settings.js";
import { type AgentSkillDefinition } from "../../../src/skills.js";

export type ShiftStore = {
  getModels(): ModelsConfig;
  setModels(config: ModelsConfig): ModelsConfig;
  addModel(model: Model): Model;
  removeModel(modelKey: string): boolean;
  listAgents(): CustomAgent[];
  createAgent(agent: Omit<CustomAgent, "id">): CustomAgent;
  updateAgent(
    id: string,
    updates: Partial<Omit<CustomAgent, "id">>,
  ): CustomAgent | undefined;
  deleteAgent(id: string): boolean;
  listSkills(): AgentSkillDefinition[];
  getLearnings(): LearningsConfig;
  addLearning(content: string): LearningsConfig;
  removeLearnings(indexes: number[]): LearningsConfig;
  getSettings(): SettingsConfig;
  updateSettings(updates: Partial<SettingsConfig>): SettingsConfig;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let agentCounter = 0;

export const createShiftStore = (): ShiftStore => {
  let models: ModelsConfig = { models: [], config: {}, customModelKeys: [] };
  let agents: CustomAgent[] = [];
  const skills: AgentSkillDefinition[] = [];
  let learnings: LearningsConfig = clone(defaultLearningsConfig);
  let settings: SettingsConfig = clone(defaultSettingsConfig);

  return {
    getModels: () => clone(models),
    setModels: (config) => {
      models = clone(config);
      return clone(models);
    },
    addModel: (model) => {
      models = { ...models, models: [...models.models, clone(model)] };
      return clone(model);
    },
    removeModel: (modelKey) => {
      const before = models.models.length;
      models = {
        ...models,
        models: models.models.filter((model) => model.id !== modelKey),
        customModelKeys: models.customModelKeys.filter(
          (key) => key !== modelKey,
        ),
      };
      return models.models.length < before;
    },
    listAgents: () => clone(agents),
    createAgent: (agent) => {
      const created: CustomAgent = {
        id: `agent-${Date.now()}-${++agentCounter}`,
        ...agent,
      };
      agents = [...agents, created];
      return clone(created);
    },
    updateAgent: (id, updates) => {
      const agent = agents.find((candidate) => candidate.id === id);
      if (agent === undefined) {
        return undefined;
      }
      const updated = { ...agent, ...updates, id: agent.id };
      agents = agents.map((candidate) =>
        candidate.id === id ? updated : candidate,
      );
      return clone(updated);
    },
    deleteAgent: (id) => {
      const before = agents.length;
      agents = agents.filter((agent) => agent.id !== id);
      return agents.length < before;
    },
    listSkills: () => clone(skills),
    getLearnings: () => clone(learnings),
    addLearning: (content) => {
      learnings = { entries: [...learnings.entries, content] };
      return clone(learnings);
    },
    removeLearnings: (indexes) => {
      learnings = {
        entries: learnings.entries.filter(
          (_, index) => !indexes.includes(index),
        ),
      };
      return clone(learnings);
    },
    getSettings: () => clone(settings),
    updateSettings: (updates) => {
      settings = { ...settings, ...updates };
      return clone(settings);
    },
  };
};
