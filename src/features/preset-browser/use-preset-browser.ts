import { useEffect, useState } from 'react';

import type { PresetCatalog } from '@core/lut/preset-model';
import {
  getPresetsByCategory,
  getUniqueCategories,
  loadPresetCatalog,
} from '@services/lut/lut-library.service';

const EMPTY_CATALOG: PresetCatalog = {
  version: 1,
  presets: [],
};

export function usePresetBrowser() {
  const [catalog, setCatalog] = useState<PresetCatalog>(EMPTY_CATALOG);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    loadPresetCatalog().then((nextCatalog) => {
      if (!isMounted) {
        return;
      }

      setCatalog(nextCatalog);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const presets = getPresetsByCategory(catalog, selectedCategory);
  const categories = getUniqueCategories(catalog);

  return {
    presets,
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedPresetId,
    setSelectedPresetId,
    isLoading,
  };
}
