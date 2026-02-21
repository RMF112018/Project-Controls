---
name: CODE_ARCHITECTURE_GUIDE | description: Architecture layers, folder structure, and dependency rules for HBC Project Controls | triggers: architecture,structure,refactor,layer,dependency | updated: 2026-02-21
---
# HBC CODE ARCHITECTURE GUIDE (Lean v1)
Token limit: < 8 kB | Use with FEATURE_DEVELOPMENT_BLUEPRINT.md

## §0 Core Principles
- Strict layered architecture: Data → Domain → Presentation (no upward dependencies)
- Feature-sliced design inside Presentation layer (by construction domain)
- Monorepo purity: @hbc/sp-services contains only data and models
- All changes must preserve offline/PWA and SPFx compatibility

## §1 Enforced Folder Structure
- `src/`: Presentation + Domain (pages/, components/, hooks/, tanstack/router/, guards/)
- `packages/hbc-sp-services/`: Data layer only (models/, services/, mock/, columnMappings/)
- `docs/`: Architecture & analysis documents
- `.claude/`: Agent instruction files
- `.github/workflows/`, `infrastructure/`, `scripts/`: CI, deployment, utilities

## §2 Dependency & Refactoring Rules
- Presentation may depend on Domain and Data
- Domain may depend on Data only
- Use IDataService abstraction; never direct PnP calls outside services
- Post-schedule-v2: legacy react-router code must remain removed
- Barrel exports (index.ts) required for all shared modules

## §3 Agent Checklist (apply to every architecture-impacting task)
- [ ] Layers and direction of dependency verified?
- [ ] New domain placed in correct feature slice?
- [ ] No direct imports from lower to higher layers?
- [ ] Architecture diagram in docs/ updated if changed?

Reference files only. Never repeat full sections.