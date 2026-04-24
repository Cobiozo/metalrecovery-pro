# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Applications

### MetalRecovery Pro (`artifacts/metals-calculator`)
Full-stack precious metals recovery calculator for e-waste professionals. Frontend at `/`, API at `/api`.

**Features:**
- Batch input: 61 types of electronic scrap in 7 categories; material selector also available in Processes page for yield estimation
- 9 wet chemistry processes: aqua regia (includes pre-trawienie HNO3 step), HNO3 dilute/concentrated, HCl+H2O2, nitrate boat, electrolysis, Wohlwill, Miller, zinc cementation
- Process simulation: reagent amounts with **adjustable concentration selectors** (auto-recalculates volume/price), temperatures, times, costs per kg
- Live metal prices (Au, Ag, Pt, Pd) from NBP API with 24h cache, fallback values
- Profitability analysis: revenue vs chemistry costs, net profit, rating
- Polish-language UI with dark professional theme; all tabs use "Materiał wsadu" terminology
- **Legal disclaimer** in sidebar and Processes page header (informational/educational only)
- **Material selector in Processes page**: pick material, see estimated grams recovered per metal (metalContent × processYield × batchKg)
- **Mobile-responsive**: bottom navigation bar on mobile, stacked batch rows, short tab labels
- **Editable reagent prices**: in calculator step 2 each reagent has an editable zł/L price field; changes apply to calculation and persist in localStorage
- **Calibrated data** (Au/Ag/Pt/Pd content corrected for RAM, HDD, HDD heads vs real lab data)

**API additions:**
- `POST /api/calculator/estimate` now accepts `reagentPriceOverrides: Record<string, number>` — map of reagent name to custom price in PLN/L

**Key API routes (in `artifacts/api-server`):**
- `GET /api/metals/prices` — live Au/Ag/Pt/Pd prices in PLN/g from NBP
- `GET /api/materials/electronics` — 21 electronic material types with metal content
- `GET /api/chemicals/processes` — 9 chemical extraction processes with full specs
- `POST /api/calculator/estimate` — full calculation from batch + process to profitability

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
