# Testing

> Last mapped: 2026-04-22

## Framework & Configuration

| Item | Detail |
|------|--------|
| Runner | Jest 29.7.0 via `jest-expo` ~52.0.0 |
| Component Testing | `@testing-library/react-native` 13.0.0 |
| Snapshot Rendering | `react-test-renderer` 18.3.1 |
| Config | `jest.config.js` (root) |
| Setup | `jest.setup.ts` (currently a placeholder) |
| Command | `npm test` → `jest` |

## Test Location

Tests are centralized in `__tests__/` at the project root — **not colocated** with source:

```
__tests__/
├── app-layout.test.tsx          # Root layout
├── adapters/
│   └── image-picker.test.ts
├── core/
│   └── stylistic/               # (subdirectory exists)
├── editor/
│   └── .gitkeep                 # (empty, tests in features/)
├── features/                    # 16 test files
│   ├── home.screen.test.tsx
│   ├── editor.screen.test.tsx
│   ├── batch.screen.test.tsx
│   ├── batch-photo-picker.test.tsx
│   ├── blend-sheet.test.tsx
│   ├── modification-log-sheet.test.tsx
│   ├── adjustment-panel.test.tsx
│   ├── draft-grid.test.tsx
│   ├── use-editor-session.test.ts
│   ├── use-batch-session.test.ts
│   ├── use-drafts.test.ts
│   ├── use-export-image.test.ts
│   ├── export-image.screen.test.tsx
│   ├── import-image.screen.test.tsx
│   ├── settings.screen.test.tsx
│   └── quick-color-copy.test.ts
├── helpers/
│   └── test-utils.ts            # Shared test utilities (minimal)
├── import-export/
│   ├── cube-roundtrip.test.ts
│   └── .gitkeep
├── lut-core/                    # 8 test files
│   ├── cube-parser.test.ts
│   ├── cube-serializer.test.ts
│   ├── cube-validator.test.ts
│   ├── cube-to-hald.test.ts
│   ├── hald-parser.test.ts
│   ├── hald-validator.test.ts
│   ├── strip-sampler.test.ts
│   └── trilinear.test.ts
└── services/                    # 6 test files
    ├── draft-store.test.ts
    ├── preview-render.test.ts
    ├── batch-export-queue.test.ts
    ├── batch-workspace.test.ts
    ├── thumbnail-cache.test.ts
    └── recent-items.test.ts
```

## Test Roots

Jest is configured with multiple roots:
```javascript
roots: ['<rootDir>/__tests__', '<rootDir>/src', '<rootDir>/packages/lut-core/src']
```

This allows tests in `__tests__/` to find source, and any colocated tests in `src/` or `packages/` to also be discovered.

## Module Aliases in Tests

All path aliases (`@core/*`, `@features/*`, `@lut-core`, etc.) are mapped in `jest.config.js` via `moduleNameMapper`, mirroring the `tsconfig.json` paths exactly.

## Transform Ignore Patterns

Standard Expo pattern — transforms everything except common RN-ecosystem packages:
```javascript
transformIgnorePatterns: [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|...))'
]
```

## Test Categories by Count

| Category | Files | Coverage Area |
|----------|-------|--------------|
| Features | 16 | Screen rendering, hooks, user interactions |
| LUT Core | 8 | Parser, serializer, validator, interpolation |
| Services | 6 | Draft store, preview render, batch, thumbnails |
| Import/Export | 1 | Cube roundtrip integration test |
| Adapters | 1 | Image picker |
| App | 1 | Root layout |
| **Total** | **33** | |

## Testing Patterns

### Component Tests (Features)

Use `@testing-library/react-native` for render + interaction:
- Render screen components with mock props/callbacks
- Assert on rendered text, buttons, and interactions
- Test hook behavior via component integration

### Pure Logic Tests (LUT Core, Services)

Direct function testing with no React involvement:
- Parse `.cube` content → assert `LutData` output
- Serialize `LutData` → assert `.cube` string
- Validate → assert error/success
- Roundtrip: parse → serialize → parse → compare

### Mocking Strategy

- Expo modules mocked at adapter boundary (tests don't import `expo-*` directly)
- Skia is mocked for component tests
- AsyncStorage mocked for storage service tests
- File system operations mocked in draft store tests

## Coverage Gaps

Based on directory analysis:

| Area | Status |
|------|--------|
| `src/adapters/skia/` (9 files) | No tests — GPU shaders not testable in Jest |
| `src/adapters/exif/` | No tests |
| `src/adapters/ads/` | No tests |
| `src/services/ads/` | No tests |
| `src/services/image/export-render.service.ts` | No dedicated test |
| `src/services/image/cpu-render.service.ts` | No test |
| `src/services/image/export-request-builder.ts` | No test |
| `src/services/lut/` (3 files) | No tests |
| `src/features/watermark/` | No tests |
| `src/features/framing-toolkit/` | No tests |
| `src/features/import-lut/` | No tests |
| `src/features/export-lut/` | No tests |
| `src/features/preset-browser/` | No tests |
| `src/ui/` (all components) | No tests |
| `src/theme/` | No tests |
| `src/i18n/` | No tests |
| `__tests__/editor/` | Empty (.gitkeep only) |
| `jest.setup.ts` | Placeholder — no shared mocks configured |
