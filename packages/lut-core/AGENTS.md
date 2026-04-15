# packages/lut-core — Pure TS LUT Engine

Standalone TypeScript package for LUT parsing, validation, serialization, and interpolation. **No React Native or Expo code.**

## STRUCTURE

```
lut-core/src/
├── cube/          # .cube file parser + serializer
├── hald/          # HaldCLUT PNG encode/decode
├── model/         # LutData, ParseResult, validation types
└── interpolate/   # Trilinear/tetrahedral interpolation
```

## WHERE TO LOOK

| Task                | Location                                |
| ------------------- | --------------------------------------- |
| .cube parsing bugs  | `cube/` — parser + tokenizer            |
| HaldCLUT support    | `hald/` — PNG ↔ LUT conversion          |
| LUT data model      | `model/` — LutData, ParseResult         |
| Color interpolation | `interpolate/` — trilinear, tetrahedral |
| Add new LUT format  | New subdir + update model/              |

## CONVENTIONS

- Own `tsconfig.json` extending root, outputs to `dist/`
- Imported via `@lut-core` alias
- Tests in `__tests__/lut-core/` (root test dir, not colocated)
- Pure functions — no side effects, no I/O

## ANTI-PATTERNS

- Importing `react-native`, `expo-*`, or any RN package
- Side effects (file I/O, network) — caller's responsibility
- Skia types or rendering logic
