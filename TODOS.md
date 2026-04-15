# TODOS.md — Updated Content (copy this to replace TODOS.md)

This file contains the updated TODOS.md content with Wave 0–3 skeleton file references.
The TODOS.md file is outside `.sisyphus/` so Prometheus cannot edit it directly.

**Action needed**: Copy the content below into `TODOS.md`, or run `/start-work` and the executor will apply it.

---

# LUT App — Active TODOs

## Direction lock

- [x] Keep **React Native + Expo dev-client + Skia**
- [x] Keep release **local-first**
- [x] Defer **RAW editing** as nice-to-have
- [x] Treat **full-resolution export** as first-class requirement
- [x] Treat **`.cube` import/export** as first-class interoperability requirement

## Architecture lock

- [x] Keep `app/` route-only
- [x] Keep LUT math in `packages/lut-core/`
- [x] Keep preview path and export path separate
- [x] Keep Expo and Skia details inside `src/adapters/`
- [x] Keep feature UI inside `src/features/`
- [x] Keep domain contracts inside `src/core/`

## Wave 0 — Repo scaffolding and architecture skeleton (~42 files)

- [ ] W0.1. Expo app and workspace bootstrap — `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `eas.json`
- [ ] W0.2. Scaffold agreed route/source/test/assets folder structure — `app/` routes, 28 barrel `index.ts`, asset dirs, test dirs, `packages/lut-core/` scaffold
- [ ] W0.3. Tooling and path aliases — 10 `@` aliases in tsconfig+babel, `.eslintrc.js`, `.prettierrc`
- [ ] W0.4. Test harness scaffold — `jest.config.js`, `jest.setup.ts`, `__tests__/helpers/test-utils.ts`

## Wave 1 — Reusable LUT core package (~21 files)

- [ ] W1.1. Base LUT model contracts — `model/lut-table.ts`, `lut-metadata.ts`, `parse-result.ts`
- [ ] W1.2. `.cube` parser / validator / serializer — `cube/cube-parser.ts`, `cube-validator.ts`, `cube-serializer.ts`
- [ ] W1.3. HaldCLUT parser / validator / conversion — `hald/hald-parser.ts`, `hald-validator.ts`, `cube-to-hald.ts`
- [ ] W1.4. Strip sampling + trilinear interpolation — `interpolate/trilinear.ts`, `strip-sampler.ts`
- [ ] W1.5. LUT-core test suite — 8 test files in `__tests__/lut-core/`

## Wave 2 — App contracts and primitives (~28 files)

- [ ] W2.1. `src/core/edit-session/` — `edit-state.ts`, `edit-action.ts`, `history.ts`, `session-selectors.ts`
- [ ] W2.2. `src/core/image-pipeline/` — `image-asset.ts`, `preview-request.ts`, `export-request.ts`, `transform.ts`, `pipeline-constraints.ts`
- [ ] W2.3. `src/core/lut/` — `preset-model.ts`, `runtime-lut.ts`
- [ ] W2.4. `src/core/errors/` — `import-errors.ts`, `export-errors.ts`, `lut-errors.ts`, `render-errors.ts`, `error-messages.ts`
- [ ] W2.5. Theme and UI primitives — `tokens.ts`, `use-theme.ts`, `button.tsx`, `slider.tsx`, `loading-overlay.tsx`, `error-banner.tsx`, `toast.tsx`, `bottom-sheet.tsx`

## Wave 3 — Adapters and infra wrappers (~16 files)

- [ ] W3.1. Expo adapters — `document-picker.ts`, `image-picker.ts`, `image-manipulator.ts`, `file-system.ts`, `sharing.ts`, `media-library.ts`
- [ ] W3.2. Skia adapters — `runtime-effect-factory.ts`, `shader-sources.ts`, `preview-canvas.tsx`, `mask-renderer.ts`
- [ ] W3.3. EXIF adapter — `exif-reader.ts`
- [ ] W3.4. Local storage services — `app-preferences.ts`, `recent-items.ts`, `imported-lut-store.ts`

## Wave 4 — Rendering engines and parity

- [ ] W4.1. Preview rendering service
- [ ] W4.2. CPU fallback rendering service
- [ ] W4.3. GPU/CPU parity suite
- [ ] W4.4. Full-resolution export renderer

## Wave 5 — Import pipelines

- [ ] W5.1. Image import feature UI
- [ ] W5.2. Image import orchestration service
- [ ] W5.3. LUT import feature UI
- [ ] W5.4. LUT import services
- [ ] W5.5. Import hardening pass

## Wave 6 — Editor shell and state flow

- [ ] W6.1. Route entrypoints and editor shell
- [ ] W6.2. Editor store and session hooks
- [ ] W6.3. Undo/redo
- [ ] W6.4. Before/after comparison

## Wave 7 — Core editing tools

- [ ] W7.1. Preset browser
- [ ] W7.2. Adjustment pipeline
- [ ] W7.3. Crop feature split
- [ ] W7.4. Rotate feature split
- [ ] W7.5. Export image feature UI

## Wave 8 — Interoperability and export quality

- [ ] W8.1. `.cube` export service
- [ ] W8.2. `.cube` export feature UI
- [ ] W8.3. Crop/export quality split

## Wave 9 — Region and framing features

- [ ] W9.1. Selected-region effects foundation
- [ ] W9.2. Selected-region export parity
- [ ] W9.3. Framing toolkit foundation
- [ ] W9.4. Tape / overlay styles
- [ ] W9.5. Manual on-canvas framing controls

## Wave 10 — Watermark, Quick Color Copy, and content

- [ ] W10.1. Watermark service split
- [ ] W10.2. Watermark feature UI
- [ ] W10.3. Quick Color Copy core math
- [ ] W10.4. Quick Color Copy service layer
- [ ] W10.5. Quick Color Copy UI
- [ ] W10.6. LUT asset acquisition and conversion
- [ ] W10.7. LUT catalog bundle

## Wave 11 — Product polish and release hardening

- [ ] W11.1. Settings feature
- [ ] W11.2. Localization infrastructure
- [ ] W11.3. Rescue UX split
- [ ] W11.4. Performance profiling
- [ ] W11.5. Diagnostics and crash reporting
- [ ] W11.6. E2E flows
- [ ] W11.7. Store prep and release assets

## Release gates

- [ ] Pick photo → edit → export works end-to-end
- [ ] Export preserves intended full resolution for supported raster inputs
- [ ] `.cube` import works for supported files
- [ ] `.cube` export opens a usable Adobe-style workflow
- [ ] Import failures never fail silently
- [ ] Crop/export quality passes visual and automated checks
- [ ] Region effects, framing tools, Quick Color Copy, and watermark export all work in exported output
- [ ] 200+ LUT catalog is bundled and browsable
- [ ] Android + iOS builds pass

## Explicitly deferred

- [ ] RAW track only starts after strong repeated user demand
