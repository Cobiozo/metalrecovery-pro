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

// In-memory fast-path cache: date -> Set<IP>
const seenToday = new Map<string, Set<string>>();

function getMemSet(date: string): Set<string> {
  if (!seenToday.has(date)) {
    seenToday.clear(); // drop old-date entries
    seenToday.set(date, new Set());
  }
  return seenToday.get(date)!;
}

export async function trackUniqueVisit(ip: string): Promise<void> {
  const date = todayDate();
  const memSet = getMemSet(date);

  // Fast path: already seen this session
  if (memSet.has(ip)) return;

  // Slow path: check DB — survives server restarts
  const { db, visitLogsTable } = await import("@workspace/db");
  const { and, eq } = await import("drizzle-orm");

  const existing = await db
    .select({ id: visitLogsTable.id })
    .from(visitLogsTable)
    .where(and(eq(visitLogsTable.ip, ip), eq(visitLogsTable.date, date)))
    .limit(1);

  if (existing.length > 0) {
    memSet.add(ip); // populate cache so next call is fast
    return;
  }

  // New unique visit — insert and count
  memSet.add(ip);
  await db.insert(visitLogsTable).values({ ip, date });
  await incrementStat(STAT_METRICS.PAGE_VISITS);
}

export { STAT_METRICS, todayDate };
