import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { EditorScreen } from '@features/editor';

export default function EditorRoute(): React.JSX.Element {
  const { assetId } = useLocalSearchParams<{ assetId: string }>();

  return <EditorScreen assetId={assetId ?? 'unknown'} />;
}
