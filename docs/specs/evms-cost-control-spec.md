# EVMS Cost Control Specification
**Live at commit:** 83db2ad9e8b0b8f164562564dbff4fad554d4e8b

## Purpose
Exact formulas and workflows for Earned Value Management System.

## Key Entities & File Paths at this commit
- Models: `packages/hbc-sp-services/src/models/ICostForecast.ts`
- Hooks: `src/webparts/hbcProjectControls/hooks/useHbcEVMSQuery.ts`

## Business Rules & Invariants
- CPI = EV / AC; SPI = EV / PV; must match P6 export exactly.
- Baseline update on every change order.

## Correctness Criteria
- S-curve rendering uses Fluent UI DataGrid with exact column keys.

Agent instruction: Enforce formulas verbatim.