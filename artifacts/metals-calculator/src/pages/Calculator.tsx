import { useState, useEffect } from "react";
import { useGetElectronicMaterials, getGetElectronicMaterialsQueryKey, useGetChemicalProcesses, getGetChemicalProcessesQueryKey, useCalculateRecovery, CalculationResult } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle, Save, History, X } from "lucide-react";
import { formatCurrency, formatMass, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

type BatchItemState = {
  id: string;
  materialId: string;
  quantity: number;
  unitOverride?: 'kg' | 'piece';
};

type SavedSession = {
  id: string;
  name: string;
  savedAt: string;
  batchItems: BatchItemState[];
  selectedProcessId: string;
  processParams: ProcessParams;
  result: CalculationResult;
};

type ProcessParams = {
  acidConcentrationOverride: number | null;
  temperatureOverride: number | null;
  electricityPricePerKwh: number;
};

const SESSIONS_KEY = "metalrecovery_sessions";
const REAGENT_PRICES_KEY = "metalrecovery_reagent_prices";
const MAX_SESSIONS = 10;

function loadSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedSession[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: SavedSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
}

function loadReagentPrices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(REAGENT_PRICES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function saveReagentPrices(prices: Record<string, number>): void {
  localStorage.setItem(REAGENT_PRICES_KEY, JSON.stringify(prices));
}

const CATEGORY_LABELS: Record<string, string> = {
  plyty_glowne: "Płyty główne",
  pcb: "Płytki PCB",
  procesor: "Procesory",
  pamiec: "Pamięci RAM",
  karta: "Karty graficzne / dźwiękowe",
  dysk: "Dyski i napędy",
  urzadzenie: "Urządzenia kompletne",
  zasilacz: "Zasilacze i ładowarki",
  ic: "Układy scalone IC",
  zlacza: "Złącza",
  kondensator: "Kondensatory",
  inne: "Inne",
};

const CATEGORY_ORDER = [
  "plyty_glowne", "pcb", "procesor", "pamiec", "karta",
  "dysk", "urzadzenie", "zasilacz", "ic", "zlacza", "kondensator", "inne",
];

export function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<string>("wsad");
  const [batchItems, setBatchItems] = useState<BatchItemState[]>([{ id: '1', materialId: '', quantity: 1 }]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [processParams, setProcessParams] = useState<ProcessParams>({
    acidConcentrationOverride: null,
    temperatureOverride: null,
    electricityPricePerKwh: 0.8,
  });
  const [reagentPriceOverrides, setReagentPriceOverrides] = useState<Record<string, number>>(loadReagentPrices);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(loadSessions);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const { data: materials, isLoading: materialsLoading } = useGetElectronicMaterials({
    query: { queryKey: getGetElectronicMaterialsQueryKey() }
  });

  const { data: processes, isLoading: processesLoading } = useGetChemicalProcesses({
    query: { queryKey: getGetChemicalProcessesQueryKey() }
  });

  const selectedProcess = processes?.find(p => p.id === selectedProcessId);

  useEffect(() => {
    if (selectedProcess) {
      setProcessParams(prev => ({
        ...prev,
        temperatureOverride: selectedProcess.temperatureOptimal ?? null,
        acidConcentrationOverride: selectedProcess.reagents?.[0]?.concentration ?? null,
      }));
    }
  }, [selectedProcessId]);

  const calculateMutation = useCalculateRecovery({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        setActiveTab("wyniki");
      }
    }
  });

  const handleAddBatchItem = () => {
    setBatchItems([...batchItems, { id: Math.random().toString(), materialId: '', quantity: 1 }]);
  };

  const handleBatchUnitToggle = (id: string) => {
    setBatchItems(batchItems.map(item => {
      if (item.id !== id) return item;
      const material = materials?.find(m => m.id === item.materialId);
      const defaultUnit = material?.unit === 'piece' ? 'piece' : 'kg';
      const current = item.unitOverride ?? defaultUnit;
      return { ...item, unitOverride: current === 'kg' ? 'piece' : 'kg' };
    }));
  };

  const handleRemoveBatchItem = (id: string) => {
    if (batchItems.length > 1) {
      setBatchItems(batchItems.filter(item => item.id !== id));
    }
  };

  const handleBatchMaterialChange = (id: string, value: string) => {
    setBatchItems(batchItems.map(item => item.id === id ? { ...item, materialId: value } : item));
  };

  const handleBatchQuantityChange = (id: string, value: number) => {
    setBatchItems(batchItems.map(item => item.id === id ? { ...item, quantity: value } : item));
  };

  const handleReagentPriceChange = (name: string, value: number) => {
    const updated = { ...reagentPriceOverrides, [name]: value };
    setReagentPriceOverrides(updated);
    saveReagentPrices(updated);
  };

  const handleCalculate = () => {
    if (!selectedProcessId || batchItems.some(i => !i.materialId || i.quantity <= 0)) return;

    const requestData: Parameters<typeof calculateMutation.mutate>[0]['data'] = {
      batch: batchItems.map(item => {
        const material = materials?.find(m => m.id === item.materialId);
        const nativeUnit = material?.unit === 'piece' ? 'piece' : 'kg';
        const effectiveUnit = getEffectiveUnit(item);
        let quantity = item.quantity;
        if (effectiveUnit === 'piece' && nativeUnit === 'kg') {
          quantity = item.quantity * getWeightPerPiece(item);
        } else if (effectiveUnit === 'kg' && nativeUnit === 'piece') {
          const wpp = getWeightPerPiece(item);
          quantity = wpp > 0 ? Math.round(item.quantity / wpp) : item.quantity;
        }
        return { materialId: item.materialId, quantity };
      }),
      processId: selectedProcessId,
      electricityPricePerKwh: processParams.electricityPricePerKwh,
    };

    if (processParams.acidConcentrationOverride !== null) {
      requestData.acidConcentrationOverride = processParams.acidConcentrationOverride;
    }
    if (processParams.temperatureOverride !== null) {
      requestData.temperatureOverride = processParams.temperatureOverride;
    }
    if (Object.keys(reagentPriceOverrides).length > 0) {
      requestData.reagentPriceOverrides = reagentPriceOverrides;
    }

    calculateMutation.mutate({ data: requestData });
  };

  const handleSaveSession = () => {
    if (!result || !sessionName.trim()) return;
    const newSession: SavedSession = {
      id: Date.now().toString(),
      name: sessionName.trim(),
      savedAt: new Date().toISOString(),
      batchItems,
      selectedProcessId,
      processParams,
      result,
    };
    const updated = [newSession, ...savedSessions];
    setSavedSessions(updated);
    saveSessions(updated);
    setShowSaveDialog(false);
    setSessionName("");
  };

  const handleLoadSession = (session: SavedSession) => {
    setBatchItems(session.batchItems);
    setSelectedProcessId(session.selectedProcessId);
    setProcessParams(session.processParams);
    setResult(session.result);
    setShowHistory(false);
    setActiveTab("wyniki");
  };

  const handleDeleteSession = (id: string) => {
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    saveSessions(updated);
  };

  const getEffectiveUnit = (item: BatchItemState): 'kg' | 'piece' => {
    if (item.unitOverride) return item.unitOverride;
    const material = materials?.find(m => m.id === item.materialId);
    return material?.unit === 'piece' ? 'piece' : 'kg';
  };

  const getWeightPerPiece = (item: BatchItemState): number => {
    const material = materials?.find(m => m.id === item.materialId);
    return (material as any)?.weightPerPiece ?? 0.1;
  };

  const totalMass = batchItems.reduce((acc, item) => {
    const material = materials?.find(m => m.id === item.materialId);
    if (!material) return acc;
    const effectiveUnit = getEffectiveUnit(item);
    if (effectiveUnit === 'piece') {
      return acc + item.quantity * getWeightPerPiece(item);
    }
    return acc + item.quantity;
  }, 0);

  const canGoToProcess = batchItems.some(i => i.materialId && i.quantity > 0) && !batchItems.some(i => i.materialId && i.quantity <= 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight">Kalkulator Odzysku Metali</h1>
          <p className="text-muted-foreground text-sm mt-1">Precyzyjne szacowanie opłacalności procesów hydrometalurgicznych</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="shrink-0">
          <History className="h-4 w-4 mr-2" />
          Historia ({savedSessions.length})
        </Button>
      </div>

      {showHistory && (
        <Card className="border-primary/30 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Zapisane sesje</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {savedSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Brak zapisanych sesji. Wykonaj kalkulację i zapisz ją.</p>
            ) : (
              <div className="space-y-2">
                {savedSessions.map(session => (
                  <div key={session.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{session.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.savedAt).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' · '}Zysk: <span className={session.result.netProfitPln >= 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(session.result.netProfitPln)}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleLoadSession(session)}>Wczytaj</Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSession(session.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-muted/50 p-1">
          <TabsTrigger value="wsad" className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <span className="hidden sm:inline">1. Materiał wsadu</span>
            <span className="sm:hidden">1. Materiał</span>
          </TabsTrigger>
          <TabsTrigger value="proces" disabled={!canGoToProcess} className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <span className="hidden sm:inline">2. Parametry Procesu</span>
            <span className="sm:hidden">2. Proces</span>
          </TabsTrigger>
          <TabsTrigger value="wyniki" disabled={!result} className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <span className="hidden sm:inline">3. Wyniki & Opłacalność</span>
            <span className="sm:hidden">3. Wyniki</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wsad" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Definicja materiału wsadu</CardTitle>
              <CardDescription>Wybierz materiały elektroniczne i określ ich ilość (kg lub sztuki)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {batchItems.map((item) => {
                const selectedMaterial = materials?.find(m => m.id === item.materialId);
                return (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-4 items-start bg-muted/30 p-4 rounded-lg border border-border">
                    <div className="flex-1 w-full">
                      <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">Materiał</label>
                      <Select
                        value={item.materialId}
                        onValueChange={(val) => handleBatchMaterialChange(item.id, val)}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Wybierz materiał..." />
                        </SelectTrigger>
                        <SelectContent>
                          {materialsLoading ? (
                            <div className="p-2"><Skeleton className="h-4 w-full" /></div>
                          ) : (() => {
                            const grouped: Record<string, typeof materials> = {};
                            materials?.forEach(m => {
                              if (!grouped[m.category]) grouped[m.category] = [];
                              grouped[m.category]!.push(m);
                            });
                            return CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
                              <SelectGroup key={cat}>
                                <SelectLabel className="text-xs font-bold uppercase tracking-wider text-amber-500 px-2 pt-2">
                                  {CATEGORY_LABELS[cat] ?? cat}
                                </SelectLabel>
                                {grouped[cat]!.map(m => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name} <span className="text-muted-foreground ml-1">({m.unit === 'piece' ? 'szt.' : 'kg'})</span>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto items-end">
                      <div className="flex-1 sm:w-32">
                        <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">Ilość</label>
                        <div className="flex gap-1">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              min="0.001"
                              step={getEffectiveUnit(item) === 'piece' ? "1" : "0.01"}
                              value={item.quantity}
                              onChange={(e) => handleBatchQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                              className="bg-background font-mono"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBatchUnitToggle(item.id)}
                            disabled={!item.materialId}
                            className="shrink-0 w-12 text-xs font-bold px-1"
                            title="Kliknij aby przełączyć między kg i szt."
                          >
                            {getEffectiveUnit(item) === 'piece' ? 'szt.' : 'kg'}
                          </Button>
                        </div>
                        {item.materialId && getEffectiveUnit(item) === 'piece' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ≈ {(item.quantity * getWeightPerPiece(item)).toFixed(2)} kg
                          </p>
                        )}
                      </div>
                      <div className="pb-0.5">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveBatchItem(item.id)}
                          disabled={batchItems.length === 1}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Button variant="outline" onClick={handleAddBatchItem} className="w-full border-dashed border-2 hover:bg-muted/50">
                <Plus className="mr-2 h-4 w-4" /> Dodaj kolejny materiał
              </Button>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border flex justify-between items-center py-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Szacowana masa całkowita:</span>
                <span className="font-mono font-bold ml-2 text-lg">{formatMass(totalMass, 'kg')}</span>
              </div>
              <Button
                onClick={() => setActiveTab("proces")}
                disabled={!canGoToProcess}
              >
                Dalej: Wybierz proces <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="proces" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Proces Chemiczny</CardTitle>
              <CardDescription>Wybierz metodę ekstrakcji dla zdefiniowanego wsadu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processesLoading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
                ) : processes?.map(process => (
                  <div
                    key={process.id}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedProcessId === process.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedProcessId(process.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg leading-tight">{process.name}</h3>
                      {selectedProcessId === process.id && <CheckCircle2 className="text-primary h-5 w-5 shrink-0" />}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {process.targetMetals.map(m => (
                        <span key={m} className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                          {m}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{process.description}</p>
                    <div className="text-xs font-mono mt-auto text-muted-foreground">
                      <div className="flex justify-between border-t border-border pt-2">
                        <span>Czas: {process.timePerKgMin}-{process.timePerKgMax}h/kg</span>
                        <span>Temp: {process.temperatureOptimal}°C</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedProcess && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Parametry Procesu</CardTitle>
                <CardDescription>
                  Dostosuj warunki reakcji — odchylenia od optymalnych wartości obniżą wydajność odzysku
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Temperatura reakcji</Label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">
                        {processParams.temperatureOverride ?? selectedProcess.temperatureOptimal}°C
                      </span>
                      <span className="text-xs text-muted-foreground">(opt: {selectedProcess.temperatureOptimal}°C)</span>
                    </div>
                  </div>
                  <Slider
                    min={Math.max(0, (selectedProcess.temperatureOptimal ?? 70) - 50)}
                    max={(selectedProcess.temperatureOptimal ?? 70) + 50}
                    step={5}
                    value={[processParams.temperatureOverride ?? selectedProcess.temperatureOptimal ?? 70]}
                    onValueChange={([val]) => setProcessParams(p => ({ ...p, temperatureOverride: val ?? null }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Za niska → wolna reakcja</span>
                    <span>Za wysoka → rozkład reagentów</span>
                  </div>
                </div>

                {selectedProcess.reagents?.[0] && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Stężenie głównego reagentu ({selectedProcess.reagents[0].formula ?? selectedProcess.reagents[0].name})</Label>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">
                          {processParams.acidConcentrationOverride ?? selectedProcess.reagents[0].concentration}%
                        </span>
                        <span className="text-xs text-muted-foreground">(opt: {selectedProcess.reagents[0].concentration}%)</span>
                      </div>
                    </div>
                    <Slider
                      min={Math.max(1, (selectedProcess.reagents[0].concentration ?? 35) - 20)}
                      max={Math.min(100, (selectedProcess.reagents[0].concentration ?? 35) + 30)}
                      step={1}
                      value={[processParams.acidConcentrationOverride ?? selectedProcess.reagents[0].concentration ?? 35]}
                      onValueChange={([val]) => setProcessParams(p => ({ ...p, acidConcentrationOverride: val ?? null }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Zbyt niskie → niekompletna reakcja</span>
                      <span>Zbyt wysokie → nadmiar korozji</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Cena energii elektrycznej</Label>
                    <span className="font-mono font-bold text-primary">{processParams.electricityPricePerKwh.toFixed(2)} zł/kWh</span>
                  </div>
                  <Slider
                    min={0.3}
                    max={2.0}
                    step={0.05}
                    value={[processParams.electricityPricePerKwh]}
                    onValueChange={([val]) => setProcessParams(p => ({ ...p, electricityPricePerKwh: val ?? 0.8 }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.30 zł/kWh</span>
                    <span>2.00 zł/kWh</span>
                  </div>
                </div>

                {selectedProcess.reagents && selectedProcess.reagents.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <Label className="text-sm font-semibold">Ceny odczynników (PLN/litr)</Label>
                    <p className="text-xs text-muted-foreground">
                      Wartości zapisywane lokalnie i stosowane w kalkulacji kosztów chemii
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedProcess.reagents.map((reagent) => {
                        const customPrice = reagentPriceOverrides[reagent.name];
                        const displayPrice = customPrice !== undefined ? customPrice : reagent.pricePerLiter;
                        return (
                          <div key={reagent.name} className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg border border-border">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{reagent.name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{reagent.formula} · def: {reagent.pricePerLiter} zł/l</div>
                            </div>
                            <div className="relative shrink-0 w-28">
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={displayPrice}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val > 0) handleReagentPriceChange(reagent.name, val);
                                }}
                                className="bg-background pr-10 font-mono text-sm h-8"
                              />
                              <span className="absolute right-2 top-1.5 text-xs text-muted-foreground">zł/l</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {Object.keys(reagentPriceOverrides).length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setReagentPriceOverrides({});
                          saveReagentPrices({});
                        }}
                        className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                      >
                        Przywróć ceny domyślne
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/30 border-t border-border flex justify-between items-center py-4">
                <Button variant="ghost" onClick={() => setActiveTab("wsad")}>Wróć do materiału</Button>
                <Button
                  onClick={handleCalculate}
                  disabled={!selectedProcessId || calculateMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {calculateMutation.isPending ? 'Kalkulowanie...' : 'Uruchom Kalkulację'} <TrendingUp className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {!selectedProcess && (
            <CardFooter className="bg-muted/30 border border-border rounded-lg flex justify-between items-center py-4 px-6">
              <Button variant="ghost" onClick={() => setActiveTab("wsad")}>Wróć do materiału</Button>
              <Button
                onClick={handleCalculate}
                disabled={!selectedProcessId || calculateMutation.isPending}
              >
                {calculateMutation.isPending ? 'Kalkulowanie...' : 'Uruchom Kalkulację'} <TrendingUp className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          )}
        </TabsContent>

        <TabsContent value="wyniki" className="space-y-6">
          {result && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-border bg-card col-span-1 lg:col-span-2">
                  <CardHeader className="pb-2 border-b border-border mb-4">
                    <CardTitle>Podsumowanie Finansowe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <div className="text-xs text-muted-foreground uppercase mb-1">Przychód</div>
                        <div className="font-mono font-bold text-success text-lg">{formatCurrency(result.totalRevenuePln)}</div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <div className="text-xs text-muted-foreground uppercase mb-1">Koszty Chemii</div>
                        <div className="font-mono font-bold text-destructive text-lg">-{formatCurrency(result.totalChemistryCostPln)}</div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <div className="text-xs text-muted-foreground uppercase mb-1">Koszty Energii</div>
                        <div className="font-mono font-bold text-destructive text-lg">-{formatCurrency(result.electricityCostPln)}</div>
                      </div>
                      <div className="bg-primary/10 p-3 rounded-lg border border-primary/30">
                        <div className="text-xs text-primary uppercase mb-1 font-bold">Zysk Netto</div>
                        <div className="font-mono font-bold text-primary text-xl">{formatCurrency(result.netProfitPln)}</div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg flex items-start gap-4 border ${
                      result.profitabilityRating === 'very_profitable' ? 'bg-success/10 border-success/30 text-success' :
                      result.profitabilityRating === 'profitable' ? 'bg-primary/10 border-primary/30 text-primary' :
                      result.profitabilityRating === 'marginal' ? 'bg-warning/10 border-warning/30 text-warning' :
                      'bg-destructive/10 border-destructive/30 text-destructive'
                    }`}>
                      {result.profitabilityRating === 'not_profitable' ? <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" /> : <TrendingUp className="h-6 w-6 shrink-0 mt-0.5" />}
                      <div>
                        <h4 className="font-bold uppercase tracking-wider mb-1">
                          {{
                            very_profitable: 'Bardzo opłacalne',
                            profitable: 'Opłacalne',
                            marginal: 'Marginalna opłacalność',
                            not_profitable: 'Nieopłacalne',
                          }[result.profitabilityRating] ?? result.profitabilityRating}
                        </h4>
                        <p className="text-sm opacity-90">{result.profitabilityNote}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-2 border-b border-border mb-4">
                    <CardTitle>Parametry Procesu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Masa całkowita materiału wsadu</span>
                      <span className="font-mono font-bold">{formatMass(result.totalInputMassKg, 'kg')}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Szacowany czas</span>
                      <span className="font-mono font-bold">{result.estimatedTimeHours} godz.</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Proces</span>
                      <span className="font-bold text-right pl-4 truncate">{result.processName}</span>
                    </div>
                    {processParams.temperatureOverride !== null && (
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="text-sm text-muted-foreground">Temperatura</span>
                        <span className="font-mono font-bold">{processParams.temperatureOverride}°C</span>
                      </div>
                    )}
                    <div className="pt-2 space-y-2">
                      {!showSaveDialog ? (
                        <Button variant="outline" className="w-full" onClick={() => setShowSaveDialog(true)}>
                          <Save className="h-4 w-4 mr-2" />Zapisz sesję
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            placeholder="Nazwa sesji..."
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSession()}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1" onClick={handleSaveSession} disabled={!sessionName.trim()}>
                              Zapisz
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setShowSaveDialog(false); setSessionName(""); }}>
                              Anuluj
                            </Button>
                          </div>
                        </div>
                      )}
                      <Button variant="outline" className="w-full" onClick={() => { setResult(null); setBatchItems([{ id: '1', materialId: '', quantity: 1 }]); setSelectedProcessId(''); setActiveTab("wsad"); }}>
                        Nowa kalkulacja
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Odzyskane Metale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="w-[80px]">Metal</TableHead>
                            <TableHead className="text-right">Masa</TableHead>
                            <TableHead className="text-right">Wydajność</TableHead>
                            <TableHead className="text-right">Wartość</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.recoveredMetals.map((metal) => (
                            <TableRow key={metal.metal} className="border-border">
                              <TableCell className="font-bold font-mono text-primary">{metal.metal}</TableCell>
                              <TableCell className="text-right font-mono">{formatMass(metal.massGrams, 'g')}</TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">{formatPercent(metal.yieldPercent)}</TableCell>
                              <TableCell className="text-right font-mono font-bold text-success">{formatCurrency(metal.totalValuePln)}</TableCell>
                            </TableRow>
                          ))}
                          {result.recoveredMetals.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                Brak odzyskanych metali z tego procesu
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Zapotrzebowanie Chemiczne</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead>Odczynnik</TableHead>
                            <TableHead className="text-right">Ilość</TableHead>
                            <TableHead className="text-right">Cena/l</TableHead>
                            <TableHead className="text-right">Koszt</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.chemistryCosts.map((chem) => (
                            <TableRow key={chem.reagentName} className="border-border">
                              <TableCell className="font-medium">{chem.reagentName}</TableCell>
                              <TableCell className="text-right font-mono">{chem.amountLiters.toFixed(2)} L</TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">{chem.pricePerLiter.toFixed(2)} zł</TableCell>
                              <TableCell className="text-right font-mono font-bold text-destructive">-{formatCurrency(chem.totalCostPln)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
