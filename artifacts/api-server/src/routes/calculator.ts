import { Router, type IRouter } from "express";
import { getOrFetchPrices } from "./metals.js";

const router: IRouter = Router();

interface BatchItem {
  materialId: string;
  quantity: number;
}

interface CalculationRequest {
  batch: BatchItem[];
  processId: string;
  acidConcentrationOverride?: number;
  temperatureOverride?: number;
  electricityPricePerKwh?: number;
  reagentPriceOverrides?: Record<string, number>;
}

const electronicMaterialsMap: Record<
  string,
  {
    unit: string;
    metalContentPerKg: {
      Au: { typical: number };
      Ag: { typical: number };
      Pt: { typical: number };
      Pd: { typical: number };
    };
  }
> = {
  pcb_standard: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.08 },
      Ag: { typical: 1.2 },
      Pt: { typical: 0.005 },
      Pd: { typical: 0.02 },
    },
  },
  pcb_server: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.25 },
      Ag: { typical: 2.5 },
      Pt: { typical: 0.01 },
      Pd: { typical: 0.05 },
    },
  },
  pcb_telecom: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.3 },
      Ag: { typical: 3.0 },
      Pt: { typical: 0.015 },
      Pd: { typical: 0.08 },
    },
  },
  pcb_smd: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.5 },
      Ag: { typical: 4.0 },
      Pt: { typical: 0.02 },
      Pd: { typical: 0.15 },
    },
  },
  cpu_intel: {
    unit: "piece",
    metalContentPerKg: {
      Au: { typical: 0.3 },
      Ag: { typical: 1.0 },
      Pt: { typical: 0.005 },
      Pd: { typical: 0.01 },
    },
  },
  cpu_amd: {
    unit: "piece",
    metalContentPerKg: {
      Au: { typical: 0.25 },
      Ag: { typical: 0.9 },
      Pt: { typical: 0.005 },
      Pd: { typical: 0.01 },
    },
  },
  cpu_ceramic: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 2.5 },
      Ag: { typical: 5.0 },
      Pt: { typical: 0.05 },
      Pd: { typical: 0.15 },
    },
  },
  ram_dimm: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.12 },
      Ag: { typical: 1.8 },
      Pt: { typical: 0.005 },
      Pd: { typical: 0.04 },
    },
  },
  ram_simm: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.6 },
      Ag: { typical: 3.5 },
      Pt: { typical: 0.01 },
      Pd: { typical: 0.08 },
    },
  },
  ic_general: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.4 },
      Ag: { typical: 2.5 },
      Pt: { typical: 0.01 },
      Pd: { typical: 0.05 },
    },
  },
  ic_fpga: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.8 },
      Ag: { typical: 4.5 },
      Pt: { typical: 0.015 },
      Pd: { typical: 0.1 },
    },
  },
  connectors_gold: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 2.5 },
      Ag: { typical: 1.5 },
      Pt: { typical: 0.005 },
      Pd: { typical: 0.02 },
    },
  },
  connectors_mixed: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.7 },
      Ag: { typical: 1.0 },
      Pt: { typical: 0.002 },
      Pd: { typical: 0.01 },
    },
  },
  capacitors_tantalum: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.01 },
      Ag: { typical: 1.5 },
      Pt: { typical: 0.002 },
      Pd: { typical: 0.5 },
    },
  },
  capacitors_ceramic_mlcc: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.005 },
      Ag: { typical: 2.5 },
      Pt: { typical: 0.005 },
      Pd: { typical: 1.0 },
    },
  },
  phone_smartphone: {
    unit: "piece",
    metalContentPerKg: {
      Au: { typical: 0.04 },
      Ag: { typical: 0.25 },
      Pt: { typical: 0.002 },
      Pd: { typical: 0.012 },
    },
  },
  phone_feature: {
    unit: "piece",
    metalContentPerKg: {
      Au: { typical: 0.02 },
      Ag: { typical: 0.12 },
      Pt: { typical: 0.001 },
      Pd: { typical: 0.006 },
    },
  },
  laptop_complete: {
    unit: "piece",
    metalContentPerKg: {
      Au: { typical: 0.12 },
      Ag: { typical: 1.2 },
      Pt: { typical: 0.005 },
      Pd: { typical: 0.035 },
    },
  },
  ufo_mix: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.07 },
      Ag: { typical: 0.8 },
      Pt: { typical: 0.003 },
      Pd: { typical: 0.02 },
    },
  },
  hard_drive_head: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.02 },
      Ag: { typical: 0.04 },
      Pt: { typical: 1.2 },
      Pd: { typical: 0.02 },
    },
  },
  catalytic_converter: {
    unit: "kg",
    metalContentPerKg: {
      Au: { typical: 0.002 },
      Ag: { typical: 0.01 },
      Pt: { typical: 2.5 },
      Pd: { typical: 5.0 },
    },
  },
};

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
        name: "Kwas solny (HCl)",
        concentration: 35,
        amountPerKg: 3.0,
        pricePerLiter: 8.5,
      },
      {
        name: "Kwas azotowy (HNO3)",
        concentration: 65,
        amountPerKg: 1.0,
        pricePerLiter: 12.0,
      },
      {
        name: "Wodorosiarczyn sodu (reduktor SMB)",
        concentration: 40,
        amountPerKg: 0.3,
        pricePerLiter: 6.0,
      },
    ],
    timePerKgMin: 4,
    timePerKgMax: 12,
    temperatureOptimal: 70,
    yieldPercent: { Au: 95, Ag: 20, Pt: 85, Pd: 80 },
    electricityKwhPerKg: 0.5,
  },
  hno3_dilute: {
    name: "Kwas azotowy rozcieńczony (HNO3 25-30%)",
    reagents: [
      {
        name: "Kwas azotowy rozcieńczony (HNO3 25%)",
        concentration: 25,
        amountPerKg: 2.5,
        pricePerLiter: 12.0,
      },
      {
        name: "Chlorek sodu (do wytrącania AgCl)",
        concentration: 100,
        amountPerKg: 0.1,
        pricePerLiter: 1.5,
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
        amountPerKg: 2.0,
        pricePerLiter: 12.0,
      },
    ],
    timePerKgMin: 1,
    timePerKgMax: 4,
    temperatureOptimal: 55,
    yieldPercent: { Au: 0, Ag: 90, Pt: 0, Pd: 70 },
    electricityKwhPerKg: 0.15,
  },
  hcl_h2o2: {
    name: "HCl + H2O2 (etching kwasowy)",
    reagents: [
      {
        name: "Kwas solny (HCl)",
        concentration: 35,
        amountPerKg: 3.0,
        pricePerLiter: 8.5,
      },
      {
        name: "Nadtlenek wodoru (H2O2)",
        concentration: 30,
        amountPerKg: 1.5,
        pricePerLiter: 5.0,
      },
      {
        name: "Wodorosiarczyn sodu (reduktor SMB)",
        concentration: 40,
        amountPerKg: 0.3,
        pricePerLiter: 6.0,
      },
    ],
    timePerKgMin: 6,
    timePerKgMax: 24,
    temperatureOptimal: 40,
    yieldPercent: { Au: 90, Ag: 15, Pt: 60, Pd: 75 },
    electricityKwhPerKg: 0.3,
  },
  nitrate_boat: {
    name: "Łódź azotanowa (NaNO3 + H2SO4)",
    reagents: [
      {
        name: "Azotan sodu (NaNO3)",
        concentration: 99,
        amountPerKg: 0.5,
        pricePerLiter: 15.0,
      },
      {
        name: "Kwas siarkowy (H2SO4)",
        concentration: 98,
        amountPerKg: 1.5,
        pricePerLiter: 7.0,
      },
    ],
    timePerKgMin: 3,
    timePerKgMax: 8,
    temperatureOptimal: 80,
    yieldPercent: { Au: 85, Ag: 90, Pt: 30, Pd: 40 },
    electricityKwhPerKg: 0.8,
  },
  electrolysis: {
    name: "Elektroliza (rafinacja elektrolityczna)",
    reagents: [
      {
        name: "Kwas azotowy (elektrolit bazowy)",
        concentration: 10,
        amountPerKg: 2.0,
        pricePerLiter: 12.0,
      },
      {
        name: "Azotan złota (AuNO3, uzupełniacz)",
        concentration: 5,
        amountPerKg: 0.1,
        pricePerLiter: 800.0,
      },
    ],
    timePerKgMin: 8,
    timePerKgMax: 48,
    temperatureOptimal: 65,
    yieldPercent: { Au: 99, Ag: 95, Pt: 60, Pd: 50 },
    electricityKwhPerKg: 2.5,
  },
  wohlwill_process: {
    name: "Proces Wöhlwilla (rafinacja złota 999.9)",
    reagents: [
      {
        name: "Kwas solny (elektrolit)",
        concentration: 20,
        amountPerKg: 3.0,
        pricePerLiter: 8.5,
      },
      {
        name: "Chlorek złota (AuCl3, elektrolit)",
        concentration: 10,
        amountPerKg: 0.2,
        pricePerLiter: 1200.0,
      },
    ],
    timePerKgMin: 24,
    timePerKgMax: 72,
    temperatureOptimal: 60,
    yieldPercent: { Au: 99.5, Ag: 0, Pt: 30, Pd: 20 },
    electricityKwhPerKg: 3.0,
  },
  miller_process: {
    name: "Proces Millera (chloracja)",
    reagents: [
      {
        name: "Chlor gazowy (Cl2)",
        concentration: 99,
        amountPerKg: 0.5,
        pricePerLiter: 25.0,
      },
      {
        name: "Boraks (topnik)",
        concentration: 99,
        amountPerKg: 0.3,
        pricePerLiter: 8.0,
      },
    ],
    timePerKgMin: 0.5,
    timePerKgMax: 2,
    temperatureOptimal: 1050,
    yieldPercent: { Au: 98, Ag: 0, Pt: 20, Pd: 10 },
    electricityKwhPerKg: 5.0,
  },
  cementation_zinc: {
    name: "Cementacja cynkiem (wytrącanie Au)",
    reagents: [
      {
        name: "Cynk metaliczny (granulki)",
        concentration: 99,
        amountPerKg: 0.4,
        pricePerLiter: 18.0,
      },
      {
        name: "Ług cyjanku sodu (NaCN, opcjonalny)",
        concentration: 5,
        amountPerKg: 1.0,
        pricePerLiter: 20.0,
      },
    ],
    timePerKgMin: 2,
    timePerKgMax: 8,
    temperatureOptimal: 25,
    yieldPercent: { Au: 80, Ag: 75, Pt: 20, Pd: 30 },
    electricityKwhPerKg: 0.1,
  },
};

const PIECE_WEIGHT_KG: Record<string, number> = {
  cpu_intel: 0.03,
  cpu_amd: 0.028,
  phone_smartphone: 0.17,
  phone_feature: 0.08,
  laptop_complete: 2.2,
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

  const process = chemicalProcessesMap[body.processId];
  if (!process) {
    res.status(400).json({ error: `Unknown processId: ${body.processId}` });
    return;
  }

  const unknownMaterials = body.batch
    .filter((item) => !electronicMaterialsMap[item.materialId])
    .map((item) => item.materialId);

  if (unknownMaterials.length > 0) {
    res.status(400).json({
      error: `Unknown material IDs: ${unknownMaterials.join(", ")}`,
    });
    return;
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
    const material = electronicMaterialsMap[item.materialId]!;

    let massKg: number;
    if (material.unit === "piece") {
      const weightPerPiece = PIECE_WEIGHT_KG[item.materialId] ?? 0.1;
      massKg = item.quantity * weightPerPiece;
    } else {
      massKg = item.quantity;
    }

    totalMassKg += massKg;

    totalMetalsGPerKg.Au += material.metalContentPerKg.Au.typical * massKg;
    totalMetalsGPerKg.Ag += material.metalContentPerKg.Ag.typical * massKg;
    totalMetalsGPerKg.Pt += material.metalContentPerKg.Pt.typical * massKg;
    totalMetalsGPerKg.Pd += material.metalContentPerKg.Pd.typical * massKg;
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
  const electricityCostPln =
    process.electricityKwhPerKg * totalMassKg * electricityPricePerKwh;

  const reagentPriceOverrides = body.reagentPriceOverrides ?? {};
  const chemistryCosts = process.reagents.map((reagent) => {
    const amountLiters = reagent.amountPerKg * totalMassKg;
    const effectivePrice =
      reagentPriceOverrides[reagent.name] !== undefined
        ? reagentPriceOverrides[reagent.name]
        : reagent.pricePerLiter;
    const totalCost = amountLiters * effectivePrice;
    return {
      reagentName: reagent.name,
      amountLiters: Math.round(amountLiters * 100) / 100,
      pricePerLiter: effectivePrice,
      totalCostPln: Math.round(totalCost * 100) / 100,
    };
  });

  const totalChemistryCostPln =
    chemistryCosts.reduce((sum, c) => sum + c.totalCostPln, 0) +
    electricityCostPln;

  const totalRevenuePln = recoveredMetals.reduce(
    (sum, m) => sum + m.totalValuePln,
    0,
  );
  const totalCostPln = totalChemistryCostPln;
  const netProfitPln = totalRevenuePln - totalCostPln;

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
    profitabilityNote = `Nieopłacalne. Koszty chemii (${totalCostPln.toFixed(2)} PLN) przekraczają wartość odzysku (${totalRevenuePln.toFixed(2)} PLN). Zwiększ wsad lub zmień proces.`;
  }

  const avgTimePerKg = (process.timePerKgMin + process.timePerKgMax) / 2;
  let estimatedTimeHours = avgTimePerKg * totalMassKg;

  if (body.temperatureOverride !== undefined && processOptimalTemp !== undefined) {
    const tempFactor = 1 + (processOptimalTemp - body.temperatureOverride) * 0.01;
    estimatedTimeHours = Math.max(avgTimePerKg * 0.5, estimatedTimeHours * Math.max(0.5, Math.min(2.0, tempFactor)));
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

export default router;
