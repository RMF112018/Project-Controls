# VPAT® 2.5 — WCAG 2.2 Level AA Accessibility Conformance Report

**Product Name:** HBC Project Controls
**Version:** 1.0.0
**Date:** 2026-02-18
**Contact:** Hedrick Brothers Construction — IT / SharePoint team
**Report prepared by:** Development team

---

## Scope

This report covers the HBC Project Controls SPFx web part deployed to SharePoint Online. Testing was performed against the mock dev server using the following test methods:

- Automated: `@axe-core/playwright` (axe-core 4.10+) with WCAG 2.2 AA tag set
- Manual: Keyboard-only navigation (Tab, Shift+Tab, Enter, Space, Arrow keys)
- Assisted: VoiceOver (macOS) / NVDA (Windows)
- Tool: Storybook 8.5 with `@storybook/addon-a11y`

---

## Conformance Levels

| WCAG 2.2 Criterion | Level | Status | Notes |
|--------------------|-------|--------|-------|
| **1.1.1** Non-text Content | A | Supports | All `HbcEChart` instances have `ariaLabel`; `role="img"` + hidden description via `aria-describedby` |
| **1.3.1** Info & Relationships | A | Supports | `DataTable` uses semantic `<table>`, `<th scope>`, `aria-label`; forms use `htmlFor`/`id` pairs |
| **1.3.5** Identify Input Purpose | AA | Supports | Fluent UI v9 inputs with correct `type` attributes |
| **1.4.1** Use of Color | A | Supports | Color is not the sole means of conveying information |
| **1.4.3** Contrast (Minimum) | AA | Partially Supports | Body text uses `gray600`+ (7.0:1 ✅); `gray400`/`gray500` restricted to decorative/placeholder use; `orange` restricted to large text/icons |
| **1.4.4** Resize Text | AA | Supports | Fluent tokens use relative units; layout is fluid |
| **1.4.10** Reflow | AA | Supports | Responsive grid collapses at 320px viewport width |
| **1.4.11** Non-text Contrast | AA | Supports | Fluent UI v9 component borders meet 3:1 against background |
| **1.4.12** Text Spacing | AA | Supports | No fixed-height containers that clip text when spacing is adjusted |
| **1.4.13** Content on Hover/Focus | AA | Supports | Tooltips persist; dismissed with Escape |
| **2.1.1** Keyboard | A | Supports | All interactive elements reachable via Tab; sortable `<th>` respond to Enter/Space; clickable rows respond to Enter/Space |
| **2.1.2** No Keyboard Trap | A | Supports | Focus not trapped; modals use `FocusTrapZone` (Fluent) |
| **2.4.3** Focus Order | A | Supports | Logical reading order; AppShell landmark structure |
| **2.4.7** Focus Visible | AA | Supports | Fluent UI v9 native focus ring; tested under 2.4.11 |
| **2.4.11** Focus Appearance | AA | Supports | Fluent tokens provide 3px offset ring |
| **2.5.3** Label in Name | A | Supports | Visible labels match accessible name |
| **2.5.8** Target Size (Minimum) | AA | Partially Supports | `TOUCH_TARGET.min=44px` constants defined; icon-only buttons updated; some legacy inline controls may be smaller |
| **3.2.2** On Input | A | Supports | No automatic context change on input |
| **3.3.1** Error Identification | A | Supports | Validation errors associated via `aria-describedby` + `aria-invalid` on all required form fields |
| **3.3.2** Labels or Instructions | A | Supports | Required fields marked with `*`; `aria-required="true"` set |
| **4.1.2** Name, Role, Value | A | Supports | ARIA roles on nav (`role="navigation"`), main (`role="main"`), header (`role="banner"`), chart regions (`role="region"` + `aria-labelledby`) |
| **4.1.3** Status Messages | AA | Supports | Toast notifications use `aria-live="polite"`; `HbcEChart` loading states announced |

---

## Known Gaps / Roadmap

| Issue | Priority | Target |
|-------|----------|--------|
| `gray400`/`gray500` still used in some legacy chart labels (ECharts axis) | P2 | Phase 2 |
| GoNoGoScorecard radio groups need `role="radiogroup"` + `aria-labelledby` | P2 | Phase 2 |
| JobNumberRequestForm inline editable fields need `aria-label` per cell | P2 | Phase 2 |
| Schedule Gantt chart (canvas-rendered) — no accessible alternative | P3 | Phase 3 |

---

## Evidence

CI axe reports are uploaded as GitHub Actions artifacts on every PR:
- Artifact name: `axe-report-{sha}`
- Retention: 14 days
- Run: `npm run test:a11y`

---

## Legal Notice

This VPAT was prepared by the HBC IT development team and represents a good-faith self-assessment. It has not been independently audited. For certification, engage an independent auditor (e.g., Level Access, Deque).
