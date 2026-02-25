# Plan: Project Hub Module Features

## Context

The Project Hub is the central project-specific workspace in the HBC suite. It consolidates all project-related data and features into one location filtered to the currently selected project. The entire Project Hub group is hidden unless a project is selected (using ProjectContext / ProjectRequiredRoute).

When the Project Hub link is selected, the contextual sidebar displays the categories collapsed following the accordion behavior defined in enterprise-navigation skill v1.1 (all collapsed on load, only one group expanded at a time, remembered state, smooth Fluent UI motion animations).

This plan defines the exact sidebar grouping and page structure. All pages are fresh components under the Project Hub workspace.

All work on `feature/hbc-suite-stabilization`.

## Deliverables

### Sidebar Grouping (Contextual – only visible when a project is selected)

**Project Hub** (parent group level)
- Project Dashboard (unique page, displayed in all workspaces)
- Project Settings (unique page, displayed in all workspaces)

**Preconstruction** (sub-group, displayed in all workspaces)
- Go/No-Go (unique page)
- Estimating Kick-Off (unique page)
- Estimate (unique page)
- Project Turnover (unique page)
- Post-Bid Autopsy (unique page)

**Project Manual** (sub-group, only displayed in “Operations” workspace)
- Project Management Plan (unique page)
- Superintendent’s Plan (unique page)
- Responsibility Matrix (unique page)

**Startup & Closeout** (child sub-group, only displayed in “Operations” workspace)
- Project Startup Guide (unique page)
- Startup Checklist (unique page)
- Project Closeout Guide (unique page)
- Completion & Acceptance Process (unique page)
- Closeout Checklist (unique page)

- Meeting Agenda Templates (unique page)
- Pay Application Process (unique page)
- Safety Plan (unique page)
- OSHA Site Visit Guide (unique page)
- Tropical Weather Guide (unique page)
- Crisis Management & ICE Guide (unique page)

**QA / QC Program** (child sub-group, only displayed in “Operations” workspace)
- QC Checklists [smart populated]
- Best Practices [smart populated]

- IDS Requirements (unique page)

**Cost & Time** (sub-group, only displayed in “Operations” workspace)

**Financial Forecasting** (child sub-group, only displayed in “Operations” workspace)
- Review Checklist (unique page)
- Forecast Summary (unique page)
- GC/GR Forecast (unique page)
- Cash Flow Forecast (unique page)

**Schedule** (child sub-group, only displayed in “Operations” workspace)
- Reference schedule v2 (unique feature set)

**Logs & Reports** (sub-group, only displayed in “Operations” workspace)
- Buyout Log (unique page)
- Permit Log (unique page)
- Constraints Log (unique page)

**Monthly Reports** (child sub-group, only displayed in “Operations” workspace)
- PX Review
- Owner Report

- Subcontractor Scorecard (unique page)

**Documents** (sub-group, displayed in all workspaces)
- Embedded SharePoint document library viewer

### Visibility Rules
- The entire "Project Hub" group is hidden if no project is selected.
- Preconstruction sub-group always visible when Project Hub is active.
- Project Manual, Cost & Time, Logs & Reports, and their children only visible in Operations workspace.

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project Hub visibility | Hidden unless project selected | Matches owner intent – acts as a project-specific workspace |
| Accordion behavior | Single open group, remembered state, smooth animation | Follows updated enterprise-navigation skill v1.1 |
| Deep nesting | Project Manual and Cost & Time with child sub-groups | Keeps sidebar manageable while matching owner hierarchy |
| Documents | Consistent embedded viewer | Reusable component; Graph API via DataProviderFactory |

## Verification

- No project selected → Project Hub group hidden in sidebar  
- Project selected → Project Hub appears with correct sub-groups per workspace  
- Accordion behavior works (collapsed on load, single open, remembered)  
- All pages render correctly  
- `npm run verify:sprint3` + a11y pass

## Post-Implementation

- Update CLAUDE.md §20 and §21 with Project Hub structure  
- Update master plan to mark Project Hub as COMPLETE

**Governance Note**: This plan is the single source of truth for the Project Hub module. Any deviation requires owner approval and immediate CLAUDE.md update.