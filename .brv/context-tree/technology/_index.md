---
children_hash: 5b44650203119f5ced49239e6c25e33ad0fbbe090449c77aed870308435db776
compression_ratio: 0.6640883977900552
condensation_order: 2
covers: [context.md, graphics/_index.md]
covers_token_total: 905
summary_level: d2
token_count: 601
type: summary
---
# Technology / Graphics Structural Summary

## Domain Purpose & Scope (`context.md`)
- Documents long-lived graphics, rendering, and LUT tooling decisions for the mobile app under Graphics Engineering ownership.
- Focuses on rendering frameworks/shaders, color transform asset formats, and media handling for LUT application; explicitly excludes unrelated product management or backend infrastructure choices.
- Serves as the entry point for capturing locked-in technology decisions affecting LUT experience.

## Graphics Topic Map (`graphics/_index.md`)
- **Graphics Context**: Establishes React Native + Skia stack with image-only processing, anchoring the shader and media constraints detailed across subordinate entries.
- **Cube-to-Hald Conversion Tool** (`cube_to_haldclut_conversion_tool.md`): Explains `cube_to_hald.py` CLI workflow—`.cube` parsing, normalized RGB grid generation, vectorized trilinear interpolation, and HaldCLUT PNG output—with defaults (Level 4) vs. high-fidelity Level 8, and bulk conversion handling.
- **Conversion Tools Domain** (`lut_conversion_tools/_index.md`): Maps the parsing, interpolation, and PNG-writing roles, dependencies (`numpy`, `Pillow`, CLI libs), and facts about level defaults, bulk processing, and interpolation strategy.
- **Mobile Tech Stack** (`lut_mobile_tech_stack.md`): Captures architecture choice (React Native over Flutter), `@shopify/react-native-skia`, SKSL `RuntimeEffect` shaders, bundled HaldCLUT PNG assets, and the constraint to still-image processing.
- **Rendering Pipeline** (`lut_rendering_pipeline/_index.md`): Details shader limitations (no SKSL 3D sampler), flattened 512×512 HaldCLUT assets, Level-4/Level-8 strategy, and dependency on `tools/cube_to_hald.py` conversion (~30 ms per LUT) to support the GPU pipeline.

## Key Relationship Patterns
- **Tooling → Assets → Runtime**: `tools/cube_to_hald.py` generates HaldCLUTs that the rendering pipeline and mobile stack consume, binding conversion tooling to shader requirements and asset packaging.
- **Framework + Shader Strategy**: React Native + `@shopify/react-native-skia` + SKSL `RuntimeEffect` shaders define the runtime that uses precomputed HaldCLUT PNGs.
- **Asset Choices ↔ Performance**: Level-4 default (~200 KB mobile-friendly) versus Level-8 (~768 KB higher fidelity) dictates both conversion options and rendering pipeline behavior without altering shader logic.