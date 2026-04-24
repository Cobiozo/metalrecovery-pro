# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Applications

### MetalRecovery Pro (`artifacts/metals-calculator`)
Full-stack precious metals recovery calculator for e-waste professionals. Frontend at `/`, API at `/api`.

**Features:**
- Batch input: 21 types of electronic scrap (PCBs, CPUs, RAM, ICs, connectors, capacitors, phones, laptops, UFO/mixed)
- 9 wet chemistry processes: aqua regia, HNO3 dilute/concentrated, HCl+H2O2, nitrate boat, electrolysis, Wohlwill, Miller, zinc cementation
- Process simulation: reagent amounts, temperatures, times, costs per kg of batch
- Live metal prices (Au, Ag, Pt, Pd) from NBP API with 1hr cache, fallback values
- Profitability analysis: revenue vs chemistry costs, net profit, rating
- Polish-language UI with dark professional theme
- **Mobile-responsive**: bottom navigation bar on mobile, stacked batch rows, short tab labels, overflow-x-auto on tables
- **Editable reagent prices**: in calculator step 2 each reagent has an editable zł/L price field; changes apply to calculation and persist in localStorage

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
