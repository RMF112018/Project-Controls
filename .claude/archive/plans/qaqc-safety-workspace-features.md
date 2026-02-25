# Plan: QA/QC & Safety Workspace Features (Mobile-First Field Management App)

## Context

The QA/QC & Safety workspace is the flagship mobile-first workspace in the HBC suite (per child-app-structure skill and owner summary 22 Feb 2026). It is purpose-built for field use on job sites with large touch targets, swipe actions, photo capture placeholders, offline-ready patterns, and QR code scanning.

This plan defines the exact features, components, and IDataService interactions for the QA/QC & Safety workspace. It is designed to minimize future migrations/refactoring by using configuration-driven patterns, the existing DataProviderFactory, and the clean TanStack Router workspace layout established in Phase 3.

All work occurs on `feature/hbc-suite-stabilization`.

## Deliverables – Features to Include

### 1. Workspace Dashboard (Landing Page)
- KPI cards (Active Inspections, Open Deficiencies, Safety Score, Sign-Ins Today)
- Quick-action buttons (Sign In/Out, New Inspection, New Deficiency, Daily Safety Report)
- Recent activity feed (last sign-ins, recent inspections, open deficiencies)

### 2. Jobsite Sign-In / Sign-Out (QR Code)
- QR code scanner for sign-in/out (using device camera)
- Registration flow (first/last name, phone, email, company, position, supervisor, emergency contact)
- Identity verification (photo ID upload or waiver with 3 signatures: individual, supervisor, HB rep)
- Real-time sign-in/out log with duration tracking per person per project

### 3. Safety Inspections
- Template-based inspection forms (configurable via admin)
- Swipe-to-complete checklist items (pass/fail/NA)
- Photo attachment per item
- Location tagging (blueprint PDF or pre-defined locations)

### 4. Automated Safety Warnings & Notices
- Form letter builder for safety violations
- Automated distribution workflow:
  - Warning letters sent simultaneously to HB PM team, cited individual, and supervisor
  - Notice letters require HB PM review/approval before distribution
- Email generation with audit logging

### 5. Smart Tool-Box-Talk Recommendations
- Keyword search against project schedule data
- Recommended topics displayed to HB PM team with risk highlights

### 6. Safety Scorecard
- Weekly safety inspections conducted by Safety Manager role
- Aggregated metrics dashboard
- Automated suggestions for corrective actions (placeholder for future AI)

### 7. Interactive Quality Control Inspections
- Pre-installation meeting guides, pre/in-progress/post-installation inspections (auto-populated where possible)
- Assignment of responsible parties (foreman, PM) with contact info
- Inspection items: pass/fail, photo/document attachments, code/standard reference, location tag (blueprint + pre-defined), comments
- Progression gates (incomplete/failed items block continuation)

### 8. Issue Resolution Workflow (5 Buckets)
- Buckets: Identified → Distributed → In Progress → Ready for Review → Closed
- Ball-in-court tracking with timers and notifications
- Collaboration chat-style comments between parties
- 5-work-day escalation warning
- Image/document attachments on resolution
- Only HB PM can close issues

### 9. Quality Metrics & Data Collection
- Performance metrics by personnel, subcontractor, product, trade
- Dashboard visualizations (charts/tables)

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single mobile-first workspace | One QA/QC & Safety workspace with all safety and QC features | Matches owner intent and child-app-structure skill (mobile-first flag) |
| Offline-first patterns | Use existing Dexie + queue from schedule skill | Ensures field usability without major refactoring |
| QR code & photo capture | Device camera APIs with placeholders | Future-proof for Gen 3 native mobile |
| Resolution workflow | 5-bucket state machine with timers and chat | Directly implements owner description with no future migration risk |
| Configuration-driven | Templates, checklists, and gates via admin | Aligns with permission-system and pluggable-data patterns |

## Verification

- All features render correctly in mobile viewport
- QR scanning, swipe actions, and touch targets meet WCAG 2.5.8
- Workflow progresses through all 5 buckets with timers and notifications
- RoleGate restricts Safety Manager and HB PM actions
- Offline mode works for sign-in/out and inspections
- `npm run verify:sprint3` + mobile a11y pass

## Post-Implementation

- Update CLAUDE.md §20 with QA/QC & Safety workspace details
- Update master plan to mark QA/QC & Safety workspace features as COMPLETE

**Governance Note**: This plan is the single source of truth for the QA/QC & Safety workspace. Any deviation requires owner approval and immediate CLAUDE.md update.