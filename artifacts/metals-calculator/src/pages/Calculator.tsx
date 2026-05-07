import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGetElectronicMaterials, getGetElectronicMaterialsQueryKey, useGetChemicalProcesses, getGetChemicalProcessesQueryKey, useCalculateRecovery, useCompareProcesses, CalculationResult, ProcessCompareResult } from "@workspace/api-client-react";
import { useCustomMaterials, getInlineContent } from "@/lib/useCustomMaterials";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Trash2, Plus, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle, Save, History, X, FileDown, BarChart2, Sparkles, ArrowLeftRight, ChevronsUpDown, Check } from "lucide-react";
import { generateCalculationPdf } from "@/lib/generatePdf";
import { formatCurrency, formatMass, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ProcessCompareTable } from "@/components/ProcessCompareTable";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

type BatchItemState = {
  id: string;
  materialId: string;
  quantity: number;
  unitOverride?: 'kg' | 'piece';
  isCleaned?: boolean;
  /** Au multiplier from plating quality analysis (0.65–1.40), set by vision flow */
  auMultiplier?: number;
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
  withSeparacja: boolean;
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

const CATEGORY_ORDER = [
  "plyty_glowne", "pcb", "procesor", "pamiec", "karta",
  "dysk", "urzadzenie", "zasilacz", "ic", "zlacza", "styki", "kondensator", "inne", "wlasne",
];

type MaterialOption = { id: string; name: string; category: string };

function MaterialCombobox({
  value,
  onValueChange,
  options,
  loading,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: MaterialOption[];
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const selected = options.find(m => m.id === value);

  const grouped: Record<string, MaterialOption[]> = {};
  options.forEach(m => {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category]!.push(m);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background font-normal h-10 px-3 text-sm"
        >
          <span className={selected ? "text-foreground" : "text-muted-foreground"}>
            {selected ? selected.name : t("calculator.selectMaterial")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
        style={{ maxHeight: "340px" }}
      >
        <Command filter={(itemValue, search) => {
          if (!search) return 1;
          return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
        }}>
          <CommandInput placeholder={t("calculator.searchMaterial")} className="h-9" />
          <CommandList className="max-h-[280px]">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">{t("common.loading")}</div>
            ) : (
              <>
                <CommandEmpty>{t("calculator.noResults")}</CommandEmpty>
                {CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
                  <CommandGroup
                    key={cat}
                    heading={
                      <span className={`text-xs font-bold uppercase tracking-wider ${cat === "wlasne" ? "text-primary" : "text-amber-500"}`}>
                        {t(`categories.${cat}`)}
                      </span>
                    }
                  >
                    {grouped[cat]!.map(m => (
                      <CommandItem
                        key={m.id}
                        value={m.name}
                        onSelect={() => {
                          onValueChange(m.id);
                          setOpen(false);
                        }}
                        className="text-sm"
                      >
                        <Check className={`mr-2 h-3.5 w-3.5 shrink-0 ${value === m.id ? "opacity-100" : "opacity-0"}`} />
                        {m.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function CalculatorPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const matName = (m: { name: string; nameEn?: string | null }) =>
    lang === "en" && m.nameEn ? m.nameEn : m.name;
  const [activeTab, setActiveTab] = useState<string>("wsad");
  const [batchItems, setBatchItems] = useState<BatchItemState[]>([{ id: '1', materialId: '', quantity: 1 }]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [processParams, setProcessParams] = useState<ProcessParams>({
    acidConcentrationOverride: null,
    temperatureOverride: null,
    electricityPricePerKwh: 0.8,
    withSeparacja: false,
  });
  const [reagentPriceOverrides, setReagentPriceOverrides] = useState<Record<string, number>>(loadReagentPrices);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(loadSessions);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareData, setCompareData] = useState<ProcessCompareResult[] | null>(null);
  const [purchaseCost, setPurchaseCost] = useState<number>(0);

  const processNextBtnRef = useRef<HTMLDivElement>(null);

  const changeTab = useCallback((tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const { data: apiMaterials, isLoading: materialsLoading } = useGetElectronicMaterials({
    query: { queryKey: getGetElectronicMaterialsQueryKey() }
  });
  const { materials: customMats, asApiMaterials: customApiMats } = useCustomMaterials();
  const materials = [...(apiMaterials ?? []), ...customApiMats];
  const isCustomId = (id: string) => id.startsWith("custom_");
  const getCustomMat = (id: string) => customMats.find((m) => m.id === id) ?? null;

  const { data: processes, isLoading: processesLoading } = useGetChemicalProcesses({
    query: { queryKey: getGetChemicalProcessesQueryKey() }
  });

  const selectedProcess = processes?.find(p => p.id === selectedProcessId);

  useEffect(() => {
    try {
      const visionBatch = localStorage.getItem("metalrecovery_vision_batch");
      if (visionBatch) {
        localStorage.removeItem("metalrecovery_vision_batch");
        const parsed: Array<{ materialId: string; quantity: number; unitOverride?: 'kg' | 'piece'; auMultiplier?: number }> = JSON.parse(visionBatch);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBatchItems(
            parsed.map((entry, i) => {
              const isPiece = entry.unitOverride === "piece";
              const minQty = isPiece ? 1 : 0.001;
              return {
                id: (Date.now() + i).toString(),
                materialId: entry.materialId,
                quantity: Math.max(minQty, entry.quantity || minQty),
                ...(entry.unitOverride ? { unitOverride: entry.unitOverride } : {}),
                ...(entry.auMultiplier ? { auMultiplier: entry.auMultiplier } : {}),
              };
            }),
          );
          return;
        }
      }
      const visionMaterialId = localStorage.getItem("metalrecovery_vision_new_material");
      if (visionMaterialId) {
        localStorage.removeItem("metalrecovery_vision_new_material");
        const rawQty = localStorage.getItem("metalrecovery_vision_quantity");
        localStorage.removeItem("metalrecovery_vision_quantity");
        const rawUnitOverride = localStorage.getItem("metalrecovery_vision_unit_override") as 'kg' | 'piece' | null;
        localStorage.removeItem("metalrecovery_vision_unit_override");
        const rawQuality = localStorage.getItem("metalrecovery_vision_plating_quality");
        localStorage.removeItem("metalrecovery_vision_plating_quality");
        const QUALITY_MULT: Record<number, number> = { 1: 0.65, 2: 0.80, 3: 1.00, 4: 1.20, 5: 1.40 };
        const auMultiplier = rawQuality ? (QUALITY_MULT[Number(rawQuality)] ?? undefined) : undefined;
        const isPiece = rawUnitOverride === "piece";
        const qty = rawQty ? Math.max(isPiece ? 1 : 0.001, parseFloat(rawQty) || (isPiece ? 1 : 0.001)) : 1;
        setBatchItems([{
          id: Date.now().toString(),
          materialId: visionMaterialId,
          quantity: qty,
          ...(rawUnitOverride ? { unitOverride: rawUnitOverride } : {}),
          ...(auMultiplier && auMultiplier !== 1.0 ? { auMultiplier } : {}),
        }]);
      }
    } catch {
      // private mode — ignore
    }
  }, []);

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
        changeTab("wyniki");
      }
    }
  });

  const compareMutation = useCompareProcesses({
    mutation: {
      onSuccess: (data) => {
        setCompareData(data);
        setShowCompare(true);
      }
    }
  });

  const buildBatchForApi = () =>
    batchItems
      .filter((item) => item.materialId && item.quantity > 0)
      .map((item) => {
        const material = materials?.find((m) => m.id === item.materialId);
        const nativeUnit = material?.unit === "piece" ? "piece" : "kg";
        const effectiveUnit = getEffectiveUnit(item);
        let quantity = item.quantity;
        if (effectiveUnit === "piece" && nativeUnit === "kg") {
          quantity = item.quantity * getWeightPerPiece(item);
        } else if (effectiveUnit === "kg" && nativeUnit === "piece") {
          const wpp = getWeightPerPiece(item);
          quantity = wpp > 0 ? Math.round(item.quantity / wpp) : item.quantity;
        }
        const customMat = isCustomId(item.materialId) ? getCustomMat(item.materialId) : null;
        return {
          materialId: item.materialId,
          quantity,
          isCleaned: item.isCleaned,
          ...(customMat ? { inlineMetalContent: getInlineContent(customMat) } : {}),
          ...(item.auMultiplier && item.auMultiplier !== 1.0 ? { auMultiplier: item.auMultiplier } : {}),
        };
      });

  const handleCompare = () => {
    if (!canGoToProcess) return;
    compareMutation.mutate({
      data: {
        batch: buildBatchForApi(),
        electricityPricePerKwh: processParams.electricityPricePerKwh,
        ...(processParams.withSeparacja ? { withSeparacja: true } : {}),
      },
    });
  };

  const handleSelectFromCompare = (processId: string) => {
    setSelectedProcessId(processId);
    setShowCompare(false);
    calculateMutation.mutate({
      data: {
        batch: buildBatchForApi(),
        processId,
        electricityPricePerKwh: processParams.electricityPricePerKwh,
        ...(processParams.withSeparacja ? { withSeparacja: true } : {}),
      },
    });
  };

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
    const newMaterial = materials?.find(m => m.id === value);
    setBatchItems(batchItems.map(item =>
      item.id === id
        ? { ...item, materialId: value, isCleaned: newMaterial?.requiresCleaning ? item.isCleaned : false }
        : item
    ));
  };

  const handleBatchQuantityChange = (id: string, value: number) => {
    setBatchItems(batchItems.map(item => item.id === id ? { ...item, quantity: value } : item));
  };

  const handleBatchIsCleanedToggle = (id: string, checked: boolean) => {
    setBatchItems(batchItems.map(item => item.id === id ? { ...item, isCleaned: checked } : item));
  };

  const handleReagentPriceChange = (name: string, value: number) => {
    const updated = { ...reagentPriceOverrides, [name]: value };
    setReagentPriceOverrides(updated);
    saveReagentPrices(updated);
  };

  const handleCalculate = () => {
    if (!selectedProcessId || batchItems.some(i => !i.materialId || i.quantity <= 0)) return;

    const requestData: Parameters<typeof calculateMutation.mutate>[0]['data'] = {
      batch: buildBatchForApi(),
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
    if (processParams.withSeparacja) {
      requestData.withSeparacja = true;
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
    changeTab("wyniki");
  };

  const handleDeleteSession = (id: string) => {
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    saveSessions(updated);
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    const batchForPdf = batchItems.map(item => {
      const material = materials?.find(m => m.id === item.materialId);
      const effectiveUnit = getEffectiveUnit(item);
      return {
        materialName: material?.name ?? item.materialId,
        quantity: item.quantity,
        unit: effectiveUnit === 'piece' ? 'szt.' : 'kg',
      };
    }).filter(item => item.materialName);
    generateCalculationPdf({
      result,
      batchItems: batchForPdf,
      processParams,
    });
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
          <h1 className="text-2xl font-bold font-sans tracking-tight">{t("calculator.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("calculator.subtitle")}</p>
        </div>
        {user && (
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="shrink-0">
            <History className="h-4 w-4 mr-2" />
            {t("calculator.history")} ({savedSessions.length})
          </Button>
        )}
      </div>

      {user && showHistory && (
        <Card className="border-primary/30 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("calculator.savedSessions")}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {savedSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("calculator.noSessions")}</p>
            ) : (
              <div className="space-y-2">
                {savedSessions.map(session => (
                  <div key={session.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{session.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.savedAt).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{t("calculator.netProfit")}: <span className={session.result.netProfitPln >= 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(session.result.netProfitPln)}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleLoadSession(session)}>{t("calculator.load")}</Button>
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

      <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-muted/50 p-1">
          <TabsTrigger value="wsad" className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <span className="hidden sm:inline">{t("calculator.tab1")}</span>
            <span className="sm:hidden">{t("calculator.tab1Short")}</span>
          </TabsTrigger>
          <TabsTrigger value="proces" disabled={!canGoToProcess} className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <span className="hidden sm:inline">{t("calculator.tab2")}</span>
            <span className="sm:hidden">{t("calculator.tab2Short")}</span>
          </TabsTrigger>
          <TabsTrigger value="wyniki" disabled={!result} className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <span className="hidden sm:inline">{t("calculator.tab3")}</span>
            <span className="sm:hidden">{t("calculator.tab3Short")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wsad" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>{t("calculator.batchTitle")}</CardTitle>
              <CardDescription>{t("calculator.batchSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {batchItems.map((item) => {
                const selectedMaterial = materials?.find(m => m.id === item.materialId);
                return (
                  <div key={item.id} className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-4 items-start bg-muted/30 p-4 rounded-lg border border-border">
                    <div className="flex-1 w-full">
                      <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">{t("calculator.material")}</label>
                      <MaterialCombobox
                        value={item.materialId}
                        onValueChange={(val) => handleBatchMaterialChange(item.id, val)}
                        options={(materials ?? []).map(m => ({ id: m.id, name: matName(m), category: m.category }))}
                        loading={materialsLoading}
                      />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto items-end">
                      <div className="flex-1 sm:w-auto">
                        <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">{t("calculator.quantity")}</label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="w-7 h-9 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors disabled:opacity-40 shrink-0"
                            onClick={() => handleBatchQuantityChange(item.id, Math.max(0, item.quantity - (getEffectiveUnit(item) === 'piece' ? 1 : 0.01)))}
                            disabled={item.quantity <= 0}
                          >−</button>
                          <Input
                            type="number"
                            min="0.001"
                            step={getEffectiveUnit(item) === 'piece' ? "1" : "0.01"}
                            value={item.quantity}
                            onChange={(e) => handleBatchQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                            className="bg-background font-mono w-20 text-center"
                          />
                          <button
                            type="button"
                            className="w-7 h-9 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors shrink-0"
                            onClick={() => handleBatchQuantityChange(item.id, item.quantity + (getEffectiveUnit(item) === 'piece' ? 1 : 0.01))}
                          >+</button>
                        </div>
                        {item.materialId && getEffectiveUnit(item) === 'piece' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ≈ {(item.quantity * getWeightPerPiece(item)).toFixed(2)} kg
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">{t("calculator.unit")}</label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBatchUnitToggle(item.id)}
                          disabled={!item.materialId}
                          className="shrink-0 h-9 px-3 text-xs font-bold gap-1.5"
                          title={t("calculator.unitToggleTip")}
                        >
                          <ArrowLeftRight className="h-3 w-3 opacity-60" />
                          {getEffectiveUnit(item) === 'piece' ? 'szt.' : 'kg'}
                        </Button>
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
                  {selectedMaterial?.requiresCleaning && (
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-2">
                      <Checkbox
                        id={`cleaned-${item.id}`}
                        checked={item.isCleaned === true}
                        onCheckedChange={(checked) => handleBatchIsCleanedToggle(item.id, checked === true)}
                      />
                      <label htmlFor={`cleaned-${item.id}`} className="text-xs text-amber-600 dark:text-amber-400 cursor-pointer select-none font-medium flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        {t("calculator.cleaned")}
                      </label>
                    </div>
                  )}
                  {item.auMultiplier && item.auMultiplier !== 1.0 && (
                    <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 rounded-md px-3 py-2">
                      <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        {t("calculator.aiPlatingQuality")} {item.auMultiplier > 1 ? "+" : ""}{Math.round((item.auMultiplier - 1) * 100)}% Au
                      </span>
                    </div>
                  )}
                  </div>
                );
              })}

              <Button variant="outline" onClick={handleAddBatchItem} className="w-full border-dashed border-2 hover:bg-muted/50">
                <Plus className="mr-2 h-4 w-4" /> {t("calculator.addMaterial")}
              </Button>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border flex flex-col gap-3 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("calculator.totalMass")}</span>
                  <span className="font-mono font-bold ml-2 text-lg">{formatMass(totalMass, 'kg')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label htmlFor="purchase-cost" className="text-muted-foreground whitespace-nowrap">
                    {t("calculator.purchaseCost")}
                  </label>
                  <div className="relative w-32">
                    <Input
                      id="purchase-cost"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={purchaseCost === 0 ? "" : purchaseCost}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setPurchaseCost(isNaN(v) || v < 0 ? 0 : v);
                      }}
                      className="bg-background pr-7 font-mono text-sm h-8"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-muted-foreground">zł</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto sm:self-end">
                <Button
                  variant="outline"
                  onClick={handleCompare}
                  disabled={!canGoToProcess || compareMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  {compareMutation.isPending ? (
                    t("calculator.comparing")
                  ) : (
                    <>
                      <BarChart2 className="h-4 w-4 mr-2" />
                      {t("calculator.compareProcesses")}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => changeTab("proces")}
                  disabled={!canGoToProcess}
                  className="flex-1 sm:flex-none"
                >
                  <span className="sm:hidden">{t("calculator.next")}</span>
                  <span className="hidden sm:inline">{t("calculator.nextProcess")}</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>

          {showCompare && compareData && (
            <Card className="border-primary/30 bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-primary" />
                      {t("calculator.compareAll")}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {t("calculator.compareRanking")} ({formatMass(totalMass, 'kg')})
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowCompare(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ProcessCompareTable
                  data={compareData}
                  onSelectProcess={handleSelectFromCompare}
                  isSelecting={calculateMutation.isPending}
                  selectedProcessId={selectedProcessId}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="proces" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>{t("calculator.processTitle")}</CardTitle>
              <CardDescription>{t("calculator.processSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processesLoading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
                ) : processes?.map(process => (
                  <div
                    key={process.id}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col ${
                      selectedProcessId === process.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedProcessId(process.id);
                      setTimeout(() => {
                        processNextBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }, 120);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg leading-tight">{t(`processes.names.${process.id}`, { defaultValue: process.name })}</h3>
                      {selectedProcessId === process.id && <CheckCircle2 className="text-primary h-5 w-5 shrink-0 ml-2" />}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {process.targetMetals.map(m => (
                        <span key={m} className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                          {m}
                        </span>
                      ))}
                      {process.id === 'aqua_regia' && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded border border-amber-500/30 font-medium">
                          ⚠ Pre-trawienie HNO3
                        </span>
                      )}
                    </div>
                    <p className={`text-xs text-muted-foreground mb-3 ${selectedProcessId === process.id ? '' : 'line-clamp-3'}`}>
                      {process.description}
                    </p>
                    {process.id === 'aqua_regia' && selectedProcessId === process.id && (
                      <div className="mb-3 px-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-700 dark:text-amber-300">
                        <strong>PRZED procesem:</strong> Przetraw wsad w rozcieńczonym HNO3 (25–30%, 40°C, 1–2h/kg) aby usunąć Cu, Zn, Ni i metale nieszlachetne. Pomija ten krok obniży czystość odzysku Au.
                      </div>
                    )}
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
                <CardTitle>{t("calculator.processParams")}</CardTitle>
                <CardDescription>
                  {t("calculator.processParamsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>{t("calculator.temperature")}</Label>
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
                    <span>{t("calculator.tempTooLow")}</span>
                    <span>{t("calculator.tempTooHigh")}</span>
                  </div>
                </div>

                {selectedProcess.reagents?.[0] && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>{t("calculator.acidConc")} ({selectedProcess.reagents[0].formula ?? selectedProcess.reagents[0].name})</Label>
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
                      <span>{t("calculator.concTooLow")}</span>
                      <span>{t("calculator.concTooHigh")}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>{t("calculator.electricity")}</Label>
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

                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="separacja"
                      checked={processParams.withSeparacja}
                      onCheckedChange={(checked) =>
                        setProcessParams((p) => ({ ...p, withSeparacja: !!checked }))
                      }
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="separacja" className="font-semibold cursor-pointer">
                        {t("calculator.withSeparation")}
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("calculator.withSeparationDesc")}
                      </p>
                    </div>
                  </div>
                  {processParams.withSeparacja && (
                    <div className="ml-7 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      ✓ {t("calculator.separationActive")}
                    </div>
                  )}
                </div>

                {selectedProcess.reagents && selectedProcess.reagents.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <Label className="text-sm font-semibold">{t("calculator.reagentPrices")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("calculator.reagentPricesDesc")}
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
                        {t("calculator.resetPrices")}
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter ref={processNextBtnRef} className="bg-muted/30 border-t border-border flex justify-between items-center py-4">
                <Button variant="ghost" onClick={() => changeTab("wsad")}>{t("calculator.backToMaterial")}</Button>
                <Button
                  onClick={handleCalculate}
                  disabled={!selectedProcessId || calculateMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {calculateMutation.isPending ? t("calculator.calculating") : t("calculator.runCalculation")} <TrendingUp className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {!selectedProcess && (
            <CardFooter className="bg-muted/30 border border-border rounded-lg flex justify-between items-center py-4 px-6">
              <Button variant="ghost" onClick={() => changeTab("wsad")}>{t("calculator.backToMaterial")}</Button>
              <Button
                onClick={handleCalculate}
                disabled={!selectedProcessId || calculateMutation.isPending}
              >
                {calculateMutation.isPending ? t("calculator.calculating") : t("calculator.runCalculation")} <TrendingUp className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          )}
        </TabsContent>

        <TabsContent value="wyniki" className="space-y-4">
          {result && (
            <>
              {/* ── Baner opłacalności (zawsze na górze) ─────────────────── */}
              {(() => {
                const finalProfit = result.netProfitPln - purchaseCost;
                const hasPurchaseCost = purchaseCost > 0;
                const finalRating = hasPurchaseCost
                  ? (finalProfit > 400 ? 'very_profitable'
                    : finalProfit >= 100 ? 'profitable'
                    : finalProfit >= 0 ? 'marginal'
                    : 'not_profitable')
                  : result.profitabilityRating;
                return (
                  <div className={`rounded-xl border-2 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                    finalRating === 'very_profitable' ? 'bg-success/10 border-success/40 text-success' :
                    finalRating === 'profitable'      ? 'bg-primary/10 border-primary/40 text-primary' :
                    finalRating === 'marginal'        ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400' :
                    'bg-destructive/10 border-destructive/40 text-destructive'
                  }`}>
                    <div className="flex items-center gap-3 flex-1">
                      {finalRating === 'not_profitable'
                        ? <AlertTriangle className="h-7 w-7 shrink-0" />
                        : <TrendingUp className="h-7 w-7 shrink-0" />}
                      <div>
                        <div className="font-bold text-lg uppercase tracking-wider leading-tight">
                          {{
                            very_profitable: t("calculator.veryProfitable"),
                            profitable: t("calculator.profitable"),
                            marginal: t("calculator.marginal"),
                            not_profitable: t("calculator.notProfitable"),
                          }[finalRating] ?? finalRating}
                        </div>
                        <div className="text-sm opacity-80 mt-0.5">{result.profitabilityNote}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0 pl-1 sm:pl-4 border-t sm:border-t-0 sm:border-l border-current/20 pt-3 sm:pt-0 sm:pl-6">
                      <div className="text-center">
                        <div className="text-xs opacity-60 uppercase mb-0.5">{t("calculator.revenue")}</div>
                        <div className="font-mono font-bold text-base">{formatCurrency(result.totalRevenuePln)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs opacity-60 uppercase mb-0.5">{t("calculator.costs")}</div>
                        <div className="font-mono font-bold text-base">-{formatCurrency(result.totalChemistryCostPln + result.electricityCostPln + purchaseCost)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs opacity-60 uppercase mb-0.5 font-bold">{hasPurchaseCost ? t("calculator.profitAfterPurchase") : t("calculator.netProfit")}</div>
                        <div className="font-mono font-bold text-xl">{formatCurrency(finalProfit)}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Podsumowanie wsadu ────────────────────────────────────── */}
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground font-medium">{t("calculator.feed")}:</span>
                {batchItems.filter(i => i.materialId).map((item, idx) => {
                  const mat = materials?.find(m => m.id === item.materialId);
                  const unitLabel = (item.unitOverride ?? mat?.unit ?? 'kg') === 'piece' ? 'szt.' : 'kg';
                  return (
                    <span key={idx} className="font-semibold text-foreground inline-flex items-center gap-1 flex-wrap">
                      {mat?.name ?? item.materialId}
                      <span className="font-mono text-primary ml-1">× {item.quantity} {unitLabel}</span>
                      {item.isCleaned && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded px-1.5 py-0.5 ml-1">
                          <Sparkles className="h-3 w-3" />
                          {t("calculator.cleanedShort")}
                        </span>
                      )}
                      {idx < batchItems.filter(i => i.materialId).length - 1 && <span className="text-muted-foreground ml-1">+</span>}
                    </span>
                  );
                })}
                <span className="text-muted-foreground ml-auto">{t("calculator.process")}: <span className="text-foreground font-medium">{result.processName}</span></span>
              </div>

              {/* ── Finanse + Parametry ───────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="border-border bg-card col-span-1 lg:col-span-2">
                  <CardHeader className="pb-2 border-b border-border mb-4">
                    <CardTitle>{t("calculator.financialSummary")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <div className="text-xs text-muted-foreground uppercase mb-1">{t("calculator.revenue")}</div>
                        <div className="font-mono font-bold text-success text-lg">{formatCurrency(result.totalRevenuePln)}</div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <div className="text-xs text-muted-foreground uppercase mb-1">{t("calculator.reagentCost")}</div>
                        <div className="font-mono font-bold text-destructive text-lg">-{formatCurrency(result.totalChemistryCostPln)}</div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <div className="text-xs text-muted-foreground uppercase mb-1">{t("calculator.electricityCost")}</div>
                        <div className="font-mono font-bold text-destructive text-lg">-{formatCurrency(result.electricityCostPln)}</div>
                      </div>
                      <div className={purchaseCost > 0 ? "bg-muted/30 p-3 rounded-lg border border-border" : "bg-primary/10 p-3 rounded-lg border border-primary/30"}>
                        <div className={`text-xs uppercase mb-1 font-bold ${purchaseCost > 0 ? "text-muted-foreground" : "text-primary"}`}>{t("calculator.netProfitChem")}</div>
                        <div className={`font-mono font-bold text-xl ${purchaseCost > 0 ? "text-foreground" : "text-primary"}`}>{formatCurrency(result.netProfitPln)}</div>
                      </div>
                    </div>
                    {purchaseCost > 0 && (
                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 p-3 rounded-lg border border-border">
                          <div className="text-xs text-muted-foreground uppercase mb-1">{t("calculator.ownCost")}</div>
                          <div className="font-mono font-bold text-destructive text-lg">-{formatCurrency(purchaseCost)}</div>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-lg border border-primary/30">
                          <div className="text-xs text-primary uppercase mb-1 font-bold">{t("calculator.profitAfterPurchase")}</div>
                          <div className={`font-mono font-bold text-xl ${result.netProfitPln - purchaseCost >= 0 ? "text-primary" : "text-destructive"}`}>
                            {formatCurrency(result.netProfitPln - purchaseCost)}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-2 border-b border-border mb-4">
                    <CardTitle>{t("calculator.processParams")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">{t("calculator.inputMass")}</span>
                      <span className="font-mono font-bold">{formatMass(result.totalInputMassKg, 'kg')}</span>
                    </div>
                    {result.chemProcessedMassKg !== undefined && result.chemProcessedMassKg < result.totalInputMassKg * 0.99 && (
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="text-sm text-muted-foreground text-amber-600 dark:text-amber-400">
                          {t("calculator.acidMass")}
                          <span className="block text-xs text-muted-foreground">{t("calculator.acidMassNote")}</span>
                        </span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatMass(result.chemProcessedMassKg, 'kg')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">{t("calculator.estimatedTime")}</span>
                      <span className="font-mono font-bold">{result.estimatedTimeHours} {t("calculator.hours")}</span>
                    </div>
                    {processParams.temperatureOverride !== null && (
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="text-sm text-muted-foreground">{t("calculator.temperature")}</span>
                        <span className="font-mono font-bold">{processParams.temperatureOverride}°C</span>
                      </div>
                    )}
                    <div className="pt-2 space-y-2">
                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={handleDownloadPdf}
                      >
                        <FileDown className="h-4 w-4 mr-2" />{t("calculator.downloadPdf")}
                      </Button>
                      {!showSaveDialog ? (
                        <Button variant="outline" className="w-full" onClick={() => setShowSaveDialog(true)}>
                          <Save className="h-4 w-4 mr-2" />{t("calculator.saveSession")}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            placeholder={t("calculator.sessionName") + "..."}

                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSession()}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1" onClick={handleSaveSession} disabled={!sessionName.trim()}>
                              {t("calculator.save")}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setShowSaveDialog(false); setSessionName(""); }}>
                              {t("calculator.cancel")}
                            </Button>
                          </div>
                        </div>
                      )}
                      <Button variant="outline" className="w-full" onClick={() => { setResult(null); setBatchItems([{ id: '1', materialId: '', quantity: 1 }]); setSelectedProcessId(''); changeTab("wsad"); }}>
                        {t("calculator.newCalculation")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>{t("calculator.recoveredMetals")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="w-[80px]">{t("calculator.metal")}</TableHead>
                            <TableHead className="text-right">{t("calculator.mass")}</TableHead>
                            <TableHead className="text-right">{t("calculator.yield")}</TableHead>
                            <TableHead className="text-right">{t("calculator.value")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.recoveredMetals.map((metal) => (
                            <TableRow key={metal.metal} className="border-border">
                              <TableCell className="font-bold font-mono text-primary">
                                {metal.metal}
                                <span className="ml-1 font-normal text-muted-foreground text-[10px]">({METAL_NAMES[metal.metal] ?? metal.metal})</span>
                              </TableCell>
                              <TableCell className="text-right font-mono">{formatMass(metal.massGrams, 'g')}</TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">{formatPercent(metal.yieldPercent)}</TableCell>
                              <TableCell className="text-right font-mono font-bold text-success">{formatCurrency(metal.totalValuePln)}</TableCell>
                            </TableRow>
                          ))}
                          {result.recoveredMetals.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                {t("calculator.noMetalsRecovered")}
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
                    <CardTitle>{t("calculator.chemicalRequirements")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead>{t("calculator.reagent")}</TableHead>
                            <TableHead className="text-right">{t("calculator.quantity")}</TableHead>
                            <TableHead className="text-right">{t("calculator.pricePerL")}</TableHead>
                            <TableHead className="text-right">{t("calculator.cost")}</TableHead>
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
