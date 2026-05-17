import {
  pgTable,
  text,
  timestamp,
  integer,
  pgEnum,
  uniqueIndex,
  primaryKey,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import { sql } from "drizzle-orm";

// ---------- Auth.js standard tables ----------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

// ---------- Project tables ----------

export const llmProvider = pgEnum("llm_provider", [
  "anthropic",
  "openai",
  "google",
  "ollama",
]);

export const runStatus = pgEnum("run_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);

export const runEventType = pgEnum("run_event_type", [
  "text",
  "tool_call",
  "tool_result",
  "error",
]);

export const providerKeys = pgTable(
  "provider_key",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: llmProvider("provider").notNull(),
    encryptedKey: text("encrypted_key").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("provider_key_user_provider_idx").on(table.userId, table.provider)],
);

export type AgentGraph = {
  nodes: Array<{
    id: string;
    type: "llm" | "tool" | "input" | "output";
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }>;
};

export type AgentSpec = {
  systemPrompt: string;
  tools: Array<"http_fetch" | "web_search" | "calculator">;
  summary: string;
};

export const EMPTY_SPEC: AgentSpec = {
  systemPrompt: "You are a helpful assistant.",
  tools: [],
  summary: "A blank agent — describe what you want it to do in the chat.",
};

export const agents = pgTable(
  "agent",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    spec: jsonb("spec").$type<AgentSpec>().notNull().default(EMPTY_SPEC),
    graph: jsonb("graph").$type<AgentGraph>().notNull().default({ nodes: [], edges: [] }),
    // Public sharing — when isPublic=true, anyone with the shareToken can chat
    // with the agent at /a/[shareToken]/chat without auth.
    isPublic: boolean("is_public").notNull().default(false),
    shareToken: text("share_token"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("agent_share_token_idx").on(table.shareToken)],
);

export const buildMessageRole = pgEnum("build_message_role", ["user", "assistant"]);

export const buildMessages = pgTable("build_message", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  role: buildMessageRole("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const runs = pgTable("run", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: runStatus("status").notNull().default("pending"),
  input: jsonb("input").notNull(),
  error: text("error"),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
});

export const runEvents = pgTable("run_event", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id, { onDelete: "cascade" }),
  seq: integer("seq").notNull(),
  type: runEventType("type").notNull(),
  payload: jsonb("payload").notNull(),
  ts: timestamp("ts").notNull().defaultNow(),
});
