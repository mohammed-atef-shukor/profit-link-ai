import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentSnapshot } from "firebase/firestore";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/lib/firestore-pagination";

export type PaginatedFetchFn<T> = (
  pageSize: number,
  cursor: DocumentSnapshot | null,
) => Promise<PaginatedResult<T>>;

type Options = {
  pageSize?: number;
  enabled?: boolean;
};

export function useFirestorePagination<T>(
  fetchFn: PaginatedFetchFn<T>,
  deps: readonly unknown[],
  options?: Options,
) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const enabled = options?.enabled ?? true;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasNext, setHasNext] = useState(false);

  const cursorsRef = useRef<(DocumentSnapshot | null)[]>([null]);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  const load = useCallback(
    async (pageIndex: number) => {
      if (!enabled) {
        setItems([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const cursor = cursorsRef.current[pageIndex - 1] ?? null;
        const result = await fetchFn(pageSize, cursor);
        setItems(result.items);
        setHasNext(result.hasMore);
        lastDocRef.current = result.lastDoc;
        setPage(pageIndex);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        setItems([]);
        setHasNext(false);
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, fetchFn, pageSize],
  );

  useEffect(() => {
    cursorsRef.current = [null];
    setPage(1);
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when deps change
  }, [enabled, pageSize, ...deps]);

  const nextPage = useCallback(() => {
    if (!hasNext || !lastDocRef.current) return;
    cursorsRef.current[page] = lastDocRef.current;
    void load(page + 1);
  }, [hasNext, page, load]);

  const prevPage = useCallback(() => {
    if (page <= 1) return;
    void load(page - 1);
  }, [page, load]);

  const reset = useCallback(() => {
    cursorsRef.current = [null];
    void load(1);
  }, [load]);

  const rangeStart = items.length ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = items.length ? rangeStart + items.length - 1 : 0;

  return {
    items,
    page,
    pageSize,
    isLoading,
    error,
    hasNext,
    hasPrev: page > 1,
    nextPage,
    prevPage,
    reset,
    rangeStart,
    rangeEnd,
  };
}
