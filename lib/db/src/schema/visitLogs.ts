import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const visitLogsTable = pgTable("visit_logs", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  ip: text("ip").notNull(),
  date: text("date").notNull().default(""),
});

export type VisitLog = typeof visitLogsTable.$inferSelect;
