import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Table } from "jspdf-autotable";
import type { CalculationResult } from "@workspace/api-client-react";
import logoDataUrl from "../assets/logo.png";

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: Table;
  }
}

const EUR_PLN_RATE = 4.25;

function fmtPln(value: number) {
  return (
    value.toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " PLN"
  );
}

function fmtEur(value: number) {
  return (
    (value / EUR_PLN_RATE).toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " EUR"
  );
}

function fmtMass(grams: number) {
  if (grams >= 1000) {
    return (grams / 1000).toFixed(4) + " kg";
  }
  return grams.toFixed(4) + " g";
}

const METAL_NAMES: Record<string, string> = {
  Au: "Złoto",
  Ag: "Srebro",
  Pt: "Platyna",
  Pd: "Pallad",
};

const PROFITABILITY_LABELS: Record<string, string> = {
  very_profitable: "Bardzo opłacalne",
  profitable: "Opłacalne",
  marginal: "Marginalna opłacalność",
  not_profitable: "Nieopłacalne",
};

export interface BatchItemForPdf {
  materialName: string;
  quantity: number;
  unit: string;
}

interface ProcessParamsForPdf {
  temperatureOverride: number | null;
  acidConcentrationOverride: number | null;
  electricityPricePerKwh: number;
}

interface GeneratePdfOptions {
  result: CalculationResult;
  batchItems: BatchItemForPdf[];
  processParams: ProcessParamsForPdf;
}

export function generateCalculationPdf(options: GeneratePdfOptions): void {
  const { result, batchItems, processParams } = options;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  const dateStr = new Date().toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageW, 30, "F");

  doc.addImage(logoDataUrl, "PNG", margin, 4, 20, 20);

  const textX = margin + 23;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 175, 55);
  doc.text("MetalRecovery Pro", textX, 13);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text("Raport Kalkulacji Odzysku Metali Szlachetnych", textX, 21);

  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(dateStr, pageW - margin, 13, { align: "right" });
  doc.text(`Kurs: 1 EUR = ${EUR_PLN_RATE.toFixed(2)} PLN`, pageW - margin, 21, {
    align: "right",
  });

  y = 37;

  doc.setTextColor(30, 30, 30);

  const profitabilityLabel =
    PROFITABILITY_LABELS[result.profitabilityRating] ?? result.profitabilityRating;
  const isProfit = result.netProfitPln >= 0;

  doc.setFillColor(isProfit ? 230 : 255, isProfit ? 247 : 230, isProfit ? 230 : 230);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(isProfit ? 34 : 180, isProfit ? 120 : 30, 30);
  doc.text(profitabilityLabel.toUpperCase(), margin + 4, y + 8);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const noteLines = doc.splitTextToSize(result.profitabilityNote, contentW - 8);
  doc.text(noteLines, margin + 4, y + 16);

  y += 28;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 15, 15);
  doc.text("1. ZESTAWIENIE MATERIAŁÓW WSADU", margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Materiał", "Ilość", "Jednostka"]],
    body: batchItems.map((item) => [item.materialName, item.quantity.toString(), item.unit]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 30, halign: "right" },
      2: { cellWidth: 30, halign: "center" },
    },
  });
  y = doc.lastAutoTable.finalY! + 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 15, 15);
  doc.text("2. PARAMETRY PROCESU", margin, y);
  y += 5;

  const processParamsData: [string, string][] = [
    ["Proces chemiczny", result.processName],
    ["Masa wejściowa (całość)", `${result.totalInputMassKg.toFixed(3)} kg`],
    ...(result.chemProcessedMassKg !== undefined && result.chemProcessedMassKg < result.totalInputMassKg * 0.99
      ? [["Masa do obróbki kwasowej", `${result.chemProcessedMassKg.toFixed(3)} kg (obudowa/plastik nie wchodzi do kwasu)`] as [string, string]]
      : []),
    ["Szacowany czas procesu", `${result.estimatedTimeHours} godz.`],
    ["Cena energii elektrycznej", `${processParams.electricityPricePerKwh.toFixed(2)} zł/kWh`],
  ];
  if (processParams.temperatureOverride !== null) {
    processParamsData.push(["Temperatura reakcji", `${processParams.temperatureOverride}°C`]);
  }
  if (processParams.acidConcentrationOverride !== null) {
    processParamsData.push([
      "Stężenie reagentu",
      `${processParams.acidConcentrationOverride}%`,
    ]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: processParamsData,
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold", fillColor: [245, 245, 245] },
      1: { cellWidth: "auto" },
    },
    theme: "plain",
  });
  y = doc.lastAutoTable.finalY! + 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 15, 15);
  doc.text("3. ODZYSKANE METALE SZLACHETNE", margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [
      ["Metal", "Masa odzyskana", "Wydajność", "Cena/g", "Wartość (PLN)", "Wartość (EUR)"],
    ],
    body: result.recoveredMetals.map((m) => [
      `${m.metal} — ${METAL_NAMES[m.metal] ?? m.metal}`,
      fmtMass(m.massGrams),
      `${m.yieldPercent.toFixed(1)}%`,
      `${m.pricePerGram.toFixed(2)} PLN`,
      fmtPln(m.totalValuePln),
      fmtEur(m.totalValuePln),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 30, halign: "right" },
      2: { cellWidth: 22, halign: "right" },
      3: { cellWidth: 28, halign: "right" },
      4: { cellWidth: 32, halign: "right" },
      5: { cellWidth: 28, halign: "right" },
    },
  });
  y = doc.lastAutoTable.finalY! + 8;

  const pageH = doc.internal.pageSize.getHeight();
  if (y > pageH - 80) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 15, 15);
  doc.text("4. ZAPOTRZEBOWANIE CHEMICZNE", margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Odczynnik", "Ilość (L)", "Cena/l (PLN)", "Koszt (PLN)"]],
    body: result.chemistryCosts.map((c) => [
      c.reagentName,
      c.amountLiters.toFixed(2),
      c.pricePerLiter.toFixed(2),
      fmtPln(c.totalCostPln),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 25, halign: "right" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
  });
  y = doc.lastAutoTable.finalY! + 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 15, 15);
  doc.text("5. PODSUMOWANIE FINANSOWE", margin, y);
  y += 5;

  const chemistryCostOnly = result.totalChemistryCostPln - result.electricityCostPln;
  const financialRows: [string, string, string][] = [
    [
      "Przychód brutto (wartość metali)",
      fmtPln(result.totalRevenuePln),
      fmtEur(result.totalRevenuePln),
    ],
    [
      "Koszty chemii i reagentów",
      `- ${fmtPln(chemistryCostOnly)}`,
      `- ${fmtEur(chemistryCostOnly)}`,
    ],
    [
      "Koszty energii elektrycznej",
      `- ${fmtPln(result.electricityCostPln)}`,
      `- ${fmtEur(result.electricityCostPln)}`,
    ],
    [
      "Całkowite koszty procesu",
      `- ${fmtPln(result.totalCostPln)}`,
      `- ${fmtEur(result.totalCostPln)}`,
    ],
    ["ZYSK NETTO", fmtPln(result.netProfitPln), fmtEur(result.netProfitPln)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Pozycja", "PLN", "EUR"]],
    body: financialRows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 40, halign: "right" },
      2: { cellWidth: 35, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.row.index === financialRows.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = isProfit ? [220, 252, 231] : [254, 226, 226];
        data.cell.styles.textColor = isProfit ? [20, 110, 20] : [160, 20, 20];
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(
      `MetalRecovery Pro · Raport wygenerowany ${dateStr} · Kurs EUR/PLN: ${EUR_PLN_RATE.toFixed(
        2
      )} (szacunkowy)`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
    doc.text(
      `Strona ${i} / ${pageCount}`,
      pageW - margin,
      doc.internal.pageSize.getHeight() - 8,
      { align: "right" }
    );
  }

  const dateForFile = new Date().toISOString().slice(0, 10);
  doc.save(`MetalRecovery_${dateForFile}.pdf`);
}
