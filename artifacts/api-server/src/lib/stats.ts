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

/**
 * Normalise IP address:
 * - Strips IPv6-mapped IPv4 prefix (::ffff:1.2.3.4 → 1.2.3.4)
 * - Removes surrounding brackets from IPv6 literals
 * - Falls back to "unknown"
 */
function normalizeIp(raw: string): string {
  if (!raw || raw === "unknown") return "unknown";
  let ip = raw.trim();
  // Remove surrounding IPv6 brackets (e.g. [::1] → ::1)
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  // Convert IPv4-mapped IPv6 addresses to plain IPv4
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (mapped) return mapped[1]!;
  return ip;
}

// In-memory fast-path cache: date -> Set<IP>
const seenToday = new Map<string, Set<string>>();

// In-flight set: IPs currently being processed — prevents concurrent race condition
const inFlight = new Set<string>();

function getMemSet(date: string): Set<string> {
  if (!seenToday.has(date)) {
    seenToday.clear(); // drop old-date entries
    seenToday.set(date, new Set());
  }
  return seenToday.get(date)!;
}

export async function trackUniqueVisit(rawIp: string): Promise<void> {
  const ip = normalizeIp(rawIp);
  const date = todayDate();
  const memSet = getMemSet(date);

  // Fast path: already seen this session
  if (memSet.has(ip)) return;

  // Prevent race condition: if another async call for the same IP is in progress, skip
  const inflightKey = `${date}:${ip}`;
  if (inFlight.has(inflightKey)) return;
  inFlight.add(inflightKey);

  try {
    // Reserve spot in memory immediately to block other concurrent calls
    memSet.add(ip);

    // Slow path: upsert into DB — ON CONFLICT DO NOTHING handles any remaining races
    const { db, visitLogsTable } = await import("@workspace/db");
    const { sql } = await import("drizzle-orm");

    const inserted = await db
      .insert(visitLogsTable)
      .values({ ip, date })
      .onConflictDoNothing()
      .returning({ id: visitLogsTable.id });

    // Only increment counter if we actually inserted a new row
    if (inserted.length > 0) {
      await incrementStat(STAT_METRICS.PAGE_VISITS);
    }
  } finally {
    inFlight.delete(inflightKey);
  }
}

export { STAT_METRICS, todayDate };
