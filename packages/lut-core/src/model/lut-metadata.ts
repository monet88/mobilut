export interface LutMetadata {
  readonly title: string;
  readonly size: number;
  readonly domainMin: readonly [number, number, number];
  readonly domainMax: readonly [number, number, number];
  readonly comments: readonly string[];
}

export const DEFAULT_DOMAIN_MIN: readonly [number, number, number] = [0, 0, 0];
export const DEFAULT_DOMAIN_MAX: readonly [number, number, number] = [1, 1, 1];
