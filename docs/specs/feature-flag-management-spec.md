# Feature Flag Management Specification
**Live at commit:** 83db2ad9e8b0b8f164562564dbff4fad554d4e8b

## Purpose
Runtime evaluation and catalog for all conditional features.

## Key Entities & File Paths at this commit
- Catalog: `packages/hbc-sp-services/src/featureFlags.json`
- Hook: `src/webparts/hbcProjectControls/hooks/useFeatureFlag.ts`

## Business Rules & Invariants
- Flags wrap entire route sub-trees.
- Default = false for new flags.

Agent instruction: Update flag definition + this spec on every new flag.