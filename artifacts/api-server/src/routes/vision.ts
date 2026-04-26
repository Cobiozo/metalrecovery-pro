import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, aiAnalysisLogsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { incrementStat, STAT_METRICS } from "../lib/stats";
import { resolveUser, type AuthRequest } from "../middlewares/auth";
import multer from "multer";
import OpenAI from "openai";
import { z } from "zod";

function getOpenAIClient(): OpenAI {
  const apiKey =
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY;
  const baseURL =
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
    process.env.OPENAI_BASE_URL;
  if (!apiKey) {
    throw new Error("Brak klucza API OpenAI. Ustaw AI_INTEGRATIONS_OPENAI_API_KEY w zmiennych środowiskowych.");
  }
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

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

const BoxSchema = z.object({
  cx: z.number().min(0).max(100),
  cy: z.number().min(0).max(100),
});

const VisionItemSchema = z.object({
  materialType: z.string(),
  description: z.string(),
  quantity: z.number().int().min(0),
  massGrams: z.number().min(0).nullable().optional(),
  individualBoxes: z.array(BoxSchema).nullable().optional(),
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
  scaleReading: z.object({
    detected: z.boolean(),
    weightGrams: z.number().nullable().optional(),
    confidence: z.enum(["low", "medium", "high"]),
    displayText: z.string().nullable().optional(),
  }).optional(),
});

const ANALYSIS_PROMPT = `You are an expert in precious metal recovery from electronic waste (e-waste).

{{CATALOG_SECTION}}

Analyze the uploaded photo and return a JSON object following these steps:

STEP 0 — DETECT WEIGHING SCALE.
Scan the entire image for a digital kitchen scale, postal scale, or any weighing device with a numeric display.
If a scale display is visible:
  • Read the number shown on the display as precisely as possible (e.g. "100", "156", "2.3 kg").
  • Determine the unit from the display or the scale label (g or kg). Convert to grams.
  • Record: scaleReading.detected = true, scaleReading.weightGrams = <number in grams>, scaleReading.displayText = "<exact text on display>", scaleReading.confidence = "high"/"medium"/"low".
  • This is the ACTUAL MEASURED WEIGHT of all the items on the scale — use it to calibrate quantities.
If no scale is visible: scaleReading.detected = false, scaleReading.weightGrams = null, scaleReading.confidence = "low".

STEP 1 — IDENTIFY distinct material types.
Are there different component types (e.g. motherboards AND CPUs AND RAM)? Each distinct type → separate item in "items".
IMPORTANT — the following ARE electronic waste (e-waste) with recoverable precious metals:
  • Cameras and camcorders (VHS, Video8, Hi8, Super 8, digital, analog) — contain PCBs, gold-plated connectors, ICs
  • Printers (inkjet, laser) — contain PCBs and gold contacts
  • Game consoles (Atari, Nintendo, Sega, PlayStation, Xbox) — contain rich PCBs
  • Audio/video equipment (tape decks, CD/DVD players, amplifiers)
  • Any device with a circuit board, connectors or microchips
DO NOT force-fit non-electronics: decorative buttons, coins, brass fittings, clothing, non-electronic mechanical parts are NOT e-waste.
Non-e-waste → materialType = "Nieelektroniczne — [Polish name]", all metal values = 0.0, quantity = 0.

CRITICAL VISUAL SHAPE GUIDE — read before identifying:
  RAM sticks (DIMM/SO-DIMM): LONG thin rectangular board (133mm×30mm desktop or 67mm×30mm laptop). Memory chips in ONE ROW along the LENGTH. A notch cut into the edge contacts. Never square. Never small.
  mini PCIe / M.2 cards (laptop WiFi/BT/WWAN): TINY card, roughly SQUARE (30×26mm) or small rectangle (30×51mm). Gold contacts on ONE SHORT EDGE ONLY. Two tiny coaxial (MHF/IPEX) connectors. FCC-ID label. This is NOT RAM — it is 3-5× smaller than a RAM stick.
  Laptop sub-boards (USB/audio/touchpad/power): small rectangular or square PCBs (40-120mm) with ribbon cable connectors, dedicated to a single laptop function. No large CPU/GPU die.
  CPU socket adapter / BGA programmer boards: square PCB (70-110mm) with a large SQUARE OPENING or socket cavity in the CENTER. Dense gold contacts or pin array around the central hole. Edge connector on one side. THESE ARE NOT laptop motherboards.
  Laptop motherboards: large complex PCB (200-300mm) with CPU socket or BGA site, multiple DIMM slots, PCIe slots, multiple connectors and chips.
  Desktop motherboards: even larger PCB (240-305mm ATX) with expansion slots, DIMM rows, large CPU socket, VRM heatsink mounts.
  ISA/PCI expansion cards: PCB with a bracket (metal L-bracket or card with notch). Usually 120-170mm × 100mm.
  ZIF / IC test sockets: black or gold plastic socket (20-50mm long), two rows of gold-plated pins along the sides, optional lever mechanism — used for IC programming or chip testing — SMALL individual items usually 3-10g each.
  SIMM memory slot connectors: gold L-shaped or C-shaped metal bracket (70-100mm long), narrow slot for inserting SIMM module, spring contacts inside — pulled from old motherboard — NOT a telecom block.
  Standard DIP IC sockets: tiny black plastic socket (8-40 pins), two rows of silver/tin contact pins — very low gold content — common repair-shop items.
  TELECOM backplane connectors (HIGH VALUE): ONLY from telephone exchange racks (AXE, EWSD, DMS) — massive blocks 150mm+ packed with hundreds of dense DIN/Metral pins — INDUSTRIAL TELECOM EQUIPMENT ONLY.

STEP 2 — For EACH type, select "materialType" from the catalog above (exact name). If none fits, use a descriptive Polish name.
IMPORTANT: Apply the shape guide from above — do NOT call small square cards "RAM". Do NOT call a square board with a central opening a "laptop motherboard".
IMPORTANT: Do NOT use "UFO" as a materialType name — ever. For mixed/unidentified electronics use the catalog entry "Mix PCB — Elektronika Mieszana".

STEP 3 — Determine quantities.
A) COUNT each type carefully: scan systematically left→right, top→bottom. Count EVERY visible unit including partially visible ones at edges.
   If items overlap, estimate based on visible corners/edges — prefer overcounting over undercounting.
B) IF a scale was detected in STEP 0 with a valid weight reading:
   — scaleReading.weightGrams is the ACTUAL TOTAL MASS of all items on the scale.
   — Estimate what PERCENTAGE of that total mass belongs to each identified type.
     Example: scale shows 100g, pile is roughly 70% ZIF sockets + 30% SIMM connectors → ZIF massGrams=70, SIMM massGrams=30.
   — Set "massGrams" on each item to its share. ALL massGrams values MUST sum exactly to scaleReading.weightGrams.
   — This is more accurate than piece counts — use it as the primary quantity for calculations.
   IF no scale was detected: set massGrams = null for all items.

STEP 4 — Estimate metal content and plating for each type.

STEP 4B — For each item mark the CENTER POINT of every individual physical piece in "individualBoxes".

  HOW TO MARK EACH PIECE:
  1. Scan the image systematically: left→right, top→bottom. Do not stop early.
  2. For EACH physical piece found, record its geometric center as cx (horizontal %) and cy (vertical %).
  3. CRITICAL: The number of entries in individualBoxes MUST EQUAL the quantity from STEP 3.
     If quantity=18, you MUST produce exactly 18 {cx,cy} points — no more, no fewer.
     Count again before writing the JSON if unsure.
  4. Maximum 40 entries per item type (if quantity > 40, mark only the first 40 and set quantity=40).

  COORDINATE SYSTEM (0–100, % of total image width/height):
  - cx: horizontal center (0 = left edge, 100 = right edge)
  - cy: vertical center   (0 = top edge,  100 = bottom edge)
  HARD RULE: cx and cy must both be between 1 and 99.

STEP 5 — Return ONLY this JSON (no markdown, no explanation):
{
  "scaleReading": {
    "detected": <true|false from STEP 0>,
    "weightGrams": <number in grams, or null if not detected>,
    "confidence": "high|medium|low",
    "displayText": "<exact text visible on scale display, or null>"
  },
  "items": [
    {
      "materialType": "exact catalog name or descriptive Polish name",
      "description": "2-3 sentences in Polish about this type and its metal characteristics",
      "quantity": <integer piece count from STEP 3A; 0 only if truly impossible to count>,
      "massGrams": <number from STEP 3B if scale detected, otherwise null>,
      "individualBoxes": [
        { "cx": <center_x_pct>, "cy": <center_y_pct> },
        { "cx": <center_x_pct>, "cy": <center_y_pct> }
      ],
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
Reference metal values: motherboards ~0.2–0.5 g Au/kg; ceramic CPUs ~3–10 g Au/kg; gold fingers ~2–15 g Au/kg; RAM (gold contacts, DIMM) ~0.6–1.5 g Au/kg; mini PCIe / M.2 WiFi cards ~0.4–0.8 g Au/kg; laptop sub-boards ~0.1–0.2 g Au/kg; CPU socket adapter boards ~0.5–1.5 g Au/kg; ZIF/test IC sockets (precision) ~1–4 g Au/kg; SIMM memory slot connectors ~0.8–2.5 g Au/kg; standard DIP IC sockets (cheap) ~0.1–0.5 g Au/kg; telecom backplane connectors (industrial) ~2–8 g Au/kg; VHS camcorders (whole) ~0.08 g Au/kg, ~0.55 g Ag/kg; Video8/Hi8 camcorders (whole) ~0.10 g Au/kg, ~0.65 g Ag/kg; Super 8 film cameras ~0.025 g Au/kg, ~0.18 g Ag/kg; digital cameras (whole) ~0.09 g Au/kg, ~0.55 g Ag/kg.`;

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

router.get("/status", (_req, res) => {
  const hasKey = Boolean(
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY
  );
  res.json({ available: hasKey });
});

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
        const catalog: Array<{ id: string; name: string; nameEn?: string; catalogHint?: string }> =
          JSON.parse(rawCatalog);
        if (Array.isArray(catalog) && catalog.length > 0) {
          const lines = catalog
            .map((m) => {
              let line = `  - "${m.name}"`;
              const extra: string[] = [];
              if (m.nameEn) extra.push(m.nameEn);
              if (m.catalogHint) extra.push(`VISUAL: ${m.catalogHint}`);
              if (extra.length) line += ` (${extra.join(" — ")})`;
              return line;
            })
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
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: "gpt-5.4",
        temperature: 0,
        max_completion_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUri, detail: "low" } },
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

    // Reconcile: align quantity to actual marker count so UI stays consistent
    for (const item of validated.data.items) {
      const boxCount = item.individualBoxes?.length ?? 0;
      if (boxCount > 0 && item.quantity !== boxCount) {
        item.quantity = boxCount;
      }
    }

    incrementStat(STAT_METRICS.AI_ANALYSES).catch(() => {});
    const user = await resolveUser(req as AuthRequest).catch(() => null);
    if (user) {
      db.update(usersTable)
        .set({ aiUsageCount: sql`${usersTable.aiUsageCount} + 1` })
        .where(eq(usersTable.id, user.id))
        .catch(() => {});
    }

    // Log the analysis: IP, account (if logged in), detected materials
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";
    const materialsDetected = validated.data.items
      .map((item) => `${item.materialType} ×${item.quantity}`)
      .join(", ");
    db.insert(aiAnalysisLogsTable)
      .values({
        ip: clientIp,
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        materialsDetected: materialsDetected || null,
        itemCount: validated.data.items.length,
      })
      .catch(() => {});

    res.json(validated.data);
  },
);

export default router;
