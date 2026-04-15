---
title: Mobile LUT Rendering Pipeline
tags: []
related: [technology/graphics/lut_mobile_tech_stack.md]
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-04-14T10:16:36.164Z'
updatedAt: '2026-04-14T10:16:36.164Z'
---
## Raw Concept
**Task:**
Document the LUT rendering workaround for SKSL RuntimeEffect on mobile platforms.

**Changes:**
- Captured the lack of 3D sampler support and the resulting need to flatten cube LUTs.
- Recorded Level-4 vs Level-8 HaldCLUT guidance plus the conversion tooling.

**Files:**
- tools/cube_to_hald.py

**Flow:**
Generate 64x64x64 LUTs, run tools/cube_to_hald.py to produce a 512x512 2D strip PNG, embed the texture with shaders, prefer Level-4 for mobile footprints and Level-8 when quality matters, then compute 2D UVs inside RuntimeEffect for sampling.

## Narrative
### Structure
Because SKSL RuntimeEffect has no 3D sampler, the pipeline flattens the LUT cube into a 512x512 2D strip and packs it with the shader so fragments compute UV offsets and sample the LUT entirely within the 2D texture.

### Dependencies
Mobile assets depend on Level-4 HaldCLUT (64x64 PNG ~30KB) for small download size and on tools/cube_to_hald.py (Python + numpy + Pillow) to convert cube data in roughly 30ms per file, while Level-8 (512x512) textures are produced when higher precision is needed.

### Highlights
This workaround avoids injecting platform-specific 3D sampler extensions, keeps mobile textures compact, and still allows a higher-fidelity Level-8 option without changing the shader sampling code.

## Facts
- **sksl_3d_sampler_support**: SKSL RuntimeEffect lacks native 3D sampler support. [project]
- **lut_encoding**: Encode 64x64x64 LUT as a 512x512 2D strip so RuntimeEffect can sample it. [project]
- **mobile_lut_level4**: Mobile assets rely on Level-4 HaldCLUT (64x64px, ~30KB PNG). [project]
- **lut_level8**: Level-8 (512x512) textures deliver higher fidelity when the budget allows. [project]
- **lut_conversion_tool**: tools/cube_to_hald.py (Python with numpy + Pillow) converts cubes to HaldCLUTs in ~30ms per file. [project]
