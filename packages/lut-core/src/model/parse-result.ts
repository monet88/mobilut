export type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ValidationError };

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

export function ok<T>(value: T): ParseResult<T> {
  return { ok: true, value };
}

export function err(
  code: string,
  message: string,
  context?: Record<string, unknown>,
): ParseResult<never> {
  return { ok: false, error: { code, message, context } };
}
