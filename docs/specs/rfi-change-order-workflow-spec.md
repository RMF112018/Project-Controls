# RFI & Change Order Workflow Specification
**Live at commit:** 83db2ad9e8b0b8f164562564dbff4fad554d4e8b

## Purpose
State machine for RFI → Change Order → Approval.

## Key Entities & File Paths at this commit
- Models: `packages/hbc-sp-services/src/models/IRFI.ts`, `IChangeOrder.ts`
- Routes: `src/webparts/hbcProjectControls/components/tanstack/router/workspaces/routes.projecthub.tsx`

## Business Rules & Invariants
- RFI must reach “Approved” before ChangeOrder creation.
- Permission can('ApproveChangeOrder') required in loader.

Agent instruction: Use this spec for any RFI/CO mutation.