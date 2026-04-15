---
children_hash: d4b62abd780937d881cf77fa19951a6bc9bde3f6c126261faf384f8c4195f2da
compression_ratio: 0.5201668984700973
condensation_order: 0
covers: [cube_to_hald_conversion_tool.md]
covers_token_total: 719
summary_level: d0
token_count: 374
type: summary
---
### Domain Overview: technology/graphics

- **Cube to Hald Conversion Tool (`cube_to_hald_conversion_tool.md`)**
  - **Purpose & Flow**: `cube_to_hald.py` parses Adobe `.cube` files (skipping headers, enforcing `LUT_3D_SIZE`), reshapes entries into `[b,g,r]` grids, builds a HaldCLUT image (grid size = level²), normalizes values, applies vectorized trilinear interpolation to map coordinates back to LUT indices, clamps results, and saves the PNG; bulk mode repeats this per file while logging duration.
  - **Responsibilities**: `parse_cube` handles validation and reshaping, `cube_to_haldclut` constructs the interpolated HaldCLUT grid and writes PNG using Pillow, and `convert_folder` detects `.cube`/`.CUBE` files, prepares output folders, and reports successes/failures.
  - **Dependencies & Usage**: Requires `numpy` for array math, `Pillow` for PNG output, and standard libs (`sys`, `os`, `glob`, `time`) for CLI handling. Supports single-file CLI (`python cube_to_hald.py input.cube output.png [level]`) and bulk folder conversion (`python cube_to_hald.py ./luts/ ./output/ [level]`), with defaults tuned for mobile (level 4 → 256×256 Hald, ~200KB; optional level 8 → 512×512, ~768KB).
  - **Key Facts**:
    - Defaults to level 4 but accepts level 8 for higher quality mobile assets.
    - Bulk conversion handles every `.cube`/`.CUBE` file, exporting PNGs named after each LUT.
    - Trilinear interpolation across eight surrounding LUT entries drives pixel-level conversion accuracy.