import { pgTable, text, real, timestamp, unique } from "drizzle-orm/pg-core";

export const metalPriceHistoryTable = pgTable(
  "metal_price_history",
  {
    date: text("date").notNull(),
    au: real("au").notNull(),
    ag: real("ag").notNull(),
    pt: real("pt").notNull(),
    pd: real("pd").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  },
  (table) => [unique("metal_price_history_date_unique").on(table.date)],
);

export type MetalPriceHistoryRow = typeof metalPriceHistoryTable.$inferSelect;
export type InsertMetalPriceHistory = typeof metalPriceHistoryTable.$inferInsert;
