---
name: UX_UI_PATTERNS | description: UX/UI patterns for HBC Project Controls using Fluent UI v9 in construction context | triggers: ui,ux,fluent,styling,accessibility,design,theme | updated: 2026-02-21
---
# HBC UX/UI PATTERNS (Fluent UI v9 + Construction Context)
Token limit: < 8 kB | Use with PERFORMANCE_OPTIMIZATION_GUIDE.md

## §0 Core Principles
- All surfaces: FluentProvider (custom HBC theme tokens) + high-contrast mode support
- Accessibility: axe WCAG 2.2 AA enforced (npm run test:a11y)
- Construction UX: dense data tables, status badges, color-coded workflows (red/amber/green), signature blocks, Excel parity

## §1 Component Hierarchy (Enforced)
1. PageHeader (shared) → RoleGate/FeatureGate → Content
2. Tables: HbcTanStackTable only (with columnFactories/toTanStackColumns)
3. Forms: @tanstack/react-form v1 + Fluent fields
4. Charts: HbcEChart wrapper (lazy, theme-aware)
5. Modals/Dialogs: Fluent Dialog + useId for labels

## §2 Styling Rules (Griffel)
- makeStyles for every component (structure)
- tokens from Fluent theme or HBC_COLORS only
- No inline styles on repeating elements
- Responsive: use media queries in makeStyles or Fluent breakpoints

## §3 Agent Checklist (Run on every UI task)
- [ ] Uses FeatureGate / RoleGate before render?
- [ ] Keyboard navigation + screen-reader labels?
- [ ] Loading state with Fluent Skeleton or Spinner?
- [ ] Mobile/tablet parity (SPFx responsive)?
- [ ] Dark mode / high-contrast tested?
- [ ] Performance: no layout thrashing (useMemo on options/columns)

## §4 Construction-Specific Patterns
- Status workflows: 10-step Go/No-Go, 55-item Startup Checklist → use Stepper or Accordion with progress ring
- Signature blocks: 4-party with affidavit → Fluent SignaturePad + PDF export (html2canvas + jspdf)
- Dashboard KPIs: KPICard grid with ECharts sparkline
- Data entry: inline editable cells in TanStack Table + optimistic mutation

Reference only. Quote checklist items verbatim.