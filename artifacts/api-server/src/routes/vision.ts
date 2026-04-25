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

const ANALYSIS_PROMPT = `You are an expert in precious metal recovery from electronic waste (e-waste).

{{CATALOG_SECTION}}

Analyze the uploaded photo and return a JSON object following these steps:

STEP 1 — IDENTIFY distinct material types.
Are there different component types (e.g. motherboards AND CPUs AND RAM)? Each distinct type → separate item in "items".
DO NOT force-fit non-electronics: decorative buttons, coins, brass fittings are NOT e-waste.
Non-e-waste → materialType = "Nieelektroniczne — [Polish name]", all metal values = 0.0, quantity = 0.

STEP 2 — For EACH type, select "materialType" from the catalog above (exact name). If none fits, use a descriptive Polish name.

STEP 3 — COUNT each type carefully.
Scan the image systematically: left column top→bottom, then next column, etc.
Count EVERY visible unit, including partially visible ones at edges.
If items overlap, estimate based on visible corners/edges — prefer overcounting over undercounting.
Write down your count before moving on.

STEP 4 — Estimate metal content and plating for each type.

STEP 5 — Return ONLY this JSON (no markdown, no explanation):
{
  "items": [
    {
      "materialType": "exact catalog name or descriptive Polish name",
      "description": "2-3 sentences in Polish about this type and its metal characteristics",
      "quantity": <integer from STEP 3; 0 only if truly impossible to count>,
      "metalContent": {
        "Au": { "value_g_per_kg": <number>, "confidence": "low|medium|high" },
        "Ag": { "value_g_per_kg": <number>, "confidence": "low|medium|high" },
        "Pt": { "value_g_per_kg": <number>, "confidence": "low|medium|high" },
        "Pd": { "value_g_per_kg": <number>, "confidence": "low|medium|high" }
      },
      "platingAnalysis": {
        "detected": <true only if gold-plated contacts/pins clearly visible>,
        "color": "złoty|srebrny|niklowy|mieszany or null",
        "thickness": "cienkie (<0,1μm)|średnie (0,1-0,5μm)|grube (>0,5μm) or null",
        "quality_1_to_5": <integer 1-5 or null>,
        "notes": "Polish note or null"
      },
      "recommendedProcess": "Polish name of recommended recovery process"
    }
  ],
  "caveats": "1-2 sentence Polish warning about estimation accuracy"
}

ALL string values (color, thickness, notes, descriptions) MUST be in POLISH.
Reference metal values: motherboards ~0.2–0.5 g Au/kg; ceramic CPUs ~3–10 g Au/kg; gold fingers ~2–15 g Au/kg; RAM ~0.5–1.5 g Au/kg.`;

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
