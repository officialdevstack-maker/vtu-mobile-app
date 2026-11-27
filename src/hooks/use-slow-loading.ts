import { useEffect, useState } from 'react';

export function useSlowLoading(loading: boolean, afterMs = 8_000): boolean {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const resetTimer = setTimeout(() => setSlow(false), 0);
    if (!loading) return () => clearTimeout(resetTimer);
    const timer = setTimeout(() => setSlow(true), afterMs);
    return () => {
      clearTimeout(resetTimer);
      clearTimeout(timer);
    };
  }, [loading, afterMs]);

  return loading && slow;
}
