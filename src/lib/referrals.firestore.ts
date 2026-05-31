import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
  type DocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import { fetchPage, type PaginatedResult } from "@/lib/firestore-pagination";
import { normalizeProduct, type Product } from "@/lib/products.firestore";

export type ReferralLink = {
  id: string;
  marketer_id: string;
  seller_id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  commission_percent: number;
  code: string;
  clicks: number;
  sales: number;
  commissions: number;
  created_at: Timestamp | null;
};

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

function genCode(len = 8): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Normalize Firestore payloads so UI never crashes on missing numeric fields. */
export function normalizeReferralLink(id: string, data: Record<string, unknown>): ReferralLink {
  return {
    id,
    marketer_id: String(data.marketer_id ?? ""),
    seller_id: String(data.seller_id ?? ""),
    product_id: String(data.product_id ?? ""),
    product_title: String(data.product_title ?? "Untitled product"),
    product_price: toNumber(data.product_price),
    commission_percent: toNumber(data.commission_percent),
    code: String(data.code ?? ""),
    clicks: toNumber(data.clicks),
    sales: toNumber(data.sales),
    commissions: toNumber(data.commissions),
    created_at: (data.created_at as Timestamp | null) ?? null,
  };
}

function mapReferralDoc(id: string, data: Record<string, unknown>): ReferralLink {
  return normalizeReferralLink(id, data);
}

export async function listPublishedProducts(): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("status", "==", "published"),
    orderBy("created_at", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeProduct(d.id, d.data()));
}

export async function getPublishedProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", id));
  if (!snap.exists()) return null;
  const product = normalizeProduct(snap.id, snap.data());
  if (product.status !== "published") return null;
  return product;
}

export async function listMyReferralLinks(): Promise<ReferralLink[]> {
  const uid = requireUid();
  const q = query(
    collection(db, "referral_links"),
    where("marketer_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapReferralDoc(d.id, d.data()));
}

export async function fetchMyReferralLinksPage(
  pageSize: number,
  cursor: DocumentSnapshot | null,
): Promise<PaginatedResult<ReferralLink>> {
  const uid = requireUid();
  return fetchPage(
    collection(db, "referral_links"),
    [where("marketer_id", "==", uid), orderBy("created_at", "desc")],
    cursor,
    pageSize,
    mapReferralDoc,
  );
}

export async function fetchReferralLinksForSellerPage(
  sellerId: string,
  pageSize: number,
  cursor: DocumentSnapshot | null,
): Promise<PaginatedResult<ReferralLink>> {
  return fetchPage(
    collection(db, "referral_links"),
    [where("seller_id", "==", sellerId), orderBy("created_at", "desc")],
    cursor,
    pageSize,
    mapReferralDoc,
  );
}

export async function fetchReferralLinksSampleForSeller(
  sellerId: string,
  limitCount: number,
): Promise<ReferralLink[]> {
  const q = query(
    collection(db, "referral_links"),
    where("seller_id", "==", sellerId),
    orderBy("created_at", "desc"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapReferralDoc(d.id, d.data()));
}

export async function fetchTopMyReferralLinks(limitCount: number): Promise<ReferralLink[]> {
  const uid = requireUid();
  const q = query(
    collection(db, "referral_links"),
    where("marketer_id", "==", uid),
    orderBy("commissions", "desc"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapReferralDoc(d.id, d.data()));
}

export async function findMyLinkForProduct(productId: string): Promise<ReferralLink | null> {
  const uid = requireUid();
  const q = query(
    collection(db, "referral_links"),
    where("marketer_id", "==", uid),
    where("product_id", "==", productId),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapReferralDoc(d.id, d.data());
}

export async function createReferralLink(product: Product): Promise<ReferralLink> {
  const uid = requireUid();
  const existing = await findMyLinkForProduct(product.id);
  if (existing) return existing;

  const code = genCode();
  const ref = await addDoc(collection(db, "referral_links"), {
    marketer_id: uid,
    seller_id: product.seller_id,
    product_id: product.id,
    product_title: product.title,
    product_price: Number(product.price),
    commission_percent: Number(product.commission_percent),
    code,
    clicks: 0,
    sales: 0,
    commissions: 0,
    created_at: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return mapReferralDoc(ref.id, snap.data() ?? {});
}

export async function getLinkByCode(code: string): Promise<ReferralLink | null> {
  const q = query(collection(db, "referral_links"), where("code", "==", code), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapReferralDoc(d.id, d.data());
}

export async function recordClick(linkId: string): Promise<void> {
  await updateDoc(doc(db, "referral_links", linkId), { clicks: increment(1) });
}

export function buildShareUrl(code: string): string {
  if (typeof window === "undefined") return `/r/${code}`;
  return `${window.location.origin}/r/${code}`;
}

/** Live referral links promoting this seller's products (by seller_id + legacy product_id fallback). */
export function subscribeReferralLinksForSeller(
  sellerId: string,
  productIds: string[],
  next: (data: ReferralLink[]) => void,
  onError?: (e: Error) => void,
): () => void {
  if (!sellerId) {
    next([]);
    return () => {};
  }

  const bySellerQuery = new Map<string, ReferralLink>();
  const byProductQuery = new Map<string, ReferralLink>();

  const emit = () => {
    const merged = new Map<string, ReferralLink>(bySellerQuery);
    for (const [id, link] of byProductQuery) {
      if (!link.seller_id || link.seller_id === sellerId) {
        merged.set(id, link);
      }
    }
    next(Array.from(merged.values()));
  };

  const qSeller = query(
    collection(db, "referral_links"),
    where("seller_id", "==", sellerId),
    orderBy("created_at", "desc"),
  );

  const unsubs: Array<() => void> = [
    onSnapshot(
      qSeller,
      (snap) => {
        bySellerQuery.clear();
        for (const d of snap.docs) {
          bySellerQuery.set(d.id, mapReferralDoc(d.id, d.data()));
        }
        emit();
      },
      (e) => onError?.(e as Error),
    ),
  ];

  const ids = [...new Set(productIds.filter(Boolean))].slice(0, 30);
  if (ids.length > 0) {
    const qByProduct = query(
      collection(db, "referral_links"),
      where("product_id", "in", ids),
      orderBy("created_at", "desc"),
    );
    unsubs.push(
      onSnapshot(
        qByProduct,
        (snap) => {
          byProductQuery.clear();
          for (const d of snap.docs) {
            byProductQuery.set(d.id, mapReferralDoc(d.id, d.data()));
          }
          emit();
        },
        (e) => onError?.(e as Error),
      ),
    );
  }

  return () => unsubs.forEach((u) => u());
}

export function subscribeMyReferralLinks(
  next: (data: ReferralLink[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    // Auth still initializing — return empty data, not an error.
    next([]);
    return () => {};
  }
  const q = query(
    collection(db, "referral_links"),
    where("marketer_id", "==", uid),
    orderBy("created_at", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => next(snap.docs.map((d) => mapReferralDoc(d.id, d.data()))),
    (e) => onError?.(e as Error),
  );
}
