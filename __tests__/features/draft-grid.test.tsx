import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { DraftGrid } from '@features/home/draft-grid';

const draftSummary = {
  assetId: 'asset-1',
  assetUri: 'file:///draft.jpg',
  previewUri: 'file:///draft.jpg',
  createdAt: 1,
  updatedAt: 2,
};

describe('DraftGrid', () => {
  it('stops propagation when the delete button is pressed', () => {
    const onDraftPress = jest.fn();
    const onDeleteDraft = jest.fn();
    const stopPropagation = jest.fn();

    const screen = render(
      <DraftGrid
        drafts={[draftSummary]}
        onDraftPress={onDraftPress}
        onDeleteDraft={onDeleteDraft}
      />,
    );

    fireEvent(screen.getByLabelText('Delete asset-1'), 'press', { stopPropagation });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onDeleteDraft).toHaveBeenCalledWith('asset-1');
    expect(onDraftPress).not.toHaveBeenCalled();
  });
});
