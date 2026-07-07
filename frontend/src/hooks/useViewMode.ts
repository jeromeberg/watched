import { useState } from 'react';

export type ViewMode = 'grid' | 'list';

export function useViewMode(key: string, defaultMode: ViewMode = 'grid'): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(`view_${key}`) as ViewMode) ?? defaultMode;
  });

  function set(m: ViewMode) {
    localStorage.setItem(`view_${key}`, m);
    setMode(m);
  }

  return [mode, set];
}
