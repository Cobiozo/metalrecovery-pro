import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface MetalPrices {
  Au: number;
  Ag: number;
  Pt: number;
  Pd: number;
  updatedAt: string;
  source: string;
}

interface PerMetalPrices {
  Au: number | null;
  Ag: number | null;
  Pt: number | null;
  Pd: number | null;
}

let cachedPrices: MetalPrices | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchNBPGoldPerGram(): Promise<number | null> {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  try {
    const res = await fetch(
      `https://api.nbp.pl/api/cenyzlota/${thirtyDaysAgo}/${today}/?format=json`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ data: string; cena: number }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const latestEntry = data[data.length - 1];
    if (!latestEntry) return null;
    return latestEntry.cena;
  } catch {
    return null;
  }
}

async function fetchNBPExchangeRate(currencyCode: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.nbp.pl/api/exchangerates/rates/a/${currencyCode}/last/?format=json`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { rates: Array<{ mid: number }> };
    if (!data.rates || data.rates.length === 0) return null;
    return data.rates[0]?.mid ?? null;
  } catch {
    return null;
  }
}

async function fetchFromOpenMetals(usdToPln: number): Promise<PerMetalPrices> {
  const result: PerMetalPrices = { Au: null, Ag: null, Pt: null, Pd: null };
  try {
    const symbols = "XAU,XAG,XPT,XPD";
    const res = await fetch(
      `https://open.er-api.com/v6/latest/USD`,
    );
    if (!res.ok) return result;
    const data = (await res.json()) as { rates?: Record<string, number> };
    if (!data.rates) return result;
    const rates = data.rates;
    if (rates["XAU"]) result.Au = usdToPln / rates["XAU"] / 31.1035;
    if (rates["XAG"]) result.Ag = usdToPln / rates["XAG"] / 31.1035;
    if (rates["XPT"]) result.Pt = usdToPln / rates["XPT"] / 31.1035;
    if (rates["XPD"]) result.Pd = usdToPln / rates["XPD"] / 31.1035;
    void symbols;
  } catch {
  }
  return result;
}

async function fetchFromFrankfurterAPI(usdToPln: number): Promise<PerMetalPrices> {
  const result: PerMetalPrices = { Au: null, Ag: null, Pt: null, Pd: null };
  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=USD&symbols=XAU,XAG`,
    );
    if (!res.ok) return result;
    const data = (await res.json()) as { rates?: Record<string, number> };
    if (!data.rates) return result;
    const rates = data.rates;
    if (rates["XAU"]) result.Au = usdToPln / rates["XAU"] / 31.1035;
    if (rates["XAG"]) result.Ag = usdToPln / rates["XAG"] / 31.1035;
  } catch {
  }
  return result;
}

async function fetchMetalPricesFromNBP(): Promise<MetalPrices> {
  const usdToPlnRate = await fetchNBPExchangeRate("usd");
  const usdToPln = usdToPlnRate ?? 4.0;

  const [nbpGold, openMetals, frankfurterMetals] = await Promise.all([
    fetchNBPGoldPerGram(),
    fetchFromOpenMetals(usdToPln),
    fetchFromFrankfurterAPI(usdToPln),
  ]);

  const auPerGram: number =
    nbpGold ??
    openMetals.Au ??
    frankfurterMetals.Au ??
    550.0;

  const agPerGram: number =
    openMetals.Ag ??
    frankfurterMetals.Ag ??
    (auPerGram / 90.0);

  const ptPerGram: number =
    openMetals.Pt ??
    (auPerGram * 0.22);

  const pdPerGram: number =
    openMetals.Pd ??
    (auPerGram * 0.22);

  const sources: string[] = [];
  if (nbpGold !== null) sources.push("NBP (złoto)");
  if (openMetals.Ag !== null) sources.push("open.er-api.com (Ag/Pt/Pd)");
  else if (frankfurterMetals.Ag !== null) sources.push("frankfurter.dev (Ag)");
  if (sources.length === 0) sources.push("Wartości szacunkowe (brak połączenia z API)");

  return {
    Au: Math.round(auPerGram * 100) / 100,
    Ag: Math.round(agPerGram * 100) / 100,
    Pt: Math.round(ptPerGram * 100) / 100,
    Pd: Math.round(pdPerGram * 100) / 100,
    updatedAt: new Date().toISOString(),
    source: sources.join(" + "),
  };
}

async function getOrFetchPrices(): Promise<MetalPrices> {
  const now = Date.now();
  if (cachedPrices && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPrices;
  }
  const prices = await fetchMetalPricesFromNBP();
  cachedPrices = prices;
  cacheTimestamp = now;
  return prices;
}

router.get("/metals/prices", async (_req, res) => {
  res.json(await getOrFetchPrices());
});

export default router;
export { fetchMetalPricesFromNBP, getOrFetchPrices, type MetalPrices };
