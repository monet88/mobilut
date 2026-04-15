---
title: LUT Mobile Tech Stack
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-04-14T10:13:57.687Z'
updatedAt: '2026-04-14T10:13:57.687Z'
---
## Raw Concept
**Task:**
Document the LUT mobile app technology stack and rendering asset decisions.

**Changes:**
- Committed to React Native instead of Flutter for cross-platform parity.
- Integrated @shopify/react-native-skia to render LUTs on the GPU.
- Applied LUTs through an SKSL RuntimeEffect shader for performance.
- Preferred bundling LUTs as HaldCLUT PNG assets instead of .cube files.
- Constraining the app to image processing and leaving video out of scope.

**Flow:**
Choose cross-platform framework -> adopt Skia rendering runtime -> implement SKSL shader LUT application -> bundle HaldCLUT PNG assets -> process images only.

**Timestamp:** 2026-04-14

**Author:** Graphics Engineering Team

## Narrative
### Structure
The LUT experience lives inside a React Native shell that delegates GPU rendering to @shopify/react-native-skia. The SKSL RuntimeEffect shader receives HaldCLUT PNG assets at runtime to apply color transformations without needing .cube parsing logic.

### Dependencies
Depends on the Skia runtime provided by @shopify/react-native-skia and the ability to ship precomputed HaldCLUT PNGs inside the bundle.

### Highlights
React Native avoids Flutter-specific constraints and keeps the UI layer familiar to the mobile team. HaldCLUT PNG assets simplify bundling and distribution. Limiting the app to still images keeps processing predictable and avoids the complexity of video frames.

## Facts
- **framework_choice**: React Native was chosen instead of Flutter for the LUT app technology stack. [project]
- **rendering_library**: The LUT rendering engine relies on @shopify/react-native-skia for GPU-accelerated effects. [project]
- **lut_application**: LUTs are applied through an SKSL RuntimeEffect shader inside the Skia runtime. [project]
- **lut_asset_format**: Bundled LUT assets prefer HaldCLUT PNG files rather than .cube because PNGs are simpler at runtime. [project]
- **media_support**: The mobile app processes only still images and does not support video. [project]
