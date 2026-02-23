# Plan: Analytics Dashboards – Main Hub + Workspace Dashboards (Enhanced with Real-World Data Sources)

## Context

The current dashboards are structural placeholders (navigation cards or “Modules coming soon”). This plan delivers highly effective, interactive, and beautifully polished analytics dashboards for:

- Main Analytics Hub (entry point)
- Preconstruction Workspace Dashboard
- Operations Workspace Dashboard (Commercial + Luxury contextual)
- Shared Services Workspace Dashboard
- HB Site Control Workspace Dashboard
- Admin Workspace Dashboard (polish existing)

All dashboards will be built as fresh page components under the correct workspace (no reuse of old placeholder code). The design emphasizes construction-industry relevance, role-based visibility, and future-proofing for Power BI embedded reports.

All work on `feature/hbc-suite-stabilization`.

## Charting Stack (Locked)

**Primary:** Enhanced HbcEChart (Apache ECharts v5.5+)  
- Already in the stack (lazy-loaded)  
- Apply custom Griffel themes for Fluent UI v9 consistency  
- Advanced interactivity: zoom, drill-down, cross-filtering, tooltips, animations  

**Secondary (when needed):** Recharts for KPI sparklines  

**Future-proofing:**  
- PowerBIEmbed component (using @microsoft/powerbi-client-react) behind feature flag `PowerBIIntegration`  
- Placeholder embed slots on every dashboard for easy future swap  

## Data Sources (Mock + Future Live)

- **Procore**: Projects, RFIs, Submittals, Budget Line Items, Change Orders, Daily Logs, Photos
- **BambooHR**: Employee directory, Org chart, Time-off, Headcount by department/division
- **SAGE Intact**: AR/AP, Cash Flow, Revenue, Profit Margin, Project financials
- **Unanet**: Pipeline value, Win rate, Bid volume, Lead conversion
- **Industry benchmarks**: Florida labor rates by region/trade (Miami, West Palm, Orlando, Space Coast), material cost indices (ENR Florida, RoMac, Turner)

All dashboards use TanStack Query loaders with optimistic updates. Mock data is realistic and sourced from the above APIs/industry reports for immediate visual impact.

## Deliverables

### 1. Main Analytics Hub Dashboard (/)

**KPI Strip (top row)**  
- Active Projects (Procore)  
- Total Pipeline Value (Unanet)  
- Win Rate (last 12 mo) (Unanet)  
- Safety Score (HB Site Control)  
- On-Time Completion % (Procore + Schedule v2)

**Interactive Charts**  
- Pipeline Funnel by Stage (ECharts funnel – Unanet data)  
- Project Status Treemap (Procore status + budget variance)  
- Win Rate Trend with Forecast (ECharts line – Unanet)  
- Resource Utilization Heatmap by Division (BambooHR + Procore manpower)  
- Florida Labor Rate Benchmark vs Actual (bar – industry + SAGE labor)  
- Material Cost Index Trend (line – RoMac/ENR Florida indices)  
- Recent Activity Feed (TanStack Virtual list)

**Mock Data Examples**  
- Pipeline Value: $187.4M (Unanet mock)  
- Win Rate: 34.2% YTD (vs Florida GC average 28.7%)  
- Labor Rate Variance: Miami +8.7% above state avg

**Quick Links**  
- Role-gated tiles to all workspaces

### 2. Preconstruction Workspace Dashboard

**KPI Cards**  
- Active Leads, Go/No-Go in Progress, Pipeline Value, Estimated Win Rate

**Charts**  
- Lead Funnel by Stage (ECharts – Unanet)  
- Win Rate by Estimator (bar – Unanet)  
- Post-Bid Autopsy Trend (line)

**Mock Data Examples**  
- Pipeline Value: $42.3M  
- Win Rate by Estimator: Ryan Hutchins 41%, Chai Banthia 29%

### 3. Operations Workspace Dashboard

**KPI Cards** (contextual by role)  
- Active Projects, On-Time %, Safety Score, Budget Variance

**Charts**  
- Project Health Radar (ECharts)  
- Schedule Variance by Trade (bar – Procore + Schedule v2)  
- Buyout Log Summary (pie)

**Mock Data Examples**  
- Budget Variance: -2.4% (SAGE)  
- On-Time %: 87% (vs Florida GC benchmark 79%)

### 4. Shared Services Workspace Dashboard

**KPI Cards**  
- Open HR Requests, AR Aging (SAGE), Marketing Campaigns Active, Open Risk Items

**Charts**  
- Department Headcount (BambooHR)  
- AR Aging Waterfall (SAGE)  
- Risk Exposure Heatmap (Unanet)

**Mock Data Examples**  
- AR Aging: $8.7M over 90 days (SAGE mock)

### 5. HB Site Control Workspace Dashboard

**KPI Cards**  
- Sign-Ins Today, Open Deficiencies, Safety Score, Inspections Completed

**Charts**  
- Daily Sign-In Trend (line)  
- Deficiency Resolution Funnel  
- Safety Scorecard Trend (vs Florida industry benchmark)

**Mock Data Examples**  
- Safety Score: 92.4 (vs Florida GC average 84.1)

### 6. Admin Workspace Dashboard (polish)

- System Health cards  
- Connector status overview  
- Recent audit activity

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Charting | Enhanced HbcEChart + Power BI placeholder | Consistent with existing stack, beautiful theming, future-proof |
| Data | TanStack Query with realistic mock fixtures from real APIs | Immediate visual impact, easy swap to live sources |
| Layout | KPI strip + 2–3 large interactive charts + activity feed | Proven construction leadership dashboard pattern |
| Role gating | RoleGate + FeatureGate on every chart/tile | Aligns with permission-system skill |
| Mobile | Responsive + mobile-first for HB Site Control | Matches workspace flag |

## Verification

- All dashboards render beautifully in desktop + mobile viewports  
- Charts are interactive (zoom, hover, click)  
- Power BI placeholder renders when flag enabled  
- Role-based visibility works  
- `npm run verify:sprint3` + a11y + bundle check pass

## Post-Implementation

- Update CLAUDE.md §20 with dashboard details  
- Update master plan to mark Analytics Dashboards as COMPLETE

**Governance Note**: This plan is the single source of truth for all dashboards. Any deviation requires owner approval and immediate CLAUDE.md update.