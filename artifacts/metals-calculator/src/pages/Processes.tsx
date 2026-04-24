import { useState } from "react";
import { useGetChemicalProcesses, getGetChemicalProcessesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beaker, Thermometer, Clock, Zap, AlertTriangle, ChevronRight } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const METAL_NAMES: Record<string, string> = {
  Au: "złoto",
  Ag: "srebro",
  Pt: "platyna",
  Pd: "pallad",
};

export function ProcessesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: processes, isLoading } = useGetChemicalProcesses({
    query: { queryKey: getGetChemicalProcessesQueryKey() }
  });

  const selectedProcess = selectedId
    ? processes?.find(p => p.id === selectedId) ?? processes?.[0]
    : processes?.[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight">Baza Procesów Chemicznych</h1>
          <p className="text-muted-foreground text-sm mt-1">Specyfikacje techniczne procesów odzysku</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-32 shrink-0 rounded-md" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">Baza Procesów Chemicznych</h1>
        <p className="text-muted-foreground text-sm mt-1">Specyfikacje techniczne procesów odzysku</p>
      </div>

      <div className="flex gap-1 lg:hidden overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {processes?.map((process) => {
          const isSelected = (selectedId ?? processes[0]?.id) === process.id;
          return (
            <button
              key={process.id}
              onClick={() => setSelectedId(process.id)}
              className={cn(
                "shrink-0 snap-start px-3 py-2 rounded-md border text-left transition-colors",
                isSelected
                  ? "bg-primary/10 border-primary/30 text-foreground"
                  : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="text-xs font-semibold whitespace-nowrap">{process.name}</div>
              <div className="flex gap-1 mt-1">
                {process.targetMetals.map(m => (
                  <Badge key={m} variant="outline" className="text-[10px] px-1 py-0 font-mono border-primary/20 text-primary">
                    {m}
                  </Badge>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 items-start">
        <div className="hidden lg:flex flex-col gap-1 w-[220px] shrink-0 sticky top-4">
          {processes?.map((process) => {
            const isSelected = (selectedId ?? processes[0]?.id) === process.id;
            return (
              <button
                key={process.id}
                onClick={() => setSelectedId(process.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-md border transition-colors",
                  isSelected
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold leading-tight line-clamp-2">{process.name}</span>
                  {isSelected && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-primary" />}
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {process.targetMetals.map(m => (
                    <Badge key={m} variant="outline" className="text-[10px] px-1 py-0 font-mono border-primary/20 text-primary">
                      {m}
                    </Badge>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {selectedProcess && (
          <Card className="flex-1 min-w-0 border-border bg-card overflow-hidden">
            <div className="bg-primary/5 px-4 py-4 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <h2 className="text-base font-bold leading-tight">{selectedProcess.name}</h2>
                <div className="flex gap-1.5 flex-wrap shrink-0">
                  {selectedProcess.targetMetals.map(m => (
                    <Badge key={m} variant="outline" className="font-mono bg-background border-primary/20 text-primary text-xs">
                      {m} <span className="ml-1 font-normal text-muted-foreground text-[10px]">({METAL_NAMES[m]})</span>
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{selectedProcess.description}</p>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-full bg-muted text-muted-foreground shrink-0">
                    <Thermometer className="w-3 h-3" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Temperatura</div>
                    <div className="font-mono text-[11px] font-medium leading-tight">
                      {selectedProcess.temperatureMin}–{selectedProcess.temperatureMax}°C
                      <span className="text-muted-foreground"> (opt. {selectedProcess.temperatureOptimal}°C)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-full bg-muted text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Czas</div>
                    <div className="font-mono text-[11px] font-medium">{selectedProcess.timePerKgMin}–{selectedProcess.timePerKgMax} h/kg</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-full bg-muted text-muted-foreground shrink-0">
                    <Zap className="w-3 h-3" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Energia</div>
                    <div className="font-mono text-[11px] font-medium">{selectedProcess.electricityKwhPerKg} kWh/kg</div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 mt-3 bg-amber-500/5 border border-amber-500/20 rounded-md p-2.5">
                <div className="p-1 rounded-full bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                  <AlertTriangle className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">BHP</div>
                  <div className="text-xs text-amber-400 leading-snug">{selectedProcess.safetyNotes}</div>
                </div>
              </div>
            </div>

            <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Beaker className="w-3.5 h-3.5" /> Odczynniki (na 1 kg wsadu)
                </h4>
                <div className="space-y-1.5">
                  {selectedProcess.reagents.map(reagent => (
                    <div key={reagent.name} className="flex items-center justify-between gap-2 text-sm bg-muted/30 px-3 py-2 rounded">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-xs block leading-tight">{reagent.name}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {reagent.formula} ({reagent.concentration}%)
                        </span>
                      </div>
                      <div className="font-mono text-xs flex items-center gap-2 shrink-0">
                        <span className="font-medium whitespace-nowrap">{reagent.amountPerKg} L</span>
                        <span className="text-muted-foreground whitespace-nowrap">{formatCurrency(reagent.pricePerLiter)}/L</span>
                      </div>
                    </div>
                  ))}
                </div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">Wydajność odzysku</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.entries(selectedProcess.yieldPercent) as [string, number][]).map(([metal, yieldVal]) => yieldVal > 0 && (
                    <div key={metal} className="flex items-center justify-between px-3 py-1.5 border border-border rounded-md bg-background">
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold font-mono text-sm">{metal}</span>
                        <span className="text-[10px] text-muted-foreground">({METAL_NAMES[metal]})</span>
                      </div>
                      <span className="font-mono text-primary font-medium text-sm">{formatPercent(yieldVal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Kroki procesu</h4>
                <ol className="space-y-1.5">
                  {selectedProcess.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-muted-foreground leading-snug text-xs">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
