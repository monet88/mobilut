import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { EditorScreen } from '@features/editor';

export default function EditorRoute(): React.JSX.Element {
  const router = useRouter();
  const { assetId } = useLocalSearchParams<{ assetId: string }>();

  return <EditorScreen assetId={assetId ?? 'unknown'} onClose={() => router.back()} />;
}
