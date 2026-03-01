# Kickoff & Estimating Specification
**Live at commit:** 83db2ad9e8b0b8f164562564dbff4fad554d4e8b

## Purpose
Defines the EstimatingKickoffPage and KickOffSection flows (fixed in this exact commit).

## Key Entities & File Paths at this commit
- Interfaces: `packages/hbc-sp-services/src/models/IEstimatingKickoff.ts`, `IKickoffConfig.ts`
- Utils: `packages/hbc-sp-services/src/utils/kickoffSectionConfigs.ts`, `estimatingKickoffTemplate.ts`
- Components: `src/webparts/hbcProjectControls/components/shared/KickOffSection.tsx`, `EstimatingKickoffPage.tsx`
- Query options: `src/webparts/hbcProjectControls/components/tanstack/query/queryOptions/kickoffQueryOptions.ts`

## Business Rules & Invariants
- resolveValue must always return the resolved template after fix in this commit.
- All sections editable only if can('EditEstimatingKickoff').

## Correctness Criteria
- No unresolved sections after save.
- Optimistic update + exact invalidation ['kickoff', projectId].

## Failure Modes & Prevention
- resolveValue returning null → prevented by the hotfix in this commit.

Agent instruction: When touching KickOffSection, always reference this spec and the 83db2ad9… hotfix.