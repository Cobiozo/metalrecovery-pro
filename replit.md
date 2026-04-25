# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Applications

### MetalRecovery Pro (`artifacts/metals-calculator`)
Full-stack precious metals recovery calculator for e-waste professionals. Frontend at `/`, API at `/api`.

**Features:**
- Batch input: 65 types of electronic scrap in 12 categories; material selector also available in Processes page for yield estimation
- 9 wet chemistry processes: aqua regia (includes pre-trawienie HNO3 step), HNO3 dilute/concentrated, HCl+H2O2, nitrate boat, electrolysis, Wohlwill, Miller, zinc cementation
- Process simulation: reagent amounts with **adjustable concentration selectors** (auto-recalculates volume/price), temperatures, times, costs per kg
- Live metal prices (Au, Ag, Pt, Pd) from NBP API with 24h cache, fallback values
- Profitability analysis: revenue vs chemistry costs, net profit, rating
- Polish-language UI with dark professional theme; all tabs use "Materiał wsadu" terminology
- **Legal disclaimer** in sidebar and Processes page header (informational/educational only)
- **Material selector in Processes page**: pick material, see estimated grams recovered per metal (metalContent × processYield × batchKg)
- **Mobile-responsive**: bottom navigation bar on mobile, stacked batch rows, short tab labels
- **Editable reagent prices**: in calculator step 2 each reagent has an editable zł/L price field; changes apply to calculation and persist in localStorage
- **Feature A — Mixed lot purchase calculator**: toggle between single-material and "Partia mieszana" (batch) mode; calculates weighted-average max purchase price + per-material breakdown for up to 30 materials
- **Feature B — Custom material profiles**: create lab-assay profiles with Au/Ag/Pt/Pd content (g/kg), stored in localStorage; available in both calculators; sent to backend via `inlineMetalContent` so all existing endpoints work transparently
- **Comprehensively audited data** (Apr 2025): 8 materials corrected against GRF assay data, academic studies (Holgersson 2018, JSDEWES, Huang 2022) and Phoenix Refining:
  - `ram_srebrne` Ag: 3.80 → **0.55 g/kg** (major correction — DDR3/4 Ag only from SnAg solder + MLCC, NOT 3-5 g/kg)
  - `ram_simm` Au: 1.50 → **0.85 g/kg** (SIMM has thick plating but fewer contacts than SDRAM/DDR)
  - `ram_zlote` Au: 1.10 → **1.30 g/kg** (DDR1/DDR2 typically 1.2-2.0 g/kg)
  - `cpu_ceramic_486` Au: 9.5 → **7.0 g/kg** (GRF: 486DX2/DX4 = 6.4-8.0 g/kg; military up to 14)
  - `cpu_ceramic_2str` Au: 5.5 → **6.0 g/kg** (GRF: Gold+Gold = 6.25 g/kg)
  - `cpu_ceramic_nozki` Au: 3.5 → **2.2 g/kg** (GRF: simple ceramic no gold cap = 2.06 g/kg)
  - `cpu_plastik_czarny` Au: 1.80 → **2.0 g/kg** (GRF: AMD K6 batch = 1.97 g/kg)
  - `cpu_zielone_p3p4` Au: 0.45 → **0.65 g/kg** (GRF: green fiber CPUs = 0.76-0.80 g/kg)
  - `pcb_telecom` Ag: 3.00 → **1.50 g/kg**, Pd: 0.080 → **0.025 g/kg** (Holgersson 2018: 1213 ppm Ag, 19.5 ppm Pd)
  - `pcb_telefon_nowe` Au: 0.22 → **0.40 g/kg** (JSDEWES: phone PCB 1071 ppm; lower due to full module weight)
  - `mb_laptop_stare` Ag: 2.20 → **0.80 g/kg** (old laptops use Pb-Sn solder without Ag)

**API additions:**
- `POST /api/calculator/estimate` now accepts `reagentPriceOverrides: Record<string, number>` — map of reagent name to custom price in PLN/L

**Key API routes (in `artifacts/api-server`):**
- `GET /api/metals/prices` — live Au/Ag/Pt/Pd prices in PLN/g from NBP
- `GET /api/materials/electronics` — 65 electronic material types with metal content
- `GET /api/chemicals/processes` — 9 chemical extraction processes with full specs
- `POST /api/calculator/estimate` — full calculation from batch + process to profitability; accepts optional `inlineMetalContent` per BatchItem for custom materials
- `POST /api/calculator/purchase-price` — single-material max purchase price; accepts optional `inlineMetalContent`
- `POST /api/calculator/purchase-price-batch` — multi-material lot; returns weighted-average price + per-material breakdown; accepts `inlineMetalContent` per item

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Frontend**: React 19 + Vite 7 + TailwindCSS v4 + shadcn/ui
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
