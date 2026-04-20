# Testing

**Mapped:** 2026-04-20

## Framework

| Tool | Version | Config |
|------|---------|--------|
| Jest | 29.7.0 | `jest.config.js` |
| jest-expo | ~52.0.0 | Preset for Expo/React Native |
| @testing-library/react-native | 13.0.0 | Component testing |
| react-test-renderer | 18.3.1 | Available but not primary |

## Configuration

```javascript
// jest.config.js highlights
preset: 'jest-expo',
roots: ['<rootDir>/__tests__', '<rootDir>/src', '<rootDir>/packages/lut-core/src'],
setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
```

- Path aliases mirrored in `moduleNameMapper` (all 10 aliases)
- Helpers excluded from test runs: `testPathIgnorePatterns: ['__tests__/helpers/']`

## Test Structure

```
__tests__/
├── features/
│   ├── import-image.screen.test.tsx    # Screen component test
│   └── quick-color-copy.test.ts        # Feature logic test
├── helpers/
│   └── test-utils.ts                   # Shared test utilities
├── import-export/
│   └── cube-roundtrip.test.ts          # End-to-end format roundtrip
├── lut-core/
│   ├── cube-parser.test.ts
│   ├── cube-serializer.test.ts
│   ├── cube-to-hald.test.ts
│   ├── cube-validator.test.ts
│   ├── hald-parser.test.ts
│   ├── hald-validator.test.ts
│   ├── strip-sampler.test.ts
│   └── trilinear.test.ts
└── services/
    └── preview-render.test.ts
```

## Coverage by Module

| Module | Tests | Coverage Assessment |
|--------|-------|-------------------|
| `packages/lut-core/` | 8 test files | **Well tested** — parser, serializer, validator, interpolation |
| `src/features/` | 2 test files | **Sparse** — only import-image and quick-color-copy |
| `src/services/` | 1 test file | **Sparse** — only preview-render |
| `src/core/` | 0 test files | **No direct tests** — covered indirectly via lut-core tests |
| `src/adapters/` | 0 test files | **No tests** — thin wrappers, would need mocking |
| `src/ui/` | 0 test files | **No tests** |
| `app/` | 0 test files | **No tests** |

### Strongest Coverage: lut-core
The `packages/lut-core/` package has the most thorough test coverage:
- Parser correctness (valid and malformed .cube files)
- Serializer roundtrip (parse → serialize → parse)
- Validator edge cases (size limits, domain ranges)
- HaldCLUT conversion (cube-to-hald mapping)
- Trilinear interpolation accuracy
- Strip texture sampling

### Integration Test
- `cube-roundtrip.test.ts` — end-to-end: parse .cube → create table → serialize back → verify identity

## Testing Patterns

- Tests live in `__tests__/` at root level (not co-located with source)
- Shared helpers in `__tests__/helpers/test-utils.ts`
- Pure functions tested directly (no mocking needed for lut-core)
- Setup file: `jest.setup.ts` (minimal, 130 bytes)

## Gaps

1. **No adapter tests** — Expo module wrappers untested
2. **No UI component tests** — primitives (Button, Slider, Text) untested
3. **No editor integration tests** — reducer + session flow untested
4. **No Skia rendering tests** — shader compilation/output untested
5. **No export pipeline tests** — full export-render.service untested

## Run Command

```bash
npm test
# or
npx jest
```
