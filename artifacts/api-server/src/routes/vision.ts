import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      cb(new Error("Nieobsługiwany format pliku. Wymagany JPG, PNG lub WebP."));
    } else {
      cb(null, true);
    }
  },
});

type Confidence = "low" | "medium" | "high";

type VisionResult = {
  materialType: string;
  description: string;
  metalContent: {
    Au: { value_g_per_kg: number; confidence: Confidence };
    Ag: { value_g_per_kg: number; confidence: Confidence };
    Pt: { value_g_per_kg: number; confidence: Confidence };
    Pd: { value_g_per_kg: number; confidence: Confidence };
  };
  platingAnalysis: {
    detected: boolean;
    color?: string;
    thickness?: string;
    quality_1_to_5?: number;
    notes?: string;
  };
  recommendedProcess: string;
  caveats: string;
};

function validateConfidence(v: unknown): Confidence {
  if (v === "low" || v === "medium" || v === "high") return v;
  return "low";
}

function validateMetalEstimate(v: unknown): { value_g_per_kg: number; confidence: Confidence } {
  if (typeof v !== "object" || v === null) return { value_g_per_kg: 0, confidence: "low" };
  const o = v as Record<string, unknown>;
  return {
    value_g_per_kg: Math.max(0, typeof o.value_g_per_kg === "number" ? o.value_g_per_kg : 0),
    confidence: validateConfidence(o.confidence),
  };
}

function validateVisionResult(raw: unknown): VisionResult | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;

  if (typeof o.materialType !== "string") return null;
  if (typeof o.description !== "string") return null;
  if (typeof o.recommendedProcess !== "string") return null;
  if (typeof o.caveats !== "string") return null;

  const mc = o.metalContent as Record<string, unknown> | null | undefined;
  if (typeof mc !== "object" || mc === null) return null;

  const pa = o.platingAnalysis as Record<string, unknown> | null | undefined;
  if (typeof pa !== "object" || pa === null) return null;

  return {
    materialType: o.materialType,
    description: o.description,
    metalContent: {
      Au: validateMetalEstimate(mc.Au),
      Ag: validateMetalEstimate(mc.Ag),
      Pt: validateMetalEstimate(mc.Pt),
      Pd: validateMetalEstimate(mc.Pd),
    },
    platingAnalysis: {
      detected: Boolean(pa.detected),
      color: typeof pa.color === "string" ? pa.color : undefined,
      thickness: typeof pa.thickness === "string" ? pa.thickness : undefined,
      quality_1_to_5: typeof pa.quality_1_to_5 === "number"
        ? Math.min(5, Math.max(0, pa.quality_1_to_5))
        : undefined,
      notes: typeof pa.notes === "string" ? pa.notes : undefined,
    },
    recommendedProcess: o.recommendedProcess,
    caveats: o.caveats,
  };
}

const ANALYSIS_PROMPT = `You are an expert in precious metal recovery from electronic waste (e-waste).
Analyze the provided image of electronic scrap (PCB, connector, CPU, RAM, or other component) and return ONLY a JSON object (no markdown, no explanation, just raw JSON).

JSON structure required:
{
  "materialType": "short Polish name of the material type (e.g. Płytka PCB, Procesor ceramiczny, Złącze edge, Karta graficzna)",
  "description": "2-3 sentence description in Polish of what you see and its precious metal characteristics",
  "metalContent": {
    "Au": { "value_g_per_kg": <number>, "confidence": "low|medium|high" },
    "Ag": { "value_g_per_kg": <number>, "confidence": "low|medium|high" },
    "Pt": { "value_g_per_kg": <number>, "confidence": "low|medium|high" },
    "Pd": { "value_g_per_kg": <number>, "confidence": "low|medium|high" }
  },
  "platingAnalysis": {
    "detected": <true|false>,
    "color": "color description if plating detected (e.g. jasne złoto, ciemne złoto, różowe złoto)",
    "thickness": "flash|thin|standard|thick|gold-filled (if detected)",
    "quality_1_to_5": <1-5 score if detected, else 0>,
    "notes": "Polish description of plating quality and what it indicates about purity/thickness"
  },
  "recommendedProcess": "Polish name of the recommended recovery process (e.g. Woda Królewska (HCl + HNO3), Elektroliza, HCl + H2O2)",
  "caveats": "1-2 sentences in Polish about limitations of this visual estimate and what to verify in a lab"
}

Metal content reference ranges (g/kg):
- Server/desktop motherboard PCB: Au 0.15-0.35, Ag 0.5-1.5, Pt 0-0.01, Pd 0-0.01
- Laptop/phone motherboard: Au 0.20-0.50, Ag 0.3-1.0
- CPU ceramic (386/486/Pentium): Au 3-10, Ag 0-0.5
- CPU plastic (modern): Au 0.2-1.0
- Gold-plated edge connectors: Au 1-5 (depends on plating thickness)
- RAM DDR1/DDR2 (gold contacts): Au 1.0-2.0, Ag 0.3-0.8
- RAM DDR3/DDR4 (tin/tin-silver): Au 0.3-0.6, Ag 0.3-0.8
- SIMM/DIMM modules: Au 0.5-1.5
- Telecom PCB: Au 0.1-0.3, Ag 1.0-2.0, Pd 0.02-0.05
- BGA/IC chips: Au 0.05-0.3

Plating quality guide:
- Flash gold (0.05-0.1 μm): thin, bright, quality 1-2
- Standard ENIG (0.05-0.13 μm): moderate, quality 2-3
- Thick plating (>0.5 μm): rich yellow/orange, quality 3-4
- Gold-filled/thick hard gold (edge connectors): deep yellow/orange, quality 4-5
- If color is pale/silvery it may be tin, nickel or tin-silver alloy — set quality to 0

If you cannot determine the material type or the image is unclear, still return valid JSON with low confidence values and explain in caveats.`;

router.post(
  "/vision/analyze",
  upload.single("image"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Brak pliku zdjęcia. Prześlij obraz jako pole 'image' (multipart/form-data)." });
      return;
    }

    const base64 = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${base64}`;

    let rawContent: string;
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.4",
        max_completion_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: ANALYSIS_PROMPT },
              { type: "image_url", image_url: { url: dataUri, detail: "high" } },
            ],
          },
        ],
      });
      rawContent = response.choices[0]?.message?.content ?? "";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(502).json({ error: `Błąd komunikacji z modelem AI: ${msg}` });
      return;
    }

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(502).json({
        error: "Model AI nie zwrócił poprawnego JSON. Spróbuj ponownie lub użyj lepszego zdjęcia.",
      });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      res.status(502).json({ error: "Nie udało się sparsować odpowiedzi AI. Spróbuj ponownie." });
      return;
    }

    const validated = validateVisionResult(parsed);
    if (!validated) {
      res.status(502).json({
        error: "Odpowiedź AI ma nieprawidłową strukturę. Spróbuj ponownie.",
      });
      return;
    }

    res.json(validated);
  },
);

export default router;
