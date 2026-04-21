import type { EditState } from '@core/edit-session/edit-state';
import type { History } from '@core/edit-session/history';

export interface DraftSummary {
  readonly assetId: string;
  readonly assetUri: string;
  readonly previewUri: string | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface DraftRecord {
  readonly summary: DraftSummary;
  readonly history: History<EditState>;
}
