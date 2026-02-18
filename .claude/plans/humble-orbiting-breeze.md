# Plan: Browser Automation via Puppeteer MCP + `/ui-feedback` Rewrite

## Context

The HBC Project Controls app has a `/ui-feedback` command that currently hedges with "if browser automation available." No MCP browser tools are configured, no browser packages installed. The user wants a concrete, actionable command that uses the Puppeteer MCP server to automate visual verification — opening the dev server, switching roles, navigating pages, checking for console errors, and taking screenshots.

### Current State
- **`ui-feedback.md`**: Exists but is a generic placeholder (56 lines)
- **MCP config**: `.claude/settings.json` has permissions only, no `mcpServers` key
- **Dev server**: localhost:3000, webpack HMR
- **RoleSwitcher**: Native HTML `<select>` at bottom-left (`position: fixed`), 14 role options, z-index 9999
- **session-start.md**: Already references `/ui-feedback` at lines 24 and 42

---

## Deliverables (3 items)

### 1. Add Puppeteer MCP server config to `.claude/settings.json`

Add `mcpServers` key alongside existing `permissions`:

```json
{
  "permissions": { ... },
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

**File**: `.claude/settings.json`

### 2. Rewrite `ui-feedback.md` with concrete Puppeteer MCP workflow

Replace the existing 56-line placeholder with a concrete command that uses specific Puppeteer MCP tool names. The command should:

**Structure:**
1. **Prerequisites check** — Verify dev server on localhost:3000 (curl/fetch check)
2. **Launch & Navigate** — `puppeteer_navigate` to `http://localhost:3000`
3. **Role Switching** — `puppeteer_select` on the RoleSwitcher `<select>` element (CSS selector: the `<select>` inside the fixed-position RoleSwitcher container). Accept an optional `$ARGUMENTS` role parameter.
4. **Route Navigation** — `puppeteer_navigate` to the requested route hash (e.g., `http://localhost:3000/#/operations/management-plan`). Accept optional route from `$ARGUMENTS`.
5. **Console Error Check** — `puppeteer_evaluate` to run `window.__consoleErrors` or similar JS to capture console.error calls
6. **Screenshot** — `puppeteer_screenshot` of the current page state
7. **Basic Assertions** — `puppeteer_evaluate` to check for:
   - Error boundary renders (`.error-boundary` selector)
   - Data table rows (`table tbody tr` count)
   - Specific element presence (user-provided selector)
   - No blank/empty page state
8. **Report** — Structured Pass/Fail/Screenshot/Console output

**Key details for the RoleSwitcher selector:**
- File: `dev/RoleSwitcher.tsx`
- It's a native `<select>` element inside a fixed-position container
- Role values: `DEV_SUPER_ADMIN`, `ExecutiveLeadership`, `IDS`, `DepartmentDirector`, `SharePointAdmin`, `OperationsTeam`, `PreconstructionTeam`, `EstimatingCoordinator`, `BDRepresentative`, `AccountingManager`, `Legal`, `Marketing`, `QualityControl`, `Safety`, `RiskManagement`
- CSS selector for the select: `select` inside the bottom-left fixed container (simplest: just `select` since there's only one in dev mode, or more specific via parent container styles)

**File**: `.claude/commands/ui-feedback.md`

### 3. Update `session-start.md` — enhance the `/ui-feedback` description

The command table already lists `/ui-feedback` and the Command Usage Guide already mentions it. Update the description in both places to reflect the new Puppeteer-powered capabilities:

**In the table** (line 33):
```
| `/ui-feedback` | Browser automation: screenshots, role switching, console checks via Puppeteer MCP |
```

**In the Command Usage Guide** (line 42):
```
- **`/ui-feedback`** — After UI changes, use Puppeteer MCP to open the dev server, switch roles, navigate pages, take screenshots, and check for console errors. Requires dev server running (`npm run dev`).
```

**File**: `.claude/commands/session-start.md`

---

## Files Changed

| File | Action |
|------|--------|
| `.claude/settings.json` | **Edit** — add `mcpServers.puppeteer` config |
| `.claude/commands/ui-feedback.md` | **Rewrite** — concrete Puppeteer MCP workflow |
| `.claude/commands/session-start.md` | **Edit** — enhance `/ui-feedback` descriptions |

---

## Verification

1. Read `.claude/settings.json` → has `mcpServers.puppeteer` with correct npx command
2. Read `ui-feedback.md` → references specific Puppeteer tool names (`puppeteer_navigate`, `puppeteer_screenshot`, `puppeteer_click`, `puppeteer_select`, `puppeteer_evaluate`)
3. Read `ui-feedback.md` → includes RoleSwitcher select element interaction with correct role values
4. Read `session-start.md` → updated descriptions mention Puppeteer MCP
5. After implementation: restart Claude Code session, run `/ui-feedback` with dev server running to confirm tools are available
