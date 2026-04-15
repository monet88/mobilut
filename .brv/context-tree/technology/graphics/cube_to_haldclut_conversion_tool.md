---
title: Cube to HaldCLUT Conversion Tool
tags: []
related: [technology/graphics/lut_rendering_pipeline/mobile_lut_rendering_pipeline.md]
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-04-14T10:18:33.320Z'
updatedAt: '2026-04-14T10:18:33.320Z'
---
## Raw Concept
**Task:**
Document the cube_to_hald.py LUT conversion tool used to produce mobile-friendly HaldCLUT PNGs.

**Changes:**
- Added documentation for single-file conversion path
- Recorded bulk folder conversion workflow and reporting

**Files:**
- tools/cube_to_hald.py

**Flow:**
Invoke CLI with source + destination + optional level → parse .cube LUT entries → build normalized RGB grid → trilinearly interpolate between LUT samples → reshape into hald_level^3 × hald_level^3 image → save PNG (loop for each file when input is folder).

**Timestamp:** 2026-04-14

## Narrative
### Structure
cube_to_hald.py exposes parse_cube, cube_to_haldclut, and convert_folder helpers. parse_cube reads and validates LUT_3D_SIZE before reshaping samples into a numpy array. cube_to_haldclut normalizes HaldCLUT coordinates, maps them to lut indices, and applies trilinear interpolation before writing the resulting RGB grid as a PNG.

### Dependencies
Requires numpy for array math, Pillow (PIL.Image) for PNG output, plus standard libs sys/os/glob/time for CLI handling and logging.

### Highlights
Supports single .cube → PNG conversion with optional level override, bulk folder conversion with per-file success/failure reporting, mobile-friendly default (level 4 ~200KB) and higher-quality level 8 (~768KB).

### Rules
Usage:
  python cube_to_hald.py input.cube output.png [level]
Usage:
  python cube_to_hald.py ./luts/ ./output/ [level]   # bulk convert folder
Level: 4 = 256x256 (~200KB, fast), 8 = 512x512 (~768KB, higher quality)   Default level: 4 (recommended for mobile apps)

### Examples
Example single-file command: python tools/cube_to_hald.py tools/test.cube out/test.png 4

## Facts
- **lut_conversion**: cube_to_hald.py converts Adobe .cube LUT files into HaldCLUT PNG images. [project]
- **hald_level_defaults**: Default HaldCLUT level is 4 (256x256 pixels, ~200KB) and level 8 produces 512x512 (~768KB). [project]
- **bulk_conversion**: Bulk mode scans input folders for .cube or .CUBE files and converts each entry before reporting converted/failed counts. [project]
- **interpolation_strategy**: Trilinear interpolation samples eight surrounding LUT points (r0/r1, g0/g1, b0/b1) to generate each HaldCLUT pixel. [project]
