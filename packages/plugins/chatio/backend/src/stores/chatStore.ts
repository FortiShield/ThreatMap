import type { ChatMessage, ChatSession } from "../../../src/message.js";
import {
  DEFAULT_MODELS,
  type ModelItem,
  type ModelUserConfig,
  type Provider,
} from "../../../src/model.js";
import {
  type ChatSettings,
  DEFAULT_CHAT_SETTINGS,
} from "../../../src/settings.js";

export type ChatIoStore = {
  listSessions(): ChatSession[];
  getSession(sessionId: string): ChatSession | undefined;
  createSession(title: string, model?: string): ChatSession;
  deleteSession(sessionId: string): boolean;
  appendMessage(
    sessionId: string,
    role: ChatMessage["role"],
    text: string,
  ): ChatSession | undefined;
  listModels(): ModelItem[];
  setModelEnabled(config: ModelUserConfig): ModelItem | undefined;
  getSettings(): ChatSettings;
  updateSettings(updates: Partial<ChatSettings>): ChatSettings;
  getProviderStatuses(): { id: Provider; isConfigured: boolean }[];
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let counter = 0;
const nextId = (): string => `session-${Date.now()}-${++counter}`;

export const createChatIoStore = (): ChatIoStore => {
  let sessions: ChatSession[] = [];
  const models: ModelItem[] = clone(DEFAULT_MODELS);
  let settings: ChatSettings = clone(DEFAULT_CHAT_SETTINGS);
  const enabledProviders = new Set<string>();

  return {
    listSessions: () => clone(sessions),
    getSession: (sessionId) => {
      const session = sessions.find((candidate) => candidate.id === sessionId);
      return session === undefined ? undefined : clone(session);
    },
    createSession: (title, model) => {
      const now = new Date().toISOString();
      const session: ChatSession = {
        id: nextId(),
        title,
        model,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      sessions = [...sessions, session];
      return clone(session);
    },
    deleteSession: (sessionId) => {
      const before = sessions.length;
      sessions = sessions.filter((session) => session.id !== sessionId);
      return sessions.length < before;
    },
    appendMessage: (sessionId, role, text) => {
      const session = sessions.find((candidate) => candidate.id === sessionId);
      if (session === undefined) {
        return undefined;
      }
      session.messages.push({
        id: `message-${Date.now()}-${++counter}`,
        role,
        parts: [{ type: "text", text }],
        createdAt: new Date().toISOString(),
      });
      session.updatedAt = new Date().toISOString();
      return clone(session);
    },
    listModels: () => clone(models),
    setModelEnabled: (config) => {
      const model = models.find((candidate) => candidate.id === config.id);
      if (model === undefined) {
        return undefined;
      }
      if (config.enabled) {
        enabledProviders.add(model.provider);
      } else {
        enabledProviders.delete(model.provider);
      }
      return clone(model);
    },
    getSettings: () => clone(settings),
    updateSettings: (updates) => {
      settings = { ...settings, ...updates };
      return clone(settings);
    },
    getProviderStatuses: () => {
      const providers = new Map<string, Provider>();
      for (const model of models) {
        providers.set(model.provider, model.provider);
      }
      return [...providers.values()].map((provider) => ({
        id: provider,
        isConfigured: enabledProviders.has(provider),
      }));
    },
  };
};
