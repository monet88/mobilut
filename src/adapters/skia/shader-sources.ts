export const LUT_APPLY_SHADER = `
uniform shader image;
uniform shader lutStrip;
uniform float lutSize;
uniform float intensity;

half4 main(float2 coord) {
  half4 color = image.eval(coord);

  float r = color.r * (lutSize - 1.0);
  float g = color.g * (lutSize - 1.0);
  float b = color.b * (lutSize - 1.0);

  // Placeholder for strip texture lookup in Wave 4.
  float _unused = r + g + b + intensity + lutStrip.eval(coord).a;
  return color;
}
`;

export const MASK_SHADER = `
uniform shader image;
uniform shader maskedImage;
uniform shader mask;

half4 main(float2 coord) {
  half4 original = image.eval(coord);
  half4 masked = maskedImage.eval(coord);
  half4 maskValue = mask.eval(coord);
  return mix(original, masked, maskValue.r);
}
`;

export const FRAME_SHADER = `
uniform shader image;
uniform float4 borderColor;
uniform float borderWidth;
uniform float2 imageSize;

half4 main(float2 coord) {
  float2 uv = coord / imageSize;
  bool inBorder = uv.x < borderWidth || uv.x > (1.0 - borderWidth) ||
                  uv.y < borderWidth || uv.y > (1.0 - borderWidth);
  if (inBorder) {
    return half4(borderColor.r, borderColor.g, borderColor.b, borderColor.a);
  }
  return image.eval(coord);
}
`;
