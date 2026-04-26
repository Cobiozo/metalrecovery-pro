import { db } from "@workspace/db";
import { systemStatsTable, STAT_METRICS } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function incrementStat(metric: string, amount = 1): Promise<void> {
  const date = todayDate();
  await db
    .insert(systemStatsTable)
    .values({ date, metric, value: amount })
    .onConflictDoUpdate({
      target: [systemStatsTable.date, systemStatsTable.metric],
      set: { value: sql`${systemStatsTable.value} + ${amount}` },
    });
}

export async function getStatsLastDays(days = 30): Promise<Record<string, Record<string, number>>> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(systemStatsTable)
    .where(sql`${systemStatsTable.date} >= ${cutoffStr}`)
    .orderBy(systemStatsTable.date);

  const result: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!result[row.date]) result[row.date] = {};
    result[row.date][row.metric] = row.value;
  }
  return result;
}

export { STAT_METRICS, todayDate };
