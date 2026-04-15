"""
Convert Adobe .cube LUT files to HaldCLUT PNG format.
Usage:
  python cube_to_hald.py input.cube output.png [level]
  python cube_to_hald.py ./luts/ ./output/ [level]   # bulk convert folder

Level: 4 = 256x256 (~200KB, fast), 8 = 512x512 (~768KB, higher quality)
Default level: 4 (recommended for mobile apps)
"""

import numpy as np
from PIL import Image
import sys
import os
import glob
import time


def parse_cube(filepath):
    """Parse an Adobe .cube 3D LUT file."""
    lut_size = None
    lut_data = []

    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.upper().startswith("LUT_3D_SIZE"):
                lut_size = int(line.split()[-1])
            elif line.upper().startswith(("TITLE", "DOMAIN_MIN", "DOMAIN_MAX", "LUT_1D")):
                continue
            else:
                parts = line.split()
                if len(parts) >= 3:
                    try:
                        r, g, b = float(parts[0]), float(parts[1]), float(parts[2])
                        lut_data.append((r, g, b))
                    except ValueError:
                        continue

    if lut_size is None:
        raise ValueError(f"LUT_3D_SIZE not found in: {filepath}")
    if len(lut_data) < lut_size**3:
        raise ValueError(f"Expected {lut_size**3} entries, got {len(lut_data)} in: {filepath}")

    # .cube format: R changes fastest (inner), B slowest (outer)
    # flat_index = r + g*N + b*N*N  →  reshape gives lut[b][g][r]
    arr = np.array(lut_data[:lut_size**3], dtype=np.float32)
    lut = arr.reshape(lut_size, lut_size, lut_size, 3)  # [b_idx, g_idx, r_idx, channel]
    return lut_size, lut


def cube_to_haldclut(cube_path, output_path, hald_level=4):
    """
    Convert .cube file to HaldCLUT PNG.
    hald_level 4  → image 256x256  (cube_size = 16 per channel)
    hald_level 8  → image 512x512  (cube_size = 64 per channel)
    """
    cube_size = hald_level * hald_level        # entries per channel in HaldCLUT
    img_size  = hald_level * hald_level * hald_level  # image width = height

    lut_n, lut = parse_cube(cube_path)

    # Build all (r_in, g_in, b_in) for every HaldCLUT pixel — vectorized
    total_pixels = img_size * img_size          # e.g. 65536 for level-4
    p = np.arange(total_pixels, dtype=np.int32)

    r_idx = p % cube_size                       # 0..cube_size-1
    g_idx = (p // cube_size) % cube_size
    b_idx = p // (cube_size * cube_size)

    # Normalize to 0..1
    r_in = r_idx.astype(np.float32) / (cube_size - 1)
    g_in = g_idx.astype(np.float32) / (cube_size - 1)
    b_in = b_idx.astype(np.float32) / (cube_size - 1)

    # Map to LUT float indices (0..lut_n-1)
    n = lut_n - 1
    rf = r_in * n
    gf = g_in * n
    bf = b_in * n

    r0 = np.clip(rf.astype(np.int32), 0, n - 1)
    g0 = np.clip(gf.astype(np.int32), 0, n - 1)
    b0 = np.clip(bf.astype(np.int32), 0, n - 1)
    r1 = np.minimum(r0 + 1, n)
    g1 = np.minimum(g0 + 1, n)
    b1 = np.minimum(b0 + 1, n)

    dr = (rf - r0)[:, None]   # shape (P, 1) for broadcast
    dg = (gf - g0)[:, None]
    db = (bf - b0)[:, None]

    # Trilinear interpolation — lut is [b, g, r, ch]
    out = (
        lut[b0, g0, r0] * (1 - dr) * (1 - dg) * (1 - db) +
        lut[b0, g0, r1] * dr       * (1 - dg) * (1 - db) +
        lut[b0, g1, r0] * (1 - dr) * dg       * (1 - db) +
        lut[b0, g1, r1] * dr       * dg       * (1 - db) +
        lut[b1, g0, r0] * (1 - dr) * (1 - dg) * db +
        lut[b1, g0, r1] * dr       * (1 - dg) * db +
        lut[b1, g1, r0] * (1 - dr) * dg       * db +
        lut[b1, g1, r1] * dr       * dg       * db
    )

    pixels_rgb = np.clip(out * 255, 0, 255).astype(np.uint8)
    img_data = pixels_rgb.reshape(img_size, img_size, 3)
    Image.fromarray(img_data, "RGB").save(output_path)


def convert_folder(input_dir, output_dir, hald_level=4):
    """Bulk convert all .cube files in a folder."""
    os.makedirs(output_dir, exist_ok=True)
    cubes = glob.glob(os.path.join(input_dir, "*.cube")) + \
            glob.glob(os.path.join(input_dir, "*.CUBE"))

    if not cubes:
        print(f"No .cube files found in: {input_dir}")
        return

    print(f"Converting {len(cubes)} files → HaldCLUT level {hald_level} "
          f"({hald_level**3}x{hald_level**3}px)...")

    ok, fail = 0, 0
    for cube_path in sorted(cubes):
        name = os.path.splitext(os.path.basename(cube_path))[0]
        out_path = os.path.join(output_dir, name + ".png")
        t0 = time.time()
        try:
            cube_to_haldclut(cube_path, out_path, hald_level)
            ms = int((time.time() - t0) * 1000)
            print(f"  ✓ {name}.png  ({ms}ms)")
            ok += 1
        except Exception as e:
            print(f"  ✗ {name}: {e}")
            fail += 1

    print(f"\nDone: {ok} converted, {fail} failed → {output_dir}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    src   = sys.argv[1]
    dst   = sys.argv[2]
    level = int(sys.argv[3]) if len(sys.argv) > 3 else 4

    if os.path.isdir(src):
        convert_folder(src, dst, level)
    elif src.lower().endswith(".cube"):
        os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
        t0 = time.time()
        cube_to_haldclut(src, dst, level)
        print(f"Done: {dst}  ({int((time.time()-t0)*1000)}ms)")
    else:
        print("Input must be a .cube file or folder containing .cube files.")
        sys.exit(1)
