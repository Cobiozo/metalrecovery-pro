import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod";

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

const MetalEstimateSchema = z.object({
  value_g_per_kg: z.number().min(0),
  confidence: z.enum(["low", "medium", "high"]),
});

const VisionResultSchema = z.object({
  materialType: z.string(),
  description: z.string(),
  metalContent: z.object({
    Au: MetalEstimateSchema,
    Ag: MetalEstimateSchema,
    Pt: MetalEstimateSchema,
    Pd: MetalEstimateSchema,
  }),
  platingAnalysis: z.object({
    detected: z.boolean(),
    color: z.string().nullable().optional(),
    thickness: z.string().nullable().optional(),
    quality_1_to_5: z.number().int().min(1).max(5).nullable().optional(),
    notes: z.string().nullable().optional(),
  }),
  recommendedProcess: z.string(),
  caveats: z.string(),
});

const ANALYSIS_PROMPT = `You are an expert in precious metal recovery from electronic waste (e-waste).
Analyze the provided image of electronic scrap (PCB, connector, CPU, RAM, or other component) and return ONLY a JSON object (no markdown, no explanation, just raw JSON).

JSON structure required:
{
  "materialType": "short Polish name of the material type (e.g. Płytka PCB, Procesor ceramiczny, Złącze edge, Karta graficzna)",
  "description": "2-3 sentence description in Polish of what you see and its precious metal characteristics",
  "metalContent": {
    "Au": { "value_g_per_kg": <number, grams of Au per kg of this scrap>, "confidence": "low|medium|high" },
    "Ag": { "value_g_per_kg": <number>, "confidence": "low|medium|high" },
    "Pt": { "value_g_per_kg": <number>, "confidence": "low|medium|high" },
    "Pd": { "value_g_per_kg": <number>, "confidence": "low|medium|high" }
  },
  "platingAnalysis": {
    "detected": <true if you see gold-plated pins, pads, or connectors>,
    "color": "gold|silver|nickel|mixed or null if none",
    "thickness": "thin (<0.1μm)|medium (0.1-0.5μm)|thick (>0.5μm) or null",
    "quality_1_to_5": <integer 1-5, where 5=thick gold flash on many contacts; 1=no gold or negligible, or null if not applicable>,
    "notes": "brief Polish note on plating quality/coverage or null"
  },
  "recommendedProcess": "Best Polish name of chemical/electrolytic process for this scrap (e.g. Woda królewska, Elektroliza, Rozkład HNO3)",
  "caveats": "1-2 sentence Polish warning about the accuracy limits of this estimate"
}

Use realistic values based on typical e-waste literature (e.g. PCB motherboards ~0.2-0.5 g Au/kg, ceramic CPUs ~3-10 g Au/kg, gold fingers/edge connectors ~2-15 g Au/kg).
Be conservative — underestimating is safer than overestimating for business decisions.`;

function handleUpload(req: Request, res: Response, next: NextFunction): void {
  upload.single("image")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "Plik jest za duży. Maksymalny rozmiar to 10 MB." });
      } else {
        res.status(400).json({ error: `Błąd przesyłania pliku: ${err.message}` });
      }
      return;
    }
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
}

router.post(
  "/analyze",
  handleUpload,
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "Brak pliku zdjęcia. Prześlij obraz w polu 'image'." });
      return;
    }

    const base64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

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

    const validated = VisionResultSchema.safeParse(parsed);
    if (!validated.success) {
      res.status(502).json({
        error: "Odpowiedź AI ma nieprawidłową strukturę. Spróbuj ponownie.",
        details: validated.error.message,
      });
      return;
    }

    res.json(validated.data);
  },
);

export default router;
