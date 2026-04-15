---
children_hash: fcd174a143ab1d76b768307348bd360e2ba47a4ba5d2c4f0de465c2af763ca33
compression_ratio: 0.3333333333333333
condensation_order: 1
covers: [context.md, cube_to_haldclut_conversion_tool.md, lut_conversion_tools/_index.md, lut_mobile_tech_stack.md, lut_rendering_pipeline/_index.md]
covers_token_total: 1980
summary_level: d1
token_count: 660
type: summary
---
# Graphics Knowledge Structure (Technology / Graphics)

## Core Topics
- **graphics/context.md**
  - Mobile LUT experience covers the technology stack, shader execution, and media handling constraints, establishing React Native, Skia, and image-only processing as the foundation.

- **cube_to_haldclut_conversion_tool.md**
  - Documented `cube_to_hald.py` tooling: CLI parses `.cube` LUTs, validates `LUT_3D_SIZE`, builds normalized RGB grids, applies vectorized trilinear interpolation, and writes HaldCLUT PNGs; supports single-file and bulk folder workflows with configurable levels (default level 4, optional level 8). Dependencies: `numpy`, `Pillow`, plus standard CLI libs. Rules/usage and facts detail how Level‑4 (~200 KB) is mobile-friendly; Level‑8 (~768 KB) offers higher fidelity; bulk mode processes every `.cube`/`.CUBE` file and reports success/failure counts.

- **lut_conversion_tools/_index.md**
  - Summarizes the cube-to-Hald conversion domain: `parse_cube`, `cube_to_haldclut`, and `convert_folder` roles; the flow from parsing to interpolation and PNG output; tooling dependencies and CLI commands; and key facts around level defaults, bulk conversions, and trilinear interpolation.

- **lut_mobile_tech_stack.md**
  - Chronicles the stack decision: choosing React Native over Flutter, integrating `@shopify/react-native-skia`, using SKSL `RuntimeEffect` shaders with bundled HaldCLUT PNGs, and constraining the app to still-image processing. Facts record framework, rendering library, shader approach, asset format, and media scope.

- **lut_rendering_pipeline/_index.md**
  - Highlights shader constraints (no SKSL 3D sampler), the flattened 512×512 HaldCLUT approach, Level-4/Level-8 asset strategy, and reliance on `tools/cube_to_hald.py` conversion (Python with numpy/Pillow, ~30 ms per LUT) to support the GPU pipeline.

## Key Relationships & Patterns
- **Tooling ↔ Assets**: `tools/cube_to_hald.py` (conversion documentation) feeds HaldCLUT assets referenced by the rendering pipeline and mobile stack summaries, linking conversion tooling to shader requirements and asset packaging decisions.
- **Shader Strategy ↔ Framework**: React Native + `@shopify/react-native-skia` + SKSL `RuntimeEffect` shaders form the runtime platform that consumes precomputed HaldCLUT PNGs produced by the conversion workflow.
- **Asset Choices ↔ Performance Constraints**: Level-4 defaults (~200 KB) balance mobile download size and shader simplicity, while Level-8 remains available for higher fidelity without changing shader logic; these constraints inform both conversion tooling options and rendering pipeline documentation.