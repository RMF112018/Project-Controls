# Fluent UI v9 Global Standards — Cold Storage

**Status**: Authoritative (Cold Knowledge Base)  
**Created**: 2026-03-01  
**Scope**: Cross-cutting UI decisions for the entire HBC Project Controls SPFx application.  
**Governance**: Referenced by all domain-specific specs. Never duplicated.

## Token Mapping (Hardcoded → Fluent)

| Hardcoded          | Fluent Token                          | Context                  |
|--------------------|---------------------------------------|--------------------------|
| `'4px'`            | `tokens.spacingVerticalXS`            | Gap/padding              |
| `'8px'`            | `tokens.spacingVerticalS`             | Gap/padding              |
| `'12px'`           | `tokens.spacingVerticalMNudge`        | Gap/margin               |
| `'16px'`           | `tokens.spacingVerticalM`             | Gap/padding              |
| `'20px'`           | `tokens.spacingVerticalL`             | Padding                  |
| `'24px'`           | `tokens.spacingVerticalL`             | Gap                      |
| `'32px'`           | `tokens.spacingVerticalXL`            | Spacing                  |
| `'40px'`           | `tokens.spacingVerticalXXL`           | Padding                  |
| `'8px'` (radius)   | `tokens.borderRadiusMedium`           | Border-radius            |
| `'12px'` (radius)  | `tokens.borderRadiusLarge`            | Border-radius            |
| `'12px'` (font)    | `tokens.fontSizeBase200`              | Font-size                |
| `'13px'` (font)    | `tokens.fontSizeBase200`              | Font-size                |
| `'14px'` (font)    | `tokens.fontSizeBase300`              | Font-size                |
| `'18px'` (font)    | `tokens.fontSizeBase400`              | Section title            |
| `fontWeight: 500`  | `tokens.fontWeightMedium`             | Weight                   |
| `fontWeight: 600`  | `tokens.fontWeightSemibold`           | Weight                   |

## Accessibility Checklist (WCAG 2.2 AA)

- All interactive elements have proper ARIA attributes  
- Charts have `ariaLabel` prop  
- Forms use `HbcField` for label-input association  
- Required fields have `aria-required="true"`  
- Validation errors linked via `aria-describedby`  
- Error banners use `role="alert"` or `aria-live="assertive"`  
- Focus indicators via `:focus-visible`  
- Touch targets minimum 44px (TOUCH_TARGET.min from tokens)  
- Status indicators include visible text label (not color-only)  

## Responsive Breakpoint Strategy

| Breakpoint   | Name     | Behavior                              |
|--------------|----------|---------------------------------------|
| >= 1024px    | Desktop  | Full multi-column grids               |
| 768–1023px   | Tablet   | Reduced columns (2-3 KPIs per row)    |
| < 768px      | Mobile   | Single column, stacked layout         |

## Dark-Mode / High-Contrast Architecture (Phase 6 Task 1)

- **ThemeGate** component (nested `FluentProvider` inside `AppProvider`)  
- Three themes: `hbcLightTheme`, `hbcDarkTheme`, `hbcHighContrastTheme` (`teamsHighContrastTheme` re-export)  
- Persistence: `localStorage` key `hbc:theme-mode:{email}`  
- OS tracking: `prefers-color-scheme: dark` + `matchMedia`  
- High contrast: `@media (forced-colors: active)` + `forced-colors` CSS overrides  
- Token migration summary and exceptions documented in full (see Token Migration Summary table below)

## Motion Primitives (Phase 6 Task 2)

**Central utility**: `src/.../components/shared/HbcMotion.ts`

**Duration Token Mapping**

| Token | Approximate Value | Usage |
|-------|-------------------|-------|
| `tokens.durationUltraFast` | ~50ms | Reduced-motion fallback |
| `tokens.durationFaster` | ~100ms | Subtle preset |
| `tokens.durationFast` | ~150ms | Standard micro-animation ceiling |
| `tokens.durationNormal` | ~200ms | Accordion content expand |
| `tokens.durationSlow` | ~300ms | Dialog entrance (max cap) |

**Curve Token Mapping**

| Token | Behavior | Usage |
|-------|----------|-------|
| `tokens.curveDecelerateMid` | Ease-out (natural deceleration) | Enter animations, scale-in |
| `tokens.curveEasyEase` | Symmetric ease | Color/state transitions |

**Reduced-Motion Mandate**
Every animation MUST include `@media (prefers-reduced-motion: reduce)` with `tokens.durationUltraFast`. This is enforced in all `useHbcMotionStyles` and `useEstimatingMotionStyles` presets.

**Max Duration Cap**: `HBC_MOTION_MAX_MS = 300` — no animation may exceed 300ms.

**Estimating-Specific Presets** (`useEstimatingMotionStyles`): `scoreTransition`, `pillAppear`, `badgeScaleIn`, `chevronRotate`, `accordionContent`/`accordionContentExpanded`. See `estimating-function-ui-stabilization.md` Phase 6 Task 2 for details.

## Shared Patterns Reference

- Button theming → `useButtonStyles` hook
- Mutation feedback → `useMutationWithToast` / `withToastFeedback`
- Micro-animations → `useHbcMotionStyles` (global) + `useEstimatingMotionStyles` (estimating surfaces only)

**Usage Rule**
Every domain-specific spec MUST reference this file and may only contain domain-specific deviations. No duplication allowed.

**End of Global UI Standards**