import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Camera, Upload, ScanLine, Loader2, AlertTriangle, Info,
  FlaskConical, Star, CheckCircle2, XCircle, Sparkles,
  ChevronRight, ImageIcon, RotateCcw, ShoppingCart, Calculator, Scale,
  Flag, ChevronsUpDown, Check, Share2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useCustomMaterials } from "@/lib/useCustomMaterials";
import { CustomMaterialModal } from "@/components/CustomMaterialModal";
import { useToast } from "@/hooks/use-toast";
import { useGetElectronicMaterials } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import i18next from "i18next";

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
  return i18next.t(`analysis.confidence.${c}`) as string;
}

function confidenceColor(c: Confidence): string {
  return c === "high"
    ? "border-green-500/50 text-green-400 bg-green-500/10"
    : c === "medium"
    ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
    : "border-red-500/50 text-red-400 bg-red-500/10";
}

function displayMaterialType(materialType: string): string {
  if (i18next.language !== "en") return materialType;
  return materialType
    .replace(/^Nieelektroniczne\s*[—–-]\s*/i, "Non-electronic — ")
    .replace(/^Nieelektroniczne$/i, "Non-electronic");
}

const COLOR_PL: Record<string, string> = {
  gold: "złoty", silver: "srebrny", nickel: "niklowy", mixed: "mieszany",
  "złoty": "złoty", "srebrny": "srebrny", "niklowy": "niklowy", "mieszany": "mieszany",
};
const COLOR_PL_TO_EN: Record<string, string> = {
  "złoty": "gold", "srebrny": "silver", "niklowy": "nickel", "mieszany": "mixed",
};
const THICKNESS_PL: Record<string, string> = {
  "thin (<0.1μm)": "cienkie (<0,1μm)",
  "medium (0.1-0.5μm)": "średnie (0,1-0,5μm)",
  "thick (>0.5μm)": "grube (>0,5μm)",
  "thin": "cienkie (<0,1μm)",
  "medium": "średnie (0,1-0,5μm)",
  "thick": "grube (>0,5μm)",
};
const THICKNESS_PL_TO_EN: Record<string, string> = {
  "cienkie (<0,1μm)": "thin (<0.1μm)",
  "średnie (0,1-0,5μm)": "medium (0.1-0.5μm)",
  "grube (>0,5μm)": "thick (>0.5μm)",
};
function translateColor(v?: string | null): string | null {
  if (!v) return null;
  if (i18next.language === "pl") return COLOR_PL[v.toLowerCase()] ?? v;
  return COLOR_PL_TO_EN[v.toLowerCase()] ?? v;
}
function translateThickness(v?: string | null): string | null {
  if (!v) return null;
  if (i18next.language === "pl") return THICKNESS_PL[v.toLowerCase()] ?? THICKNESS_PL[v] ?? v;
  return THICKNESS_PL_TO_EN[v] ?? v;
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

const CORRECTION_CATEGORIES_PL = [
  { group: "Płyty główne i podzespoły PC", items: [
    "Płyta główna laptopa",
    "Płyta główna desktopa (ATX/mATX)",
    "Karta graficzna GPU",
    "Karta sieciowa / rozszerzenia ISA/PCI",
    "RAM DDR — kości pamięci",
    "SSD / NVMe (płytka)",
    "Dysk twardy HDD",
  ]},
  { group: "Procesory i układy scalone", items: [
    "Procesor ceramiczny (stary CPU — wysoka wartość Au)",
    "Procesor plastikowy (nowy CPU)",
    "Układy scalone ceramiczne DIP (EPROMs, stare CPU — biała/szara ceramika)",
    "Układy scalone plastikowe (DIP/SOIC/QFP)",
  ]},
  { group: "Złącza i styki", items: [
    "Piny/styki złącz elektronicznych (grubo złocone, bez plastiku)",
    "Styki krzyżownicy (kontakty Pd-Ag z central telefonicznych)",
    "Złącza telekomów backplane (TELECOM, przemysłowe)",
    "ZIF / IC test sockets (precyzyjne podstawki IC)",
    "SIMM memory slot connectors",
    "Standardowe podstawki DIP IC (tanie)",
  ]},
  { group: "Serwery i sieć", items: [
    "Serwer rack 1U (całość, z obudową)",
    "Serwer rack 2U (całość, z obudową)",
    "Serwer blade — moduł",
    "Obudowa blade chassis",
    "Serwer wieżowy (całość, z obudową)",
    "Przełącznik sieciowy enterprise (Cisco, HP ProCurve)",
    "NAS (sieciowy zasób dyskowy, bez dysków)",
  ]},
  { group: "Stacje dokujące i huby", items: [
    "Stacja dokująca do laptopa (Dell WD, HP, Lenovo ThinkPad)",
    "Hub USB / replikator portów (niemarkowy, biurowy)",
  ]},
  { group: "Kondensatory", items: [
    "Kondensatory MLCC stare PRE-2000 (wysoka zawartość Pd)",
    "Kondensatory MLCC nowe POST-2000 (niska wartość)",
    "Kondensatory tantalowe SMD",
  ]},
  { group: "Kamery i fotografia", items: [
    "Kamera wideo VHS (całość)",
    "Kamera Hi8 / Video8 (całość)",
    "Kamera cyfrowa / aparat fotograficzny",
    "Kamera Super 8 (filmowa)",
  ]},
  { group: "RTV / elektronika użytkowa", items: [
    "Konsola do gier (retro — Atari, Nintendo, Sega, PlayStation)",
    "Drukarka (laserowa/atramentowa)",
    "Sprzęt audio/video (wieża, amplituner, odtwarzacz)",
    "Oscyloskop / analizator sygnałowy (sprzęt pomiarowy)",
    "Telefon / smartfon",
    "Tablet / iPad",
    "Laptop (całość)",
    "Monitor LCD/CRT",
  ]},
  { group: "Mix elektroniki", items: [
    "Mix PCB — Elektronika Mieszana",
    "Stara elektronika (ogólna)",
    "mini PCIe / M.2 karty WiFi/BT",
    "Podpłytki laptopa (USB, audio, touchpad)",
  ]},
  { group: "Nieelektroniczne", items: [
    "Nieelektroniczne — metal (stal, aluminium, mosiądz)",
    "Nieelektroniczne — plastik/mechanika",
  ]},
];

const CORRECTION_CATEGORIES_EN = [
  { group: "Motherboards & PC Components", items: [
    "Laptop motherboard",
    "Desktop motherboard (ATX/mATX)",
    "GPU graphics card",
    "Network card / ISA/PCI expansion card",
    "RAM DDR memory chips",
    "SSD / NVMe (board)",
    "HDD hard drive",
  ]},
  { group: "CPUs & Integrated Circuits", items: [
    "Ceramic processor (vintage CPU — high Au content)",
    "Plastic processor (modern CPU)",
    "Ceramic DIP ICs (EPROMs, vintage CPUs — white/grey ceramic)",
    "Plastic ICs (DIP/SOIC/QFP)",
  ]},
  { group: "Connectors & Contacts", items: [
    "Electronic connector pins (thick gold-plated, no plastic)",
    "Crossbar switch contacts (Pd-Ag from telephone exchanges)",
    "Telecom backplane connectors (TELECOM, industrial)",
    "ZIF / IC test sockets (precision IC sockets)",
    "SIMM memory slot connectors",
    "Standard DIP IC sockets (low-value)",
  ]},
  { group: "Servers & Networking", items: [
    "Rack server 1U (complete, with chassis)",
    "Rack server 2U (complete, with chassis)",
    "Blade server module",
    "Blade chassis enclosure",
    "Tower server (complete, with chassis)",
    "Enterprise network switch (Cisco, HP ProCurve)",
    "NAS (network attached storage, no drives)",
  ]},
  { group: "Docking Stations & Hubs", items: [
    "Laptop docking station (Dell WD, HP, Lenovo ThinkPad)",
    "USB hub / port replicator (generic, office)",
  ]},
  { group: "Capacitors", items: [
    "MLCC capacitors PRE-2000 (high Pd content)",
    "MLCC capacitors POST-2000 (low value)",
    "SMD tantalum capacitors",
  ]},
  { group: "Cameras & Photography", items: [
    "VHS video camera (complete)",
    "Hi8 / Video8 camera (complete)",
    "Digital camera / photo camera",
    "Super 8 film camera",
  ]},
  { group: "Consumer Electronics", items: [
    "Retro gaming console (Atari, Nintendo, Sega, PlayStation)",
    "Printer (laser/inkjet)",
    "Audio/video equipment (hi-fi, amplifier, player)",
    "Oscilloscope / signal analyzer (test equipment)",
    "Phone / smartphone",
    "Tablet / iPad",
    "Laptop (complete)",
    "LCD/CRT monitor",
  ]},
  { group: "Electronics Mix", items: [
    "PCB mix — Mixed Electronics",
    "Vintage electronics (general)",
    "mini PCIe / M.2 WiFi/BT cards",
    "Laptop sub-boards (USB, audio, touchpad)",
  ]},
  { group: "Non-electronic", items: [
    "Non-electronic — metal (steel, aluminium, brass)",
    "Non-electronic — plastic/mechanical",
  ]},
];

function getCorrectionCategories() {
  return i18next.language === "en" ? CORRECTION_CATEGORIES_EN : CORRECTION_CATEGORIES_PL;
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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customMaterial, setCustomMaterial] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const correctMaterial = selectedCategory === "__other__" ? customMaterial : selectedCategory;

  const { t } = useTranslation();

  async function submit() {
    const trimmed = correctMaterial.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${getVisionApiBase()}/vision/correction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          aiMaterialType,
          correctMaterialType: trimmed,
          correctionNote: note.trim() || undefined,
          imageDescription: imageDescription || undefined,
        }),
      });
      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try { const j = await res.json(); if (j?.error) errMsg = j.error; } catch {}
        throw new Error(errMsg);
      }
      toast({ title: t("analysis.correction.thanks"), description: t("analysis.correction.reviewPending") });
      setSelectedCategory("");
      setCustomMaterial("");
      setNote("");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("analysis.correction.unknownError");
      toast({ title: t("analysis.correction.sendError"), description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flag className="w-4 h-4 text-orange-400" />
            {t("analysis.correction.dialogTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t("analysis.correction.aiClassifiedAs")}</p>
            <p className="text-sm font-medium bg-muted/50 rounded px-3 py-2 border border-border">
              {aiMaterialType}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold block">
              {t("analysis.correction.correctMaterialLabel")} <span className="text-destructive">*</span>
            </label>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={comboOpen}
              onClick={() => setComboOpen(true)}
              className="w-full justify-between bg-background font-normal h-10 px-3 text-sm"
            >
              <span className={selectedCategory && selectedCategory !== "__other__" ? "text-foreground truncate" : "text-muted-foreground"}>
                {selectedCategory && selectedCategory !== "__other__" ? selectedCategory : t("analysis.correction.selectPlaceholder")}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            <Dialog open={comboOpen} onOpenChange={setComboOpen}>
              <DialogContent className="max-w-sm p-0 gap-0 max-h-[80vh] flex flex-col">
                <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
                  <DialogTitle className="text-sm font-semibold">{t("analysis.correction.selectTitle")}</DialogTitle>
                </DialogHeader>
                <Command
                  className="flex flex-col min-h-0 flex-1"
                  filter={(itemValue, search) => {
                    if (!search) return 1;
                    return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                  }}
                >
                  <div className="px-3 pb-2 shrink-0">
                    <CommandInput placeholder={t("analysis.correction.searchPlaceholder")} className="h-9" />
                  </div>
                  <CommandList className="flex-1 overflow-y-auto overscroll-contain px-1 pb-3" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                    <CommandEmpty>{t("analysis.correction.noResults")}</CommandEmpty>
                    {getCorrectionCategories().map((group) => (
                      <CommandGroup key={group.group} heading={<span className="text-xs font-bold uppercase tracking-wider text-amber-500">{group.group}</span>}>
                        {group.items.map((item) => (
                          <CommandItem
                            key={item}
                            value={item}
                            onSelect={() => { setSelectedCategory(item); setCustomMaterial(""); setComboOpen(false); }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedCategory === item ? "opacity-100" : "opacity-0")} />
                            {item}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                    <CommandGroup>
                      <CommandItem
                        value={t("analysis.correction.otherCategoryValue")}
                        onSelect={() => { setSelectedCategory("__other__"); setComboOpen(false); }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedCategory === "__other__" ? "opacity-100" : "opacity-0")} />
                        {t("analysis.correction.otherCategory")}
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </DialogContent>
            </Dialog>

            {selectedCategory === "__other__" && (
              <input
                type="text"
                value={customMaterial}
                onChange={(e) => setCustomMaterial(e.target.value)}
                placeholder={t("analysis.correction.describePrompt")}
                autoFocus
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary mt-1.5"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold block">
              {t("analysis.correction.notesLabel")}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={t("analysis.correction.notesPlaceholder")}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t("analysis.correction.reviewNote")}
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!correctMaterial.trim() || submitting}
            onClick={submit}
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
            {t("analysis.correction.submit")}
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
}: {
  result: VisionItem;
  onSaveProfile: () => void;
  onQuantityChange: (qty: number) => void;
  weightPerPieceKg?: number;
  initialMassKg?: number | null;
}) {
  const scaleMode = initialMassKg != null && initialMassKg > 0;
  const [qty, setQty] = useState<number>(
    scaleMode ? initialMassKg : (result.quantity > 0 ? result.quantity : 0)
  );

  const updateQty = (next: number) => {
    const safe = Math.max(0, Math.round(scaleMode ? next * 1000 : next) / (scaleMode ? 1000 : 1));
    setQty(safe);
    onQuantityChange(safe);
  };

  const { t } = useTranslation();
  const metals = [
    { key: "Au" as const, label: t("analysis.metals.au"), color: "text-yellow-400" },
    { key: "Ag" as const, label: t("analysis.metals.ag"), color: "text-slate-300" },
    { key: "Pt" as const, label: t("analysis.metals.pt"), color: "text-sky-400" },
    { key: "Pd" as const, label: t("analysis.metals.pd"), color: "text-purple-400" },
  ];

  const isNonEwaste = result.materialType.toLowerCase().startsWith("nieelektroniczne");

  return (
    <div className="space-y-4">
      {isNonEwaste && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">{t("analysis.notEwaste")}</p>
            <p className="text-xs text-red-400/80 mt-0.5 leading-relaxed">
              {t("analysis.notEwasteDesc")}
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
                <CardTitle className="text-base">{displayMaterialType(result.materialType)}</CardTitle>
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
                {t("analysis.massKg")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors disabled:opacity-40"
                  onClick={() => updateQty(Math.max(0, qty - 0.005))}
                  disabled={qty <= 0}
                  aria-label={t("analysis.decreaseMass")}
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
                  aria-label={t("analysis.increaseMass")}
                >
                  +
                </button>
              </div>
              <span className="text-xs font-mono text-green-400 flex items-center gap-1">
                <Scale className="w-3 h-3" />
                {Math.round(qty * 1000)} {t("analysis.fromScaleG")}
              </span>
              {result.quantity > 0 && (
                <span className="text-xs text-muted-foreground/60">
                  {t("analysis.aiCountedApprox", { count: result.quantity })}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground shrink-0">{t("analysis.quantityPcs")}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors disabled:opacity-40"
                  onClick={() => updateQty(Math.max(0, qty - 1))}
                  disabled={qty <= 0}
                  aria-label={t("analysis.decreaseQty")}
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
                  aria-label={t("analysis.increaseQty")}
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
                  {t("analysis.aiEstimate", { count: result.quantity })}
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
            {t("analysis.estimatedMetalContent")}
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
            {t("analysis.platingTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-2">
            {result.platingAnalysis.detected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-sm text-green-400 font-medium">{t("analysis.platingDetected")}</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">{t("analysis.noPlating")}</span>
              </>
            )}
          </div>
          {result.platingAnalysis.detected && (
            <div className="space-y-2 pl-6">
              {result.platingAnalysis.color && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20 shrink-0">{t("analysis.platingColor")}</span>
                  <span className="font-medium">{translateColor(result.platingAnalysis.color)}</span>
                </div>
              )}
              {result.platingAnalysis.thickness && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20 shrink-0">{t("analysis.platingThickness")}</span>
                  <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-400 bg-yellow-500/5">
                    {translateThickness(result.platingAnalysis.thickness)}
                  </Badge>
                </div>
              )}
              {result.platingAnalysis.quality_1_to_5 !== undefined &&
                result.platingAnalysis.quality_1_to_5 > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20 shrink-0">{t("analysis.platingQuality")}</span>
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
              {t("analysis.recommendedProcess")}
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
                {t("analysis.platingQualityNote", {
                  value: result.platingAnalysis.quality_1_to_5,
                  sign: result.platingAnalysis.quality_1_to_5! >= 4 ? "+" : result.platingAnalysis.quality_1_to_5! <= 2 ? "" : "±",
                  pct: Math.round((QUALITY_AU_MULTIPLIER[result.platingAnalysis.quality_1_to_5!] - 1) * 100),
                })}
              </p>
            </div>
          )}
          <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground text-xs" onClick={onSaveProfile}>
            <FlaskConical className="w-3.5 h-3.5" />
            {t("analysis.saveProfile")}
          </Button>
        </div>
      )}

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
          alt={i18next.t("analysis.scanning.alt") as string}
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
          <span className="text-xs font-mono text-emerald-300">{i18next.t("analysis.scanning.status") as string}</span>
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
    return (item.individualBoxes ?? []).map((bb) => ({ bb, label: displayMaterialType(item.materialType), color }));
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
      <div className="relative" style={{ lineHeight: 0 }}>
      <img
        src={photoUrl}
        alt={i18next.t("analysis.analysisResultAlt") as string}
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
                  top: pcy < 12 ? "14px" : "-22px",
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
  const { t } = useTranslation();

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
      notes: `${t("analysis.aiNotesPrefix")} ${new Date().toLocaleDateString()}. ${t("analysis.aiNotesConfidence")}: Au ${confidenceLabel(item.metalContent.Au.confidence)}, Ag ${confidenceLabel(item.metalContent.Ag.confidence)}.${quality ? ` ${t("analysis.aiNotesQuality")}: ${quality}/5.` : ""}`,
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
  const [analysisCorrectionOpen, setAnalysisCorrectionOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);

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
      formData.append("lang", i18next.language);
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
        throw new Error(data.error ?? `${i18next.t("analysis.serverError")} (${response.status})`);
      }

      const parsed = data as VisionResultSet;
      setResult(parsed);
      setShareId(null);
      setEditedQuantities(parsed.items.map((i: VisionItem) => {
        if (i.massGrams != null && i.massGrams > 0) return i.massGrams / 1000;
        return Math.max(0, i.quantity || 0);
      }));
      fetch(`${getVisionApiBase()}/vision/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultJson: JSON.stringify(parsed) }),
      }).then((r) => r.json()).then((d: { shareId?: string }) => {
        if (d.shareId) setShareId(d.shareId);
      }).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("analysis.correction.unknownError");
      setError(msg);
      toast({ title: t("analysis.errorTitle"), description: msg, variant: "destructive" });
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
            {t("analysis.pageTitle")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("analysis.unavailableNote")}
          </p>
        </div>
        <Card className="border-border">
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="bg-muted p-4 rounded-full">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-base">{t("analysis.unavailable")}</p>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm">
                {t("analysis.unavailableDesc")}
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
          {t("analysis.pageTitle")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("analysis.pageSubtitle")}
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
              <p className="font-semibold text-base">{t("analysis.dropzone")}</p>
              <p className="text-muted-foreground text-sm mt-1">{t("analysis.orSelect")}</p>
              <p className="text-muted-foreground text-xs mt-1">{t("analysis.formats")}</p>
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
                {t("analysis.takePhoto")}
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
                {t("analysis.selectFile")}
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
                  <img src={preview} alt={i18next.t("analysis.preview") as string} className="w-full h-full object-cover" />
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
                  {t("analysis.analyzingProgress")}
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" />
                  {t("analysis.analyzeButton")}
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
                <p className="text-sm font-medium text-destructive">{t("analysis.errorTitle")}</p>
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
                <p className="font-semibold">{t("analysis.analyzingProgress")}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {t("analysis.analyzingNote")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {result && !loading && preview && (
        <div>
          <PhotoWithDetections photoUrl={preview} items={result.items} />
          <div className="max-w-2xl mx-auto mt-4 px-1 flex justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const shareUrl = shareId
                    ? `https://metalrecovery.online/analiza/${shareId}`
                    : "https://metalrecovery.online/analiza";
                  const lines = result.items.map((item) => {
                    const au = item.metalContent.Au.value_g_per_kg.toFixed(1);
                    const ag = item.metalContent.Ag.value_g_per_kg.toFixed(1);
                    const pt = item.metalContent.Pt.value_g_per_kg.toFixed(2);
                    const pd = item.metalContent.Pd.value_g_per_kg.toFixed(2);
                    return `${displayMaterialType(item.materialType)}\nAu ${au} g/kg · Ag ${ag} g/kg · Pt ${pt} g/kg · Pd ${pd} g/kg`;
                  });
                  const text = `🔬 MetalRecovery Analysis\n\n${lines.join("\n\n")}\n\n${shareUrl}`;
                  if (navigator.share) {
                    navigator.share({ title: "MetalRecovery Analysis", text, url: shareUrl }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                      toast({ title: t("analysis.shareCopied") });
                    });
                  }
                }}
                className="flex items-center justify-center gap-2 text-sm font-medium text-sky-400 border border-sky-400/40 hover:border-sky-400 hover:bg-sky-400/10 transition-all rounded-lg px-5 py-2.5"
              >
                <Share2 className="w-4 h-4" />
                {t("analysis.shareBtn")}
              </button>
              <button
                type="button"
                onClick={() => user ? setAnalysisCorrectionOpen(true) : navigate("/login")}
                className="flex items-center justify-center gap-2 text-sm font-medium text-orange-400 border border-orange-400/40 hover:border-orange-400 hover:bg-orange-400/10 transition-all rounded-lg px-5 py-2.5"
              >
                <Flag className="w-4 h-4" />
                {t("analysis.reportError")}
              </button>
              {user && (
                <CorrectionDialog
                  open={analysisCorrectionOpen}
                  onClose={() => setAnalysisCorrectionOpen(false)}
                  aiMaterialType={result.items.map((i) => i.materialType).join(", ")}
                  imageDescription={result.items.map((i) => i.description).join(" | ")}
                  authHeaders={authHeaders}
                  toast={toast}
                />
              )}
            </div>
        </div>
      )}

      {result && !loading && (
        <div className="max-w-2xl mx-auto space-y-4">
          {result.scaleReading?.detected && result.scaleReading.weightGrams != null && (
            <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
              <Scale className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
                  {t("analysis.scaleDetected")}
                  <Badge variant="outline" className={cn("text-xs", confidenceColor(result.scaleReading.confidence))}>
                    {t("analysis.scaleConfidence")} {confidenceLabel(result.scaleReading.confidence)}
                  </Badge>
                </p>
                <p className="text-xs text-green-400/80 mt-0.5 leading-relaxed">
                  {t("analysis.scaleReading")} <span className="font-mono font-bold">{result.scaleReading.displayText ?? `${result.scaleReading.weightGrams} g`}</span>
                  {" "}· {t("analysis.scaleTotalMass")} <span className="font-mono font-bold">{result.scaleReading.weightGrams} g</span>
                  . {t("analysis.scaleQtyNote")}
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
                    {t("analysis.materialTypesCount", { count: ewasteItems.length })}
                    {" "}· {t("analysis.platingPerItem")}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="gap-2"
                    onClick={() => navigateAll(result.items, editedQuantities, "/")}
                  >
                    <Calculator className="w-4 h-4" />
                    {t("analysis.calculatorBtn")}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigateAll(result.items, editedQuantities, "/skup")}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {t("analysis.shopBtn")}
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
          <strong>{t("analysis.disclaimer")}</strong> {t("analysis.disclaimerText")}
        </p>
      </div>

      <CustomMaterialModal
        open={saveItem !== null}
        onOpenChange={(open) => { if (!open) setSaveItem(null); }}
        existing={null}
        onSave={(data) => {
          add(data);
          toast({ title: t("analysis.profileSaved"), description: `"${data.name}" ${t("analysis.profileSavedDesc")}` });
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
                notes: `${t("analysis.aiNotesPrefix")} ${new Date().toLocaleDateString()}. ${t("analysis.aiNotesConfidence")}: Au ${confidenceLabel(saveItem.metalContent.Au.confidence)}, Ag ${confidenceLabel(saveItem.metalContent.Ag.confidence)}.`,
              }
            : undefined
        }
      />
    </div>
  );
}

export function SharedAnalysisPage() {
  const [, params] = useRoute("/analiza/:id");
  const shareId = params?.id ?? "";
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VisionResultSet | null>(null);
  const [editedQuantities, setEditedQuantities] = useState<number[]>([]);

  useEffect(() => {
    if (!shareId) return;
    setLoading(true);
    fetch(`${getVisionApiBase()}/vision/share/${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((d: { resultJson?: string; error?: string }) => {
        if (d.error || !d.resultJson) throw new Error(d.error ?? "Not found");
        const parsed = JSON.parse(d.resultJson) as VisionResultSet;
        setResult(parsed);
        setEditedQuantities(parsed.items.map((i) => {
          if (i.massGrams != null && i.massGrams > 0) return i.massGrams / 1000;
          return Math.max(0, i.quantity || 0);
        }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Błąd"))
      .finally(() => setLoading(false));
  }, [shareId]);

  const { add } = useCustomMaterials();

  const handleSendToCalc = () => {
    if (!result) return;
    result.items.forEach((item, idx) => {
      const qty = editedQuantities[idx] ?? Math.max(0, item.quantity || 0);
      add({
        name: item.materialType,
        au: item.metalContent.Au.value_g_per_kg,
        ag: item.metalContent.Ag.value_g_per_kg,
        pt: item.metalContent.Pt.value_g_per_kg,
        pd: item.metalContent.Pd.value_g_per_kg,
        notes: `MetalRecovery AI · ${new Date().toLocaleDateString()} · qty: ${qty}`,
      });
    });
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={() => navigate("/analiza")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {t("analysis.title")}
        </button>
        <h1 className="text-xl font-bold">{t("analysis.sharedResultTitle", "Udostępniona analiza")}</h1>
      </div>

      {loading && (
        <div className="text-center py-12 text-muted-foreground">{t("common.loading", "Ładowanie…")}</div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {result && (
        <>
          {result.items.map((item, idx) => (
            <VisionResultCard
              key={idx}
              result={item}
              onSaveProfile={() => {}}
              onQuantityChange={(qty) => {
                setEditedQuantities((prev) => {
                  const next = [...prev];
                  next[idx] = qty;
                  return next;
                });
              }}
              initialMassKg={item.massGrams != null && item.massGrams > 0 ? item.massGrams / 1000 : null}
            />
          ))}
          <div className="flex justify-center gap-3 flex-wrap pt-2">
            <button
              type="button"
              onClick={handleSendToCalc}
              className="flex items-center gap-2 text-sm font-medium bg-amber-500 hover:bg-amber-400 text-black transition-all rounded-lg px-5 py-2.5"
            >
              {t("analysis.sendToCalc")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
