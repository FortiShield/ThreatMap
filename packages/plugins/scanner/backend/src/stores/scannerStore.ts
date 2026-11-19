import { type CheckMetadata } from "../../../src/check.js";
import type { GetChecksOptions, UserConfig } from "../../../src/config.js";
import type { QueueTask } from "../../../src/queue.js";
import type { InterruptReason } from "../../../src/scan.js";
import type { ScanRequestPayload, Session } from "../../../src/session.js";

export type ScannerStore = {
  listChecks(options?: GetChecksOptions): CheckMetadata[];
  getUserConfig(): UserConfig | undefined;
  updateUserConfig(config: Partial<UserConfig>): UserConfig | undefined;
  listQueueTasks(): QueueTask[];
  getQueueTask(id: string): QueueTask | undefined;
  clearQueueTasks(): void;
  createSession(payload: ScanRequestPayload): Session;
  getSession(id: string): Session | undefined;
  listSessions(): Session[];
  updateSession(id: string, updates: Partial<Session>): Session | undefined;
  deleteSession(id: string): boolean;
  interruptSession(id: string, reason: InterruptReason): Session | undefined;
  registerCheck(check: CheckMetadata): void;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let sessionCounter = 0;

export const createScannerStore = (): ScannerStore => {
  let checks: CheckMetadata[] = [];
  let userConfig: UserConfig | undefined;
  let queueTasks: QueueTask[] = [];
  let sessions: Session[] = [];

  return {
    listChecks: (_options) => clone(checks),
    getUserConfig: () =>
      userConfig === undefined ? undefined : clone(userConfig),
    updateUserConfig: (updates) => {
      userConfig =
        userConfig === undefined
          ? undefined
          : ({ ...userConfig, ...updates } as UserConfig);
      return userConfig === undefined ? undefined : clone(userConfig);
    },
    listQueueTasks: () => clone(queueTasks),
    getQueueTask: (id) => {
      const task = queueTasks.find((candidate) => candidate.id === id);
      return task === undefined ? undefined : clone(task);
    },
    clearQueueTasks: () => {
      queueTasks = [];
    },
    createSession: (payload) => {
      const session: Session = {
        kind: "Running",
        id: `session-${Date.now()}-${++sessionCounter}`,
        title: payload.title,
        createdAt: Date.now(),
        startedAt: Date.now(),
        progress: {
          checksTotal: 0,
          checksHistory: [],
        },
        requestIDs: payload.requestIDs,
        scanConfig: payload.scanConfig,
      };
      sessions = [...sessions, session];
      return clone(session);
    },
    getSession: (id) => {
      const session = sessions.find((candidate) => candidate.id === id);
      return session === undefined ? undefined : clone(session);
    },
    listSessions: () => clone(sessions),
    updateSession: (id, updates) => {
      const session = sessions.find((candidate) => candidate.id === id);
      if (session === undefined) {
        return undefined;
      }
      const updated = { ...session, ...updates, id: session.id } as Session;
      sessions = sessions.map((candidate) =>
        candidate.id === id ? updated : candidate,
      );
      return clone(updated);
    },
    deleteSession: (id) => {
      const before = sessions.length;
      sessions = sessions.filter((session) => session.id !== id);
      return sessions.length < before;
    },
    interruptSession: (id, reason) => {
      const session = sessions.find((candidate) => candidate.id === id);
      if (session === undefined) {
        return undefined;
      }
      const interrupted: Session =
        session.kind === "Pending"
          ? {
              kind: "Interrupted",
              id: session.id,
              title: session.title,
              createdAt: session.createdAt,
              startedAt: Date.now(),
              progress: { checksTotal: 0, checksHistory: [] },
              reason,
              hasExecutionTrace: false,
              requestIDs: session.requestIDs,
              scanConfig: session.scanConfig,
            }
          : {
              kind: "Interrupted",
              id: session.id,
              title: session.title,
              createdAt: session.createdAt,
              startedAt:
                session.kind === "Running" ? session.startedAt : Date.now(),
              progress:
                session.kind === "Running"
                  ? session.progress
                  : { checksTotal: 0, checksHistory: [] },
              reason,
              hasExecutionTrace: false,
              requestIDs: session.requestIDs,
              scanConfig: session.scanConfig,
            };
      sessions = sessions.map((candidate) =>
        candidate.id === id ? interrupted : candidate,
      );
      return clone(interrupted);
    },
    registerCheck: (check) => {
      checks = [...checks, clone(check)];
    },
  };
};
