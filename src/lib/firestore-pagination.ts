import {
  getDocs,
  limit,
  query,
  startAfter,
  type CollectionReference,
  type DocumentSnapshot,
  type QueryConstraint,
} from "firebase/firestore";

export const DEFAULT_PAGE_SIZE = 10;
export const MARKETPLACE_PAGE_SIZE = 12;
export const RECENT_PREVIEW_LIMIT = 5;
export const ANALYTICS_SAMPLE_LIMIT = 100;

export type PaginatedResult<T> = {
  items: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
};

export async function fetchPage<T>(
  col: CollectionReference,
  constraints: QueryConstraint[],
  cursor: DocumentSnapshot | null,
  pageSize: number,
  mapDoc: (id: string, data: Record<string, unknown>) => T,
): Promise<PaginatedResult<T>> {
  const pageConstraints: QueryConstraint[] = [...constraints];
  if (cursor) pageConstraints.push(startAfter(cursor));
  pageConstraints.push(limit(pageSize + 1));

  const snap = await getDocs(query(col, ...pageConstraints));
  const docs = snap.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    items: pageDocs.map((d) => mapDoc(d.id, d.data())),
    lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  };
}
