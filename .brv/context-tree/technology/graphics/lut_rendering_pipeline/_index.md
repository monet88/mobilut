---
children_hash: bfd2c3f84c1a6d271b09a9921575134449087ef24266e29f64eb00956460a956
compression_ratio: 0.41904761904761906
condensation_order: 0
covers: [mobile_lut_rendering_pipeline.md]
covers_token_total: 525
summary_level: d0
token_count: 220
type: summary
---
# Technology / Graphics Overview

- **Mobile LUT Rendering Pipeline** (mobile_lut_rendering_pipeline.md)
  - **Problem**: SKSL `RuntimeEffect` lacks native 3D sampler support, so mobile shaders cannot sample cube LUTs directly.
  - **Solution**: Flatten 64×64×64 LUTs into a 512×512 2D HaldCLUT strip, embed that texture with the shader, and compute per-fragment UV offsets to sample the encoded LUT entirely in 2D.
  - **Assets & Tooling**: Level-4 HaldCLUTs (64×64 PNG, ≈30 KB) minimize download size; Level-8 (512×512) textures provide higher fidelity without shader changes. Conversion uses `tools/cube_to_hald.py` (Python + numpy + Pillow) at ~30 ms per LUT.
  - **Key Fact Preservation**: Explicitly records lack of SKSL 3D sampler, LUT encoding strategy, Level-4/Level-8 options, and conversion tooling, ensuring traceability for implementation or optimization decisions.