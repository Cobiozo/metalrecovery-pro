import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Camera, Upload, ScanLine, Loader2, AlertTriangle, Info,
  FlaskConical, Star, CheckCircle2, XCircle, Sparkles,
  ChevronRight, ImageIcon, RotateCcw, ShoppingCart, Calculator, Scale,
  Flag,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
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

type BoundingBox = { cx: number; cy: number };

type VisionItem = {
  materialType: string;
  description: string;
  quantity: number;
  massGrams?: number | null;
  individualBoxes?: BoundingBox[] | null;
  metalContent: {
    Au: MetalEstimate;
    Ag: MetalEstimate;
    Pt: MetalEstimate;
    Pd: MetalEstimate;
  };
  platingAnalysis: PlatingAnalysis;
  recommendedProcess: string;
};

type ScaleReading = {
  detected: boolean;
  weightGrams?: number | null;
  confidence: "low" | "medium" | "high";
  displayText?: string | null;
};

type VisionResultSet = {
  items: VisionItem[];
  caveats: string;
  scaleReading?: ScaleReading;
};

function getApiBase(): string {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/api`;
}

function getVisionApiBase(): string {
  const override = import.meta.env.VITE_VISION_API_URL;
  if (override) return override.replace(/\/$/, "");
  return getApiBase();
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

const COLOR_PL: Record<string, string> = {
  gold: "złoty", silver: "srebrny", nickel: "niklowy", mixed: "mieszany",
  "złoty": "złoty", "srebrny": "srebrny", "niklowy": "niklowy", "mieszany": "mieszany",
};
const THICKNESS_PL: Record<string, string> = {
  "thin (<0.1μm)": "cienkie (<0,1μm)",
  "medium (0.1-0.5μm)": "średnie (0,1-0,5μm)",
  "thick (>0.5μm)": "grube (>0,5μm)",
  "thin": "cienkie (<0,1μm)",
  "medium": "średnie (0,1-0,5μm)",
  "thick": "grube (>0,5μm)",
};
function translateColor(v?: string | null): string | null {
  if (!v) return null;
  return COLOR_PL[v.toLowerCase()] ?? v;
}
function translateThickness(v?: string | null): string | null {
  if (!v) return null;
  return THICKNESS_PL[v.toLowerCase()] ?? THICKNESS_PL[v] ?? v;
}

const QUALITY_AU_MULTIPLIER: Record<number, number> = {
  1: 0.65, 2: 0.80, 3: 1.00, 4: 1.20, 5: 1.40,
};
function applyQualityToAu(au: number, quality: number | null | undefined): number {
  if (!quality) return au;
  return au * (QUALITY_AU_MULTIPLIER[quality] ?? 1.0);
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

function CorrectionDialog({
  open,
  onClose,
  aiMaterialType,
  imageDescription,
  authHeaders,
  toast,
}: {
  open: boolean;
  onClose: () => void;
  aiMaterialType: string;
  imageDescription?: string;
  authHeaders: () => Record<string, string>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [correctMaterial, setCorrectMaterial] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const trimmed = correctMaterial.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBase()}/vision/correction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          aiMaterialType,
          correctMaterialType: trimmed,
          correctionNote: note.trim() || undefined,
          imageDescription: imageDescription || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Dziękujemy za zgłoszenie!", description: "Korekta zostanie sprawdzona przez administratora." });
      setCorrectMaterial("");
      setNote("");
      onClose();
    } catch {
      toast({ title: "Błąd", description: "Nie udało się wysłać korekty. Spróbuj ponownie.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flag className="w-4 h-4 text-orange-400" />
            Zgłoś błędną klasyfikację
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">AI sklasyfikowało jako:</p>
            <p className="text-sm font-medium bg-muted/50 rounded px-3 py-2 border border-border">
              {aiMaterialType}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold block">
              Właściwy materiał <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={correctMaterial}
              onChange={(e) => setCorrectMaterial(e.target.value)}
              placeholder="np. Stacja dokująca Dell WD22..."
              className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold block">
              Uwagi (opcjonalnie)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Dodatkowy opis widocznych cech materiału..."
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Twoja korekta zostanie przesłana do administratora. Po weryfikacji poprawi dokładność przyszłych analiz AI.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Anuluj
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!correctMaterial.trim() || submitting}
            onClick={submit}
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
            Wyślij korektę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VisionResultCard({
  result,
  onSaveProfile,
  onQuantityChange,
  weightPerPieceKg,
  initialMassKg,
  authHeaders,
  isLoggedIn,
}: {
  result: VisionItem;
  onSaveProfile: () => void;
  onQuantityChange: (qty: number) => void;
  weightPerPieceKg?: number;
  initialMassKg?: number | null;
  authHeaders: () => Record<string, string>;
  isLoggedIn: boolean;
}) {
  const { toast } = useToast();
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const scaleMode = initialMassKg != null && initialMassKg > 0;
  const [qty, setQty] = useState<number>(
    scaleMode ? initialMassKg : (result.quantity > 0 ? result.quantity : 0)
  );

  const updateQty = (next: number) => {
    const safe = Math.max(0, Math.round(scaleMode ? next * 1000 : next) / (scaleMode ? 1000 : 1));
    setQty(safe);
    onQuantityChange(safe);
  };

  const metals = [
    { key: "Au" as const, label: "Złoto (Au)", color: "text-yellow-400" },
    { key: "Ag" as const, label: "Srebro (Ag)", color: "text-slate-300" },
    { key: "Pt" as const, label: "Platyna (Pt)", color: "text-sky-400" },
    { key: "Pd" as const, label: "Pallad (Pd)", color: "text-purple-400" },
  ];

  const isNonEwaste = result.materialType.toLowerCase().startsWith("nieelektroniczne");

  return (
    <div className="space-y-4">
      {isNonEwaste && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">To nie jest złom elektroniczny</p>
            <p className="text-xs text-red-400/80 mt-0.5 leading-relaxed">
              Zdjęcie nie przedstawia komponentu elektronicznego. Szacunki zawartości metali nie mają zastosowania.
            </p>
          </div>
        </div>
      )}

      <Card className={cn("border-primary/30", isNonEwaste ? "bg-muted/30" : "bg-primary/5")}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-md mt-0.5", isNonEwaste ? "bg-muted" : "bg-primary/10")}>
              <ScanLine className={cn("w-5 h-5", isNonEwaste ? "text-muted-foreground" : "text-primary")} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{result.materialType}</CardTitle>
              </div>
              <CardDescription className="text-sm mt-1 leading-relaxed">
                {result.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          {scaleMode ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                <Scale className="w-3 h-3" />
                Masa (kg):
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors disabled:opacity-40"
                  onClick={() => updateQty(Math.max(0, qty - 0.005))}
                  disabled={qty <= 0}
                  aria-label="Zmniejsz masę"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  step={0.001}
                  value={qty.toFixed(3)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= 0) updateQty(v);
                  }}
                  className="w-20 h-7 text-center text-sm font-mono bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors"
                  onClick={() => updateQty(qty + 0.005)}
                  aria-label="Zwiększ masę"
                >
                  +
                </button>
              </div>
              <span className="text-xs font-mono text-green-400 flex items-center gap-1">
                <Scale className="w-3 h-3" />
                {Math.round(qty * 1000)} g z wagi
              </span>
              {result.quantity > 0 && (
                <span className="text-xs text-muted-foreground/60">
                  (AI liczyło: ~{result.quantity} szt.)
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground shrink-0">Ilość (szt.):</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors disabled:opacity-40"
                  onClick={() => updateQty(Math.max(0, qty - 1))}
                  disabled={qty <= 0}
                  aria-label="Zmniejsz ilość"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={qty}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 0) updateQty(v);
                  }}
                  className="w-14 h-7 text-center text-sm font-mono bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors"
                  onClick={() => updateQty(qty + 1)}
                  aria-label="Zwiększ ilość"
                >
                  +
                </button>
              </div>
              {result.quantity > 0 && qty !== result.quantity && (
                <span className="text-xs text-muted-foreground italic">
                  (AI: ~{result.quantity})
                </span>
              )}
              {result.quantity > 0 && qty === result.quantity && (
                <span className="text-xs text-muted-foreground/60 font-mono">
                  ~{result.quantity} wg AI
                </span>
              )}
              {weightPerPieceKg && qty > 0 && (
                <span className="text-xs text-blue-400 font-mono">
                  ≈ {(qty * weightPerPieceKg).toFixed(3)} kg
                </span>
              )}
            </div>
          )}
        </CardContent>
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
                  <span className="font-medium">{translateColor(result.platingAnalysis.color)}</span>
                </div>
              )}
              {result.platingAnalysis.thickness && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20 shrink-0">Grubość:</span>
                  <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-400 bg-yellow-500/5">
                    {translateThickness(result.platingAnalysis.thickness)}
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

      {!isNonEwaste && (
        <div className="space-y-2">
          {result.platingAnalysis.quality_1_to_5 && (
            <div className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-md px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <p className="text-xs text-yellow-400/90 leading-snug">
                Jakość złoceń {result.platingAnalysis.quality_1_to_5}/5 uwzględniona w wycenie Au
                {" "}({result.platingAnalysis.quality_1_to_5 >= 4 ? "+" : result.platingAnalysis.quality_1_to_5 <= 2 ? "" : "±"}
                {Math.round((QUALITY_AU_MULTIPLIER[result.platingAnalysis.quality_1_to_5] - 1) * 100)}% Au)
              </p>
            </div>
          )}
          <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground text-xs" onClick={onSaveProfile}>
            <FlaskConical className="w-3.5 h-3.5" />
            Zapisz jako własny profil materiału
          </Button>
        </div>
      )}

      {isLoggedIn && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-orange-400/70 hover:text-orange-400 text-xs border border-orange-500/15 hover:border-orange-500/30 hover:bg-orange-500/5"
          onClick={() => setCorrectionOpen(true)}
        >
          <Flag className="w-3.5 h-3.5" />
          Zgłoś błędną klasyfikację AI
        </Button>
      )}

      <CorrectionDialog
        open={correctionOpen}
        onClose={() => setCorrectionOpen(false)}
        aiMaterialType={result.materialType}
        imageDescription={result.description}
        authHeaders={authHeaders}
        toast={toast}
      />
    </div>
  );
}

function findDbMaterial(
  apiMaterials: Array<{ id: string; name: string; nameEn?: string; catalogHint?: string }> | undefined,
  materialType: string
): string | null {
  if (!apiMaterials || !materialType) return null;
  const query = materialType.toLowerCase().trim();

  // 1. Exact match (AI was given the catalog, so this should usually succeed)
  for (const mat of apiMaterials) {
    if (mat.name.toLowerCase().trim() === query) return mat.id;
  }

  // 2. Substring containment fallback
  for (const mat of apiMaterials) {
    const name = mat.name.toLowerCase();
    const nameEn = (mat.nameEn ?? "").toLowerCase();
    if (name.includes(query) || query.includes(name) || nameEn.includes(query) || query.includes(nameEn)) {
      return mat.id;
    }
  }

  return null;
}

function ScanningAnimation({ photoUrl }: { photoUrl: string }) {
  return (
    <Card className="border-border overflow-hidden">
      <div className="relative w-full">
        {/* Image shows at full natural proportions — no cropping */}
        <img
          src={photoUrl}
          alt="Analizowane zdjęcie"
          className="block w-full h-auto select-none pointer-events-none"
          style={{ maxHeight: "70vh", objectFit: "contain", background: "#0a0a0a" }}
          draggable={false}
        />

        {/* Subtle dark overlay */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Scanned-area tint that grows with the beam */}
        <div className="scan-tint pointer-events-none" />

        {/* Scan beam line */}
        <div className="scan-beam pointer-events-none" />

        {/* Status bar pinned to bottom of image */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
        >
          <span className="scan-dot" />
          <span className="text-xs font-mono text-emerald-300">AI skanuje obraz…</span>
        </div>
      </div>

      <style>{`
        /* Beam sweeps top → bottom, loops */
        .scan-beam {
          position: absolute;
          left: 0; right: 0;
          height: 3px;
          background: linear-gradient(
            90deg,
            transparent  0%,
            #00ffaa 18%,
            #00ffee 50%,
            #00ffaa 82%,
            transparent 100%
          );
          box-shadow: 0 0 16px 6px rgba(0,255,170,0.4);
          animation: scanBeam 2.4s linear infinite;
        }
        @keyframes scanBeam {
          0%   { top: -1%; }
          100% { top: 101%; }
        }

        /* Green shimmer follows the beam */
        .scan-tint {
          position: absolute;
          left: 0; right: 0; top: 0;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0,255,170,0.06) 100%
          );
          animation: scanTint 2.4s linear infinite;
        }
        @keyframes scanTint {
          0%   { height: 0%; }
          100% { height: 100%; }
        }

        /* Blinking status dot */
        .scan-dot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #34d399;
          flex-shrink: 0;
          animation: scanDot 1s ease-in-out infinite;
        }
        @keyframes scanDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `}</style>
    </Card>
  );
}

const ITEM_COLORS = [
  "#00ffaa", "#60a5fa", "#facc15", "#f472b6", "#a78bfa", "#34d399", "#fb923c",
];

function PhotoWithDetections({ photoUrl, items }: { photoUrl: string; items: VisionItem[] }) {
  // Flatten all individual boxes into one list: { bb, label, color }
  const allBoxes = items.flatMap((item, itemIdx) => {
    const color = ITEM_COLORS[itemIdx % ITEM_COLORS.length];
    return (item.individualBoxes ?? []).map((bb) => ({ bb, label: item.materialType, color }));
  });

  const [visCount, setVisCount] = useState(0);

  useEffect(() => {
    setVisCount(0);
    if (allBoxes.length === 0) return;
    let i = 0;
    let tid: ReturnType<typeof setTimeout>;
    const next = () => {
      if (i >= allBoxes.length) return;
      // faster reveal for many items
      const delay = allBoxes.length > 10 ? 80 : 200;
      tid = setTimeout(() => { i++; setVisCount(i); next(); }, delay);
    };
    const init = setTimeout(next, 150);
    return () => { clearTimeout(init); clearTimeout(tid); };
  }, [photoUrl]);

  return (
    <div className="rounded-xl border border-border overflow-y-auto" style={{ maxHeight: "75vh" }}>
      <div className="relative">
      <img
        src={photoUrl}
        alt="Wynik analizy"
        className="block w-full h-auto select-none"
        draggable={false}
      />
      <div className="absolute inset-0 pointer-events-none">
        {allBoxes.slice(0, visCount).map(({ bb, label, color }, i) => {
          const pcx = Math.max(0, Math.min(bb.cx, 100));
          const pcy = Math.max(0, Math.min(bb.cy, 100));
          const isFirst = i === allBoxes.findIndex((b) => b.label === label);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${pcx}%`,
                top: `${pcy}%`,
                transform: "translate(-50%, -50%)",
                animation: "detPinIn 0.2s cubic-bezier(.17,.67,.35,1.5) both",
              }}
            >
              {/* outer ring */}
              <span style={{
                position: "absolute",
                inset: "-6px",
                borderRadius: "50%",
                border: `2px solid ${color}`,
                opacity: 0.7,
              }} />
              {/* solid dot */}
              <span style={{
                display: "block",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 4px 1px ${color}99`,
              }} />
              {/* label on first pin only — flip side based on position */}
              {isFirst && (
                <span style={{
                  position: "absolute",
                  // near top → show below dot; near bottom → show above; default above
                  top: pcy < 12 ? "1.1em" : "-1.7em",
                  // near right edge → align right; otherwise center
                  left: pcx > 80 ? "auto" : "50%",
                  right: pcx > 80 ? "0" : "auto",
                  transform: pcx > 80 ? "none" : "translateX(-50%)",
                  whiteSpace: "nowrap",
                  fontSize: "9px",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color,
                  background: "rgba(0,0,0,0.85)",
                  padding: "1px 5px",
                  borderRadius: "3px",
                  border: `1px solid ${color}66`,
                  maxWidth: "18ch",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes detPinIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(2); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
      </div>
    </div>
  );
}

export function PhotoAnalysisPage() {
  const [, navigate] = useLocation();
  const { add } = useCustomMaterials();
  const { toast } = useToast();
  const { authHeaders, user } = useAuth();
  const { data: apiMaterials } = useGetElectronicMaterials();

  function resolveItemMaterial(item: VisionItem): string {
    const quality = item.platingAnalysis.quality_1_to_5 ?? null;
    const adjustedAu = applyQualityToAu(item.metalContent.Au.value_g_per_kg, quality);
    const dbId = findDbMaterial(apiMaterials, item.materialType);
    if (dbId) return dbId;
    const mat = add({
      name: item.materialType,
      au: adjustedAu,
      ag: item.metalContent.Ag.value_g_per_kg,
      pt: item.metalContent.Pt.value_g_per_kg,
      pd: item.metalContent.Pd.value_g_per_kg,
      notes: `Analiza AI ${new Date().toLocaleDateString("pl-PL")}. Pewność: Au ${confidenceLabel(item.metalContent.Au.confidence)}, Ag ${confidenceLabel(item.metalContent.Ag.confidence)}.${quality ? ` Jakość złoceń: ${quality}/5.` : ""}`,
    });
    return mat.id;
  }

  function isKgMaterialWithPieceWeight(materialId: string): boolean {
    const mat = apiMaterials?.find(m => m.id === materialId) as any;
    return !!(mat && mat.unit === "kg" && mat.weightPerPiece > 0);
  }

  function getWeightPerPieceKg(materialType: string): number | undefined {
    const dbId = findDbMaterial(apiMaterials, materialType);
    if (!dbId) return undefined;
    const mat = apiMaterials?.find(m => m.id === dbId) as any;
    return (mat?.unit === "kg" && mat?.weightPerPiece > 0) ? mat.weightPerPiece : undefined;
  }

  function navigateAll(
    items: VisionItem[],
    quantities: number[],
    dest: string,
  ) {
    const ewaste = items
      .map((item, i) => ({ item, qty: quantities[i] ?? Math.max(1, item.quantity || 1) }))
      .filter(({ item }) => !item.materialType.toLowerCase().startsWith("nieelektroniczne"));

    if (ewaste.length === 0) return;

    try {
      if (ewaste.length === 1) {
        const { item, qty } = ewaste[0];
        const quality = item.platingAnalysis.quality_1_to_5 ?? null;
        const materialId = resolveItemMaterial(item);
        const scaleBased = item.massGrams != null && item.massGrams > 0;
        const usesPieces = !scaleBased && isKgMaterialWithPieceWeight(materialId);
        localStorage.setItem("metalrecovery_vision_new_material", materialId);
        if (qty > 0) {
          localStorage.setItem("metalrecovery_vision_quantity", String(qty));
        } else {
          localStorage.removeItem("metalrecovery_vision_quantity");
        }
        if (usesPieces) {
          localStorage.setItem("metalrecovery_vision_unit_override", "piece");
        } else {
          localStorage.removeItem("metalrecovery_vision_unit_override");
        }
        if (quality) {
          localStorage.setItem("metalrecovery_vision_plating_quality", String(quality));
        } else {
          localStorage.removeItem("metalrecovery_vision_plating_quality");
        }
        localStorage.removeItem("metalrecovery_vision_batch");
      } else {
        const batch = ewaste.map(({ item, qty }) => {
          const quality = item.platingAnalysis.quality_1_to_5 ?? null;
          const auMult = quality ? (QUALITY_AU_MULTIPLIER[quality] ?? 1.0) : undefined;
          const materialId = resolveItemMaterial(item);
          const scaleBased = item.massGrams != null && item.massGrams > 0;
          const usesPieces = !scaleBased && isKgMaterialWithPieceWeight(materialId);
          return {
            materialId,
            quantity: Math.max(scaleBased ? 0.001 : 1, qty),
            ...(usesPieces ? { unitOverride: "piece" as const } : {}),
            ...(auMult !== undefined && auMult !== 1.0 ? { auMultiplier: auMult } : {}),
          };
        });
        localStorage.setItem("metalrecovery_vision_batch", JSON.stringify(batch));
        localStorage.removeItem("metalrecovery_vision_new_material");
        localStorage.removeItem("metalrecovery_vision_quantity");
        localStorage.removeItem("metalrecovery_vision_plating_quality");
        localStorage.removeItem("metalrecovery_vision_unit_override");
      }
    } catch {
      // private mode
    }
    navigate(dest);
  }

  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisionResultSet | null>(null);
  const [editedQuantities, setEditedQuantities] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveItem, setSaveItem] = useState<VisionItem | null>(null);

  useEffect(() => {
    fetch(`${getVisionApiBase()}/vision/status`)
      .then((r) => r.json())
      .then((d: { available: boolean }) => setAiAvailable(d.available))
      .catch(() => setAiAvailable(false));
  }, []);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanAreaRef = useRef<HTMLDivElement>(null);

  // Normalize EXIF orientation via Canvas before upload.
  // The browser auto-corrects EXIF rotation when rendering, but the raw file buffer
  // sent to the AI has the unrotated pixels → coordinates would be systematically wrong.
  // Drawing through Canvas flattens EXIF rotation so the AI sees the same image
  // the user sees.
  const normalizeImage = useCallback((file: File): Promise<{ blob: Blob; url: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const rawUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(rawUrl);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve({ blob: file, url: URL.createObjectURL(file) }); return; }
            resolve({ blob, url: URL.createObjectURL(blob) });
          },
          "image/jpeg",
          0.92,
        );
      };
      img.onerror = () => resolve({ blob: file, url: rawUrl });
      img.src = rawUrl;
    });
  }, []);

  const handleFileSelect = useCallback(async (selected: File) => {
    setResult(null);
    setError(null);
    const { blob, url } = await normalizeImage(selected);
    setFile(new File([blob], selected.name, { type: "image/jpeg" }));
    setPreview(url);
  }, [normalizeImage]);

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
    setTimeout(() => {
      scanAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    try {
      const formData = new FormData();
      formData.append("image", file);
      if (apiMaterials && apiMaterials.length > 0) {
        formData.append(
          "materialCatalog",
          JSON.stringify(apiMaterials.map((m) => ({ id: m.id, name: m.name, nameEn: m.nameEn, catalogHint: m.catalogHint }))),
        );
      }

      const response = await fetch(`${getVisionApiBase()}/vision/analyze`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? `Błąd serwera (${response.status})`);
      }

      const parsed = data as VisionResultSet;
      setResult(parsed);
      setEditedQuantities(parsed.items.map((i: VisionItem) => {
        if (i.massGrams != null && i.massGrams > 0) return i.massGrams / 1000;
        return Math.max(0, i.quantity || 0);
      }));
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
    setEditedQuantities([]);
    setError(null);
    setSaveItem(null);
  };

  const ewasteItems = result?.items.filter(
    (i) => !i.materialType.toLowerCase().startsWith("nieelektroniczne"),
  ) ?? [];

  if (aiAvailable === false) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight flex items-center gap-2">
            <ScanLine className="h-6 w-6 text-primary" />
            Analiza zdjęcia
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Rozpoznawanie metali ze zdjęcia przy pomocy AI
          </p>
        </div>
        <Card className="border-border">
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="bg-muted p-4 rounded-full">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-base">Funkcja AI niedostępna na tym serwerze</p>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm">
                Analiza zdjęć wymaga klucza API OpenAI. Skontaktuj się z administratorem serwisu.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold font-sans tracking-tight flex items-center gap-2">
          <ScanLine className="h-6 w-6 text-primary" />
          Analiza zdjęcia
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Zrób zdjęcie złomu elektronicznego, a AI oszacuje zawartość Au/Ag/Pt/Pd i oceni jakość złoceń
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
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
      </div>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />

      {error && (
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Błąd analizy</p>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && preview && (
        <div ref={scanAreaRef}>
          <ScanningAnimation photoUrl={preview} />
        </div>
      )}
      {loading && !preview && (
        <div className="max-w-2xl mx-auto">
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
        </div>
      )}

      {result && !loading && preview && (
        <PhotoWithDetections photoUrl={preview} items={result.items} />
      )}

      {result && !loading && (
        <div className="max-w-2xl mx-auto space-y-4">
          {result.scaleReading?.detected && result.scaleReading.weightGrams != null && (
            <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
              <Scale className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
                  Waga wykryta
                  <Badge variant="outline" className={cn("text-xs", confidenceColor(result.scaleReading.confidence))}>
                    pewność: {confidenceLabel(result.scaleReading.confidence)}
                  </Badge>
                </p>
                <p className="text-xs text-green-400/80 mt-0.5 leading-relaxed">
                  Wskazanie: <span className="font-mono font-bold">{result.scaleReading.displayText ?? `${result.scaleReading.weightGrams} g`}</span>
                  {" "}· całkowita masa: <span className="font-mono font-bold">{result.scaleReading.weightGrams} g</span>
                  . Ilości obliczone na podstawie wskazania wagi, a nie liczby sztuk.
                </p>
              </div>
            </div>
          )}

          {result.items.map((item, idx) => (
            <VisionResultCard
              key={idx}
              result={item}
              weightPerPieceKg={getWeightPerPieceKg(item.materialType)}
              initialMassKg={item.massGrams != null && item.massGrams > 0 ? item.massGrams / 1000 : null}
              onSaveProfile={() => setSaveItem(item)}
              authHeaders={authHeaders}
              isLoggedIn={!!user}
              onQuantityChange={(qty) =>
                setEditedQuantities((prev) => {
                  const next = [...prev];
                  next[idx] = qty;
                  return next;
                })
              }
            />
          ))}

          {result.caveats && (
            <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-md px-3 py-3">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                {result.caveats}
              </p>
            </div>
          )}

          {ewasteItems.length > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-4 space-y-3">
                {result.items.length > 1 && (
                  <p className="text-xs text-muted-foreground text-center">
                    {ewasteItems.length}{" "}
                    {ewasteItems.length === 1 ? "typ materiału" : ewasteItems.length < 5 ? "typy materiałów" : "typów materiałów"}
                    {" "}· jakość złoceń uwzględniona dla każdego osobno
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="gap-2"
                    onClick={() => navigateAll(result.items, editedQuantities, "/")}
                  >
                    <Calculator className="w-4 h-4" />
                    Kalkulator
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigateAll(result.items, editedQuantities, "/skup")}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Skup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
        open={saveItem !== null}
        onOpenChange={(open) => { if (!open) setSaveItem(null); }}
        existing={null}
        onSave={(data) => {
          add(data);
          toast({ title: "Profil zapisany", description: `"${data.name}" dodany do własnych profili` });
          setSaveItem(null);
        }}
        prefill={
          saveItem
            ? {
                name: saveItem.materialType,
                au: saveItem.metalContent.Au.value_g_per_kg,
                ag: saveItem.metalContent.Ag.value_g_per_kg,
                pt: saveItem.metalContent.Pt.value_g_per_kg,
                pd: saveItem.metalContent.Pd.value_g_per_kg,
                notes: `Analiza AI z dnia ${new Date().toLocaleDateString("pl-PL")}. Pewność: Au ${confidenceLabel(saveItem.metalContent.Au.confidence)}, Ag ${confidenceLabel(saveItem.metalContent.Ag.confidence)}.`,
              }
            : undefined
        }
      />
    </div>
  );
}
