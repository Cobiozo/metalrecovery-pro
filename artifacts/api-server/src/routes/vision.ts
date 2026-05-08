import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, aiAnalysisLogsTable, visionCorrectionsTable, visionPromptRulesTable, analysisSharesTable } from "@workspace/db/schema";
import { eq, sql, desc, asc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { incrementStat, STAT_METRICS } from "../lib/stats";
import { resolveUser, requireAuth, type AuthRequest } from "../middlewares/auth";
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

async function fetchLearnedContext(): Promise<string> {
  try {
    const [rules, corrections] = await Promise.all([
      db
        .select()
        .from(visionPromptRulesTable)
        .where(eq(visionPromptRulesTable.isActive, true))
        .orderBy(asc(visionPromptRulesTable.sortOrder), asc(visionPromptRulesTable.id)),
      db
        .select()
        .from(visionCorrectionsTable)
        .where(eq(visionCorrectionsTable.status, "pending"))
        .orderBy(desc(visionCorrectionsTable.createdAt))
        .limit(15),
    ]);

    const parts: string[] = [];

    if (rules.length > 0) {
      const ruleLines = rules.map((r) => `  • [REGUŁA: ${r.title}] ${r.ruleText}`).join("\n");
      parts.push(`PERMANENTNE REGUŁY ADMINISTRATORA (najwyższy priorytet — przestrzegaj bezwzględnie):\n${ruleLines}`);
    }

    if (corrections.length > 0) {
      const correctionLines = corrections
        .map((c) => {
          const note = c.correctionNote ? ` — uwaga: "${c.correctionNote}"` : "";
          const desc = c.imageDescription ? ` (obraz: ${c.imageDescription})` : "";
          return `  • AI powiedział "${c.aiMaterialType}" ale poprawna odpowiedź to "${c.correctMaterialType}"${desc}${note}`;
        })
        .join("\n");
      parts.push(`FEEDBACK UŻYTKOWNIKÓW (przykłady błędnych klasyfikacji do unikania):\n${correctionLines}`);
    }

    if (parts.length === 0) return "";
    return "\n\n" + parts.join("\n\n");
  } catch {
    return "";
  }
}

const ANALYSIS_PROMPT = `You are an expert in precious metal recovery from electronic waste (e-waste).

{{CATALOG_SECTION}}{{LEARNED_CONTEXT_SECTION}}

Analyze the uploaded photo and return a JSON object following these steps:

STEP 0 — DETECT WEIGHING SCALE.
Scan the entire image for a digital kitchen scale, postal scale, or any weighing device with a numeric display.
If a scale display is visible:
  • Read the number shown on the display as precisely as possible (e.g. "100", "156", "2.3 kg").
  • Determine the unit from the display or the scale label (g or kg). Convert to grams.
  • Record: scaleReading.detected = true, scaleReading.weightGrams = <number in grams>, scaleReading.displayText = "<exact text on display>", scaleReading.confidence = "high"/"medium"/"low".
  • This is the ACTUAL MEASURED WEIGHT of all the items on the scale — use it to calibrate quantities.
If no scale is visible: scaleReading.detected = false, scaleReading.weightGrams = null, scaleReading.confidence = "low".

STEP 1 — IDENTIFY ALL distinct material types. SCAN THE ENTIRE IMAGE BEFORE WRITING ANY JSON.
⚠️ CRITICAL MULTI-ITEM RULE: DO NOT stop after finding the first item. A cardboard box, crate, or pile of e-waste ALWAYS contains MULTIPLE distinct material types. If you find only 1–2 types in a mixed pile, you have NOT finished scanning — look again.
  • Scan systematically: top-left → top-right → middle-left → middle-right → bottom-left → bottom-right.
  • EVERY distinct component type visible in the image gets its OWN separate entry in "items".
  • Typical mixed e-waste box contains 3–8 different categories: e.g. motherboard + industrial PCBs + DIN-rail modules + cables — each MUST be a separate item.
  • DO NOT group unrelated items into a single generic "Mix PCB" entry unless they are truly unidentifiable fragments. If you can identify a type, use the specific category.
  • CABLES, WIRES, and HARNESSES visible in the photo must be included as a separate item if they make up a visible portion of the pile.
  • INDUSTRIAL DIN-RAIL MODULES (white/grey plastic rectangular housing ~70×50×30mm, clip-on DIN rail mount, screw terminals on top/bottom, brand labels like Siemens, ABB, Schneider, Phoenix, WAGO, Finder) — these contain PCBs, relays, and precious metal contacts — classify as "Stara elektronika (ogólna)" or "Elektronika przemysłowa / sterowniki PLC" — NEVER ignore them.
  • SMALL INDUSTRIAL PCBs (green/blue board 50–200mm, with screw terminals, relays, optocouplers, industrial connectors) from control panels, motor drives, PLCs — classify separately from consumer motherboards.
Are there different component types (e.g. motherboards AND CPUs AND RAM)? Each distinct type → separate item in "items".
IMPORTANT — the following ARE electronic waste (e-waste) with recoverable precious metals:
  • Cameras and camcorders (VHS, Video8, Hi8, Super 8, digital, analog) — contain PCBs, gold-plated connectors, ICs
  • Printers (inkjet, laser) — contain PCBs and gold contacts
  • Game consoles (Atari, Nintendo, Sega, PlayStation, Xbox) — contain rich PCBs
  • Audio/video equipment (tape decks, CD/DVD players, amplifiers)
  • SERVER EQUIPMENT — ALWAYS e-waste with recoverable Au/Ag/Pd:
      – Rack servers (Dell PowerEdge, HP ProLiant, IBM xSeries) 1U/2U/4U — classify as "Serwer rack 1U (całość, z obudową)" or "Serwer rack 2U"
      – Blade server modules (Dell M-series, HP BL-series) — classify as "Serwer blade — moduł"
      – Blade chassis/enclosures (Dell M1000e, HP c7000) — classify as "Obudowa blade chassis"
      – Tower servers (Dell PowerEdge T, HP ProLiant ML) — classify as "Serwer wieżowy (całość, z obudową)"
      – Enterprise network switches (Cisco Catalyst, HP ProCurve, Juniper EX) — classify as "Przełącznik sieciowy enterprise"
      – NAS devices (QNAP, Synology, NetApp) — classify as "NAS (sieciowy zasób dyskowy, bez dysków)"
      – SAN/fiber channel equipment — classify as "Przełącznik sieciowy enterprise"
  • Any device with a circuit board, connectors or microchips
  • LAPTOP DOCKING STATIONS — ALWAYS e-waste with recoverable Au/Ag/Pd:
      – Dell WD-series (WD15, WD19, WD22, D6000, D3100) — classify as "Stacja dokująca do laptopa (Dell WD, HP, Lenovo ThinkPad)"
      – HP docks (Thunderbolt Dock G2/G4/G5, HP UltraSlim, HP E24x, HP USB-C Dock) — same category
      – Lenovo ThinkPad (Ultra Dock, USB-C Dock, Thunderbolt 3 Dock, Hybrid Dock) — same category
      – Generic/Anker/UGREEN USB hubs with 4+ ports — classify as "Hub USB / replikator portów (niemarkowy, biurowy)"
  • LAB / TEST INSTRUMENTS — ALWAYS e-waste; classify as "Oscyloskop / przyrząd pomiarowy laboratoryjny (całe urządzenie)":
      – Oscilloscopes (Tektronix 465/2465/7000, HP/Agilent/Keysight 54xxx, Rohde&Schwarz RTO/RTM, LeCroy, Hameg)
      – Signal analyzers / dynamic signal analyzers (HP 3561A/3562A/3585A, HP 8566B, R&S FSP/FSV)
      – Spectrum analyzers (HP/Agilent/Keysight, R&S, Anritsu, Advantest)
      – Function/waveform generators (HP 3312A/3325A/33120A, Tektronix AFG, R&S)
      – Frequency counters, LCR meters, impedance analyzers, phase meters
      – Bench power supplies (laboratory, multi-output, Agilent/Keysight E3xxx, Hameg HM7xxx)
      – Network analyzers (HP/Agilent/Keysight 8753/E5071, R&S ZVA)
      – Any device with: metal chassis + BNC/SMA/SMB coaxial connectors on front/rear panel + display + many knobs/buttons
      – Pre-1990 instruments are RICHER in Au/Pd (ceramic DIP ICs, PME MLCC capacitors)
      – NEVER classify lab test instruments as "Stara elektronika (ogólna)" or "Nieelektroniczne"
CRITICAL RULE — NEVER classify server equipment as "Nieelektroniczne". Rack servers, blade servers, switches, NAS, SANs are ALWAYS e-waste with recoverable precious metals. A Dell PowerEdge, HP ProLiant, or any device with a 19-inch rack form factor IS ALWAYS e-waste.
CRITICAL RULE — NEVER classify LAPTOP DOCKING STATIONS as "Nieelektroniczne". A docking station is a flat rectangular device covered in USB/DP/HDMI/RJ45 ports. Even without a laptop connected, IT IS ALWAYS e-waste with recoverable gold. If you see a pile of flat devices with many ports on the back/sides and black plastic housing — those are DOCKING STATIONS, NOT non-electronic scrap.
CRITICAL RULE — NEVER classify OLD METAL-CAN TRANSISTORS as "Nieelektroniczne". If you see a pile of small shiny metal components with round or diamond-shaped all-metal housings and wire leads — these are OLD TRANSISTORS (TO-3, TO-5, TO-18 types from 1960s–1980s) and they ARE e-waste with recoverable GOLD (Au ~1.5 g/kg typical). TO-3 = large diamond-shaped flat metal can ~20×20mm; TO-5 = small round metal cap ~9mm diameter; TO-18 = tiny round can ~5mm. They look like shiny silver metal "hats" or "slugs" with 2-3 wire legs. Use materialType = "Tranzystory w metalowych puszkach (stare, TO-3/TO-5/TO-18)". NOTE: Modern black plastic transistors (TO-92, SOT-23 SMD) have ZERO precious metals — those ARE "Nieelektroniczne" if sorted out.
DO NOT force-fit non-electronics: decorative buttons, coins, brass fittings, clothing, non-electronic mechanical parts are NOT e-waste.
Non-e-waste → materialType = "Nieelektroniczne — [Polish name]", all metal values = 0.0, quantity = 0.

⚠️ CRITICAL FALLBACK RULE — READ BEFORE CLASSIFYING ANYTHING AS "Nieelektroniczne":
If an item HAS any of the following → it IS e-waste, NEVER "Nieelektroniczne":
  • A printed circuit board (PCB) — green, blue, yellow, or brown substrate with components
  • Microchips / ICs / transistors / capacitors soldered on a board
  • Electronic connectors, ports (USB, VGA, RJ45, HDMI, edge connectors)
  • A power supply unit, transformer, or switching converter
  • Any device that plugs into mains power or runs on batteries
  • Wiring harnesses or cables connected to electronic components
  • A motor with electronics attached
  • Relay, contactor, solenoid, or electromechanical actuator with electronic control
If you cannot identify the specific type BUT the item is clearly electronic → use "Mix PCB — Elektronika Mieszana" as the fallback, NEVER "Nieelektroniczne".
"Nieelektroniczne" is ONLY for: decorative items, coins, purely mechanical parts with ZERO electronic content, clothing, wood, stone, plain metal scraps with no electronic function.

CRITICAL VISUAL SHAPE GUIDE — read before identifying:
  RACK SERVER (1U/2U) — ALWAYS e-waste: Metal chassis with height exactly 1U (44mm) or 2U (88mm) × ~430-480mm wide × ~600-800mm deep — designed to slide into a 19-inch server rack — front face shows USB ports, VGA, drive bay slots (blank or with 2.5"/3.5" drive caddies), power button, LCD status display, or just blank drive bays — DELL branding (PowerEdge 1950/2950/R610/R620/R630/R720/R730/R740), HP (ProLiant DL360/DL380/DL580), IBM (x3550/x3650), CISCO (UCS) — if you see "Dell PowerEdge", "ProLiant", "iDRAC" or a 19-inch rack-mount chassis, it IS ALWAYS e-waste, NEVER "Nieelektroniczne". Select "Serwer rack 1U" or "Serwer rack 2U".
  BLADE SERVER MODULE: Slim rectangular compute module (~70mm×250mm×34mm) with a small front face showing only a handle/latch and status LEDs — slides horizontally into a blade enclosure — no external ports visible — brands: Dell M-series, HP BL-series, IBM BladeCenter HS. Very high PCB density.
  ENTERPRISE NETWORK SWITCH: 1U metal chassis densely packed with RJ45/SFP/SFP+ ports in rows on the FRONT — Cisco Catalyst (24/48 ports, blue/black, Cisco logo), HP ProCurve/Aruba (grey), Juniper EX (black), Brocade, Extreme Networks — heavy for its size — ALWAYS e-waste with recoverable gold.
  RAM sticks (DIMM/SO-DIMM): LONG thin rectangular board (133mm×30mm desktop or 67mm×30mm laptop). Memory chips in ONE ROW along the LENGTH. A notch cut into the edge contacts. Never square. Never small.
  mini PCIe / M.2 cards (laptop WiFi/BT/WWAN): TINY card, roughly SQUARE (30×26mm) or small rectangle (30×51mm). Gold contacts on ONE SHORT EDGE ONLY. Two tiny coaxial (MHF/IPEX) connectors. FCC-ID label. This is NOT RAM — it is 3-5× smaller than a RAM stick.
  Laptop sub-boards (USB/audio/touchpad/power): small rectangular or square PCBs (40-120mm) with ribbon cable connectors, dedicated to a single laptop function. No large CPU/GPU die.
  CPU socket adapter / BGA programmer boards: square PCB (70-110mm) with a large SQUARE OPENING or socket cavity in the CENTER. Dense gold contacts or pin array around the central hole. Edge connector on one side. THESE ARE NOT laptop motherboards.
  Laptop motherboards: large complex PCB (200-300mm) with CPU socket or BGA site, multiple DIMM slots, PCIe slots, multiple connectors and chips.
  Desktop motherboards: even larger PCB (240-305mm ATX) with expansion slots, DIMM rows, large CPU socket, VRM heatsink mounts.
  ISA/PCI expansion cards: PCB with a bracket (metal L-bracket or card with notch). Usually 120-170mm × 100mm.
  CERAMIC DIP ICs — HIGH VALUE (Au 5–25 g/kg): flat rectangular chip body made of WHITE, GREY or BEIGE CERAMIC (not black) — DIP package with two rows of legs — often has a GOLD or SILVER metallic lid/cap on top — examples: Intel EPROM (27xx series), Intel 8085/8086/8088, Motorola 68000, AMD Am286, PAL/GAL chips from 1975-1995 era — body is usually 10-70mm long, 10-25mm wide — the ceramic material looks like porcelain or fired clay, NOT shiny plastic. These are the MOST VALUABLE single ICs in e-waste. Do NOT confuse with black plastic chips.
  PLASTIC DIP/SOIC/QFP ICs — LOWER VALUE (Au 0.1–0.5 g/kg): standard BLACK EPOXY body — DIP (two rows), SOIC (flat gull-wing), QFP (legs on all 4 sides) — the most common IC type found on PCBs, manufactured from mid-1980s to today.
  ZIF / IC test sockets: black or gold plastic socket (20-50mm long), two rows of gold-plated pins along the sides, optional lever mechanism — used for IC programming or chip testing — SMALL individual items usually 3-10g each.
  SIMM memory slot connectors: gold L-shaped or C-shaped metal bracket (70-100mm long), narrow slot for inserting SIMM module, spring contacts inside — pulled from old motherboard — NOT a telecom block.
  Standard DIP IC sockets: tiny black plastic socket (8-40 pins), two rows of silver/tin contact pins — very low gold content — common repair-shop items.
  TELECOM backplane connectors (HIGH VALUE): ONLY from telephone exchange racks (AXE, EWSD, DMS) — massive blocks 150mm+ packed with hundreds of dense DIN/Metral pins — INDUSTRIAL TELECOM EQUIPMENT ONLY.
  GOLD-PLATED CONNECTOR PINS / CONTACTS (HIGH VALUE — "grubo złocone piny"): loose pile of bare metallic pins, springs, or bent contact leads with a UNIFORM GOLDEN SURFACE — thin wire-like or bent metallic pieces 5–30mm long — NO plastic housing visible — entire surface is golden (NOT just the tips) — extracted from multi-pin connectors, IC packages, or industrial components — when the whole piece looks gold (not silver/nickel), classify as "Piny/styki złącz elektronicznych (grubo złocone, bez plastiku)" with Au 2–8 g/kg.
  CROSSBAR RELAY CONTACTS ("styki krzyżownicy"): flat spring strips or contact assemblies specifically from old mechanical telephone exchange racks (Ericsson ARF/ARM, Siemens EMD, Strowger crossbar) — these are Pd-Ag ALLOY contacts (60% Pd + 40% Ag), NOT gold — Au trace only 0.1–2 g/kg, Ag 5–30 g/kg, Pd 1–8 g/kg.
  PURE SILVER ELECTRICAL CONTACTS ("styki srebrne czyste"): small identically-shaped silvery discs, rivets, or flat pads — all pieces look UNIFORM (same shape/size) — heavy for their size — no plastic housing — from relays, contactors, circuit breakers, thermostats — AgCu/AgNi/AgSnO2 alloys — silver-white metallic sheen — if the pile looks sorted and all pieces are the same shape (disc/rivet), classify as "Srebrne styki elektryczne (presortowane, czyste)" with Ag 200–900 g/kg.
  MIXED COPPER AND SILVER-PLATED CONTACT SCRAP ("złom kontaktowy MIX"): loose MIXED assortment of reddish copper strips, clips, terminal lugs, spring contacts, blade connectors AND some silvery/silver-plated pieces mixed together — irregular shapes, various sizes — from electrical panels, switchgear, relays, terminal blocks — flat pressed/stamped shapes, ring terminals, fork terminals — NOT full PCBs, NOT electronic — NOT gold-colored — reddish copper color dominates — classify as "Złom kontaktowy MIX — miedziane i srebrzone blaszki/styki" with Ag 5–80 g/kg (typical 18), Au <0.1 g/kg — IMPORTANT: this is NOT "Nieelektroniczne" generic category — use the specific "styki_mix_cu_ag" entry.
  ELECTROMECHANICAL RELAYS (for silver recovery): rectangular plastic or metal case 10–100g per piece — PCB-mounted or standalone — Omron/Finder/Schrack/Siemens TE brand — silver contact tips inside — when sold as BULK WEIGHT for Ag recovery, classify as "Przekaźniki elektromechaniczne (do odzysku srebra)" with Ag 1.5–12 g/kg of whole relay weight.
  LAPTOP DOCKING STATION (E-WASTE — "stacja dokująca"): flat rectangular block (150-250mm × 80-200mm × 20-50mm tall), entirely covered in ports on the back/sides — typically 4-8× USB-A, 1-2× USB-C, 1-2× DisplayPort or HDMI, 1× RJ45 Ethernet, audio jack, power input — brands: Dell (WD/D-series), HP (Thunderbolt/UltraSlim), Lenovo (ThinkPad dock) — black or dark grey plastic housing — when a pile of identical flat devices with many ports is visible in a cardboard box, these are docking stations — ALWAYS E-WASTE.

STEP 2 — For EACH type, select "materialType" from the catalog above (exact name). If none fits, use a descriptive Polish name.
IMPORTANT: Apply the shape guide from above — do NOT call small square cards "RAM". Do NOT call a square board with a central opening a "laptop motherboard".
IMPORTANT: Do NOT use "UFO" as a materialType name — ever. For mixed/unidentified electronics use the catalog entry "Mix PCB — Elektronika Mieszana".

STEP 3 — Determine quantities.
A) COUNT each type carefully: scan systematically left→right, top→bottom.
   STACKED / OVERLAPPING items rule — READ CAREFULLY:
   • A module counts as ONE unit only when its PRIMARY FACE (the flat main surface) is clearly visible and unique.
   • Thin horizontal or vertical EDGE STRIPS peeking out from under another module are NOT separate units — ignore them.
   • For a pile of RAM sticks on a table: count only the sticks whose full (or mostly full) front PCB face is visible. Do not count the narrow edges of buried sticks as extra units.
   • When you are unsure whether an edge strip is a separate module, DO NOT count it.
   • Conservative counting is required: under-count rather than over-count.
B) MASS ESTIMATION — always required:
   IF a scale was detected in STEP 0 with a valid weight reading:
   — scaleReading.weightGrams is the ACTUAL TOTAL MASS of all items on the scale.
   — Estimate what PERCENTAGE of that total mass belongs to each identified type.
     Example: scale shows 100g, pile is roughly 70% ZIF sockets + 30% SIMM connectors → ZIF massGrams=70, SIMM massGrams=30.
   — Set "massGrams" on each item to its share. ALL massGrams values MUST sum exactly to scaleReading.weightGrams.
   — This is more accurate than piece counts — use it as the primary quantity for calculations.
   IF no scale was detected: ESTIMATE massGrams visually for each item using these reference weights:
   WHOLE DEVICES (estimate total device mass including chassis/housing):
     • Large bench-top lab/test instruments (oscilloscopes, signal analyzers, spectrum analyzers, HP/Tektronix/Rohde&Schwarz equipment with CRT/LCD, metal chassis, depth >25cm): 5,000–15,000 g (e.g. HP 3561A ~10,500g, Tektronix 465 ~5,000g, HP 8566B ~22,000g)
     • Small bench instruments (function generators, small multimeters, handheld LCR, small power supplies): 800–4,000 g
     • Desktop PC tower (without monitor): 6,000–12,000 g
     • CRT monitor 14-17": 10,000–18,000 g; CRT monitor 19-21": 18,000–30,000 g
     • Rack server 1U (full depth, metal chassis ~60cm deep): 8,000–14,000 g
     • Rack server 2U: 12,000–25,000 g
     • Laptop (14-15"): 1,500–2,800 g; Laptop (17"): 2,500–3,500 g
     • Inkjet printer (desktop A4): 3,000–8,000 g; Laser printer (A4): 8,000–18,000 g
     • ATX power supply: 1,500–2,500 g
     • Set-top box / router / modem: 300–800 g
     • Smartphone: 130–240 g; Tablet 10": 400–700 g
     • VHS/camcorder: 800–1,800 g; Digital camera: 200–600 g
   LOOSE COMPONENTS (estimate per-piece then multiply by quantity):
     • Full-size motherboard (ATX): 500–900 g each
     • Laptop motherboard: 200–400 g each
     • RAM DIMM stick: 25–45 g each; SO-DIMM: 8–20 g each
     • ZIF test socket: 3–8 g each; SIMM connector: 4–10 g each
     • CPU (desktop LGA): 50–150 g each; CPU (laptop BGA bare): 5–20 g each
     • GPU card with bracket: 400–1,200 g each
     • PCB from CD/DVD drive: 30–50 g each
   RULES:
   — Always provide massGrams as an integer (rounded to nearest 100g for devices, 10g for small components).
   — For WHOLE DEVICES use device mass × quantity.
   — For LOOSE COMPONENTS use per-piece mass × quantity.
   — NEVER set massGrams = null when you can visually identify the device type. Use null only if truly unidentifiable.

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
      "description": "2-4 sentences in Polish: (1) what the item is and its metal characteristics, (2) for WHOLE DEVICES — which components are worth removing before processing (e.g. PCBs, CPU, gold-plated connectors, memory boards) and why",
      "quantity": <integer piece count from STEP 3A; 0 only if truly impossible to count>,
      "massGrams": <estimated total mass in grams from STEP 3B — always provide a number; null ONLY if truly unidentifiable>,
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
Reference metal values: motherboards ~0.2–0.5 g Au/kg; ceramic CPUs ~3–10 g Au/kg; gold fingers ~2–15 g Au/kg; RAM (gold contacts, DIMM) ~0.6–1.5 g Au/kg; mini PCIe / M.2 WiFi cards ~0.4–0.8 g Au/kg; laptop sub-boards ~0.1–0.2 g Au/kg; CPU socket adapter boards ~0.5–1.5 g Au/kg; ZIF/test IC sockets (precision) ~1–4 g Au/kg; SIMM memory slot connectors ~0.8–2.5 g Au/kg; standard DIP IC sockets (cheap) ~0.1–0.5 g Au/kg; telecom backplane connectors (industrial) ~2–8 g Au/kg; GOLD-PLATED CONNECTOR PINS bare (grubo złocone piny/styki bez plastiku, uniform golden surface) ~2–8 g Au/kg, ~0.5–3 g Ag/kg — HIGH VALUE, do NOT estimate as 0.05; CROSSBAR RELAY CONTACTS (styki krzyżownicy, telecom exchanges) ~3–10 g Au/kg, ~1–8 g Ag/kg, ~0.1–1.5 g Pd/kg — VERY HIGH VALUE; PURE SILVER ELECTRICAL CONTACTS presorted (styki srebrne AgCu/AgNi/AgSnO2, sorted discs/rivets) ~0 g Au/kg, ~200–900 g Ag/kg (typical 500) — EXTREMELY HIGH Ag, primary value is silver not gold; MIXED COPPER+SILVER CONTACT SCRAP (złom kontaktowy MIX, miedziane blaszki i srebrzone styki razem) ~<0.1 g Au/kg, ~5–80 g Ag/kg (typical 18) — value is Ag+Cu, NOT gold-bearing; ELECTROMECHANICAL RELAYS bulk for Ag (przekaźniki elektromehaniczne luzem, Omron/Finder/Schrack) ~0.1 g Au/kg, ~1.5–12 g Ag/kg — value is silver contacts inside; VHS camcorders (whole) ~0.08 g Au/kg, ~0.55 g Ag/kg; Video8/Hi8 camcorders (whole) ~0.10 g Au/kg, ~0.65 g Ag/kg; Super 8 film cameras ~0.025 g Au/kg, ~0.18 g Ag/kg; digital cameras (whole) ~0.09 g Au/kg, ~0.55 g Ag/kg; CERAMIC DIP ICs (white/grey/beige ceramic body, gold lid or gold legs — EPROMs, old CPUs, PALs from 1975-1995) ~5–25 g Au/kg — HIGHEST VALUE of any IC type, GRF data: Intel 8086 ceramic=18 g/kg, EPROM 2716=22 g/kg — do NOT confuse with black plastic DIP chips (those are only ~0.1–0.5 g Au/kg); plastic DIP/SOIC/QFP ICs (standard black epoxy chips) ~0.1–0.5 g Au/kg; GPU graphics cards (modern, with multiple BGA chips + GDDR memory) ~0.15–0.35 g Au/kg, ~1–2 g Ag/kg; SSD/NVMe PCBs (small rectangular board with NAND flash chips) ~0.2–0.5 g Au/kg, ~0.8–2 g Ag/kg; MLCC ceramic capacitors from PRE-2000 devices (PME type, large body 0805/1206 size) ~3–15 g Pd/kg, ~20–80 g Ag/kg — VERY HIGH Pd content; MLCC ceramic capacitors from POST-2000 devices (BME type, tiny 0402/0201) ~0.1–0.5 g Pd/kg — low; tantalum capacitors (SMD, yellow/orange/black teardrop shape) ~0.3–1.0 g Pd/kg, ~0.8–2.5 g Ag/kg; SMD resistors, inductors, and MODERN PLASTIC transistors/diodes (black TO-92, SOT-23, SOT-223) DO NOT contain significant precious metals — do not classify these as high-value e-waste; EXCEPTION: OLD METAL-CAN TRANSISTORS (TO-3/TO-5/TO-18 — shiny metal housing, no plastic) ~1.5 g Au/kg, ~0.4 g Ag/kg — HIGH VALUE, use "Tranzystory w metalowych puszkach (stare, TO-3/TO-5/TO-18)"; RACK SERVER 1U whole (with chassis, ~16 kg) ~0.05–0.15 g Au/kg, ~0.10–0.30 g Ag/kg, ~0.01–0.025 g Pd/kg — low Au/kg because heavy steel chassis dominates; RACK SERVER 2U whole ~0.05–0.14 g Au/kg; BLADE SERVER module (no chassis, ~4 kg, just compute board) ~0.15–0.55 g Au/kg — much higher Au/kg than rack server; ENTERPRISE SWITCH (Cisco Catalyst, HP ProCurve, all-PCB dense) ~0.15–0.60 g Au/kg, ~0.30–1.2 g Ag/kg — gold in dense backplane connectors and SFP ports; NAS device (QNAP/Synology without drives) ~0.08–0.25 g Au/kg; OLD KEYPAD PHONES / FEATURE PHONES (Nokia 3310/3510/6310/6610/5110/8210 and similar GSM-era brick/bar phones, pre-2005) ~0.25–0.45 g Au/kg whole phone — these older phones have MORE gold than modern smartphones because of thicker ENIG PCB plating, gold-plated keyboard dome contacts, gold-plated SIM/battery spring contacts, and older wire-bonding IC technology; do NOT underestimate to 0.05–0.1 g Au/kg; MODERN SMARTPHONES (iPhone, Samsung Galaxy, Huawei — post-2010, touchscreen) ~0.25–0.35 g Au/kg whole phone with battery; TABLETS (iPad, Samsung Tab — whole with battery) ~0.15–0.30 g Au/kg; VERY OLD MOBILE PHONES (1990s — Motorola StarTAC, Nokia 5110/8110/2110, Ericsson GH/GA series) ~0.35–0.60 g Au/kg — even higher gold content due to 1990s manufacturing standards; LAB/TEST INSTRUMENTS whole device (oscilloscopes, signal analyzers, spectrum analyzers, function generators — HP/Tektronix/R&S/Keithley, metal chassis, BNC connectors, CRT/LCD, many PCB cards) ~0.06-0.25 g Au/kg (typical 0.12), ~0.12-0.55 g Ag/kg, ~0.005-0.045 g Pd/kg — NEVER call these "Stara elektronika (ogolna)" — classify as "Oscyloskop / przyrzad pomiarowy laboratoryjny (cale urzadzenie)"; pre-1990 lab instruments richer due to ceramic DIP ICs and PME MLCC.`;

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

    const lang = typeof req.body?.lang === "string" && req.body.lang.toLowerCase().startsWith("en") ? "en" : "pl";

    const languageSection = lang === "en"
      ? `

LANGUAGE OVERRIDE — ENGLISH MODE:
Write ALL free-text fields in ENGLISH:
  • "description": 2-4 sentences in English describing the item and its metal characteristics
  • "caveats": 1-2 sentences in English warning about estimation accuracy
  • "recommendedProcess": English name of the recommended recovery process
  • "platingAnalysis.notes": English note or null
  • "platingAnalysis.color": use English terms only: gold, silver, nickel, mixed (or null)
  • "platingAnalysis.thickness": use English terms only: thin (<0.1μm), medium (0.1-0.5μm), thick (>0.5μm) (or null)
CRITICAL: Keep "materialType" in its ORIGINAL POLISH form exactly as specified in the catalog — this field is used for internal database matching and must NOT be translated.`
      : `

JĘZYK — TRYB POLSKI:
Pisz WSZYSTKIE pola tekstowe PO POLSKU:
  • "description": 2-4 zdania po polsku opisujące materiał i jego charakterystykę metaliczną
  • "caveats": 1-2 zdania po polsku dotyczące dokładności szacowania
  • "recommendedProcess": polska nazwa rekomendowanego procesu odzysku
  • "platingAnalysis.notes": polska notatka lub null
  • "platingAnalysis.color": użyj polskich terminów: złoty, srebrny, niklowy, mieszany (lub null)
  • "platingAnalysis.thickness": użyj polskich terminów: cienkie (<0,1μm), średnie (0,1-0,5μm), grube (>0,5μm) (lub null)
KRYTYCZNE: Pole "materialType" MUSI pozostać w oryginalnej polskiej formie z katalogu — używane do wewnętrznego dopasowania w bazie danych.`;

    const learnedContext = await fetchLearnedContext();
    const prompt = ANALYSIS_PROMPT
      .replace("{{CATALOG_SECTION}}", catalogSection)
      .replace("{{LEARNED_CONTEXT_SECTION}}", learnedContext) + languageSection;

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

    // No cy correction — AI coordinates are used as-is (previous quadratic
    // correction caused systematic upward shift as reported by users).

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

// POST /vision/share — save analysis result, return shareId (no auth required)
router.post("/share", async (req: Request, res: Response) => {
  const { resultJson } = req.body ?? {};
  if (!resultJson || typeof resultJson !== "string") {
    res.status(400).json({ error: "resultJson required" });
    return;
  }
  const shareId = randomBytes(6).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(analysisSharesTable).values({ id: shareId, resultJson, expiresAt });
  res.json({ shareId });
});

// GET /vision/og/analiza/:shareId — Open Graph HTML for bots (Facebook, WhatsApp, Telegram etc.)
router.get("/og/analiza/:shareId", async (req: Request, res: Response) => {
  const shareId = req.params.shareId;
  const shareUrl = `https://metalrecovery.online/analiza/${shareId}`;
  const ogImage = "https://metalrecovery.online/og-preview-v2.jpg";

  let ogTitle = "Analiza AI — MetalRecovery Pro";
  let ogDesc = "Precyzyjne szacowanie odzysku złota, srebra, platyny i palladu z e-odpadów.";

  try {
    const [share] = await db
      .select()
      .from(analysisSharesTable)
      .where(eq(analysisSharesTable.id, shareId))
      .limit(1);

    if (share && (!share.expiresAt || share.expiresAt > new Date())) {
      const result = JSON.parse(share.resultJson) as {
        items?: Array<{ materialType?: string; au?: number; ag?: number; pt?: number; pd?: number; quantity?: number }>;
      };
      const items = result.items ?? [];
      if (items.length > 0) {
        const first = items[0];
        const name = first.materialType ?? "Materiał";
        const metals = [
          first.au != null ? `Au ${first.au} g/kg` : null,
          first.ag != null ? `Ag ${first.ag} g/kg` : null,
          first.pt != null && first.pt > 0 ? `Pt ${first.pt} g/kg` : null,
          first.pd != null && first.pd > 0 ? `Pd ${first.pd} g/kg` : null,
        ].filter(Boolean).join(" · ");
        const extra = items.length > 1 ? ` (+${items.length - 1} więcej)` : "";
        ogTitle = `${name}${extra} — analiza AI | MetalRecovery Pro`;
        ogDesc = metals ? `${metals}. Analiza wykonana przez MetalRecovery Pro — kalkulator odzysku metali szlachetnych z e-odpadów.` : ogDesc;
      }
    }
  } catch {
    // fall through to defaults
  }

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8" />
<title>${esc(ogTitle)}</title>
<meta name="description" content="${esc(ogDesc)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${esc(shareUrl)}" />
<meta property="og:site_name" content="MetalRecovery Pro" />
<meta property="og:title" content="${esc(ogTitle)}" />
<meta property="og:description" content="${esc(ogDesc)}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(ogTitle)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(ogTitle)}" />
<meta name="twitter:description" content="${esc(ogDesc)}" />
<meta name="twitter:image" content="${ogImage}" />
<meta http-equiv="refresh" content="0;url=${esc(shareUrl)}" />
<script>window.location.replace(${JSON.stringify(shareUrl)});</script>
</head>
<body><a href="${esc(shareUrl)}">${esc(ogTitle)}</a></body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.send(html);
});

// GET /vision/share/:id — load saved analysis result
router.get("/share/:id", async (req: Request, res: Response) => {
  const [share] = await db
    .select()
    .from(analysisSharesTable)
    .where(eq(analysisSharesTable.id, req.params.id))
    .limit(1);
  if (!share) {
    res.status(404).json({ error: "Link nie istnieje lub analiza została usunięta." });
    return;
  }
  if (share.expiresAt && share.expiresAt < new Date()) {
    res.status(410).json({ error: "Link wygasł (ważny 30 dni od daty analizy)." });
    return;
  }
  res.json({ resultJson: share.resultJson, createdAt: share.createdAt, expiresAt: share.expiresAt });
});

// POST /vision/correction — authenticated users submit a correction for a misclassified item
router.post("/correction", requireAuth, async (req: AuthRequest, res: Response) => {
  const { aiMaterialType, correctMaterialType, correctionNote, imageDescription } = req.body ?? {};
  if (!aiMaterialType || !correctMaterialType) {
    res.status(400).json({ error: "Podaj ai_material_type i correct_material_type." });
    return;
  }
  const user = req.user!;
  await db.insert(visionCorrectionsTable).values({
    aiMaterialType: String(aiMaterialType),
    correctMaterialType: String(correctMaterialType),
    correctionNote: correctionNote ? String(correctionNote) : null,
    imageDescription: imageDescription ? String(imageDescription) : null,
    userId: user.id,
    userEmail: user.email,
    status: "pending",
  });
  res.json({ ok: true });
});

export default router;
