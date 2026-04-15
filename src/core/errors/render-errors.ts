export class RenderPipelineError extends Error {
  readonly code: string;
  readonly userMessageKey: string;

  constructor(code: string, message: string, userMessageKey: string) {
    super(message);
    this.name = 'RenderPipelineError';
    this.code = code;
    this.userMessageKey = userMessageKey;
  }
}

export const RenderErrors = {
  SHADER_FAILED: (reason: string) =>
    new RenderPipelineError(
      'RENDER_SHADER_FAILED',
      `Shader pipeline failed: ${reason}`,
      'errors.render.shaderFailed',
    ),
  OUT_OF_MEMORY: (bytesRequired: number) =>
    new RenderPipelineError(
      'RENDER_OUT_OF_MEMORY',
      `Render requires ${bytesRequired} bytes which exceeds the memory budget`,
      'errors.render.outOfMemory',
    ),
  EXPORT_FAILED: (reason: string) =>
    new RenderPipelineError(
      'RENDER_EXPORT_FAILED',
      `Render export failed: ${reason}`,
      'errors.render.exportFailed',
    ),
} as const;
