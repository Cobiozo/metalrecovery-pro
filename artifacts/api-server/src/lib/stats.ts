import { STAT_METRICS } from "@workspace/db/schema";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function incrementStat(metric: string, amount = 1): Promise<void> {
  const { db, systemStatsTable } = await import("@workspace/db");
  const { sql } = await import("drizzle-orm");
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
  const { db, systemStatsTable } = await import("@workspace/db");
  const { sql } = await import("drizzle-orm");
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

// In-memory deduplication: tracks which IPs have been counted today
const seenToday = new Map<string, Set<string>>(); // date -> Set<IP>

function getSeenSet(date: string): Set<string> {
  if (!seenToday.has(date)) {
    seenToday.clear(); // discard old dates
    seenToday.set(date, new Set());
  }
  return seenToday.get(date)!;
}

export async function trackUniqueVisit(ip: string): Promise<void> {
  const date = todayDate();
  const seen = getSeenSet(date);
  if (seen.has(ip)) return; // already counted today
  seen.add(ip);
  await incrementStat(STAT_METRICS.PAGE_VISITS);
  // Log the visit with IP to the database
  const { db, visitLogsTable } = await import("@workspace/db");
  db.insert(visitLogsTable).values({ ip }).catch(() => {});
}

export { STAT_METRICS, todayDate };
