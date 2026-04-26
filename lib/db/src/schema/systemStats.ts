import { pgTable, text, integer, primaryKey } from "drizzle-orm/pg-core";

export const systemStatsTable = pgTable(
  "system_stats",
  {
    date: text("date").notNull(),
    metric: text("metric").notNull(),
    value: integer("value").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.date, t.metric] })],
);

export type SystemStat = typeof systemStatsTable.$inferSelect;

export const STAT_METRICS = {
  PAGE_VISITS: "page_visits",
  AI_ANALYSES: "ai_analyses",
  UNIQUE_USERS: "unique_users",
} as const;
