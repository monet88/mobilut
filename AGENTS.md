# CLAUDE.md

Cross-platform mobile photo grading app for Vietnamese creators. React Native + Expo Router + `@shopify/react-native-skia`. Local-first, no backend in v1.

## Monorepo structure

npm workspaces:
- Root app: React Native + Expo
- `packages/lut-core/`: Pure TypeScript LUT library (no RN dependencies)

## Project map

- `app/` — Routes, layouts, navigation wiring only
- `src/core/` — Pure contracts, domain rules, types
- `src/features/` — Feature UI, hooks, screen composition
- `src/services/` — Orchestration layer, preview/export separation
- `src/adapters/` — Wrappers for Expo modules, Skia runtime, EXIF
- `src/ui/` — Shared UI components
- `packages/lut-core/` — LUT parse/validate/serialize/interpolate (pure TS, no RN)
- `docs/adr/` — Architecture Decision Records

## Path aliases

`@core/*`, `@features/*`, `@services/*`, `@adapters/*`, `@ui/*` → `src/` equivalents. `@theme`, `@hooks`, `@lib`, `@i18n` → `src/` singletons. `@lut-core` → `packages/lut-core/src`.

<important if="you are building the preview or export pipeline, or working with image rendering">
- Preview path ≠ export path — preview optimized for responsiveness, export for full resolution. Export must never reuse downscaled preview bitmap.
- EditState is immutable and renderer-agnostic — no Skia types in EditState.
</important>

<important if="you are working with LUT files, .cube parsing, or HaldCLUT">
- `.cube` is the interop format. Internally may use HaldCLUT PNG or strip textures for Skia.
- `packages/lut-core/` owns all LUT math/parsing. No React Native code inside.
</important>

<important if="you are adding new modules, moving files between directories, or creating new source directories">

Module boundaries are strict:

| Module               | MUST NOT contain                           |
| -------------------- | ------------------------------------------ |
| `app/`               | Business logic, parser logic, shader logic |
| `src/core/`          | Expo imports, Skia imports, route params   |
| `src/features/`      | Direct vendor API calls                    |
| `src/services/`      | UI components                              |
| `src/adapters/`      | Business logic                             |
| `packages/lut-core/` | React Native code, Expo imports            |

</important>

<important if="you are handling errors, writing failure recovery, or implementing import/export flows">
Every critical failure needs: typed error → user-facing copy → non-crashing recovery → test coverage.

Critical failures: malformed `.cube`, unsupported LUT size, invalid HaldCLUT PNG dimensions, oversized image import, shader compile/runtime failure, OOM/unsafe export dimensions, export failure/no write permission, EXIF read failure, crop/export quality regression.
</important>

<important if="you are deciding what to implement or questioning feature scope">
- RAW decode/edit, cloud sync, user accounts, live camera preview, batch processing — all deferred
- All features must work offline
</important>

<!-- gitnexus:start -->
<important if="you are modifying a function, class, or method">

**GitNexus impact analysis is REQUIRED before editing any symbol.**

1. Run `gitnexus_impact({target: "symbolName", direction: "upstream"})` first
2. Warn user if HIGH or CRITICAL risk — do not proceed without acknowledgment
3. Run `gitnexus_detect_changes()` before committing

Risk levels: d=1 (WILL BREAK — must update), d=2 (LIKELY AFFECTED — should test), d=3 (MAY NEED TESTING).

</important>

<important if="you are debugging or tracing an issue">

Use GitNexus to trace execution flows:

1. `gitnexus_query({query: "<error or symptom>"})` — find related flows
2. `gitnexus_context({name: "<suspect function>"})` — see callers, callees, process participation
3. Read `gitnexus://repo/mobilut/process/{name}` — trace execution step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})`

</important>

<important if="you are renaming, extracting, or refactoring code">

- **Renaming**: Use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` — never find-and-replace
- **Extracting**: Run `gitnexus_context` then `gitnexus_impact` to find all external callers first
- **After refactor**: `gitnexus_detect_changes({scope: "all"})` to verify scope

</important>

<important if="you are exploring unfamiliar code or need codebase context">

Use GitNexus instead of grepping:
- `gitnexus_query({query: "concept"})` — find execution flows by concept
- `gitnexus_context({name: "symbolName"})` — 360° view of a symbol
- Resources: `gitnexus://repo/mobilut/context`, `gitnexus://repo/mobilut/processes`

If tools warn index is stale: `npx gitnexus analyze` (add `--embeddings` to preserve embeddings).

</important>
<!-- gitnexus:end -->

<!-- BEGIN BEADS INTEGRATION v:1 profile:full hash:f65d5d33 -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Quality
- Use `--acceptance` and `--design` fields when creating issues
- Use `--validate` to check description completeness

### Lifecycle
- `bd defer <id>` / `bd supersede <id>` for issue management
- `bd stale` / `bd orphans` / `bd lint` for hygiene
- `bd human <id>` to flag for human decisions
- `bd formula list` / `bd mol pour <name>` for structured workflows

### Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history
- Use `bd dolt push`/`bd dolt pull` for remote sync
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
- If using XcodeBuildMCP, use the installed XcodeBuildMCP skill before calling XcodeBuildMCP tools.
