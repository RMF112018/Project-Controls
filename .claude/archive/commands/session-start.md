You are working on the **HBC Project Controls** application for Hedrick Brothers Construction.

## Project Context
- SPFx 1.21.1 monorepo: React 18 + TypeScript + Fluent UI v9
- Shared data library: `@hbc/sp-services` (packages/hbc-sp-services)
- Deployed to SharePoint Online tenant app catalog
- Key docs: `CLAUDE.md` (blueprint), `CLAUDE_ARCHIVE.md` (history)

## Current Goals
Read CLAUDE.md §15 for the active phase and §7 for service method progress. The primary goal is completing the SharePointDataService (all 221 methods) before any new UI work.

## Workflow Rules (Mandatory)
1. **After any meaningful code change**, run `/verify-changes` and show results before concluding the task.
2. **Never mark work complete** until verification passes (TypeScript, ESLint, tests).
3. **Before commits and PRs**, run `/verify-full-build` to confirm the full production build succeeds.
4. **After data-layer changes**, update CLAUDE.md §7 and §15 before ending the session.

## Work Style
- Work in **small, logical chunks** — one domain or feature slice at a time.
- Verify between chunks. Do not batch large changes without intermediate checks.
- Follow existing patterns in the codebase (see CLAUDE.md §4 and §16).
- Use `columnMappings.ts` for SP column names — never hard-code.
- Use `_getProjectWeb()` for project-site lists, `this.sp.web` for hub-site lists.
- For UI-related changes, use `/ui-feedback` to verify visual behavior in the browser.

## Available Commands
| Command | Purpose |
|---------|---------|
| `/verify-changes` | Quick check: TypeScript + ESLint + tests |
| `/verify-full-build` | Full check: above + library build + SPFx build |
| `/status` | Project overview: branch, progress, active phase |
| `/permissions` | Show current permission allowlist |
| `/ui-feedback` | UI check: dev server, role switching, visual verification |
| `/sp-progress` | Quick read-only scan of SharePointDataService stub counts |
| `/review-chunk` | Post-chunk automation: verify + scan + generate CLAUDE.md updates |

## Command Usage Guide
- **`/sp-progress`** — Run anytime to get a quick ground-truth progress snapshot (~5 seconds, read-only)
- **`/review-chunk`** — Run after completing a data service chunk. Runs verification, scans stubs, and generates ready-to-paste §7/§15 updates. This is the mandatory post-chunk workflow.
- **`/verify-changes`** / **`/verify-full-build`** — Code quality gates. Use `/verify-changes` during development, `/verify-full-build` before commits and PRs.
- **`/status`** — Session orientation. Good to run at the start of a session or when switching context.
- **`/ui-feedback`** — After UI changes, verify visual behavior in the browser with role switching.

Start by running `/status` to see where things stand.
