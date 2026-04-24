import { useState } from "react";
import { useGetMetalPrices, getGetMetalPricesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const METAL_NAMES: Record<string, string> = {
  Au: "złoto",
  Ag: "srebro",
  Pt: "platyna",
  Pd: "pallad",
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

export function PricesPage() {
  const { data: prices, isLoading } = useGetMetalPrices({
    query: { queryKey: getGetMetalPricesQueryKey() }
  });

  const [selected, setSelected] = useState<Record<string, number>>({
    Au: 999.9,
    Ag: 999,
    Pt: 950,
    Pd: 950,
  });

  const spotPrice = (metal: string): number | null => {
    if (!prices) return null;
    return prices[metal as keyof typeof prices] as number ?? null;
  };

  const calcPrice = (metal: string): number | null => {
    const spot = spotPrice(metal);
    if (spot == null) return null;
    return spot * (selected[metal] / 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sans tracking-tight">Aktualne Kursy Metali</h1>
        <p className="text-muted-foreground text-sm mt-1">Ceny skupu z rynku globalnego (PLN/g) · aktualizacja raz na 24h</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {(['Au', 'Ag', 'Pt', 'Pd'] as const).map((metal) => {
          const spot = spotPrice(metal);
          const proba = selected[metal];
          const priceAtProba = calcPrice(metal);
          const fineness = FINENESS[metal];

          return (
            <Card key={metal} className="bg-card border-border shadow-sm flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold font-mono text-primary flex items-baseline gap-1.5">
                  {metal}
                  <span className="text-sm font-normal text-muted-foreground">({METAL_NAMES[metal]})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 flex-1">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Kurs spot (999.9 / czyste)</div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-28" />
                  ) : (
                    <div className="text-2xl font-bold tracking-tight font-mono">
                      {spot != null ? formatCurrency(spot) : '—'}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">za 1 gram</div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Próba / czystość</div>
                  <select
                    value={proba}
                    onChange={e => setSelected(prev => ({ ...prev, [metal]: Number(e.target.value) }))}
                    className="w-full text-xs bg-muted border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {fineness.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Cena przy próbie {proba}</div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <div className="text-lg font-bold font-mono text-primary">
                      {priceAtProba != null ? formatCurrency(priceAtProba) : '—'}
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground">za 1 gram stopu</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50 border-border">
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0" />
          <span>Ostatnia aktualizacja: {prices
            ? new Date(prices.updatedAt).toLocaleString('pl-PL')
            : <Skeleton className="h-4 w-32 inline-block ml-1" />}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
