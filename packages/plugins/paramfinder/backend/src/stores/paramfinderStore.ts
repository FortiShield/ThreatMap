import type { SessionDescriptor } from "../../../src/api.js";
import type { EngineConfig } from "../../../src/config-schema.js";
import type { EngineRequest } from "../../../src/types.js";

export type ParamFinderStore = {
  listSessions(): SessionDescriptor[];
  getSession(id: string): SessionDescriptor | undefined;
  createSession(target: EngineRequest, config: EngineConfig): SessionDescriptor;
  cancelSession(id: string): SessionDescriptor | undefined;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let counter = 0;

export const createParamFinderStore = (): ParamFinderStore => {
  const sessions = new Map<string, SessionDescriptor>();

  return {
    listSessions: () => [...sessions.values()].map(clone),
    getSession: (id) => {
      const session = sessions.get(id);
      return session === undefined ? undefined : clone(session);
    },
    createSession: (_target, _config) => {
      const session: SessionDescriptor = {
        id: `session-${Date.now()}-${++counter}`,
        state: "running",
        phase: "learning",
      };
      sessions.set(session.id, session);
      return clone(session);
    },
    cancelSession: (id) => {
      const session = sessions.get(id);
      if (session === undefined) {
        return undefined;
      }
      const canceled: SessionDescriptor = {
        ...session,
        state: "canceled",
      };
      sessions.set(id, canceled);
      return clone(canceled);
    },
  };
};
