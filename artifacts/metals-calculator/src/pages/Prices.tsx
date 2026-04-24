import { useGetMetalPrices } from "@workspace/api-client-react";
import { getGetMetalPricesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function PricesPage() {
  const queryClient = useQueryClient();
  const { data: prices, isLoading, isFetching } = useGetMetalPrices({
    query: { queryKey: getGetMetalPricesQueryKey() }
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetMetalPricesQueryKey() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight">Aktualne Kursy Metali</h1>
          <p className="text-muted-foreground text-sm mt-1">Ceny skupu z rynku globalnego (PLN/g)</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isFetching}
          className="border-border hover:bg-muted"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Odśwież
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Au', 'Ag', 'Pt', 'Pd'].map((metal) => (
          <Card key={metal} className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold font-mono text-primary">{metal}</CardTitle>
              <div className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                {metal === 'Au' ? 'Złoto' : metal === 'Ag' ? 'Srebro' : metal === 'Pt' ? 'Platyna' : 'Pallad'}
              </div>
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
          <div className="text-muted-foreground font-mono">
            Źródło: {prices ? prices.source : <Skeleton className="h-4 w-20 inline-block ml-2" />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
