# LUT App — Project Knowledge Base

**Generated:** 2026-04-16 | **Commit:** de87e77 | **Branch:** master

## OVERVIEW

Cross-platform mobile photo grading app (LUT-based color grading) for Vietnamese creators. React Native + Expo Router + Shopify Skia. Local-first, no backend. Monorepo with `packages/lut-core` (pure TS LUT engine).

## STRUCTURE

```
mobilut/
├── app/              # Expo Router screens (thin — routing + layout only)
├── src/
│   ├── core/         # Domain models, types, error hierarchy (NO vendor imports)
│   ├── features/     # Feature-sliced modules (editor, import/export, presets, watermark...)
│   ├── services/     # Orchestration (lut, image, storage, diagnostics — NO UI)
│   ├── adapters/     # Platform wrappers (expo/, skia/, exif/)
│   ├── ui/           # Shared components (primitives/, layout/, feedback/)
│   ├── hooks/        # Custom React hooks
│   ├── theme/        # Design tokens + theme hooks
│   ├── i18n/         # en.ts, vi.ts
│   └── lib/          # Shared utilities
├── packages/
│   └── lut-core/     # Pure TS LUT engine (parse/validate/serialize/interpolate)
├── __tests__/        # Jest unit tests (mirrors src/ structure)
├── docs/adr/         # Architecture Decision Records
└── tools/            # Build/dev tooling
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add a screen/route | `app/` | Expo Router file-based routing |
| Add a feature | `src/features/<name>/` | Self-contained: screen, hooks, logic |
| Domain types/contracts | `src/core/` | Pure TS, no vendor deps |
| LUT parsing/math | `packages/lut-core/` | Separate package, own tsconfig |
| Platform API wrappers | `src/adapters/` | expo/, skia/, exif/ |
| Shared UI components | `src/ui/` | primitives/, layout/, feedback/ |
| Service orchestration | `src/services/` | lut, image, storage, diagnostics |
| Error types | `src/core/errors/` | Typed error hierarchy |
| Tests | `__tests__/` | Mirrors source structure |
| Execution plan | `.sisyphus/plans/lut-app-v2.md` | 12-wave plan |
| Task checklist | `TODOS.md` | Wave 0–11 progress |

## CONVENTIONS

- **Path aliases**: `@core/*`, `@features/*`, `@services/*`, `@adapters/*`, `@ui/*`, `@theme`, `@hooks`, `@lib`, `@i18n`, `@lut-core`
- **Formatting**: Prettier — single quotes, trailing commas, semi, 100 width
- **Strict TS**: `strict: true`, no `as any` or `@ts-ignore`
- **Feature structure**: `src/features/<name>/` with index.ts, screen.tsx, hooks
- **Immutable domain**: EditState is immutable and renderer-agnostic
- **Preview ≠ Export**: Preview optimized for speed, export for full resolution — never reuse downscaled preview bitmap

## MODULE BOUNDARIES (STRICT)

| Module | MUST NOT contain |
|--------|-----------------|
| `app/` | Business logic, parser logic, shader logic |
| `src/core/` | Expo imports, Skia imports, route params |
| `src/features/` | Direct vendor API calls (use adapters) |
| `src/services/` | UI components |
| `src/adapters/` | Business logic |
| `packages/lut-core/` | React Native code, Expo imports |

## ANTI-PATTERNS

- No `.cube` parsing outside `packages/lut-core/`
- No Skia types in EditState or core domain models
- No direct Expo/Skia calls from features (route through adapters/services)
- Empty `// TODO: export module contents` in several index.ts — fill as modules grow

## COMMANDS

```bash
npx expo start          # Dev server
npx expo run:android    # Android build+run
npx expo run:ios        # iOS build+run
npx jest                # Tests
npx tsc --noEmit        # Type check
npx gitnexus analyze    # Refresh code index
```

## DEFERRED (out of scope for v1)

RAW decode/edit, cloud sync, user accounts, live camera preview, batch processing. All features must work offline.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **mobilut** (670 symbols, 1280 relationships, 47 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/mobilut/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/mobilut/context` | Codebase overview, check index freshness |
| `gitnexus://repo/mobilut/clusters` | All functional areas |
| `gitnexus://repo/mobilut/processes` | All execution flows |
| `gitnexus://repo/mobilut/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

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
