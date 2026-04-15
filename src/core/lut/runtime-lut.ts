export type RuntimeLutSource = 'preset' | 'imported' | 'generated';

export interface RuntimeLut {
  readonly id: string;
  readonly source: RuntimeLutSource;
  readonly presetId: string | null;
  readonly haldUri: string | null;
  readonly cpuTableRef: string | null;
}
