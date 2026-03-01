# Permissions Engine Specification
**Live at commit:** 83db2ad9e8b0b8f164562564dbff4fad554d4e8b

## Purpose
14 roles, 70+ permissions, loader-level enforcement.

## Key Entities & File Paths at this commit
- Engine: `packages/hbc-sp-services/src/permissions/index.ts`
- Usage: All route loaders.

## Business Rules & Invariants
- can(permissionKey) must be called in loader; never in leaf component.

Agent instruction: Always check this spec first for gated UI.