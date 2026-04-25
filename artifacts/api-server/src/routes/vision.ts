import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
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

const VisionItemSchema = z.object({
  materialType: z.string(),
  description: z.string(),
  quantity: z.number().int().min(0),
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
});

const VisionResultSchema = z.object({
  items: z.array(VisionItemSchema).min(1),
  caveats: z.string(),
});

const ANALYSIS_PROMPT = `You are an expert in precious metal recovery from electronic waste (e-waste). A user has uploaded a photo for analysis.

STEP 1 — IDENTIFY ALL DISTINCT MATERIAL TYPES in the image.
Look carefully. Are there different types of components (e.g. motherboards AND CPUs AND RAM sticks)? Each distinct type must be a SEPARATE item in the "items" array.
- If there is only one type, return one item.
- If there are multiple distinct types (e.g. 5 motherboards and 3 CPUs), return a separate item for each type.
- DO NOT merge different types into one item.

DO NOT force-fit non-electronic objects into e-waste categories:
- Decorative buttons → NOT "styki kopułkowe". Not e-waste.
- Coins, medals → Not CPUs.
- Brass fittings → Not connectors.
For non-e-waste: materialType = "Nieelektroniczne — [Polish name]", all metal values = 0.0, confidence = "low", quantity = 0.

STEP 2 — For EACH distinct material type, count how many individual pieces of that type are visible.

STEP 3 — For EACH material type, select "materialType":
{{CATALOG_SECTION}}

STEP 4 — Fill in the JSON. ALL string values MUST be in POLISH:
- color: "złoty", "srebrny", "niklowy", "mieszany" (NOT "gold", "silver", "nickel", "mixed")
- thickness: "cienkie (<0,1μm)", "średnie (0,1-0,5μm)", "grube (>0,5μm)" (NOT "thin", "medium", "thick")
- notes, descriptions: Polish only

Return ONLY a JSON object (no markdown, no explanation):
{
  "items": [
    {
      "materialType": "EXACT name from the catalog above (or 'Nieelektroniczne — ...' if not e-waste)",
      "description": "2-3 sentences in Polish about this specific type and its metal characteristics",
      "quantity": <integer: count of visible same-type units; 0 if unclear>,
      "metalContent": {
        "Au": { "value_g_per_kg": <number>, "confidence": "low|medium|high" },
        "Ag": { "value_g_per_kg": <number>, "confidence": "low|medium|high" },
        "Pt": { "value_g_per_kg": <number>, "confidence": "low|medium|high" },
        "Pd": { "value_g_per_kg": <number>, "confidence": "low|medium|high" }
      },
      "platingAnalysis": {
        "detected": <true only if gold-plated contacts/pins clearly visible for THIS type>,
        "color": "złoty|srebrny|niklowy|mieszany or null",
        "thickness": "cienkie (<0,1μm)|średnie (0,1-0,5μm)|grube (>0,5μm) or null",
        "quality_1_to_5": <integer 1-5 or null>,
        "notes": "Polish note or null"
      },
      "recommendedProcess": "Polish name of recovery process for this type"
    }
  ],
  "caveats": "1-2 sentence Polish warning covering all detected materials"
}

Reference values:
- PCB motherboards: ~0.2–0.5 g Au/kg
- Ceramic CPUs: ~3–10 g Au/kg
- Gold fingers / edge connectors: ~2–15 g Au/kg
- RAM sticks: ~0.5–1.5 g Au/kg
- Standard CPUs (non-ceramic): ~0.1–0.3 g Au/kg

Be conservative. Each material type gets its own separate item in the array.`;

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

    // Build catalog section from optional materialCatalog form field
    let catalogSection =
      "Use a short descriptive Polish name that best describes the material type you see.";
    const rawCatalog = req.body?.materialCatalog;
    if (typeof rawCatalog === "string" && rawCatalog.trim()) {
      try {
        const catalog: Array<{ id: string; name: string; nameEn?: string }> =
          JSON.parse(rawCatalog);
        if (Array.isArray(catalog) && catalog.length > 0) {
          const lines = catalog
            .map((m) => `  - "${m.name}"${m.nameEn ? ` (${m.nameEn})` : ""}`)
            .join("\n");
          catalogSection =
            `Choose "materialType" from this EXACT catalog — use the EXACT Polish name as written:\n${lines}\n` +
            `  If none matches well, you may use a descriptive Polish name. ` +
            `  For non-e-waste always use "Nieelektroniczne — [Polish name]".`;
        }
      } catch {
        // malformed JSON — fall back to free text
      }
    }

    const prompt = ANALYSIS_PROMPT.replace("{{CATALOG_SECTION}}", catalogSection);

    const base64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    let rawContent: string;
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.4",
        max_completion_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
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
