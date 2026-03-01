# HBC Project Lifecycle Specification
**Live at commit:** 83db2ad9e8b0b8f164562564dbff4fad554d4e8b

## Purpose
Canonical definition of every project state transition from lead intake through closeout for all HBC Project Controls flows.

## Core States (exact enum values used in code)
- Lead → Opportunity → Awarded → Active → Closeout → Archived

## Key Entities & File Paths at this commit
- Project model: `packages/hbc-sp-services/src/models/IProject.ts`
- Status transitions: `packages/hbc-sp-services/src/services/projectService.ts`
- UI renderer: `src/webparts/hbcProjectControls/components/shared/ProjectStatusDropdown.tsx`

## Business Rules & Invariants
- Only "ProjectManager" role may advance to Closeout.
- Every transition must be wrapped in a useHbcMutation with exact query key ['project', id, 'status'].
- Feature flag 'enableCloseoutWorkflow' must gate Closeout UI and service call.

## Correctness Criteria
- State machine must reject invalid transitions.
- All changes logged with timestamp and actor.

## Failure Modes & Prevention
- Bypassing loader-level permission check → prevented by Constitution Trigger Table.
- Negative float or skipped compliance → blocked by construction-domain-specialist.

## Live Code Example
See `src/webparts/hbcProjectControls/components/tanstack/router/workspaces/routes.projecthub.tsx` (loader uses projectService.updateStatus).

Agent instruction: Validate every status-related change against this spec before proposing code.