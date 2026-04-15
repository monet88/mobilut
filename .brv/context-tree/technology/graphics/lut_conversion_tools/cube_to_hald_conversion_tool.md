---
title: Cube to Hald Conversion Tool
tags: []
related: [technology/graphics/lut_rendering_pipeline/mobile_lut_rendering_pipeline.md]
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-04-14T10:19:08.417Z'
updatedAt: '2026-04-14T10:19:08.417Z'
---
## Raw Concept
**Task:**
Document the cube_to_hald.py CLI tool that turns Adobe .cube LUT files into HaldCLUT PNG images for the mobile LUT pipeline.

**Changes:**
- Added vectorized trilinear interpolation to map Hald grid coordinates into source LUT values.
- Supported both single-file conversion and bulk folder conversion with explicit output directories.
- Ensured LUT parsing validates LUT_3D_SIZE and ignores header metadata before resizing.

**Files:**
- tools/cube_to_hald.py

**Flow:**
Parse the .cube file while skipping metadata → reshape entries into [b, g, r] cube → build HaldCLUT pixel grid and normalize to 0..1 → convert normalized coordinates to LUT indices and apply trilinear interpolation → clamp to 0..255, reshape into image buffer, and save PNG (repeating the CLI flow for every file when bulk-converting).

**Timestamp:** 2026-04-14

## Narrative
### Structure
cube_to_hald.py keeps three responsibilities: parse_cube reads the Adobe .cube while ignoring headers and enforces LUT_3D_SIZE, cube_to_haldclut builds the HaldCLUT grid (cube_size = level^2) and performs trilinear interpolation before saving with Pillow, and convert_folder discovers .cube/.CUBE files in a directory, creates the output folder, and logs per-file success/failure.

### Dependencies
Requires numpy for restructuring LUT arrays and arithmetic, Pillow (PIL.Image) to write PNG output, plus sys/os/glob/time from the standard library for CLI args, filesystem checks, and timing/logging.

### Highlights
Offers single-file conversion (python cube_to_hald.py input.cube output.png [level]) and bulk conversion (python cube_to_hald.py ./luts/ ./output/ [level]) with a default level of 4 (256x256) plus optional level 8 (512x512). The CLI prints conversion duration per LUT, handles missing .cube files by printing a warning, and ensures outputs keep the same base name with .png extension.

### Rules
Usage:
  python cube_to_hald.py input.cube output.png [level]
  python cube_to_hald.py ./luts/ ./output/ [level]   # bulk convert folder
Level: 4 = 256x256 (~200KB, fast), 8 = 512x512 (~768KB, higher quality)
Default level: 4 (recommended for mobile apps)

## Facts
- **hald_default_level**: Cube_to_hald.py defaults to Hald level 4 (256x256) but accepts level 8 for higher quality. [project]
- **bulk_conversion**: The tool can bulk-convert every .cube or .CUBE file in a folder and saves PNGs named after each LUT into the destination directory. [project]
- **interpolation_method**: Conversion relies on trilinear interpolation across eight surrounding LUT entries for each HaldCLUT pixel. [project]
