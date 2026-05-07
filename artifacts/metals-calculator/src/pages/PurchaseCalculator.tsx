import { useState, useEffect, useRef, useId } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetElectronicMaterials,
  getGetElectronicMaterialsQueryKey,
  useGetChemicalProcesses,
  getGetChemicalProcessesQueryKey,
  useCalculatePurchasePrice,
  useCalculatePurchasePriceBatch,
  PurchasePriceResult,
  PurchasePriceBatchResult,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart, TrendingUp, TrendingDown, Minus, Zap, Beaker,
  CircleDollarSign, Info, Sparkles, Plus, Trash2, Layers,
  FlaskConical, Package, Pencil, Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useCustomMaterials, getInlineContent, type CustomMaterial } from "@/lib/useCustomMaterials";
import { CustomMaterialModal } from "@/components/CustomMaterialModal";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

const CATEGORY_ORDER = [
  "plyty_glowne", "pcb", "procesor", "pamiec", "karta",
  "dysk", "urzadzenie", "zasilacz", "ic", "zlacza", "styki", "kondensator", "inne", "wlasne",
];

type Mode = "single" | "batch";

type BatchRow = {
  id: string;
  materialId: string;
  quantityKg: string;
  isCleaned: boolean;
};

function makeRow(): BatchRow {
  return { id: Math.random().toString(36).slice(2), materialId: "", quantityKg: "", isCleaned: false };
}

export function PurchaseCalculatorPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const matName = (m: { name: string; nameEn?: string | null }) =>
    lang === "en" && m.nameEn ? m.nameEn : m.name;
  const [mode, setMode] = useState<Mode>("single");
  const [profileModal, setProfileModal] = useState<{ open: boolean; editing: CustomMaterial | null }>({
    open: false, editing: null,
  });

  const { materials: customMats, asApiMaterials: customApiMats, add, remove, update } = useCustomMaterials();

  const { data: apiMaterials, isLoading: materialsLoading } = useGetElectronicMaterials({
    query: { queryKey: getGetElectronicMaterialsQueryKey() },
  });
  const { data: processes, isLoading: processesLoading } = useGetChemicalProcesses({
    query: { queryKey: getGetChemicalProcessesQueryKey() },
  });

  const allMaterials = [...(apiMaterials ?? []), ...customApiMats];

  const isCustomId = (id: string) => id.startsWith("custom_");
  const getCustomMat = (id: string) => customMats.find((m) => m.id === id) ?? null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            {t("purchase.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("purchase.subtitle")}
          </p>
        </div>
        {user && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs shrink-0"
            onClick={() => setProfileModal({ open: true, editing: null })}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("purchase.addCustomMaterial")}
            {customMats.length > 0 && (
              <Badge variant="secondary" className="ml-0.5 text-xs px-1.5 py-0 h-4">{customMats.length}</Badge>
            )}
          </Button>
        )}
      </div>

      <div className="flex gap-2 p-1 bg-muted/40 rounded-lg border border-border">
        <button
          onClick={() => setMode("single")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
            mode === "single"
              ? "bg-background shadow-sm text-foreground border border-border"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Package className="h-4 w-4" />
          {t("purchase.modeSingle")}
        </button>
        <button
          onClick={() => setMode("batch")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
            mode === "batch"
              ? "bg-background shadow-sm text-foreground border border-border"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Layers className="h-4 w-4" />
          {t("purchase.modeBatch")}
        </button>
      </div>

      {mode === "single" ? (
        <SingleMode
          allMaterials={allMaterials}
          processes={processes ?? []}
          materialsLoading={materialsLoading}
          processesLoading={processesLoading}
          isCustomId={isCustomId}
          getCustomMat={getCustomMat}
          onEditCustom={(mat) => setProfileModal({ open: true, editing: mat })}
        />
      ) : (
        <BatchMode
          allMaterials={allMaterials}
          processes={processes ?? []}
          materialsLoading={materialsLoading}
          processesLoading={processesLoading}
          isCustomId={isCustomId}
          getCustomMat={getCustomMat}
        />
      )}

      {user && customMats.length > 0 && (
        <Card className="border-border/50 bg-muted/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              {t("purchase.customProfiles")} ({customMats.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {customMats.map((m) => (
              <div key={m.id} className="flex items-center gap-2 p-2 rounded-md bg-background border border-border/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    Au {m.au} · Ag {m.ag} · Pt {m.pt} · Pd {m.pd} g/kg
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => setProfileModal({ open: true, editing: m })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {user && (
        <CustomMaterialModal
          open={profileModal.open}
          onOpenChange={(open) => setProfileModal((prev) => ({ ...prev, open }))}
          existing={profileModal.editing}
          onSave={(data) => {
            if (profileModal.editing) {
              update(profileModal.editing.id, data);
            } else {
              add(data);
            }
          }}
          onDelete={profileModal.editing ? () => remove(profileModal.editing!.id) : undefined}
        />
      )}
    </div>
  );
}

type SharedProps = {
  allMaterials: Array<{
    id: string;
    name: string;
    nameEn?: string | null;
    category: string;
    unit: string;
    requiresCleaning?: boolean;
  }>;
  processes: Array<{ id: string; name: string }>;
  materialsLoading: boolean;
  processesLoading: boolean;
  isCustomId: (id: string) => boolean;
  getCustomMat: (id: string) => CustomMaterial | null;
};

function MaterialGroupedSelect({
  value,
  onValueChange,
  allMaterials,
  materialsLoading,
  placeholder,
}: {
  value: string;
  onValueChange: (v: string) => void;
  allMaterials: SharedProps["allMaterials"];
  materialsLoading: boolean;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const defaultPlaceholder = placeholder ?? t("calculator.selectMaterial");
  const matLabel = (m: SharedProps["allMaterials"][number]) =>
    lang === "en" && m.nameEn ? m.nameEn : m.name;
  const grouped: Record<string, typeof allMaterials> = {};
  allMaterials.forEach((m) => {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category]!.push(m);
  });

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-background">
        <SelectValue placeholder={defaultPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {materialsLoading ? (
          <div className="p-2"><Skeleton className="h-4 w-full" /></div>
        ) : (
          CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
            <SelectGroup key={cat}>
              <SelectLabel className={cn(
                "text-xs font-bold uppercase tracking-wider px-2 pt-2",
                cat === "wlasne" ? "text-primary" : "text-amber-500",
              )}>
                {t(`categories.${cat}`)}
              </SelectLabel>
              {grouped[cat]!.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {matLabel(m)}
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

function ProcessSliders({
  processId, setProcessId,
  targetMargin, setTargetMargin,
  electricityPrice, setElectricityPrice,
  processes, processesLoading,
}: {
  processId: string; setProcessId: (v: string) => void;
  targetMargin: number; setTargetMargin: (v: number) => void;
  electricityPrice: number; setElectricityPrice: (v: number) => void;
  processes: Array<{ id: string; name: string }>;
  processesLoading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
          {t("purchase.selectProcess")}
        </Label>
        <Select value={processId} onValueChange={setProcessId}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder={t("purchase.selectProcess") + "..."} />
          </SelectTrigger>
          <SelectContent>
            {processesLoading ? (
              <div className="p-2"><Skeleton className="h-4 w-full" /></div>
            ) : (
              processes.map((p) => (
                <SelectItem key={p.id} value={p.id}>{t(`processes.names.${p.id}`, { defaultValue: p.name })}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
            {t("purchase.profitMargin")}
          </Label>
          <span className="font-mono font-bold text-primary text-lg">
            {targetMargin === 0 ? (
              <span className="text-amber-400">{t("purchase.breakEven")}</span>
            ) : `${targetMargin}%`}
          </span>
        </div>
        <Slider min={0} max={90} step={5} value={[targetMargin]} onValueChange={([v]) => setTargetMargin(v ?? 0)} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("purchase.breakEven")} (0%)</span>
          <span>90%</span>
        </div>
        {targetMargin === 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 rounded-md px-3 py-2 border border-amber-400/20">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>{t("purchase.breakEvenInfo")}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            {t("purchase.electricityPrice")}
          </Label>
          <span className="font-mono font-bold text-primary">{electricityPrice.toFixed(2)} zł/kWh</span>
        </div>
        <Slider
          min={0.2} max={2.0} step={0.05}
          value={[electricityPrice]}
          onValueChange={([v]) => setElectricityPrice(v ?? 0.8)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.20 zł/kWh</span>
          <span>2.00 zł/kWh</span>
        </div>
      </div>
    </>
  );
}

function SingleMode({
  allMaterials, processes, materialsLoading, processesLoading, isCustomId, getCustomMat, onEditCustom,
}: SharedProps & { onEditCustom: (m: CustomMaterial) => void }) {
  const { t } = useTranslation();
  const [materialId, setMaterialId] = useState("");
  const [processId, setProcessId] = useState("");
  const [targetMargin, setTargetMargin] = useState(20);
  const [electricityPrice, setElectricityPrice] = useState(0.8);
  const [isCleaned, setIsCleaned] = useState(false);
  const [quantityGrams, setQuantityGrams] = useState<number | null>(null);
  const [result, setResult] = useState<PurchasePriceResult | null>(null);

  useEffect(() => {
    try {
      const visionMaterialId = localStorage.getItem("metalrecovery_vision_new_material");
      if (visionMaterialId) {
        const visionQtyKg = localStorage.getItem("metalrecovery_vision_quantity");
        localStorage.removeItem("metalrecovery_vision_new_material");
        localStorage.removeItem("metalrecovery_vision_quantity");
        localStorage.removeItem("metalrecovery_vision_plating_quality");
        setMaterialId(visionMaterialId);
        if (visionQtyKg) {
          const kg = parseFloat(visionQtyKg);
          if (kg > 0) setQuantityGrams(Math.round(kg * 1000));
        }
      }
    } catch {
      // private mode
    }
  }, []);

  const purchaseMutation = useCalculatePurchasePrice();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);

  const selectedApiMat = allMaterials.find((m) => m.id === materialId);
  const materialRequiresCleaning = !isCustomId(materialId) && selectedApiMat?.requiresCleaning === true;
  const selectedCustomMat = isCustomId(materialId) ? getCustomMat(materialId) : null;

  useEffect(() => {
    if (!materialRequiresCleaning) setIsCleaned(false);
  }, [materialId, materialRequiresCleaning]);

  useEffect(() => {
    if (!materialId || !processId) { setResult(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const seq = ++seqRef.current;
    debounceRef.current = setTimeout(() => {
      const customMat = isCustomId(materialId) ? getCustomMat(materialId) : null;
      purchaseMutation.mutate(
        {
          data: {
            materialId,
            processId,
            targetMarginPercent: targetMargin,
            electricityPricePerKwh: electricityPrice,
            isCleaned: materialRequiresCleaning ? isCleaned : undefined,
            ...(customMat ? { inlineMetalContent: getInlineContent(customMat) } : {}),
          },
        },
        {
          onSuccess: (data) => { if (seq === seqRef.current) setResult(data); },
        },
      );
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [materialId, processId, targetMargin, electricityPrice, isCleaned, materialRequiresCleaning]);

  const isLoading = purchaseMutation.isPending;
  const canCompute = Boolean(materialId && processId);

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">{t("purchase.paramsTitle")}</CardTitle>
          <CardDescription>{t("purchase.paramsSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                {t("calculator.material")}
              </Label>
              {selectedCustomMat && (
                <button
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                  onClick={() => onEditCustom(selectedCustomMat)}
                >
                  <Pencil className="h-3 w-3" />
                  {t("purchase.editCustomMaterial")}
                </button>
              )}
            </div>
            <MaterialGroupedSelect
              value={materialId}
              onValueChange={setMaterialId}
              allMaterials={allMaterials}
              materialsLoading={materialsLoading}
            />
          </div>

          {materialRequiresCleaning && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-2.5">
              <Checkbox id="purchase-cleaned" checked={isCleaned} onCheckedChange={(c) => setIsCleaned(c === true)} />
              <label htmlFor="purchase-cleaned" className="text-xs text-amber-600 dark:text-amber-400 cursor-pointer select-none font-medium flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                {t("calculator.cleaned")}
              </label>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5" />
              {t("purchase.quantityOptional")}
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1">
                <button
                  type="button"
                  className="w-7 h-9 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors disabled:opacity-40 shrink-0"
                  onClick={() => setQuantityGrams(q => q != null ? Math.max(1, q - 10) : null)}
                  disabled={quantityGrams == null || quantityGrams <= 1}
                >−</button>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder={t("purchase.quantityPlaceholder")}
                    value={quantityGrams ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setQuantityGrams(v === "" ? null : Math.max(1, parseInt(v, 10) || 1));
                    }}
                    className="pr-9 bg-background text-center"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">g</span>
                </div>
                <button
                  type="button"
                  className="w-7 h-9 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors shrink-0"
                  onClick={() => setQuantityGrams(q => (q ?? 0) + 10)}
                >+</button>
              </div>
              {quantityGrams != null && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  = {quantityGrams >= 1000
                    ? `${(quantityGrams / 1000).toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kg`
                    : `${quantityGrams} g`}
                </span>
              )}
            </div>
            {quantityGrams == null && (
              <p className="text-xs text-muted-foreground">{t("purchase.enterGrams")}</p>
            )}
          </div>

          <ProcessSliders
            processId={processId} setProcessId={setProcessId}
            targetMargin={targetMargin} setTargetMargin={setTargetMargin}
            electricityPrice={electricityPrice} setElectricityPrice={setElectricityPrice}
            processes={processes} processesLoading={processesLoading}
          />
        </CardContent>
      </Card>

      {!canCompute && (
        <Card className="border-dashed border-border bg-muted/20">
          <CardContent className="py-10 text-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t("purchase.selectToSeeResult")}</p>
          </CardContent>
        </Card>
      )}

      {canCompute && isLoading && (
        <Card className="border-border">
          <CardContent className="py-8 space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      )}

      {canCompute && !isLoading && result && (
        <ResultCard result={result} isCleaned={materialRequiresCleaning && isCleaned} quantityGrams={quantityGrams} />
      )}
    </>
  );
}

function BatchMode({
  allMaterials, processes, materialsLoading, processesLoading, isCustomId, getCustomMat,
}: SharedProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<BatchRow[]>([makeRow()]);
  const [processId, setProcessId] = useState("");
  const [targetMargin, setTargetMargin] = useState(20);
  const [electricityPrice, setElectricityPrice] = useState(0.8);
  const [result, setResult] = useState<PurchasePriceBatchResult | null>(null);

  const batchMutation = useCalculatePurchasePriceBatch();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);

  const addRow = () => setRows((r) => [...r, makeRow()]);
  const removeRow = (id: string) => setRows((r) => r.length > 1 ? r.filter((row) => row.id !== id) : r);
  const updateRow = (id: string, patch: Partial<BatchRow>) =>
    setRows((r) => r.map((row) => row.id === id ? { ...row, ...patch } : row));

  const validRows = rows.filter((r) => r.materialId && parseFloat(r.quantityKg) > 0);
  const canCompute = validRows.length > 0 && Boolean(processId);

  useEffect(() => {
    if (!canCompute) { setResult(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const seq = ++seqRef.current;
    debounceRef.current = setTimeout(() => {
      batchMutation.mutate(
        {
          data: {
            batch: validRows.map((r) => {
              const customMat = isCustomId(r.materialId) ? getCustomMat(r.materialId) : null;
              const matName = allMaterials.find((m) => m.id === r.materialId)?.name;
              return {
                materialId: r.materialId,
                quantityKg: parseFloat(r.quantityKg),
                isCleaned: r.isCleaned || undefined,
                name: customMat ? customMat.name : matName,
                ...(customMat ? { inlineMetalContent: getInlineContent(customMat) } : {}),
              };
            }),
            processId,
            targetMarginPercent: targetMargin,
            electricityPricePerKwh: electricityPrice,
          },
        },
        {
          onSuccess: (data) => { if (seq === seqRef.current) setResult(data); },
        },
      );
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [rows, processId, targetMargin, electricityPrice]);

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">{t("purchase.batchTitle")}</CardTitle>
          <CardDescription>{t("purchase.batchSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row, idx) => (
            <BatchRowItem
              key={row.id}
              row={row}
              index={idx}
              allMaterials={allMaterials}
              materialsLoading={materialsLoading}
              isCustomId={isCustomId}
              onChangeMaterial={(v) => updateRow(row.id, { materialId: v, isCleaned: false })}
              onChangeQty={(v) => updateRow(row.id, { quantityKg: v })}
              onToggleCleaned={() => updateRow(row.id, { isCleaned: !row.isCleaned })}
              onRemove={() => removeRow(row.id)}
              canRemove={rows.length > 1}
            />
          ))}
          <Button variant="outline" size="sm" className="w-full gap-1.5 mt-1" onClick={addRow}>
            <Plus className="h-3.5 w-3.5" />
            {t("purchase.addMaterial")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">{t("purchase.paramsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProcessSliders
            processId={processId} setProcessId={setProcessId}
            targetMargin={targetMargin} setTargetMargin={setTargetMargin}
            electricityPrice={electricityPrice} setElectricityPrice={setElectricityPrice}
            processes={processes} processesLoading={processesLoading}
          />
        </CardContent>
      </Card>

      {!canCompute && (
        <Card className="border-dashed border-border bg-muted/20">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t("purchase.addMaterialsToSeeResult")}</p>
          </CardContent>
        </Card>
      )}

      {canCompute && batchMutation.isPending && (
        <Card className="border-border">
          <CardContent className="py-8 space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      )}

      {canCompute && !batchMutation.isPending && result && (
        <BatchResultCard result={result} />
      )}
    </>
  );
}

function BatchRowItem({
  row, index, allMaterials, materialsLoading, isCustomId,
  onChangeMaterial, onChangeQty, onToggleCleaned, onRemove, canRemove,
}: {
  row: BatchRow;
  index: number;
  allMaterials: SharedProps["allMaterials"];
  materialsLoading: boolean;
  isCustomId: (id: string) => boolean;
  onChangeMaterial: (v: string) => void;
  onChangeQty: (v: string) => void;
  onToggleCleaned: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { t } = useTranslation();
  const checkId = useId();
  const selectedMat = allMaterials.find((m) => m.id === row.materialId);
  const requiresCleaning = !isCustomId(row.materialId) && selectedMat?.requiresCleaning === true;

  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-2">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs font-mono text-muted-foreground w-5">{index + 1}.</span>
        <span className="text-xs text-muted-foreground font-medium flex-1">{t("purchase.materialAndMass")}</span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <MaterialGroupedSelect
            value={row.materialId}
            onValueChange={onChangeMaterial}
            allMaterials={allMaterials}
            materialsLoading={materialsLoading}
            placeholder={t("calculator.selectMaterial")}
          />
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            className="w-6 h-9 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors disabled:opacity-40 shrink-0"
            onClick={() => {
              const cur = parseFloat(row.quantityKg) || 0;
              onChangeQty(String(Math.max(0, Math.round((cur - 0.001) * 1000) / 1000)));
            }}
            disabled={!row.quantityKg || parseFloat(row.quantityKg) <= 0}
          >−</button>
          <div className="relative w-24">
            <Input
              type="number"
              min="0.001"
              step="0.001"
              placeholder="0.000"
              value={row.quantityKg}
              onChange={(e) => onChangeQty(e.target.value)}
              className="pr-6 font-mono text-sm text-center"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              kg
            </span>
          </div>
          <button
            type="button"
            className="w-6 h-9 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors shrink-0"
            onClick={() => {
              const cur = parseFloat(row.quantityKg) || 0;
              onChangeQty(String(Math.round((cur + 0.001) * 1000) / 1000));
            }}
          >+</button>
        </div>
      </div>
      {requiresCleaning && (
        <div className="flex items-center gap-2 pt-0.5">
          <Checkbox id={checkId} checked={row.isCleaned} onCheckedChange={onToggleCleaned} className="h-3.5 w-3.5" />
          <label htmlFor={checkId} className="text-xs text-amber-600 dark:text-amber-400 cursor-pointer select-none flex items-center gap-1">
            <Sparkles className="h-3 w-3 shrink-0" />
            {t("purchase.cleaned")}
          </label>
        </div>
      )}
    </div>
  );
}

function BatchResultCard({ result }: { result: PurchasePriceBatchResult }) {
  const { t } = useTranslation();
  const isPricePositive = result.maxPurchasePricePerKgPln > 0;

  return (
    <Card className={cn(
      "border-2",
      result.isBreakEven ? "border-amber-500/50"
        : isPricePositive ? "border-success/40"
        : "border-destructive/40",
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            {t("purchase.maxPurchaseBatch")}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {result.isBreakEven && (
              <Badge variant="outline" className="border-amber-400 text-amber-400 text-xs">{t("purchase.breakEven")}</Badge>
            )}
            {!result.isProfitable && (
              <Badge variant="destructive" className="text-xs">{t("purchase.notProfitable")}</Badge>
            )}
            {result.isProfitable && !result.isBreakEven && (
              <Badge className="bg-success/20 text-success border-success/30 text-xs">{t("purchase.profitable")}</Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-xs">
          {result.processName} · {t("purchase.batch")}: {result.totalQuantityKg} kg {t("purchase.total")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center py-4 bg-muted/30 rounded-xl border border-border col-span-2">
            <div className={cn(
              "text-5xl font-mono font-extrabold tracking-tight",
              isPricePositive ? "text-success" : "text-destructive",
            )}>
              {isPricePositive
                ? formatCurrency(result.maxPurchasePricePerKgPln)
                : result.maxPurchasePricePerKgPln === 0 ? formatCurrency(0)
                : `−${formatCurrency(Math.abs(result.maxPurchasePricePerKgPln))}`}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{t("purchase.perKgMix")}</div>
          </div>
          <div className="text-center py-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-2xl font-mono font-bold text-primary">
              {isPricePositive
                ? formatCurrency(result.maxPurchasePriceTotalPln)
                : `−${formatCurrency(Math.abs(result.maxPurchasePriceTotalPln))}`}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{t("purchase.totalForBatch")}</div>
          </div>
          <div className="text-center py-3 bg-muted/20 rounded-lg border border-border">
            <div className="text-2xl font-mono font-bold text-foreground">
              {result.totalQuantityKg} kg
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{t("purchase.batchMassTotal")}</div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">
            {t("purchase.breakdownWeighted")}
          </h4>
          <BreakdownRow icon={<TrendingUp className="h-4 w-4 text-success" />} label={t("purchase.revenueFromMetals")} value={result.revenuePerKgPln} variant="positive" />
          <BreakdownRow icon={<Beaker className="h-4 w-4 text-muted-foreground" />} label={t("purchase.chemistryCost")} value={result.chemistryCostPerKgPln} variant="negative" />
          <BreakdownRow icon={<Zap className="h-4 w-4 text-muted-foreground" />} label={t("purchase.electricityCost")} value={result.electricityCostPerKgPln} variant="negative" />
          <Separator className="my-2" />
          <BreakdownRow
            icon={result.grossProfitPerKgPln >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
            label={t("purchase.grossProfit")}
            value={result.grossProfitPerKgPln}
            variant={result.grossProfitPerKgPln >= 0 ? "positive" : "negative"}
            bold
          />
          {result.targetMarginPercent > 0 && (
            <BreakdownRow icon={<Minus className="h-4 w-4 text-muted-foreground" />} label={`${t("purchase.targetMargin")} (${result.targetMarginPercent}%)`} value={result.grossProfitPerKgPln * (result.targetMarginPercent / 100)} variant="neutral" />
          )}
          <Separator className="my-2" />
          <BreakdownRow icon={<ShoppingCart className="h-4 w-4 text-primary" />} label={t("purchase.maxPurchaseWeighted")} value={result.maxPurchasePricePerKgPln} variant={result.maxPurchasePricePerKgPln > 0 ? "positive" : "negative"} bold highlight />
        </div>

        {result.breakdown && result.breakdown.length > 1 && (
          <>
            <Separator />
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {t("purchase.breakdownPerMaterial")}
              </h4>
              <div className="space-y-2">
                {result.breakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border border-border/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.materialName}
                        {item.isCleaned && (
                          <span className="ml-1.5 text-xs text-amber-500 inline-flex items-center gap-0.5">
                            <Sparkles className="h-3 w-3" />{t("purchase.cleaned")}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.quantityKg} kg · {t("purchase.revenue")} {formatCurrency(item.revenuePerKgPln)}/kg
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-sm font-bold font-mono", item.maxPurchasePricePerKgPln > 0 ? "text-success" : "text-destructive")}>
                        {formatCurrency(Math.abs(item.maxPurchasePricePerKgPln))}/kg
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        = {formatCurrency(Math.abs(item.maxPurchasePriceTotalPln))} {t("purchase.total")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ResultCard({ result, isCleaned, quantityGrams }: { result: PurchasePriceResult; isCleaned?: boolean; quantityGrams?: number | null }) {
  const { t } = useTranslation();
  const price = result.maxPurchasePricePerKgPln;
  const isPricePositive = price > 0;
  const priceColor = isPricePositive ? "text-success" : "text-destructive";
  const totalPln = (quantityGrams != null && quantityGrams > 0)
    ? price * (quantityGrams / 1000)
    : null;

  return (
    <Card className={cn(
      "border-2",
      result.isBreakEven ? "border-amber-500/50"
        : isPricePositive ? "border-success/40"
        : "border-destructive/40",
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            {t("purchase.maxPurchase")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {result.isBreakEven && (
              <Badge variant="outline" className="border-amber-400 text-amber-400 text-xs">{t("purchase.breakEven")}</Badge>
            )}
            {!result.isProfitable && (
              <Badge variant="destructive" className="text-xs">{t("purchase.notProfitable")}</Badge>
            )}
            {result.isProfitable && !result.isBreakEven && (
              <Badge className="bg-success/20 text-success border-success/30 text-xs">{t("purchase.profitable")}</Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-xs flex items-center gap-2 flex-wrap">
          <span>{result.materialName} · {result.processName}</span>
          {isCleaned && (
            <span className="inline-flex items-center gap-0.5 font-medium text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded px-1.5 py-0.5">
              <Sparkles className="h-3 w-3" />
              {t("purchase.cleaned")}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-center py-4 bg-muted/30 rounded-xl border border-border">
          <div className={cn("text-5xl font-mono font-extrabold tracking-tight", priceColor)}>
            {isPricePositive ? formatCurrency(price) : price === 0 ? formatCurrency(0) : `−${formatCurrency(Math.abs(price))}`}
          </div>
          <div className="text-sm text-muted-foreground mt-1">{t("purchase.perKgRaw")}</div>
          {!isPricePositive && (
            <p className="text-xs text-destructive mt-2 px-4">
              {t("purchase.notProfitableDesc")}
            </p>
          )}
        </div>

        {totalPln !== null && (
          <div className={cn(
            "flex items-center justify-between px-4 py-3 rounded-xl border-2 font-mono",
            totalPln > 0
              ? "bg-success/10 border-success/40 text-success"
              : "bg-destructive/10 border-destructive/40 text-destructive",
          )}>
            <span className="text-sm font-semibold not-italic">
              {t("purchase.for")} {quantityGrams! >= 1000
                ? `${(quantityGrams! / 1000).toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kg`
                : `${quantityGrams} g`}
            </span>
            <span className="text-2xl font-extrabold">
              {totalPln >= 0 ? formatCurrency(totalPln) : `−${formatCurrency(Math.abs(totalPln))}`}
            </span>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">
            {t("purchase.breakdownPerKg")}
          </h4>
          <BreakdownRow icon={<TrendingUp className="h-4 w-4 text-success" />} label={t("purchase.revenueFromMetals")} value={result.revenuePerKgPln} variant="positive" />
          <BreakdownRow icon={<Beaker className="h-4 w-4 text-muted-foreground" />} label={t("purchase.chemistryCost")} value={result.chemistryCostPerKgPln} variant="negative" />
          <BreakdownRow icon={<Zap className="h-4 w-4 text-muted-foreground" />} label={t("purchase.electricityCost")} value={result.electricityCostPerKgPln} variant="negative" />
          <Separator className="my-2" />
          <BreakdownRow
            icon={result.grossProfitPerKgPln >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
            label={t("purchase.grossProfit")}
            value={result.grossProfitPerKgPln}
            variant={result.grossProfitPerKgPln >= 0 ? "positive" : "negative"}
            bold
          />
          {result.targetMarginPercent > 0 && (
            <BreakdownRow icon={<Minus className="h-4 w-4 text-muted-foreground" />} label={`${t("purchase.targetMargin")} (${result.targetMarginPercent}%)`} value={result.grossProfitPerKgPln * (result.targetMarginPercent / 100)} variant="neutral" />
          )}
          <Separator className="my-2" />
          <BreakdownRow icon={<ShoppingCart className="h-4 w-4 text-primary" />} label={t("purchase.maxPurchaseRaw")} value={result.maxPurchasePricePerKgPln} variant={result.maxPurchasePricePerKgPln > 0 ? "positive" : "negative"} bold highlight />
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownRow({
  icon, label, value, variant, bold = false, highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant: "positive" | "negative" | "neutral";
  bold?: boolean;
  highlight?: boolean;
}) {
  const valueColor =
    variant === "positive" ? "text-success"
    : variant === "negative" ? "text-destructive"
    : "text-muted-foreground";

  return (
    <div className={cn("flex items-center justify-between gap-3 py-1.5 px-2 rounded", highlight && "bg-primary/10 border border-primary/20")}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1 min-w-0">
        {icon}
        <span className={cn("truncate", bold && "font-semibold text-foreground")}>{label}</span>
      </div>
      <span className={cn("font-mono text-sm shrink-0", valueColor, bold && "font-bold")}>
        {variant === "negative" ? "−" : variant === "positive" && value > 0 ? "+" : ""}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
