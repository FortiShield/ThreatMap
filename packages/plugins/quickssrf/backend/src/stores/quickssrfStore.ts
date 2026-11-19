import {
  DEFAULT_CONFIG,
  type QuickSSRFConfig,
  type UpdateConfig,
} from "../../../src/config.js";
import type { Interaction } from "../../../src/interaction.js";
import type {
  CreateProvider,
  Provider,
  UpdateProvider,
} from "../../../src/provider.js";
import { DEFAULT_PROVIDERS } from "../../../src/provider.js";
import type { Session } from "../../../src/session.js";

export type QuickSSRFStore = {
  createSession(providerId?: string): Session | undefined;
  listSessions(): Session[];
  getSession(sessionId: string): Session | undefined;
  deleteSession(sessionId: string): boolean;
  updateSession(
    sessionId: string,
    updates: Partial<Session>,
  ): Session | undefined;
  listProviders(): Provider[];
  getProvider(providerId: string): Provider | undefined;
  addProvider(input: CreateProvider): Provider;
  updateProvider(
    providerId: string,
    updates: UpdateProvider,
  ): Provider | undefined;
  deleteProvider(providerId: string): boolean;
  listInteractions(sessionId: string): Interaction[];
  deleteInteraction(sessionId: string, interactionId: string): boolean;
  clearInteractions(sessionId: string): void;
  getConfig(): QuickSSRFConfig;
  updateConfig(updates: UpdateConfig): QuickSSRFConfig;
  polling: boolean;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let sessionCounter = 0;
let providerCounter = 0;

export const createQuickSSRFStore = (): QuickSSRFStore => {
  let sessions: Session[] = [];
  let interactions: Interaction[] = [];
  let providers: Provider[] = DEFAULT_PROVIDERS.map((provider, index) => ({
    id: `provider-${index + 1}`,
    ...clone(provider),
  }));
  let config: QuickSSRFConfig = clone(DEFAULT_CONFIG);

  return {
    polling: false,
    createSession: (providerId) => {
      const provider =
        providerId !== undefined
          ? providers.find((candidate) => candidate.id === providerId)
          : providers[0];
      if (provider === undefined) {
        return undefined;
      }
      const session: Session = {
        id: `session-${Date.now()}-${++sessionCounter}`,
        providerId: provider.id,
        providerKind: provider.kind,
        title: `${provider.name} session`,
        url: provider.url,
        status: "active",
        createdAt: new Date().toISOString(),
        interactionCount: 0,
      };
      sessions = [...sessions, session];
      return clone(session);
    },
    listSessions: () => clone(sessions),
    getSession: (sessionId) => {
      const session = sessions.find((candidate) => candidate.id === sessionId);
      return session === undefined ? undefined : clone(session);
    },
    deleteSession: (sessionId) => {
      const before = sessions.length;
      sessions = sessions.filter((session) => session.id !== sessionId);
      interactions = interactions.filter(
        (interaction) => interaction.sessionId !== sessionId,
      );
      return sessions.length < before;
    },
    updateSession: (sessionId, updates) => {
      const session = sessions.find((candidate) => candidate.id === sessionId);
      if (session === undefined) {
        return undefined;
      }
      const updated = { ...session, ...updates, id: session.id };
      sessions = sessions.map((candidate) =>
        candidate.id === sessionId ? updated : candidate,
      );
      return clone(updated);
    },
    listProviders: () => clone(providers),
    getProvider: (providerId) => {
      const provider = providers.find(
        (candidate) => candidate.id === providerId,
      );
      return provider === undefined ? undefined : clone(provider);
    },
    addProvider: (input) => {
      const provider: Provider = {
        id: `provider-${Date.now()}-${++providerCounter}`,
        ...input,
      };
      providers = [...providers, provider];
      return clone(provider);
    },
    updateProvider: (providerId, updates) => {
      const provider = providers.find(
        (candidate) => candidate.id === providerId,
      );
      if (provider === undefined) {
        return undefined;
      }
      const updated = { ...provider, ...updates, id: provider.id };
      providers = providers.map((candidate) =>
        candidate.id === providerId ? updated : candidate,
      );
      return clone(updated);
    },
    deleteProvider: (providerId) => {
      const before = providers.length;
      providers = providers.filter((candidate) => candidate.id !== providerId);
      return providers.length < before;
    },
    listInteractions: (sessionId) =>
      clone(
        interactions.filter(
          (interaction) => interaction.sessionId === sessionId,
        ),
      ),
    deleteInteraction: (sessionId, interactionId) => {
      const before = interactions.length;
      interactions = interactions.filter(
        (interaction) =>
          interaction.sessionId !== sessionId ||
          interaction.id !== interactionId,
      );
      return interactions.length < before;
    },
    clearInteractions: (sessionId) => {
      interactions = interactions.filter(
        (interaction) => interaction.sessionId !== sessionId,
      );
    },
    getConfig: () => clone(config),
    updateConfig: (updates) => {
      config = { ...config, ...updates };
      return clone(config);
    },
  };
};
