import { useGetChemicalProcesses, getGetChemicalProcessesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Beaker, Thermometer, Clock, Zap, AlertTriangle } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export function ProcessesPage() {
  const { data: processes, isLoading } = useGetChemicalProcesses({
    query: { queryKey: getGetChemicalProcessesQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight">Baza Procesów Chemicznych</h1>
          <p className="text-muted-foreground text-sm mt-1">Specyfikacje techniczne procesów odzysku</p>
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sans tracking-tight">Baza Procesów Chemicznych</h1>
        <p className="text-muted-foreground text-sm mt-1">Specyfikacje techniczne procesów odzysku</p>
      </div>

      <div className="grid gap-6">
        {processes?.map((process) => (
          <Card key={process.id} className="border-border bg-card overflow-hidden">
            <div className="bg-primary/5 px-6 py-4 border-b border-border flex items-start justify-between">
              <div>
                <CardTitle className="text-xl font-bold">{process.name}</CardTitle>
                <CardDescription className="mt-1 text-sm">{process.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                {process.targetMetals.map(m => (
                  <Badge key={m} variant="outline" className="font-mono bg-background border-primary/20 text-primary">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted text-muted-foreground">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Temperatura</div>
                    <div className="font-mono text-sm font-medium">{process.temperatureMin}-{process.temperatureMax}°C (Opt: {process.temperatureOptimal}°C)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted text-muted-foreground">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Czas reakcji</div>
                    <div className="font-mono text-sm font-medium">{process.timePerKgMin}-{process.timePerKgMax} h / kg</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted text-muted-foreground">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Energia</div>
                    <div className="font-mono text-sm font-medium">{process.electricityKwhPerKg} kWh / kg</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-warning/10 text-warning">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">BHP</div>
                    <div className="text-xs font-medium text-warning truncate w-32" title={process.safetyNotes}>
                      {process.safetyNotes}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Beaker className="w-4 h-4" /> Odczynniki (na 1 kg)
                  </h4>
                  <div className="space-y-3">
                    {process.reagents.map(reagent => (
                      <div key={reagent.name} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                        <div>
                          <span className="font-medium">{reagent.name}</span>
                          <span className="text-muted-foreground ml-2 font-mono text-xs">{reagent.formula} ({reagent.concentration}%)</span>
                        </div>
                        <div className="font-mono flex items-center gap-4">
                          <span>{reagent.amountPerKg} L</span>
                          <span className="text-muted-foreground">{formatCurrency(reagent.pricePerLiter)}/L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Wydajność Odzysku</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.entries(process.yieldPercent) as [string, number][]).map(([metal, yieldVal]) => yieldVal > 0 && (
                      <div key={metal} className="flex items-center justify-between p-3 border border-border rounded-md bg-background">
                        <span className="font-bold font-mono text-lg">{metal}</span>
                        <span className="font-mono text-primary font-medium">{formatPercent(yieldVal)}</span>
                      </div>
                    ))}
                  </div>

                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-6 mb-3">Kroki Procesu</h4>
                  <ScrollArea className="h-32 rounded-md border border-border bg-muted/10 p-3">
                    <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground ml-2">
                      {process.steps.map((step, idx) => (
                        <li key={idx} className="pl-1">{step}</li>
                      ))}
                    </ol>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
