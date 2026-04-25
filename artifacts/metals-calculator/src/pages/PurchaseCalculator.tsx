import { useState, useEffect, useRef } from "react";
import {
  useGetElectronicMaterials,
  getGetElectronicMaterialsQueryKey,
  useGetChemicalProcesses,
  getGetChemicalProcessesQueryKey,
  useCalculatePurchasePrice,
  PurchasePriceResult,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, TrendingUp, TrendingDown, Minus, Zap, Beaker, CircleDollarSign, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

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

export function PurchaseCalculatorPage() {
  const [materialId, setMaterialId] = useState("");
  const [processId, setProcessId] = useState("");
  const [targetMargin, setTargetMargin] = useState(20);
  const [electricityPrice, setElectricityPrice] = useState(0.8);
  const [result, setResult] = useState<PurchasePriceResult | null>(null);

  const { data: materials, isLoading: materialsLoading } = useGetElectronicMaterials({
    query: { queryKey: getGetElectronicMaterialsQueryKey() },
  });
  const { data: processes, isLoading: processesLoading } = useGetChemicalProcesses({
    query: { queryKey: getGetChemicalProcessesQueryKey() },
  });

  const purchaseMutation = useCalculatePurchasePrice({
    mutation: {
      onSuccess: (data) => setResult(data),
    },
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!materialId || !processId) {
      setResult(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      purchaseMutation.mutate({
        data: {
          materialId,
          processId,
          targetMarginPercent: targetMargin,
          electricityPricePerKwh: electricityPrice,
        },
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [materialId, processId, targetMargin, electricityPrice]);

  const isLoading = purchaseMutation.isPending;
  const canCompute = Boolean(materialId && processId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-sans tracking-tight flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          Kalkulator skupu
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Oblicz maksymalną cenę zakupu złomu elektronicznego przy założonej marży zysku
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Parametry skupu</CardTitle>
          <CardDescription>Wybierz materiał, proces i oczekiwaną marżę</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
              Materiał
            </Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Wybierz materiał..." />
              </SelectTrigger>
              <SelectContent>
                {materialsLoading ? (
                  <div className="p-2"><Skeleton className="h-4 w-full" /></div>
                ) : (() => {
                  const grouped: Record<string, typeof materials> = {};
                  materials?.forEach((m) => {
                    if (!grouped[m.category]) grouped[m.category] = [];
                    grouped[m.category]!.push(m);
                  });
                  return CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
                    <SelectGroup key={cat}>
                      <SelectLabel className="text-xs font-bold uppercase tracking-wider text-amber-500 px-2 pt-2">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </SelectLabel>
                      {grouped[cat]!.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
              Proces hydrometalurgiczny
            </Label>
            <Select value={processId} onValueChange={setProcessId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Wybierz proces..." />
              </SelectTrigger>
              <SelectContent>
                {processesLoading ? (
                  <div className="p-2"><Skeleton className="h-4 w-full" /></div>
                ) : (
                  processes?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                Zakładana marża zysku
              </Label>
              <span className="font-mono font-bold text-primary text-lg">
                {targetMargin === 0 ? (
                  <span className="text-amber-400">Próg rentowności</span>
                ) : (
                  `${targetMargin}%`
                )}
              </span>
            </div>
            <Slider
              min={0}
              max={90}
              step={5}
              value={[targetMargin]}
              onValueChange={([v]) => setTargetMargin(v ?? 0)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Próg rentowności (0%)</span>
              <span>90%</span>
            </div>
            {targetMargin === 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 rounded-md px-3 py-2 border border-amber-400/20">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Marża 0% = próg rentowności (break-even): pełny zysk przeznaczony na zakup surowca</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Cena energii elektrycznej
              </Label>
              <span className="font-mono font-bold text-primary">{electricityPrice.toFixed(2)} zł/kWh</span>
            </div>
            <Slider
              min={0.2}
              max={2.0}
              step={0.05}
              value={[electricityPrice]}
              onValueChange={([v]) => setElectricityPrice(v ?? 0.8)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.20 zł/kWh</span>
              <span>2.00 zł/kWh</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!canCompute && (
        <Card className="border-dashed border-border bg-muted/20">
          <CardContent className="py-10 text-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Wybierz materiał i proces, aby zobaczyć wynik</p>
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
        <ResultCard result={result} />
      )}
    </div>
  );
}

function ResultCard({ result }: { result: PurchasePriceResult }) {
  const price = result.maxPurchasePricePerKgPln;
  const isPricePositive = price > 0;

  const priceColor = isPricePositive
    ? "text-success"
    : "text-destructive";

  return (
    <Card className={cn(
      "border-2",
      result.isBreakEven
        ? "border-amber-500/50"
        : isPricePositive
        ? "border-success/40"
        : "border-destructive/40"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            Maksymalna cena skupu
          </CardTitle>
          <div className="flex items-center gap-2">
            {result.isBreakEven && (
              <Badge variant="outline" className="border-amber-400 text-amber-400 text-xs">
                Próg rentowności
              </Badge>
            )}
            {!result.isProfitable && (
              <Badge variant="destructive" className="text-xs">
                Proces nieopłacalny
              </Badge>
            )}
            {result.isProfitable && !result.isBreakEven && (
              <Badge className="bg-success/20 text-success border-success/30 text-xs">
                Opłacalne
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-xs">
          {result.materialName} · {result.processName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-center py-4 bg-muted/30 rounded-xl border border-border">
          <div className={cn("text-5xl font-mono font-extrabold tracking-tight", priceColor)}>
            {isPricePositive
              ? formatCurrency(price)
              : price === 0
              ? "0,00 zł"
              : `−${formatCurrency(Math.abs(price))}`}
          </div>
          <div className="text-sm text-muted-foreground mt-1">za kg surowca</div>
          {!isPricePositive && (
            <p className="text-xs text-destructive mt-2 px-4">
              Proces nie generuje zysku nawet bez kosztu zakupu surowca.
              Zmień materiał lub wybierz inny proces.
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">
            Rozliczenie per kg surowca
          </h4>
          <BreakdownRow
            icon={<TrendingUp className="h-4 w-4 text-success" />}
            label="Przychód z odzysku metali"
            value={result.revenuePerKgPln}
            variant="positive"
          />
          <BreakdownRow
            icon={<Beaker className="h-4 w-4 text-muted-foreground" />}
            label="Koszt chemii reagentów"
            value={result.chemistryCostPerKgPln}
            variant="negative"
          />
          <BreakdownRow
            icon={<Zap className="h-4 w-4 text-muted-foreground" />}
            label="Koszt energii elektrycznej"
            value={result.electricityCostPerKgPln}
            variant="negative"
          />
          <Separator className="my-2" />
          <BreakdownRow
            icon={
              result.grossProfitPerKgPln >= 0
                ? <TrendingUp className="h-4 w-4 text-success" />
                : <TrendingDown className="h-4 w-4 text-destructive" />
            }
            label="Zysk brutto z przetworzenia"
            value={result.grossProfitPerKgPln}
            variant={result.grossProfitPerKgPln >= 0 ? "positive" : "negative"}
            bold
          />
          {result.targetMarginPercent > 0 && (
            <BreakdownRow
              icon={<Minus className="h-4 w-4 text-muted-foreground" />}
              label={`Zakładana marża (${result.targetMarginPercent}%)`}
              value={result.grossProfitPerKgPln * (result.targetMarginPercent / 100)}
              variant="neutral"
            />
          )}
          <Separator className="my-2" />
          <BreakdownRow
            icon={<ShoppingCart className="h-4 w-4 text-primary" />}
            label="Maks. cena zakupu surowca"
            value={result.maxPurchasePricePerKgPln}
            variant={result.maxPurchasePricePerKgPln > 0 ? "positive" : "negative"}
            bold
            highlight
          />
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownRow({
  icon,
  label,
  value,
  variant,
  bold = false,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant: "positive" | "negative" | "neutral";
  bold?: boolean;
  highlight?: boolean;
}) {
  const valueColor =
    variant === "positive"
      ? "text-success"
      : variant === "negative"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className={cn(
      "flex items-center justify-between gap-3 py-1.5 px-2 rounded",
      highlight && "bg-primary/10 border border-primary/20",
    )}>
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
