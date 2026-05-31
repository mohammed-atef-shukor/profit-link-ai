import { useEffect, useState, type DependencyList } from "react";

type Unsubscribe = () => void;

/**
 * Generic hook around Firestore onSnapshot.
 * Pass `enabled: false` (or omit uid from deps) to skip until auth is ready.
 */
export function useFirestoreSubscription<T>(
  subscribe: (next: (data: T) => void, onError: (e: Error) => void) => Unsubscribe,
  deps: DependencyList,
  enabled = true,
): { data: T | undefined; isLoading: boolean; error: Error | null } {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setData(undefined);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribe(
      (d) => {
        setData(d);
        setLoading(false);
      },
      (e) => {
        setError(e);
        setLoading(false);
      },
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return { data, isLoading, error };
}
