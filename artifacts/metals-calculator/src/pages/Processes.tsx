import { useState, useMemo, useRef } from "react";
import { useGetChemicalProcesses, getGetChemicalProcessesQueryKey, useGetElectronicMaterials, getGetElectronicMaterialsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beaker, Thermometer, Clock, Zap, AlertTriangle, ChevronRight, FlaskConical, Weight, Info, Microscope } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Reagent } from "@workspace/api-client-react";

const METAL_NAMES: Record<string, string> = {
  Au: "złoto",
  Ag: "srebro",
  Pt: "platyna",
  Pd: "pallad",
};

function stripStepPrefix(step: string): string {
  return step
    .replace(/^KROK\s+\d+\s*[—–-]\s*/i, "")
    .replace(/^KROK\s+\d+\s*\([^)]*\)\s*:\s*/i, "")
    .replace(/^KROK\s+\d+\s*:\s*/i, "")
    .trim();
}

function getEffectiveConc(reagent: Reagent, overrides: Record<string, number>): number {
  return overrides[reagent.name] ?? reagent.concentration;
}

function getAdjustedAmount(reagent: Reagent, batchKg: number, overrides: Record<string, number>): number {
  const effConc = getEffectiveConc(reagent, overrides);
  return reagent.amountPerKg * (reagent.concentration / effConc) * batchKg;
}

function getAdjustedPricePerL(reagent: Reagent, overrides: Record<string, number>): number {
  const effConc = getEffectiveConc(reagent, overrides);
  return reagent.pricePerLiter * (effConc / reagent.concentration);
}

const CATEGORY_LABELS: Record<string, string> = {
  plyty_glowne: "Płyty główne",
  procesor: "Procesory",
  pamiec: "Pamięci RAM",
  karta: "Karty graficzne/dźwiękowe",
  dysk: "Dyski i napędy",
  urzadzenie: "Urządzenia kompletne",
  inne: "Inne / Mieszane",
};

const CATEGORY_ORDER = ["plyty_glowne", "procesor", "pamiec", "karta", "dysk", "urzadzenie", "inne"];

export function ProcessesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [batchKg, setBatchKg] = useState<number>(1);
  const [concentrationOverrides, setConcentrationOverrides] = useState<Record<string, number>>({});
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');

  const { data: processes, isLoading } = useGetChemicalProcesses({
    query: { queryKey: getGetChemicalProcessesQueryKey() }
  });

  const { data: materialsRaw } = useGetElectronicMaterials({
    query: { queryKey: getGetElectronicMaterialsQueryKey() }
  });

  // Keep a stable reference to materials — avoids flicker when React Query briefly
  // returns undefined during background re-fetch, which caused selectedMaterial to
  // become null and estimatedRecovery to disappear / not update on material change.
  const materialsRef = useRef(materialsRaw);
  if (materialsRaw) materialsRef.current = materialsRaw;
  const materials = materialsRef.current;

  const selectedProcess = useMemo(
    () => selectedId
      ? processes?.find(p => p.id === selectedId) ?? processes?.[0]
      : processes?.[0],
    [selectedId, processes]
  );

  const selectedMaterial = useMemo(
    () => selectedMaterialId && materials
      ? materials.find(m => m.id === selectedMaterialId) ?? null
      : null,
    [selectedMaterialId, materials]
  );

  const totalReagentCost = useMemo(
    () => selectedProcess
      ? selectedProcess.reagents.reduce((sum, r) => {
          const amt = getAdjustedAmount(r, batchKg, concentrationOverrides);
          const price = getAdjustedPricePerL(r, concentrationOverrides);
          return sum + amt * price;
        }, 0)
      : 0,
    [selectedProcess, batchKg, concentrationOverrides]
  );

  const estimatedRecovery = useMemo(
    () => selectedMaterial && selectedProcess
      ? {
          Au: selectedMaterial.metalContentPerKg.Au.typical * batchKg * selectedProcess.yieldPercent.Au / 100,
          Ag: selectedMaterial.metalContentPerKg.Ag.typical * batchKg * selectedProcess.yieldPercent.Ag / 100,
          Pt: selectedMaterial.metalContentPerKg.Pt.typical * batchKg * selectedProcess.yieldPercent.Pt / 100,
          Pd: selectedMaterial.metalContentPerKg.Pd.typical * batchKg * selectedProcess.yieldPercent.Pd / 100,
        }
      : null,
    [selectedMaterial, selectedProcess, batchKg]
  );

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
        <div className="flex gap-2 items-start bg-amber-500/5 border border-amber-500/20 rounded-md p-3 mt-3">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-amber-400">Wartości szacunkowe.</strong> Ilości odczynników, czasy procesów i wydajność odzysku są podane orientacyjnie — zależą od konkretnego materiału, stężeń kwasów, temperatury oraz warunków laboratoryjnych. Dane mają charakter wyłącznie informacyjny i edukacyjny.
          </p>
        </div>
      </div>

      <div className="flex gap-1 lg:hidden overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {processes?.map((process) => {
          const isSelected = (selectedId ?? processes[0]?.id) === process.id;
          return (
            <button
              key={process.id}
              onClick={() => { setSelectedId(process.id); setConcentrationOverrides({}); }}
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
                onClick={() => { setSelectedId(process.id); setConcentrationOverrides({}); }}
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

              {(selectedProcess as any).outputPurityText && (
                <div className="flex items-start gap-2 mt-2 bg-emerald-500/5 border border-emerald-500/20 rounded-md p-2.5">
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                    <FlaskConical className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Szacunkowa próba po odzysku</div>
                    <div className="text-xs text-emerald-400 leading-snug">{(selectedProcess as any).outputPurityText}</div>
                  </div>
                </div>
              )}
            </div>

            <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Beaker className="w-3.5 h-3.5" /> Odczynniki
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <Weight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Waga materiału:</span>
                    <div className="flex items-center border border-border rounded overflow-hidden">
                      <button
                        onClick={() => setBatchKg(v => Math.max(0.1, Math.round((v - 0.5) * 10) / 10))}
                        className="px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >−</button>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={batchKg}
                        onChange={e => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v) && v > 0) setBatchKg(Math.round(v * 10) / 10);
                        }}
                        className="w-12 text-center text-xs font-mono bg-background py-0.5 focus:outline-none"
                      />
                      <span className="text-[10px] text-muted-foreground pr-1.5">kg</span>
                      <button
                        onClick={() => setBatchKg(v => Math.round((v + 0.5) * 10) / 10)}
                        className="px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-l border-border transition-colors"
                      >+</button>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Microscope className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Materiał wsadu (opcjonalnie)</span>
                  </div>
                  <select
                    value={selectedMaterialId}
                    onChange={e => {
                      const id = e.currentTarget.value;
                      setSelectedMaterialId(id);
                    }}
                    className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="">— wybierz materiał aby zobaczyć szacunkowy odzysk —</option>
                    {CATEGORY_ORDER.map(cat => {
                      const mats = materials?.filter(m => m.category === cat) ?? [];
                      if (!mats.length) return null;
                      return (
                        <optgroup key={cat} label={CATEGORY_LABELS[cat] ?? cat}>
                          {mats.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-1.5">
                  {selectedProcess.reagents.map(reagent => {
                    const effConc = getEffectiveConc(reagent, concentrationOverrides);
                    const totalAmount = getAdjustedAmount(reagent, batchKg, concentrationOverrides);
                    const adjPricePerL = getAdjustedPricePerL(reagent, concentrationOverrides);
                    const totalCost = totalAmount * adjPricePerL;
                    const hasOptions = reagent.availableConcentrations && reagent.availableConcentrations.length > 1;
                    const concChanged = effConc !== reagent.concentration;

                    return (
                      <div key={reagent.name} className={cn(
                        "bg-muted/30 px-3 py-2 rounded",
                        concChanged && "ring-1 ring-primary/20"
                      )}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-xs block leading-tight">{reagent.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-muted-foreground font-mono text-[10px]">
                                {reagent.formula}
                              </span>
                              {hasOptions ? (
                                <select
                                  value={effConc}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setConcentrationOverrides(prev => ({ ...prev, [reagent.name]: val }));
                                  }}
                                  className="text-[10px] font-mono bg-muted border border-border rounded px-1 py-0 text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50"
                                >
                                  {reagent.availableConcentrations!.map(c => (
                                    <option key={c} value={c}>{c}%</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-muted-foreground font-mono text-[10px]">{reagent.concentration}%</span>
                              )}
                              <span className="text-muted-foreground font-mono text-[10px]">·</span>
                              <span className="text-muted-foreground font-mono text-[10px]">{formatCurrency(adjPricePerL)}/L</span>
                            </div>
                          </div>
                          <div className="font-mono text-xs text-right shrink-0">
                            <div className="font-medium">{totalAmount.toFixed(2)} L</div>
                            <div className="text-muted-foreground text-[10px]">{formatCurrency(totalCost)}</div>
                          </div>
                        </div>
                        {concChanged && (
                          <div className="mt-1 text-[9px] text-primary/70 leading-tight">
                            Przeliczono z {reagent.concentration}%: {(reagent.amountPerKg * batchKg).toFixed(2)} L → {totalAmount.toFixed(2)} L (wyższe stęż. = mniej obj.)
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between px-3 py-1.5 border border-primary/20 rounded bg-primary/5">
                    <span className="text-xs font-bold text-primary">Razem odczynniki ({batchKg} kg)</span>
                    <span className="font-mono text-sm font-bold text-primary">{formatCurrency(totalReagentCost)}</span>
                  </div>
                  {Object.keys(concentrationOverrides).length > 0 && (
                    <button
                      onClick={() => setConcentrationOverrides({})}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 w-full text-right"
                    >
                      Przywróć domyślne stężenia
                    </button>
                  )}
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

                {estimatedRecovery && selectedMaterial && (
                  <div key={selectedMaterialId} className="mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Microscope className="w-3 h-3" />
                      Szac. odzysk: {selectedMaterial.name} × {batchKg} kg
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["Au", "Ag", "Pt", "Pd"] as const).map(metal => {
                        const grams = estimatedRecovery[metal];
                        const inputGrams = selectedMaterial.metalContentPerKg[metal].typical * batchKg;
                        const yield_ = selectedProcess.yieldPercent[metal];
                        if (inputGrams < 0.0001) return null;
                        return (
                          <div key={metal} className="px-2 py-1.5 rounded-md bg-primary/5 border border-primary/10">
                            <div className="flex items-baseline gap-1 justify-between">
                              <span className="font-bold font-mono text-xs text-primary">{metal}</span>
                              <span className="font-mono text-xs font-medium">{grams >= 0.001 ? grams.toFixed(3) : '<0.001'} g</span>
                            </div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">
                              z {inputGrams.toFixed(3)} g × {yield_}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1.5 italic">*Szacunek dla wartości typowych — rzeczywisty odzysk może się różnić</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Kroki procesu</h4>
                <ol className="space-y-1.5">
                  {selectedProcess.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-muted-foreground leading-snug text-xs">{stripStepPrefix(step)}</span>
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
