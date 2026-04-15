# src/features — Feature-Sliced Modules

Self-contained feature modules. Each feature owns its screens, hooks, and local logic.

## STRUCTURE

```
features/
├── editor/            # Main editor (LUT application, preview)
│   └── components/    # Editor-specific UI components
├── export-image/      # Export edited image to gallery
├── export-lut/        # Export LUT as .cube file
├── framing-toolkit/   # Crop, rotate, aspect ratio
├── import-image/      # Pick image from gallery/camera
├── import-lut/        # Pick .cube file from filesystem
├── preset-browser/    # Browse/apply preset LUTs
├── quick-color-copy/  # Copy color grading between images
├── settings/          # App settings
└── watermark/         # Add watermark overlay
```

## CONVENTIONS

- Each feature: `index.ts` (barrel), `*.screen.tsx` (screen component), `use-*.ts` (hooks)
- Features call `@services/*` and `@adapters/*` — never vendor APIs directly
- Feature-local components go in `components/` subdir
- Screen components are imported by `app/` routes

## WHERE TO LOOK

| Task                 | Location                                                    |
| -------------------- | ----------------------------------------------------------- |
| Add new feature      | Create `src/features/<name>/` with index.ts + screen + hook |
| Editor UI changes    | `editor/` + `editor/components/`                            |
| Import/export flows  | `import-*/` or `export-*/`                                  |
| LUT preset selection | `preset-browser/`                                           |

## ANTI-PATTERNS

- Direct `import { ... } from 'expo-*'` — use `@adapters/expo/` instead
- Direct Skia API calls — use `@adapters/skia/` or `@services/*`
- Business logic that belongs in `@services/*`
