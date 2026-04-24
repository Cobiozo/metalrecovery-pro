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

export function PricesPage() {
  const { data: prices, isLoading } = useGetMetalPrices({
    query: { queryKey: getGetMetalPricesQueryKey() }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sans tracking-tight">Aktualne Kursy Metali</h1>
        <p className="text-muted-foreground text-sm mt-1">Ceny skupu z rynku globalnego (PLN/g) · aktualizacja raz na 24h</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Au', 'Ag', 'Pt', 'Pd'].map((metal) => (
          <Card key={metal} className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold font-mono text-primary flex items-baseline gap-1.5">
                {metal}
                <span className="text-sm font-normal text-muted-foreground">({METAL_NAMES[metal]})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold tracking-tight">
                  {prices ? formatCurrency(prices[metal as keyof typeof prices] as number) : '-'}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">za 1 gram</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50 border-border">
        <CardContent className="p-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            Ostatnia aktualizacja: {prices ? new Date(prices.updatedAt).toLocaleString('pl-PL') : <Skeleton className="h-4 w-32 inline-block ml-2" />}
          </div>
          <div className="text-muted-foreground font-mono text-xs">
            Źródło: {prices ? prices.source : <Skeleton className="h-4 w-20 inline-block ml-2" />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
