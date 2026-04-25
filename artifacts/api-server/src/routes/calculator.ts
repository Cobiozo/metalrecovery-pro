import { Router, type IRouter } from "express";
import { getOrFetchPrices } from "./metals.js";
import { electronicMaterials } from "./materials.js";

const router: IRouter = Router();

interface BatchItem {
  materialId: string;
  quantity: number;
  isCleaned?: boolean;
  /** Optional metal content override (g/kg typical) for custom / user-defined materials */
  inlineMetalContent?: { Au: number; Ag: number; Pt: number; Pd: number };
  /** Optional multiplier applied to Au content — used to pass vision plating-quality adjustment (e.g. 0.65–1.40) */
  auMultiplier?: number;
}

interface CalculationRequest {
  batch: BatchItem[];
  processId: string;
  acidConcentrationOverride?: number;
  temperatureOverride?: number;
  electricityPricePerKwh?: number;
  reagentPriceOverrides?: Record<string, number>;
}

type MaterialEntry = {
  unit: string;
  weightPerPiece?: number;
  requiresCleaning?: boolean;
  cleanedMultiplier?: { Au: number; Ag: number; Pt: number; Pd: number };
  metalContentPerKg: {
    Au: { typical: number };
    Ag: { typical: number };
    Pt: { typical: number };
    Pd: { typical: number };
  };
};

const electronicMaterialsMap = Object.fromEntries(
  electronicMaterials.map((m) => {
    const mat = m as typeof m & {
      weightPerPiece?: number;
      requiresCleaning?: boolean;
      cleanedMultiplier?: { Au: number; Ag: number; Pt: number; Pd: number };
    };
    const entry: MaterialEntry = {
      unit: m.unit,
      weightPerPiece: mat.weightPerPiece,
      requiresCleaning: mat.requiresCleaning,
      cleanedMultiplier: mat.cleanedMultiplier,
      metalContentPerKg: {
        Au: { typical: m.metalContentPerKg.Au.typical },
        Ag: { typical: m.metalContentPerKg.Ag.typical },
        Pt: { typical: m.metalContentPerKg.Pt.typical },
        Pd: { typical: m.metalContentPerKg.Pd.typical },
      },
    };
    return [m.id, entry];
  }),
) as Record<string, MaterialEntry>;

const chemicalProcessesMap: Record<
  string,
  {
    name: string;
    reagents: Array<{
      name: string;
      concentration: number;
      amountPerKg: number;
      pricePerLiter: number;
    }>;
    timePerKgMin: number;
    timePerKgMax: number;
    temperatureOptimal: number;
    yieldPercent: { Au: number; Ag: number; Pt: number; Pd: number };
    electricityKwhPerKg: number;
  }
> = {
  aqua_regia: {
    name: "Woda Królewska (HCl + HNO3)",
    reagents: [
      {
        name: "Kwas azotowy rozcieńczony — pre-trawienie (HNO3 25%)",
        concentration: 25,
        amountPerKg: 0.5,
        pricePerLiter: 22.0,
      },
      {
        name: "Kwas solny (HCl)",
        concentration: 35,
        amountPerKg: 0.4,
        pricePerLiter: 18.0,
      },
      {
        name: "Kwas azotowy stężony (HNO3 65%)",
        concentration: 65,
        amountPerKg: 0.15,
        pricePerLiter: 28.0,
      },
      {
        name: "Mocznik (rozkład nadmiaru HNO3)",
        concentration: 99,
        amountPerKg: 0.03,
        pricePerLiter: 4.0,
      },
      {
        name: "Wodorosiarczyn sodu — reduktor SMB (wytrącanie Au)",
        concentration: 40,
        amountPerKg: 0.02,
        pricePerLiter: 12.0,
      },
      {
        name: "Boraks (topnik do wytopu)",
        concentration: 99,
        amountPerKg: 0.005,
        pricePerLiter: 10.0,
      },
    ],
    timePerKgMin: 4,
    timePerKgMax: 10,
    temperatureOptimal: 70,
    yieldPercent: { Au: 95, Ag: 20, Pt: 85, Pd: 80 },
    electricityKwhPerKg: 0.6,
  },
  hno3_dilute: {
    name: "Kwas azotowy rozcieńczony (HNO3 25-30%)",
    reagents: [
      {
        name: "Kwas azotowy rozcieńczony (HNO3 25%)",
        concentration: 25,
        amountPerKg: 0.5,
        pricePerLiter: 22.0,
      },
      {
        name: "Chlorek sodu (wytrącanie AgCl)",
        concentration: 100,
        amountPerKg: 0.01,
        pricePerLiter: 3.0,
      },
      {
        name: "Cynk metaliczny — redukcja AgCl→Ag",
        concentration: 99,
        amountPerKg: 0.005,
        pricePerLiter: 65.0,
      },
      {
        name: "Kwas solny HCl — rozpuszczenie cynku z osadu",
        concentration: 35,
        amountPerKg: 0.05,
        pricePerLiter: 18.0,
      },
    ],
    timePerKgMin: 2,
    timePerKgMax: 6,
    temperatureOptimal: 40,
    yieldPercent: { Au: 0, Ag: 85, Pt: 5, Pd: 10 },
    electricityKwhPerKg: 0.2,
  },
  hno3_concentrated: {
    name: "Kwas azotowy stężony (HNO3 65%)",
    reagents: [
      {
        name: "Kwas azotowy stężony (HNO3 65%)",
        concentration: 65,
        amountPerKg: 0.4,
        pricePerLiter: 28.0,
      },
      {
        name: "Chlorek sodu (wytrącanie AgCl)",
        concentration: 100,
        amountPerKg: 0.01,
        pricePerLiter: 3.0,
      },
      {
        name: "Cynk metaliczny — redukcja AgCl→Ag",
        concentration: 99,
        amountPerKg: 0.005,
        pricePerLiter: 65.0,
      },
      {
        name: "Kwas solny HCl — rozpuszczenie cynku z osadu",
        concentration: 35,
        amountPerKg: 0.05,
        pricePerLiter: 18.0,
      },
    ],
    timePerKgMin: 1,
    timePerKgMax: 4,
    temperatureOptimal: 35,
    yieldPercent: { Au: 0, Ag: 90, Pt: 0, Pd: 70 },
    electricityKwhPerKg: 0.15,
  },
  hcl_h2o2: {
    name: "HCl + H2O2 (etching kwasowy)",
    reagents: [
      {
        name: "Kwas solny (HCl)",
        concentration: 35,
        amountPerKg: 0.5,
        pricePerLiter: 18.0,
      },
      {
        name: "Nadtlenek wodoru (H2O2)",
        concentration: 30,
        amountPerKg: 0.2,
        pricePerLiter: 20.0,
      },
      {
        name: "Wodorosiarczyn sodu — reduktor SMB (wytrącanie Au)",
        concentration: 40,
        amountPerKg: 0.02,
        pricePerLiter: 12.0,
      },
      {
        name: "Boraks (topnik do wytopu Au)",
        concentration: 99,
        amountPerKg: 0.005,
        pricePerLiter: 10.0,
      },
    ],
    timePerKgMin: 6,
    timePerKgMax: 16,
    temperatureOptimal: 45,
    yieldPercent: { Au: 90, Ag: 15, Pt: 60, Pd: 75 },
    electricityKwhPerKg: 0.3,
  },
  nitrate_boat: {
    name: "Łódź azotanowa (NaNO3 + H2SO4)",
    reagents: [
      {
        name: "Azotan sodu (NaNO3)",
        concentration: 99,
        amountPerKg: 0.15,
        pricePerLiter: 18.0,
      },
      {
        name: "Kwas siarkowy (H2SO4)",
        concentration: 98,
        amountPerKg: 0.5,
        pricePerLiter: 28.0,
      },
      {
        name: "Chlorek sodu (wytrącanie AgCl)",
        concentration: 100,
        amountPerKg: 0.01,
        pricePerLiter: 3.0,
      },
      {
        name: "Wodorosiarczyn sodu — SMB (wytrącanie Au)",
        concentration: 40,
        amountPerKg: 0.05,
        pricePerLiter: 12.0,
      },
    ],
    timePerKgMin: 3,
    timePerKgMax: 8,
    temperatureOptimal: 90,
    yieldPercent: { Au: 85, Ag: 90, Pt: 30, Pd: 40 },
    electricityKwhPerKg: 0.8,
  },
  electrolysis: {
    name: "Elektroliza (rafinacja elektrolityczna)",
    reagents: [
      {
        name: "Kwas azotowy (elektrolit bazowy)",
        concentration: 10,
        amountPerKg: 0.5,
        pricePerLiter: 18.0,
      },
      {
        name: "Azotan złota (Au(NO3)3, uzupełniacz elektrolitu)",
        concentration: 5,
        amountPerKg: 0.025,
        pricePerLiter: 1800.0,
      },
      {
        name: "Boraks (topnik do wytopu anody)",
        concentration: 99,
        amountPerKg: 0.05,
        pricePerLiter: 10.0,
      },
    ],
    timePerKgMin: 8,
    timePerKgMax: 24,
    temperatureOptimal: 30,
    yieldPercent: { Au: 99, Ag: 95, Pt: 60, Pd: 50 },
    electricityKwhPerKg: 2.5,
  },
  wohlwill_process: {
    name: "Proces Wöhlwilla (rafinacja złota 999.9)",
    reagents: [
      {
        name: "Kwas solny (elektrolit bazowy HCl 20%)",
        concentration: 20,
        amountPerKg: 1.0,
        pricePerLiter: 12.0,
      },
      {
        name: "Chlorek złota (AuCl3, uzupełniacz elektrolitu)",
        concentration: 10,
        amountPerKg: 0.05,
        pricePerLiter: 3200.0,
      },
      {
        name: "Boraks (topnik do wytopu anod)",
        concentration: 99,
        amountPerKg: 0.02,
        pricePerLiter: 10.0,
      },
    ],
    timePerKgMin: 24,
    timePerKgMax: 48,
    temperatureOptimal: 70,
    yieldPercent: { Au: 99.5, Ag: 0, Pt: 30, Pd: 20 },
    electricityKwhPerKg: 3.0,
  },
  miller_process: {
    name: "Proces Millera (chloracja pirometalurgiczna)",
    reagents: [
      {
        name: "Chlor gazowy (Cl2)",
        concentration: 99,
        amountPerKg: 0.15,
        pricePerLiter: 38.0,
      },
      {
        name: "Boraks (topnik)",
        concentration: 99,
        amountPerKg: 0.1,
        pricePerLiter: 10.0,
      },
      {
        name: "Wodorotlenek sodu NaOH 30% (neutralizacja Cl2 w off-gazie)",
        concentration: 30,
        amountPerKg: 0.3,
        pricePerLiter: 8.0,
      },
    ],
    timePerKgMin: 0.5,
    timePerKgMax: 2,
    temperatureOptimal: 1100,
    yieldPercent: { Au: 98, Ag: 0, Pt: 20, Pd: 10 },
    electricityKwhPerKg: 5.0,
  },
  cementation_zinc: {
    name: "Cementacja cynkiem (wytrącanie Au)",
    reagents: [
      {
        name: "Cynk metaliczny (granulki Zn)",
        concentration: 99,
        amountPerKg: 0.1,
        pricePerLiter: 65.0,
      },
      {
        name: "Ług cyjanku sodu (NaCN, opcjonalny — do ługowania)",
        concentration: 5,
        amountPerKg: 0.3,
        pricePerLiter: 40.0,
      },
      {
        name: "Kwas solny HCl (rozpuszczenie cynku z osadu Au+Zn)",
        concentration: 35,
        amountPerKg: 0.1,
        pricePerLiter: 18.0,
      },
    ],
    timePerKgMin: 3,
    timePerKgMax: 6,
    temperatureOptimal: 25,
    yieldPercent: { Au: 80, Ag: 75, Pt: 20, Pd: 30 },
    electricityKwhPerKg: 0.1,
  },
};


function computeParameterYieldMultiplier(
  processId: string,
  baseYield: number,
  acidConcentrationOverride?: number,
  temperatureOverride?: number,
  processOptimalTemp?: number,
  processDefaultConc?: number,
): number {
  let multiplier = 1.0;

  if (acidConcentrationOverride !== undefined && processDefaultConc !== undefined) {
    const ratio = acidConcentrationOverride / processDefaultConc;
    if (ratio < 0.5) {
      multiplier *= 0.7;
    } else if (ratio < 0.8) {
      multiplier *= 0.85 + (ratio - 0.5) * 0.5;
    } else if (ratio <= 1.2) {
      multiplier *= 1.0;
    } else if (ratio <= 1.5) {
      multiplier *= 0.98;
    } else {
      multiplier *= 0.95;
    }
  }

  if (temperatureOverride !== undefined && processOptimalTemp !== undefined) {
    const diff = Math.abs(temperatureOverride - processOptimalTemp);
    if (diff === 0) {
      multiplier *= 1.0;
    } else if (diff <= 10) {
      multiplier *= 1.0 - diff * 0.002;
    } else if (diff <= 25) {
      multiplier *= 0.98 - (diff - 10) * 0.008;
    } else {
      multiplier *= Math.max(0.60, 0.86 - (diff - 25) * 0.01);
    }
  }

  const adjusted = baseYield * multiplier;
  return Math.min(99.5, Math.max(0, adjusted));
}

function getEffectiveMetalContent(
  mat: MaterialEntry,
  isCleaned: boolean,
): { Au: number; Ag: number; Pt: number; Pd: number } {
  const base = {
    Au: mat.metalContentPerKg.Au.typical,
    Ag: mat.metalContentPerKg.Ag.typical,
    Pt: mat.metalContentPerKg.Pt.typical,
    Pd: mat.metalContentPerKg.Pd.typical,
  };
  if (isCleaned && mat.requiresCleaning && mat.cleanedMultiplier) {
    return {
      Au: base.Au * mat.cleanedMultiplier.Au,
      Ag: base.Ag * mat.cleanedMultiplier.Ag,
      Pt: base.Pt * mat.cleanedMultiplier.Pt,
      Pd: base.Pd * mat.cleanedMultiplier.Pd,
    };
  }
  return base;
}

/** Resolve mass in kg for a batch item (handles piece-unit materials and custom inline items). */
function resolveItemMassKg(item: BatchItem): number {
  if (item.inlineMetalContent) return item.quantity; // custom materials are always in kg
  const mat = electronicMaterialsMap[item.materialId];
  if (!mat) return item.quantity;
  return mat.unit === "piece" ? item.quantity * (mat.weightPerPiece ?? 0.1) : item.quantity;
}

/** Resolve effective metal content (g/kg) for a batch item. Returns null for unknown IDs without inline content. */
function resolveItemMetalContent(
  item: BatchItem,
): { Au: number; Ag: number; Pt: number; Pd: number } | null {
  const base = item.inlineMetalContent
    ? item.inlineMetalContent
    : (() => {
        const mat = electronicMaterialsMap[item.materialId];
        if (!mat) return null;
        return getEffectiveMetalContent(mat, item.isCleaned === true);
      })();
  if (!base) return null;
  if (item.auMultiplier && item.auMultiplier !== 1 && item.auMultiplier > 0) {
    return { ...base, Au: base.Au * item.auMultiplier };
  }
  return base;
}

function computeCompareResult(
  batch: BatchItem[],
  processId: string,
  metalPrices: { Au: number; Ag: number; Pt: number; Pd: number },
  electricityPricePerKwh = 0.8,
) {
  const process = chemicalProcessesMap[processId]!;

  let totalMassKg = 0;
  const totalMetalsG = { Au: 0, Ag: 0, Pt: 0, Pd: 0 };

  for (const item of batch) {
    const massKg = resolveItemMassKg(item);
    const content = resolveItemMetalContent(item);
    if (!content) continue;
    totalMassKg += massKg;
    totalMetalsG.Au += content.Au * massKg;
    totalMetalsG.Ag += content.Ag * massKg;
    totalMetalsG.Pt += content.Pt * massKg;
    totalMetalsG.Pd += content.Pd * massKg;
  }

  const metals = ["Au", "Ag", "Pt", "Pd"] as const;
  let totalRevenuePln = 0;
  let auMassGrams = 0;
  let agMassGrams = 0;

  for (const metal of metals) {
    const recovered = totalMetalsG[metal] * (process.yieldPercent[metal] / 100);
    totalRevenuePln += recovered * metalPrices[metal];
    if (metal === "Au") auMassGrams = Math.round(recovered * 1000) / 1000;
    if (metal === "Ag") agMassGrams = Math.round(recovered * 1000) / 1000;
  }

  totalRevenuePln = Math.round(totalRevenuePln * 100) / 100;

  const chemistryCost = process.reagents.reduce(
    (sum, r) => sum + r.amountPerKg * totalMassKg * r.pricePerLiter,
    0,
  );
  const electricityCost = process.electricityKwhPerKg * totalMassKg * electricityPricePerKwh;
  const totalCostPln = Math.round((chemistryCost + electricityCost) * 100) / 100;
  const netProfitPln = Math.round((totalRevenuePln - totalCostPln) * 100) / 100;

  const profitMargin = totalRevenuePln > 0 ? netProfitPln / totalRevenuePln : -1;
  const profitabilityRating =
    profitMargin > 0.5
      ? "very_profitable"
      : profitMargin > 0.2
        ? "profitable"
        : profitMargin > 0
          ? "marginal"
          : "not_profitable";

  const avgTimePerKg = (process.timePerKgMin + process.timePerKgMax) / 2;
  const estimatedTimeHours = Math.round(avgTimePerKg * totalMassKg * 10) / 10;

  return {
    processId,
    processName: process.name,
    totalInputMassKg: Math.round(totalMassKg * 1000) / 1000,
    netProfitPln,
    totalRevenuePln,
    totalCostPln,
    estimatedTimeHours,
    profitabilityRating,
    auMassGrams,
    agMassGrams,
  };
}

router.post("/calculator/compare", async (req, res) => {
  const body = req.body as { batch: BatchItem[]; electricityPricePerKwh?: number };

  if (!body.batch || !Array.isArray(body.batch) || body.batch.length === 0) {
    res.status(400).json({ error: "Invalid request: batch required" });
    return;
  }
  if (body.batch.length > 50) {
    res.status(400).json({ error: "Batch too large: maximum 50 items allowed" });
    return;
  }
  const unknownMaterials = body.batch
    .filter((item) => !electronicMaterialsMap[item.materialId] && !item.inlineMetalContent)
    .map((item) => item.materialId);
  if (unknownMaterials.length > 0) {
    res.status(400).json({ error: `Unknown material IDs: ${unknownMaterials.join(", ")}` });
    return;
  }
  const invalidQuantities = body.batch.filter(
    (item) => typeof item.quantity !== "number" || item.quantity <= 0,
  );
  if (invalidQuantities.length > 0) {
    res.status(400).json({ error: "All batch quantities must be positive numbers" });
    return;
  }

  const metalPrices = await getOrFetchPrices();
  const elPrice = body.electricityPricePerKwh ?? 0.8;

  const results = Object.keys(chemicalProcessesMap)
    .map((pid) => computeCompareResult(body.batch, pid, metalPrices, elPrice))
    .sort((a, b) => b.netProfitPln - a.netProfitPln);

  res.json(results);
});

router.post("/calculator/estimate", async (req, res) => {
  const body = req.body as CalculationRequest;

  if (
    !body.batch ||
    !Array.isArray(body.batch) ||
    body.batch.length === 0 ||
    !body.processId
  ) {
    res.status(400).json({ error: "Invalid request: batch and processId required" });
    return;
  }

  if (body.batch.length > 50) {
    res.status(400).json({ error: "Batch too large: maximum 50 items allowed" });
    return;
  }

  if (
    body.acidConcentrationOverride !== undefined &&
    (typeof body.acidConcentrationOverride !== "number" ||
      !isFinite(body.acidConcentrationOverride) ||
      body.acidConcentrationOverride <= 0 ||
      body.acidConcentrationOverride > 100)
  ) {
    res.status(400).json({ error: "acidConcentrationOverride must be a number between 0 and 100" });
    return;
  }

  if (
    body.temperatureOverride !== undefined &&
    (typeof body.temperatureOverride !== "number" ||
      !isFinite(body.temperatureOverride) ||
      body.temperatureOverride < -20 ||
      body.temperatureOverride > 1500)
  ) {
    res.status(400).json({ error: "temperatureOverride must be a number between -20 and 1500 °C" });
    return;
  }

  if (
    body.electricityPricePerKwh !== undefined &&
    (typeof body.electricityPricePerKwh !== "number" ||
      !isFinite(body.electricityPricePerKwh) ||
      body.electricityPricePerKwh < 0 ||
      body.electricityPricePerKwh > 10000)
  ) {
    res.status(400).json({ error: "electricityPricePerKwh must be a number between 0 and 10000" });
    return;
  }

  const process = chemicalProcessesMap[body.processId];
  if (!process) {
    res.status(400).json({ error: `Unknown processId: ${body.processId}` });
    return;
  }

  const unknownMaterials = body.batch
    .filter((item) => !electronicMaterialsMap[item.materialId] && !item.inlineMetalContent)
    .map((item) => item.materialId);

  if (unknownMaterials.length > 0) {
    res.status(400).json({
      error: `Unknown material IDs: ${unknownMaterials.join(", ")}`,
    });
    return;
  }

  if (body.reagentPriceOverrides) {
    const invalidPrices = Object.entries(body.reagentPriceOverrides).filter(
      ([, v]) =>
        typeof v !== "number" ||
        !isFinite(v) ||
        v <= 0 ||
        v > 100_000,
    );
    if (invalidPrices.length > 0) {
      res.status(400).json({
        error: `Invalid reagentPriceOverrides: prices must be finite numbers between 0 and 100000 PLN/L`,
      });
      return;
    }
  }

  const invalidQuantities = body.batch.filter(
    (item) => typeof item.quantity !== "number" || item.quantity <= 0,
  );
  if (invalidQuantities.length > 0) {
    res.status(400).json({
      error: "All batch quantities must be positive numbers",
    });
    return;
  }

  const metalPrices = await getOrFetchPrices();

  let totalMassKg = 0;
  const totalMetalsGPerKg = { Au: 0, Ag: 0, Pt: 0, Pd: 0 };

  for (const item of body.batch) {
    const massKg = resolveItemMassKg(item);
    const content = resolveItemMetalContent(item);
    if (!content) continue;
    totalMassKg += massKg;
    totalMetalsGPerKg.Au += content.Au * massKg;
    totalMetalsGPerKg.Ag += content.Ag * massKg;
    totalMetalsGPerKg.Pt += content.Pt * massKg;
    totalMetalsGPerKg.Pd += content.Pd * massKg;
  }

  const processDefaultConc = process.reagents[0]?.concentration;
  const processOptimalTemp = process.temperatureOptimal;

  const metals = ["Au", "Ag", "Pt", "Pd"] as const;
  const recoveredMetals = metals.map((metal) => {
    const totalGrams = totalMetalsGPerKg[metal];
    const baseYield = process.yieldPercent[metal];
    const adjustedYield = computeParameterYieldMultiplier(
      body.processId,
      baseYield,
      body.acidConcentrationOverride,
      body.temperatureOverride,
      processOptimalTemp,
      processDefaultConc,
    );
    const yieldFraction = adjustedYield / 100;
    const recovered = totalGrams * yieldFraction;
    const price = metalPrices[metal];
    const value = recovered * price;
    return {
      metal,
      massGrams: Math.round(recovered * 1000) / 1000,
      pricePerGram: price,
      totalValuePln: Math.round(value * 100) / 100,
      yieldPercent: Math.round(adjustedYield * 10) / 10,
    };
  });

  const electricityPricePerKwh = body.electricityPricePerKwh ?? 0.8;

  const concOverride = body.acidConcentrationOverride;
  const concFactor =
    concOverride !== undefined && processDefaultConc !== undefined && concOverride > 0
      ? Math.pow(processDefaultConc / concOverride, 0.7)
      : 1.0;
  const electricityConcFactor = Math.max(0.4, Math.min(1.5, concFactor));
  const electricityCostPln =
    process.electricityKwhPerKg * totalMassKg * electricityPricePerKwh * electricityConcFactor;

  const reagentPriceOverrides = body.reagentPriceOverrides ?? {};
  const chemistryCosts = process.reagents.map((reagent, idx) => {
    let baseAmountPerKg = reagent.amountPerKg;
    let basePrice = reagentPriceOverrides[reagent.name] !== undefined
      ? reagentPriceOverrides[reagent.name]
      : reagent.pricePerLiter;

    let effectiveAmountPerKg = baseAmountPerKg;
    let effectivePrice = basePrice;

    if (
      idx === 0 &&
      concOverride !== undefined &&
      processDefaultConc !== undefined &&
      concOverride > 0 &&
      reagent.concentration > 0
    ) {
      const volFactor = reagent.concentration / concOverride;
      effectiveAmountPerKg = baseAmountPerKg * volFactor;
      effectivePrice = basePrice / volFactor;
    }

    const amountLiters = effectiveAmountPerKg * totalMassKg;
    const totalCost = amountLiters * effectivePrice;
    return {
      reagentName: reagent.name,
      amountLiters: Math.round(amountLiters * 100) / 100,
      pricePerLiter: Math.round(effectivePrice * 100) / 100,
      totalCostPln: Math.round(totalCost * 100) / 100,
    };
  });

  const totalChemistryCostPln =
    chemistryCosts.reduce((sum, c) => sum + c.totalCostPln, 0);

  const totalRevenuePln = recoveredMetals.reduce(
    (sum, m) => sum + m.totalValuePln,
    0,
  );
  const totalCostPln = Math.round((totalChemistryCostPln + electricityCostPln) * 100) / 100;
  const netProfitPln = Math.round((totalRevenuePln - totalCostPln) * 100) / 100;

  const profitMargin = totalRevenuePln > 0 ? netProfitPln / totalRevenuePln : -1;
  let profitabilityRating: string;
  let profitabilityNote: string;

  if (profitMargin > 0.5) {
    profitabilityRating = "very_profitable";
    profitabilityNote = `Bardzo opłacalne! Marża ${Math.round(profitMargin * 100)}%. Zysk netto ${netProfitPln.toFixed(2)} PLN.`;
  } else if (profitMargin > 0.2) {
    profitabilityRating = "profitable";
    profitabilityNote = `Opłacalne. Marża ${Math.round(profitMargin * 100)}%. Zysk netto ${netProfitPln.toFixed(2)} PLN.`;
  } else if (profitMargin > 0) {
    profitabilityRating = "marginal";
    profitabilityNote = `Marginalna opłacalność. Marża tylko ${Math.round(profitMargin * 100)}%. Rozważ inny proces lub wsad.`;
  } else {
    profitabilityRating = "not_profitable";
    profitabilityNote = `Nieopłacalne. Koszty chemii (${totalCostPln.toFixed(2)} PLN) przekraczają wartość odzysku (${totalRevenuePln.toFixed(2)} PLN). Zwiększ materiał wsadu lub zmień proces.`;
  }

  const avgTimePerKg = (process.timePerKgMin + process.timePerKgMax) / 2;
  let estimatedTimeHours = avgTimePerKg * totalMassKg;

  if (body.temperatureOverride !== undefined && processOptimalTemp !== undefined) {
    const tempFactor = 1 + (processOptimalTemp - body.temperatureOverride) * 0.01;
    estimatedTimeHours = Math.max(avgTimePerKg * 0.5, estimatedTimeHours * Math.max(0.5, Math.min(2.0, tempFactor)));
  }

  if (concOverride !== undefined && processDefaultConc !== undefined && concOverride > 0) {
    const timeConcFactor = Math.max(0.4, Math.min(1.5, Math.pow(processDefaultConc / concOverride, 0.7)));
    estimatedTimeHours = Math.max(process.timePerKgMin * 0.4 * totalMassKg, estimatedTimeHours * timeConcFactor);
  }

  res.json({
    totalInputMassKg: Math.round(totalMassKg * 1000) / 1000,
    processId: body.processId,
    processName: process.name,
    estimatedTimeHours: Math.round(estimatedTimeHours * 10) / 10,
    recoveredMetals,
    chemistryCosts,
    electricityCostPln: Math.round(electricityCostPln * 100) / 100,
    totalChemistryCostPln: Math.round(totalChemistryCostPln * 100) / 100,
    totalRevenuePln: Math.round(totalRevenuePln * 100) / 100,
    totalCostPln: Math.round(totalCostPln * 100) / 100,
    netProfitPln: Math.round(netProfitPln * 100) / 100,
    profitabilityRating,
    profitabilityNote,
    metalPricesSnapshot: metalPrices,
  });
});

router.post("/calculator/purchase-price", async (req, res) => {
  const body = req.body as {
    materialId: string;
    processId: string;
    targetMarginPercent: number;
    electricityPricePerKwh?: number;
    isCleaned?: boolean;
    inlineMetalContent?: { Au: number; Ag: number; Pt: number; Pd: number };
  };

  if (!body.materialId || !body.processId) {
    res.status(400).json({ error: "materialId and processId are required" });
    return;
  }

  if (
    typeof body.targetMarginPercent !== "number" ||
    !isFinite(body.targetMarginPercent) ||
    body.targetMarginPercent < 0 ||
    body.targetMarginPercent > 90
  ) {
    res.status(400).json({ error: "targetMarginPercent must be a number between 0 and 90" });
    return;
  }

  if (
    body.electricityPricePerKwh !== undefined &&
    (typeof body.electricityPricePerKwh !== "number" ||
      !isFinite(body.electricityPricePerKwh) ||
      body.electricityPricePerKwh < 0 ||
      body.electricityPricePerKwh > 10000)
  ) {
    res.status(400).json({ error: "electricityPricePerKwh must be a number between 0 and 10000" });
    return;
  }

  const material = electronicMaterialsMap[body.materialId];
  if (!material && !body.inlineMetalContent) {
    res.status(400).json({ error: `Unknown materialId: ${body.materialId}` });
    return;
  }

  const process = chemicalProcessesMap[body.processId];
  if (!process) {
    res.status(400).json({ error: `Unknown processId: ${body.processId}` });
    return;
  }

  const metalPrices = await getOrFetchPrices();
  const elPrice = body.electricityPricePerKwh ?? 0.8;

  const metals = ["Au", "Ag", "Pt", "Pd"] as const;
  let revenuePerKg = 0;
  const effectiveContent = body.inlineMetalContent
    ? body.inlineMetalContent
    : getEffectiveMetalContent(material!, body.isCleaned === true);
  for (const metal of metals) {
    const gramsInOnKg = effectiveContent[metal];
    const recovered = gramsInOnKg * (process.yieldPercent[metal] / 100);
    revenuePerKg += recovered * metalPrices[metal];
  }

  const chemistryCostPerKg = process.reagents.reduce(
    (sum, r) => sum + r.amountPerKg * r.pricePerLiter,
    0,
  );
  const electricityCostPerKg = process.electricityKwhPerKg * elPrice;
  const processCostPerKg = chemistryCostPerKg + electricityCostPerKg;

  const grossProfitPerKg = revenuePerKg - processCostPerKg;
  const maxPurchasePricePerKg = grossProfitPerKg * (1 - body.targetMarginPercent / 100);

  const materialName =
    electronicMaterials.find((m) => m.id === body.materialId)?.name ?? body.materialId;

  res.json({
    materialId: body.materialId,
    materialName,
    processId: body.processId,
    processName: process.name,
    targetMarginPercent: body.targetMarginPercent,
    maxPurchasePricePerKgPln: Math.round(maxPurchasePricePerKg * 100) / 100,
    revenuePerKgPln: Math.round(revenuePerKg * 100) / 100,
    processCostPerKgPln: Math.round(processCostPerKg * 100) / 100,
    chemistryCostPerKgPln: Math.round(chemistryCostPerKg * 100) / 100,
    electricityCostPerKgPln: Math.round(electricityCostPerKg * 100) / 100,
    grossProfitPerKgPln: Math.round(grossProfitPerKg * 100) / 100,
    isBreakEven: body.targetMarginPercent === 0,
    isProfitable: grossProfitPerKg > 0,
  });
});

router.post("/calculator/purchase-price-batch", async (req, res) => {
  const body = req.body as {
    batch: Array<{
      materialId: string;
      quantityKg: number;
      isCleaned?: boolean;
      inlineMetalContent?: { Au: number; Ag: number; Pt: number; Pd: number };
      name?: string;
    }>;
    processId: string;
    targetMarginPercent: number;
    electricityPricePerKwh?: number;
  };

  if (!Array.isArray(body.batch) || body.batch.length === 0) {
    res.status(400).json({ error: "batch must be a non-empty array" });
    return;
  }
  if (body.batch.length > 30) {
    res.status(400).json({ error: "Batch too large: maximum 30 items" });
    return;
  }

  if (
    typeof body.targetMarginPercent !== "number" ||
    !isFinite(body.targetMarginPercent) ||
    body.targetMarginPercent < 0 ||
    body.targetMarginPercent > 90
  ) {
    res.status(400).json({ error: "targetMarginPercent must be between 0 and 90" });
    return;
  }

  if (
    body.electricityPricePerKwh !== undefined &&
    (typeof body.electricityPricePerKwh !== "number" ||
      !isFinite(body.electricityPricePerKwh) ||
      body.electricityPricePerKwh < 0 ||
      body.electricityPricePerKwh > 10000)
  ) {
    res.status(400).json({ error: "electricityPricePerKwh must be between 0 and 10000" });
    return;
  }

  const process = chemicalProcessesMap[body.processId];
  if (!process) {
    res.status(400).json({ error: `Unknown processId: ${body.processId}` });
    return;
  }

  const unknownItems = body.batch.filter(
    (item) => !electronicMaterialsMap[item.materialId] && !item.inlineMetalContent,
  );
  if (unknownItems.length > 0) {
    res.status(400).json({
      error: `Unknown materialIds (provide inlineMetalContent for custom materials): ${unknownItems.map((i) => i.materialId).join(", ")}`,
    });
    return;
  }

  const invalidQty = body.batch.filter(
    (item) => typeof item.quantityKg !== "number" || item.quantityKg <= 0,
  );
  if (invalidQty.length > 0) {
    res.status(400).json({ error: "All quantityKg values must be positive numbers" });
    return;
  }

  const metalPrices = await getOrFetchPrices();
  const elPrice = body.electricityPricePerKwh ?? 0.8;
  const metals = ["Au", "Ag", "Pt", "Pd"] as const;

  const chemistryCostPerKg = process.reagents.reduce(
    (sum, r) => sum + r.amountPerKg * r.pricePerLiter,
    0,
  );
  const electricityCostPerKg = process.electricityKwhPerKg * elPrice;
  const processCostPerKg = chemistryCostPerKg + electricityCostPerKg;

  let totalQuantityKg = 0;
  let totalRevenueFromAllKg = 0;

  const breakdown = body.batch.map((item) => {
    const qty = item.quantityKg;
    totalQuantityKg += qty;

    const content = item.inlineMetalContent
      ? item.inlineMetalContent
      : getEffectiveMetalContent(electronicMaterialsMap[item.materialId]!, item.isCleaned === true);

    let revenuePerKg = 0;
    for (const metal of metals) {
      const recovered = content[metal] * (process.yieldPercent[metal] / 100);
      revenuePerKg += recovered * metalPrices[metal];
    }
    totalRevenueFromAllKg += revenuePerKg * qty;

    const grossProfit = revenuePerKg - processCostPerKg;
    const maxPricePerKg = grossProfit * (1 - body.targetMarginPercent / 100);

    const matName = item.name
      ?? electronicMaterials.find((m) => m.id === item.materialId)?.name
      ?? item.materialId;

    return {
      materialId: item.materialId,
      materialName: matName,
      quantityKg: Math.round(qty * 1000) / 1000,
      revenuePerKgPln: Math.round(revenuePerKg * 100) / 100,
      processCostPerKgPln: Math.round(processCostPerKg * 100) / 100,
      grossProfitPerKgPln: Math.round(grossProfit * 100) / 100,
      maxPurchasePricePerKgPln: Math.round(maxPricePerKg * 100) / 100,
      maxPurchasePriceTotalPln: Math.round(maxPricePerKg * qty * 100) / 100,
      isCleaned: item.isCleaned === true,
    };
  });

  const weightedAvgRevenuePerKg = totalQuantityKg > 0 ? totalRevenueFromAllKg / totalQuantityKg : 0;
  const grossProfitPerKg = weightedAvgRevenuePerKg - processCostPerKg;
  const maxPurchasePricePerKg = grossProfitPerKg * (1 - body.targetMarginPercent / 100);
  const maxPurchasePriceTotalPln = maxPurchasePricePerKg * totalQuantityKg;

  res.json({
    processId: body.processId,
    processName: process.name,
    targetMarginPercent: body.targetMarginPercent,
    totalQuantityKg: Math.round(totalQuantityKg * 1000) / 1000,
    maxPurchasePricePerKgPln: Math.round(maxPurchasePricePerKg * 100) / 100,
    maxPurchasePriceTotalPln: Math.round(maxPurchasePriceTotalPln * 100) / 100,
    revenuePerKgPln: Math.round(weightedAvgRevenuePerKg * 100) / 100,
    processCostPerKgPln: Math.round(processCostPerKg * 100) / 100,
    chemistryCostPerKgPln: Math.round(chemistryCostPerKg * 100) / 100,
    electricityCostPerKgPln: Math.round(electricityCostPerKg * 100) / 100,
    grossProfitPerKgPln: Math.round(grossProfitPerKg * 100) / 100,
    isBreakEven: body.targetMarginPercent === 0,
    isProfitable: grossProfitPerKg > 0,
    breakdown,
  });
});

export default router;
