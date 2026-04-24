import { useState } from "react";
import { useGetElectronicMaterials, getGetElectronicMaterialsQueryKey, useGetChemicalProcesses, getGetChemicalProcessesQueryKey, useCalculateRecovery, CalculationResult } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { formatCurrency, formatMass, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type BatchItemState = {
  id: string;
  materialId: string;
  quantity: number;
};

export function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<string>("wsad");
  const [batchItems, setBatchItems] = useState<BatchItemState[]>([{ id: '1', materialId: '', quantity: 1 }]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [result, setResult] = useState<CalculationResult | null>(null);

  const { data: materials, isLoading: materialsLoading } = useGetElectronicMaterials({
    query: { queryKey: getGetElectronicMaterialsQueryKey() }
  });

  const { data: processes, isLoading: processesLoading } = useGetChemicalProcesses({
    query: { queryKey: getGetChemicalProcessesQueryKey() }
  });

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

  const handleRemoveBatchItem = (id: string) => {
    if (batchItems.length > 1) {
      setBatchItems(batchItems.filter(item => item.id !== id));
    }
  };

  const handleBatchItemChange = (id: string, field: keyof BatchItemState, value: any) => {
    setBatchItems(batchItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleCalculate = () => {
    if (!selectedProcessId || batchItems.some(i => !i.materialId || i.quantity <= 0)) return;
    
    calculateMutation.mutate({
      data: {
        batch: batchItems.map(item => ({ materialId: item.materialId, quantity: item.quantity })),
        processId: selectedProcessId
      }
    });
  };

  const totalMass = batchItems.reduce((acc, item) => {
    const material = materials?.find(m => m.id === item.materialId);
    if (!material) return acc;
    if (material.unit === 'kg') return acc + item.quantity;
    return acc; // For pieces, we'd need average mass, but API handles it. Just local rough estimate
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sans tracking-tight">Kalkulator Odzysku Metali</h1>
        <p className="text-muted-foreground text-sm mt-1">Precyzyjne szacowanie opłacalności procesów hydrometalurgicznych</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-muted/50 p-1">
          <TabsTrigger value="wsad" className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">1. Wsad (Materiały)</TabsTrigger>
          <TabsTrigger value="proces" disabled={batchItems.some(i => !i.materialId)} className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">2. Parametry Procesu</TabsTrigger>
          <TabsTrigger value="wyniki" disabled={!result} className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">3. Wyniki & Opłacalność</TabsTrigger>
        </TabsList>

        <TabsContent value="wsad" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Definicja Wsadu</CardTitle>
              <CardDescription>Wybierz materiały elektroniczne i określ ich ilość (kg lub sztuki)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {batchItems.map((item, index) => {
                const selectedMaterial = materials?.find(m => m.id === item.materialId);
                return (
                  <div key={item.id} className="flex gap-4 items-start bg-muted/30 p-4 rounded-lg border border-border">
                    <div className="flex-1">
                      <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">Materiał</label>
                      <Select 
                        value={item.materialId} 
                        onValueChange={(val) => handleBatchItemChange(item.id, 'materialId', val)}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Wybierz materiał..." />
                        </SelectTrigger>
                        <SelectContent>
                          {materialsLoading ? (
                            <div className="p-2"><Skeleton className="h-4 w-full" /></div>
                          ) : materials?.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} <span className="text-muted-foreground ml-2">({m.unit})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">Ilość</label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          value={item.quantity} 
                          onChange={(e) => handleBatchItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="bg-background pr-12 font-mono"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                          {selectedMaterial?.unit === 'piece' ? 'szt.' : 'kg'}
                        </span>
                      </div>
                    </div>
                    <div className="pt-7">
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
                disabled={batchItems.some(i => !i.materialId || i.quantity <= 0)}
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
            <CardFooter className="bg-muted/30 border-t border-border flex justify-between items-center py-4">
              <Button variant="ghost" onClick={() => setActiveTab("wsad")}>Wróć do wsadu</Button>
              <Button 
                onClick={handleCalculate} 
                disabled={!selectedProcessId || calculateMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {calculateMutation.isPending ? 'Kalkulowanie...' : 'Uruchom Kalkulację'} <TrendingUp className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
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
                          {result.profitabilityRating.replace('_', ' ')}
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
                      <span className="text-sm text-muted-foreground">Masa całkowita wsadu</span>
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
                    <div className="pt-2">
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab("wsad")}>
                        Nowa Kalkulacja
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
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Zapotrzebowanie Chemiczne</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead>Odczynnik</TableHead>
                          <TableHead className="text-right">Ilość</TableHead>
                          <TableHead className="text-right">Koszt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.chemistryCosts.map((chem) => (
                          <TableRow key={chem.reagentName} className="border-border">
                            <TableCell className="font-medium">{chem.reagentName}</TableCell>
                            <TableCell className="text-right font-mono">{chem.amountLiters.toFixed(2)} L</TableCell>
                            <TableCell className="text-right font-mono font-bold text-destructive">-{formatCurrency(chem.totalCostPln)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
