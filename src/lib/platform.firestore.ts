import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
import { fetchPage, type PaginatedResult } from "@/lib/firestore-pagination";

export type PlatformEarning = {
  id: string;
  sale_id: string;
  product_id: string;
  seller_id: string;
  amount: number;
  commission_amount: number;
  created_at: Timestamp | null;
};

function normalizePlatformEarning(id: string, data: Record<string, unknown>): PlatformEarning {
  return {
    id,
    sale_id: String(data.sale_id ?? ""),
    product_id: String(data.product_id ?? ""),
    seller_id: String(data.seller_id ?? ""),
    amount: Number(data.amount) || 0,
    commission_amount: Number(data.commission_amount) || 0,
    created_at: (data.created_at as Timestamp | null) ?? null,
  };
}

export function subscribePlatformEarnings(
  next: (data: PlatformEarning[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const q = query(collection(db, "platform_earnings"), orderBy("created_at", "desc"), limit(50));
  return onSnapshot(
    q,
    (snap) => next(snap.docs.map((d) => normalizePlatformEarning(d.id, d.data()))),
    (e) => onError?.(e as Error),
  );
}

export async function fetchPlatformEarningsPage(
  pageSize: number,
  cursor: DocumentSnapshot | null,
): Promise<PaginatedResult<PlatformEarning>> {
  return fetchPage(
    collection(db, "platform_earnings"),
    [orderBy("created_at", "desc")],
    cursor,
    pageSize,
    normalizePlatformEarning,
  );
}

export type CommissionRow = {
  id: string;
  amount: number;
  sale_id: string;
  status: string;
  created_at: Timestamp | null;
};

function normalizeCommission(id: string, data: Record<string, unknown>): CommissionRow {
  return {
    id,
    amount: Number(data.amount) || 0,
    sale_id: String(data.sale_id ?? ""),
    status: String(data.status ?? "completed"),
    created_at: (data.created_at as Timestamp | null) ?? null,
  };
}

export async function fetchMarketerCommissionsPage(
  marketerId: string,
  pageSize: number,
  cursor: DocumentSnapshot | null,
): Promise<PaginatedResult<CommissionRow>> {
  return fetchPage(
    collection(db, "commissions"),
    [where("marketer_id", "==", marketerId), orderBy("created_at", "desc")],
    cursor,
    pageSize,
    normalizeCommission,
  );
}
