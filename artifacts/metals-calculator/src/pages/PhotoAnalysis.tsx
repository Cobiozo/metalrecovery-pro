import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Camera, Upload, ScanLine, Loader2, AlertTriangle, Info,
  FlaskConical, Star, CheckCircle2, XCircle, Sparkles,
  ChevronRight, ImageIcon, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomMaterials } from "@/lib/useCustomMaterials";
import { CustomMaterialModal } from "@/components/CustomMaterialModal";
import { useToast } from "@/hooks/use-toast";
import { useGetElectronicMaterials } from "@workspace/api-client-react";

type Confidence = "low" | "medium" | "high";

type MetalEstimate = {
  value_g_per_kg: number;
  confidence: Confidence;
};

type PlatingAnalysis = {
  detected: boolean;
  color?: string;
  thickness?: string;
  quality_1_to_5?: number;
  notes?: string;
};

type VisionResult = {
  materialType: string;
  description: string;
  metalContent: {
    Au: MetalEstimate;
    Ag: MetalEstimate;
    Pt: MetalEstimate;
    Pd: MetalEstimate;
  };
  platingAnalysis: PlatingAnalysis;
  recommendedProcess: string;
  caveats: string;
};

function getApiBase(): string {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/api`;
}

function confidenceLabel(c: Confidence): string {
  return c === "high" ? "wysoka" : c === "medium" ? "średnia" : "niska";
}

function confidenceColor(c: Confidence): string {
  return c === "high"
    ? "border-green-500/50 text-green-400 bg-green-500/10"
    : c === "medium"
    ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
    : "border-red-500/50 text-red-400 bg-red-500/10";
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "w-3.5 h-3.5",
            i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          )}
        />
      ))}
    </span>
  );
}

function VisionResultCard({
  result,
  onSaveProfile,
  onCalculate,
}: {
  result: VisionResult;
  onSaveProfile: () => void;
  onCalculate: () => void;
}) {
  const metals = [
    { key: "Au" as const, label: "Złoto (Au)", color: "text-yellow-400" },
    { key: "Ag" as const, label: "Srebro (Ag)", color: "text-slate-300" },
    { key: "Pt" as const, label: "Platyna (Pt)", color: "text-sky-400" },
    { key: "Pd" as const, label: "Pallad (Pd)", color: "text-purple-400" },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-md mt-0.5">
              <ScanLine className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">{result.materialType}</CardTitle>
              <CardDescription className="text-sm mt-1 leading-relaxed">
                {result.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4" />
            Szacowana zawartość metali
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {metals.map(({ key, label, color }) => {
              const estimate = result.metalContent[key];
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={cn("text-sm font-medium w-24 shrink-0", color)}>{label}</span>
                  <span className="font-mono font-bold text-sm flex-1">
                    {estimate.value_g_per_kg.toFixed(3)} g/kg
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-xs shrink-0", confidenceColor(estimate.confidence))}
                  >
                    {confidenceLabel(estimate.confidence)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Analiza złoceń
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-2">
            {result.platingAnalysis.detected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-sm text-green-400 font-medium">Złocenia wykryte</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">Brak wyraźnych złoceń</span>
              </>
            )}
          </div>
          {result.platingAnalysis.detected && (
            <div className="space-y-2 pl-6">
              {result.platingAnalysis.color && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20 shrink-0">Kolor:</span>
                  <span className="font-medium">{result.platingAnalysis.color}</span>
                </div>
              )}
              {result.platingAnalysis.thickness && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20 shrink-0">Grubość:</span>
                  <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-400 bg-yellow-500/5">
                    {result.platingAnalysis.thickness}
                  </Badge>
                </div>
              )}
              {result.platingAnalysis.quality_1_to_5 !== undefined &&
                result.platingAnalysis.quality_1_to_5 > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20 shrink-0">Jakość:</span>
                  <StarRating value={result.platingAnalysis.quality_1_to_5} />
                  <span className="text-xs text-muted-foreground ml-1">
                    {result.platingAnalysis.quality_1_to_5}/5
                  </span>
                </div>
              )}
              {result.platingAnalysis.notes && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result.platingAnalysis.notes}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="py-4 flex items-center gap-3">
          <FlaskConical className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
              Rekomendowany proces
            </p>
            <p className="text-sm font-medium mt-0.5">{result.recommendedProcess}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button className="flex-1 gap-2" onClick={onSaveProfile}>
          <FlaskConical className="w-4 h-4" />
          Zapisz jako własny profil
        </Button>
        <Button variant="outline" className="flex-1 gap-2" onClick={onCalculate}>
          Przelicz w kalkulatorze
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-400 leading-relaxed">{result.caveats}</p>
      </div>
    </div>
  );
}

function findDbMaterial(
  apiMaterials: Array<{ id: string; name: string; nameEn?: string }> | undefined,
  materialType: string
): string | null {
  if (!apiMaterials || !materialType) return null;
  const query = materialType.toLowerCase().trim();
  for (const mat of apiMaterials) {
    const name = mat.name.toLowerCase();
    const nameEn = (mat.nameEn ?? "").toLowerCase();
    if (name.includes(query) || query.includes(name) || nameEn.includes(query) || query.includes(nameEn)) {
      return mat.id;
    }
  }
  return null;
}

export function PhotoAnalysisPage() {
  const [, navigate] = useLocation();
  const { add } = useCustomMaterials();
  const { toast } = useToast();
  const { data: apiMaterials } = useGetElectronicMaterials();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(selected);
    setPreview(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFileSelect(dropped);
    },
    [handleFileSelect],
  );

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${getApiBase()}/vision/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? `Błąd serwera (${response.status})`);
      }

      setResult(data as VisionResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nieznany błąd";
      setError(msg);
      toast({ title: "Błąd analizy", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const defaultProfileName = result ? result.materialType : "";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-sans tracking-tight flex items-center gap-2">
          <ScanLine className="h-6 w-6 text-primary" />
          Analiza zdjęcia
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Zrób zdjęcie złomu elektronicznego, a AI oszacuje zawartość Au/Ag/Pt/Pd i oceni jakość złoceń
        </p>
      </div>

      {!file ? (
        <Card
          className="border-dashed border-2 border-border hover:border-primary/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <ImageIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base">Przeciągnij zdjęcie tutaj</p>
              <p className="text-muted-foreground text-sm mt-1">lub wybierz plik</p>
              <p className="text-muted-foreground text-xs mt-1">JPG, PNG, WebP · maks. 10 MB</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
              >
                <Camera className="w-4 h-4" />
                Zrób zdjęcie
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="w-4 h-4" />
                Wybierz plik
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border">
          <CardContent className="py-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-20 h-20 rounded-md overflow-hidden border border-border shrink-0 bg-muted">
                {preview && (
                  <img src={preview} alt="Podgląd" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-muted-foreground"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <Button
              className="w-full gap-2"
              disabled={loading}
              onClick={analyze}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizuję zdjęcie...
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" />
                  Analizuj zdjęcie
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Błąd analizy</p>
              <p className="text-xs text-destructive/80 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="border-border">
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative bg-primary/10 p-4 rounded-full">
                <ScanLine className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <p className="font-semibold">Analizuję zdjęcie...</p>
              <p className="text-muted-foreground text-sm mt-1">
                AI rozpoznaje materiał i szacuje zawartość metali (3–8 sek.)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && !loading && (
        <VisionResultCard
          result={result}
          onSaveProfile={() => setSaveModalOpen(true)}
          onCalculate={() => {
            const dbId = findDbMaterial(apiMaterials, result.materialType);
            let materialId: string;
            if (dbId) {
              materialId = dbId;
            } else {
              const mat = add({
                name: result.materialType,
                au: result.metalContent.Au.value_g_per_kg,
                ag: result.metalContent.Ag.value_g_per_kg,
                pt: result.metalContent.Pt.value_g_per_kg,
                pd: result.metalContent.Pd.value_g_per_kg,
                notes: `Analiza AI z dnia ${new Date().toLocaleDateString("pl-PL")}. Pewność: Au ${confidenceLabel(result.metalContent.Au.confidence)}, Ag ${confidenceLabel(result.metalContent.Ag.confidence)}. ${result.caveats}`,
              });
              materialId = mat.id;
            }
            try {
              localStorage.setItem("metalrecovery_vision_new_material", materialId);
            } catch {
              // private mode — silently ignore
            }
            navigate("/");
          }}
        />
      )}

      <Separator />

      <div className="flex items-start gap-2 bg-muted/30 border border-border rounded-md px-3 py-3">
        <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <strong>Zastrzeżenie:</strong> Wyniki analizy AI mają charakter wyłącznie szacunkowy i informacyjny.
          Zawartość metali szlachetnych może się znacznie różnić w zależności od partii, producenta i roku produkcji.
          Przed podjęciem decyzji zakupowych lub procesowych zaleca się wykonanie analizy laboratoryjnej (assay).
          Wynik nie stanowi porady technicznej ani gwarancji odzysku.
        </p>
      </div>

      <CustomMaterialModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        existing={null}
        onSave={(data) => {
          add(data);
          toast({ title: "Profil zapisany", description: `"${data.name}" dodany do własnych profili` });
        }}
        prefill={
          result
            ? {
                name: defaultProfileName,
                au: result.metalContent.Au.value_g_per_kg,
                ag: result.metalContent.Ag.value_g_per_kg,
                pt: result.metalContent.Pt.value_g_per_kg,
                pd: result.metalContent.Pd.value_g_per_kg,
                notes: `Analiza AI z dnia ${new Date().toLocaleDateString("pl-PL")}. Pewność: Au ${confidenceLabel(result.metalContent.Au.confidence)}, Ag ${confidenceLabel(result.metalContent.Ag.confidence)}. ${result.caveats}`,
              }
            : undefined
        }
      />
    </div>
  );
}
