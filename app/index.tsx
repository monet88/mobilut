import React from 'react';
import { useRouter } from 'expo-router';

import { HomeScreen } from '@features/home';

export default function IndexRoute(): React.JSX.Element {
  const router = useRouter();

  return (
    <HomeScreen
      onOpenBatch={() => router.push('/batch')}
      onOpenEditor={(assetId) => router.push(`/editor/${encodeURIComponent(assetId)}`)}
      onOpenSettings={() => router.push('/settings')}
    />
  );
}
