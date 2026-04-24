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

let cachedPrices: MetalPrices | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

async function fetchMetalPricesFromNBP(): Promise<MetalPrices> {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  async function fetchNBPGold(): Promise<number | null> {
    try {
      const res = await fetch(
        `https://api.nbp.pl/api/cenyzlota/${thirtyDaysAgo}/${today}/?format=json`,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as Array<{ data: string; cena: number }>;
      if (!Array.isArray(data) || data.length === 0) return null;
      const latestEntry = data[data.length - 1];
      if (!latestEntry) return null;
      return latestEntry.cena / 31.1035;
    } catch {
      return null;
    }
  }

  const goldPerGram = await fetchNBPGold();

  if (goldPerGram !== null) {
    const goldToSilverRatio = 80;
    const goldToPlatinumRatio = 1.1;
    const goldToPalladiumRatio = 0.7;

    return {
      Au: Math.round(goldPerGram * 100) / 100,
      Ag: Math.round((goldPerGram / goldToSilverRatio) * 100) / 100,
      Pt: Math.round((goldPerGram / goldToPlatinumRatio) * 100) / 100,
      Pd: Math.round((goldPerGram / goldToPalladiumRatio) * 100) / 100,
      updatedAt: new Date().toISOString(),
      source: "NBP (Narodowy Bank Polski)",
    };
  }

  return {
    Au: 380.0,
    Ag: 4.75,
    Pt: 345.0,
    Pd: 540.0,
    updatedAt: new Date().toISOString(),
    source: "Wartości przybliżone (brak połączenia z API)",
  };
}

router.get("/metals/prices", async (req, res) => {
  const now = Date.now();
  if (cachedPrices && now - cacheTimestamp < CACHE_TTL_MS) {
    res.json(cachedPrices);
    return;
  }

  const prices = await fetchMetalPricesFromNBP();
  cachedPrices = prices;
  cacheTimestamp = now;
  res.json(prices);
});

export default router;
export { fetchMetalPricesFromNBP, type MetalPrices };
