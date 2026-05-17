import { useEffect, useState, type DependencyList } from "react";

type Unsubscribe = () => void;

/**
 * Generic hook around Firestore onSnapshot.
 * `subscribe` should call onSnapshot internally and return its unsubscribe fn.
 * Re-subscribes whenever `deps` change.
 */
export function useFirestoreSubscription<T>(
  subscribe: (next: (data: T) => void, onError: (e: Error) => void) => Unsubscribe,
  deps: DependencyList,
): { data: T | undefined; isLoading: boolean; error: Error | null } {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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
  }, deps);

  return { data, isLoading, error };
}
