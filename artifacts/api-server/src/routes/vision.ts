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

const ANALYSIS_PROMPT = `You are an expert in precious metal recovery from electronic waste (e-waste). A user has uploaded a photo for analysis.

STEP 1 — IDENTIFY WHAT IS IN THE IMAGE HONESTLY.
Look carefully. Is this actually electronic waste (PCB, connector, CPU, RAM, chip, gold fingers, etc.)? Or is it something else entirely (coins, buttons, jewelry, stones, tools, mechanical parts, fabric, food, etc.)?

DO NOT force-fit non-electronic objects into e-waste categories. Examples of common confusions to avoid:
- Decorative/uniform buttons → NOT "styki kopułkowe" (dome contacts). Buttons are NOT e-waste.
- Coins or medals → NOT CPUs or chips.
- Brass fittings, screws → NOT connectors.
- If uncertain about the object type, report uncertainty honestly.

STEP 2 — FILL IN THE JSON accurately based on what you see.
If the image is NOT electronic waste, use materialType like "Nieelektroniczne — [nazwa po polsku, np. Guziki ozdobne / Monety / Biżuteria]" and set ALL metal content values to 0.0 with confidence "low", and explain in description and caveats that this does not appear to be e-waste and therefore metal recovery estimates are not applicable.

If the image IS electronic waste, analyze it carefully and return realistic estimates.

Return ONLY a JSON object (no markdown, no explanation, just raw JSON):
{
  "materialType": "Polish name — for e-waste e.g. 'Płytka PCB', 'Procesor ceramiczny', 'Złącze edge'. For non-e-waste: 'Nieelektroniczne — [Polish name of what it actually is]'",
  "description": "2-3 sentences in Polish describing exactly what you see and why these estimates apply (or do not apply)",
  "metalContent": {
    "Au": { "value_g_per_kg": <number, 0.0 if not e-waste>, "confidence": "low|medium|high" },
    "Ag": { "value_g_per_kg": <number, 0.0 if not e-waste>, "confidence": "low|medium|high" },
    "Pt": { "value_g_per_kg": <number, 0.0 if not e-waste>, "confidence": "low|medium|high" },
    "Pd": { "value_g_per_kg": <number, 0.0 if not e-waste>, "confidence": "low|medium|high" }
  },
  "platingAnalysis": {
    "detected": <true only if you clearly see gold-plated electronic contacts/pins/pads>,
    "color": "gold|silver|nickel|mixed or null",
    "thickness": "thin (<0.1μm)|medium (0.1-0.5μm)|thick (>0.5μm) or null",
    "quality_1_to_5": <integer 1-5 or null — only for actual electronic gold plating>,
    "notes": "Polish note on plating or null"
  },
  "recommendedProcess": "Polish name of recommended recovery process, or 'Brak — materiał nieelektroniczny' if not e-waste",
  "caveats": "Polish warning — if not e-waste, clearly state that the uploaded image does not appear to contain electronic waste suitable for precious metal recovery"
}

Reference values for e-waste (use only when applicable):
- PCB motherboards: ~0.2–0.5 g Au/kg
- Ceramic CPUs: ~3–10 g Au/kg
- Gold fingers / edge connectors: ~2–15 g Au/kg
- RAM sticks: ~0.5–1.5 g Au/kg

Always be conservative and honest. Never invent e-waste categories to match objects that are clearly not electronic components.`;

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
