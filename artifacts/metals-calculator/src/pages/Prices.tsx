import { useState } from "react";
import {
  useGetMetalPrices,
  getGetMetalPricesQueryKey,
  useGetMetalPricesHistory,
  getGetMetalPricesHistoryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const METAL_NAMES: Record<string, string> = {
  Au: "złoto",
  Ag: "srebro",
  Pt: "platyna",
  Pd: "pallad",
};

const METAL_COLORS: Record<string, string> = {
  Au: "#F59E0B",
  Ag: "#94A3B8",
  Pt: "#60A5FA",
  Pd: "#A78BFA",
};

const FINENESS: Record<string, { label: string; value: number }[]> = {
  Au: [
    { label: "999.9 (24K — czyste)", value: 999.9 },
    { label: "999 (24K — inwestycyjne)", value: 999 },
    { label: "750 (18K — jubilerskie)", value: 750 },
    { label: "585 (14K — popularne)", value: 585 },
    { label: "375 (9K)", value: 375 },
    { label: "333 (8K)", value: 333 },
  ],
  Ag: [
    { label: "999 (czyste)", value: 999 },
    { label: "925 (sterling)", value: 925 },
    { label: "800 (stare srebro)", value: 800 },
    { label: "500 (50%)", value: 500 },
  ],
  Pt: [
    { label: "950 (jubilerskie)", value: 950 },
    { label: "850 (techniczne)", value: 850 },
    { label: "750 (stop)", value: 750 },
  ],
  Pd: [
    { label: "950 (katalityczne)", value: 950 },
    { label: "500 (stop)", value: 500 },
  ],
};

type HistoryRange = "7d" | "30d" | "90d" | "365d";

const RANGE_LABELS: Record<HistoryRange, string> = {
  "7d": "7 dni",
  "30d": "30 dni",
  "90d": "90 dni",
  "365d": "1 rok",
};

const ALL_METALS = ["Au", "Ag", "Pt", "Pd"] as const;

function formatDateLabel(dateStr: string, range: HistoryRange): string {
  const date = new Date(dateStr + "T12:00:00");
  if (range === "365d") {
    return date.toLocaleDateString("pl-PL", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("pl-PL", { month: "short", day: "numeric" });
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-md p-3 shadow-lg text-sm">
      <div className="text-muted-foreground text-xs mb-2">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-mono font-bold" style={{ color: entry.color }}>
            {entry.name}
          </span>
          <span className="font-mono text-foreground ml-auto pl-3">
            {formatCurrency(entry.value)}/g
          </span>
        </div>
      ))}
    </div>
  );
}

export function PricesPage() {
  const { data: prices, isLoading } = useGetMetalPrices({
    query: { queryKey: getGetMetalPricesQueryKey() },
  });

  const [selected, setSelected] = useState<Record<string, number>>({
    Au: 999.9,
    Ag: 999,
    Pt: 950,
    Pd: 950,
  });

  const [range, setRange] = useState<HistoryRange>("30d");
  const [visibleMetals, setVisibleMetals] = useState<Set<string>>(
    new Set(["Au"])
  );

  const { data: history, isLoading: historyLoading } = useGetMetalPricesHistory(
    { range },
    { query: { queryKey: [...getGetMetalPricesHistoryQueryKey({ range }), range] } }
  );

  const spotPrice = (metal: string): number | null => {
    if (!prices) return null;
    return (prices[metal as keyof typeof prices] as number) ?? null;
  };

  const calcPrice = (metal: string): number | null => {
    const spot = spotPrice(metal);
    if (spot == null) return null;
    return spot * (selected[metal] / 1000);
  };

  const toggleMetal = (metal: string) => {
    setVisibleMetals((prev) => {
      const next = new Set(prev);
      if (next.has(metal)) {
        if (next.size > 1) next.delete(metal);
      } else {
        next.add(metal);
      }
      return next;
    });
  };

  const chartData =
    history?.map((point) => ({
      date: formatDateLabel(point.date, range),
      rawDate: point.date,
      Au: point.Au,
      Ag: point.Ag,
      Pt: point.Pt,
      Pd: point.Pd,
    })) ?? [];

  const computeYDomain = (): [number, number] => {
    if (chartData.length === 0) return [0, 1000];
    let min = Infinity;
    let max = -Infinity;
    for (const point of chartData) {
      for (const metal of ALL_METALS) {
        if (visibleMetals.has(metal)) {
          const v = point[metal];
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
    const padding = (max - min) * 0.1;
    return [Math.max(0, Math.floor((min - padding) / 10) * 10), Math.ceil((max + padding) / 10) * 10];
  };

  const yDomain = computeYDomain();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sans tracking-tight">
          Aktualne Kursy Metali
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ceny skupu z rynku globalnego (PLN/g) · aktualizacja raz na 24h
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {(["Au", "Ag", "Pt", "Pd"] as const).map((metal) => {
          const spot = spotPrice(metal);
          const proba = selected[metal];
          const priceAtProba = calcPrice(metal);
          const fineness = FINENESS[metal];

          return (
            <Card
              key={metal}
              className="bg-card border-border shadow-sm flex flex-col"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold font-mono text-primary flex items-baseline gap-1.5">
                  {metal}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({METAL_NAMES[metal]})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 flex-1">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Kurs spot (999.9 / czyste)
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-28" />
                  ) : (
                    <div className="text-2xl font-bold tracking-tight font-mono">
                      {spot != null ? formatCurrency(spot) : "—"}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">za 1 gram</div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                    Próba / czystość
                  </div>
                  <select
                    value={proba}
                    onChange={(e) =>
                      setSelected((prev) => ({
                        ...prev,
                        [metal]: Number(e.target.value),
                      }))
                    }
                    className="w-full text-xs bg-muted border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {fineness.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Cena przy próbie {proba}
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <div className="text-lg font-bold font-mono text-primary">
                      {priceAtProba != null ? formatCurrency(priceAtProba) : "—"}
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground">
                    za 1 gram stopu
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="w-4 h-4 text-primary" />
              Historia cen (PLN/g)
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded-md border border-border overflow-hidden">
                {(Object.keys(RANGE_LABELS) as HistoryRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    aria-pressed={range === r}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      range === r
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {RANGE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            {ALL_METALS.map((metal) => (
              <button
                key={metal}
                onClick={() => toggleMetal(metal)}
                aria-pressed={visibleMetals.has(metal)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  visibleMetals.has(metal)
                    ? "border-transparent text-white"
                    : "border-border bg-transparent text-muted-foreground"
                }`}
                style={
                  visibleMetals.has(metal)
                    ? { backgroundColor: METAL_COLORS[metal] }
                    : {}
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: visibleMetals.has(metal) ? "white" : METAL_COLORS[metal] }}
                />
                {metal} ({METAL_NAMES[metal]})
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {historyLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm">Pobieranie danych historycznych…</span>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Brak danych historycznych dla wybranego zakresu
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={yDomain}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}`}
                    width={48}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  {ALL_METALS.filter((m) => visibleMetals.has(m)).map((metal) => (
                    <Line
                      key={metal}
                      type="monotone"
                      dataKey={metal}
                      name={metal}
                      stroke={METAL_COLORS[metal]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-2">
            Au: dane NBP (Narodowy Bank Polski). Ag, Pt, Pd: szacunki na podstawie kursu złota i aktualnych proporcji rynkowych.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-muted/50 border-border">
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            Ostatnia aktualizacja:{" "}
            {prices ? (
              new Date(prices.updatedAt).toLocaleString("pl-PL")
            ) : (
              <Skeleton className="h-4 w-32 inline-block ml-1" />
            )}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
