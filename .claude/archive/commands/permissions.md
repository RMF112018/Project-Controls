Display the current Claude Code permission allowlist for this project.

Read the file `.claude/settings.json` and `.claude/settings.local.json`, then present both in a readable format organized by category:

**Shared permissions** (`.claude/settings.json` — committed to repo):
- npm scripts
- TypeScript & build tools
- Volta / Node
- Git operations
- GitHub CLI
- File inspection
- Web access

**Local overrides** (`.claude/settings.local.json` — gitignored, machine-specific):
- List any entries not already covered by the shared config

Format each entry clearly with the tool name and pattern. Flag any duplicates between the two files.
