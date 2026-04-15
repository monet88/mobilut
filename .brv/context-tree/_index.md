---
children_hash: bc47b75eaefd90d7a971c4164b28dd01b8c7c501553f411e83d69a8d1474edc5
compression_ratio: 0.7969598262757872
condensation_order: 3
covers: [product_strategy/_index.md, technology/_index.md]
covers_token_total: 921
summary_level: d3
token_count: 734
type: summary
---
# Structural Summary (Level d3)

## `product_strategy/lut_pricing_and_branding`
- **Catalog & Licensing**: 200 LUT presets blend licensed contributions (G’MIC Film-LUTs, Pat David’s HaldCLUTs/RawTherapee film sims, Popul-AR assets) with 30 free samples and 170 unlockable assets; see `_index.md` for bundle composition and licensing notes.
- **Monetization Flow**: One-time $2.99 unlock replaces subscriptions, covering curation, licensing, bundle pricing, stylistic renaming, and publication stages documented in `_index.md`.
- **Naming Policy**: Names emphasize mood/style, avoiding brand references (e.g., Kodak/Fuji) to sidestep IP risk; policy rationale and examples reside in `_index.md`.

## `technology/context.md`
- **Domain Purpose & Scope**: Captures long-lived graphics/rendering/LUT tooling decisions for the mobile app under Graphics Engineering ownership, focusing on rendering frameworks, color-transform asset formats, and LUT media handling while excluding unrelated PM/backend choices.

## `technology/graphics/_index.md`
- **Graphics Stack Foundation**: React Native + `@shopify/react-native-skia` with still-image processing anchors shader and media constraints; shaders are SKSL `RuntimeEffect`s without 3D samplers, so runtime depends on precomputed assets.
- **Cube-to-Hald Conversion Tool** (`cube_to_haldclut_conversion_tool.md`): `cube_to_hald.py` CLI parses `.cube` files, builds normalized RGB grids, applies vectorized trilinear interpolation, and writes HaldCLUT PNGs; documents Level-4 defaults versus Level-8 for fidelity and bulk conversion support.
- **Conversion Tools Domain** (`lut_conversion_tools/_index.md`): Maps parsing/interpolation/PNG-writing responsibilities, dependencies (`numpy`, `Pillow`, CLI libs), Level defaults, and the interpolation strategy tying into asset generation.
- **Mobile Tech Stack** (`lut_mobile_tech_stack.md`): Justifies React Native over Flutter, binds to `@shopify/react-native-skia`, SKSL `RuntimeEffect` shaders, bundled HaldCLUT PNGs, and still-image-only processing constraint.
- **Rendering Pipeline** (`lut_rendering_pipeline/_index.md`): Details shader limitations (no SKSL 3D sampler), flattening of 512×512 HaldCLUT assets, Level-4/Level-8 strategy, and dependency on `tools/cube_to_hald.py` (~30 ms per LUT) to supply the GPU pipeline.

## Relationship Patterns
- **Tooling → Assets → Runtime**: `tools/cube_to_hald.py` conversions feed HaldCLUT PNGs consumed by rendering pipeline and mobile stack, ensuring shader requirements drive tooling and asset packaging.
- **Framework + Shader Strategy**: React Native + Skia + SKSL `RuntimeEffect` shaders define the execution environment that relies on precomputed HaldCLUT assets instead of runtime sampling.
- **Asset Choices ↔ Performance**: Default Level-4 (≈200 KB) versus Level-8 (≈768 KB) HaldCLUT outputs influence both conversion tooling options and pipeline behavior without changing shader logic.