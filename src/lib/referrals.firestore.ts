import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import type { Product } from "@/lib/products.firestore";

export type ReferralLink = {
  id: string;
  marketer_id: string;
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

export async function listPublishedProducts(): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("status", "==", "published"),
    orderBy("created_at", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }));
}

export async function getPublishedProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", id));
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<Product, "id">;
  if (data.status !== "published") return null;
  return { id: snap.id, ...data };
}

export async function listMyReferralLinks(): Promise<ReferralLink[]> {
  const uid = requireUid();
  const q = query(
    collection(db, "referral_links"),
    where("marketer_id", "==", uid),
    orderBy("created_at", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReferralLink, "id">) }));
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
  return { id: d.id, ...(d.data() as Omit<ReferralLink, "id">) };
}

export async function createReferralLink(product: Product): Promise<ReferralLink> {
  const uid = requireUid();
  const existing = await findMyLinkForProduct(product.id);
  if (existing) return existing;

  const code = genCode();
  const ref = await addDoc(collection(db, "referral_links"), {
    marketer_id: uid,
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
  return { id: ref.id, ...(snap.data() as Omit<ReferralLink, "id">) };
}

export async function getLinkByCode(code: string): Promise<ReferralLink | null> {
  const q = query(collection(db, "referral_links"), where("code", "==", code), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<ReferralLink, "id">) };
}

export async function recordClick(linkId: string): Promise<void> {
  await updateDoc(doc(db, "referral_links", linkId), { clicks: increment(1) });
}

export function buildShareUrl(code: string): string {
  if (typeof window === "undefined") return `/r/${code}`;
  return `${window.location.origin}/r/${code}`;
}
