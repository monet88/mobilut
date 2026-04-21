import { useRouter } from 'expo-router';

import { BatchScreen } from '@features/batch';

export default function Batch() {
  const router = useRouter();

  return <BatchScreen onClose={() => router.back()} />;
}
