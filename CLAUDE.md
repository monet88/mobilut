# CLAUDE.md

Cross-platform mobile photo grading app for creators. React Native + Expo Router + `@shopify/react-native-skia`. Local-first, no backend in v1. Current product direction keeps the v1 UI English-only while preserving i18n-ready architecture for future Vietnamese support.

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
- RAW decode/edit, cloud sync, user accounts, live camera preview — all deferred
- Batch processing is planned for a later milestone, not part of the initial trusted single-photo loop
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

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
<important if="you are tracking tasks, creating issues, or managing work">

Use **bd (beads)** for ALL task tracking — not TodoWrite, TaskCreate, or markdown TODOs.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

Run `bd prime` for full command reference. Use `bd remember` for persistent knowledge.

</important>

<important if="you are ending a work session or about to say done or complete">

Work is NOT complete until `git push` succeeds.

1. File issues for remaining work (`bd create`)
2. Run quality gates if code changed
3. Close finished issues (`bd close`)
4. **PUSH TO REMOTE:**
   ```bash
   git pull --rebase && bd dolt push && git push
   git status  # MUST show "up to date with origin"
   ```

NEVER stop before pushing — that leaves work stranded locally.

</important>
<!-- END BEADS INTEGRATION -->

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.