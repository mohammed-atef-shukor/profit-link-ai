import {
  collection,
  doc,
  addDoc,
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

export type Sale = {
  id: string;
  product_id: string;
  product_title: string;
  seller_id: string;
  marketer_id: string;
  referral_link_id: string;
  referral_code: string;
  buyer_name: string;
  buyer_email: string;
  price: number;
  commission_percent: number;
  commission_amount: number;
  created_at: Timestamp | null;
};

export type RecordSaleInput = {
  product_id: string;
  product_title: string;
  seller_id: string;
  marketer_id: string;
  referral_link_id: string;
  referral_code: string;
  buyer_name: string;
  buyer_email: string;
  price: number;
  commission_percent: number;
};

/**
 * Mock checkout: creates a sale doc and increments the referral link's
 * sales + commissions counters atomically (well, via two writes).
 */
export async function recordSale(input: RecordSaleInput): Promise<string> {
  const commission_amount =
    Math.round(input.price * input.commission_percent) / 100;

  const ref = await addDoc(collection(db, "sales"), {
    ...input,
    commission_amount,
    created_at: serverTimestamp(),
  });

  // Increment referral link aggregates (best-effort).
  try {
    await updateDoc(doc(db, "referral_links", input.referral_link_id), {
      sales: increment(1),
      commissions: increment(commission_amount),
    });
  } catch {
    // rules may briefly reject — sale doc still recorded
  }

  return ref.id;
}

export async function listSalesForSeller(): Promise<Sale[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const q = query(
    collection(db, "sales"),
    where("seller_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sale, "id">) }));
}

export async function listSalesForProduct(productId: string): Promise<Sale[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const q = query(
    collection(db, "sales"),
    where("product_id", "==", productId),
    where("seller_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sale, "id">) }));
}

export async function listLinksForProduct(productId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  // Public list rules apply (get,list allowed). Filter client-side by product.
  const q = query(
    collection(db, "referral_links"),
    where("product_id", "==", productId),
    orderBy("clicks", "desc"),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Array<{
    id: string;
    marketer_id: string;
    code: string;
    clicks: number;
    sales: number;
    commissions: number;
  }>;
}
