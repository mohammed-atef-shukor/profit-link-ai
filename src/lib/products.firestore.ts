import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";

export type ProductStatus = "draft" | "published";

export type Product = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  commission_percent: number;
  image_url: string | null;
  status: ProductStatus;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
};

const productsCol = () => collection(db, "products");

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

export async function listMyProducts(): Promise<Product[]> {
  const uid = requireUid();
  const q = query(productsCol(), where("seller_id", "==", uid), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }));
}

export async function getProduct(id: string): Promise<Product | null> {
  const uid = requireUid();
  const snap = await getDoc(doc(db, "products", id));
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<Product, "id">;
  if (data.seller_id !== uid) return null;
  return { id: snap.id, ...data };
}

export type ProductInput = {
  title: string;
  description: string | null;
  price: number;
  commission_percent: number;
  image_url: string | null;
  status: ProductStatus;
};

export async function createProduct(input: ProductInput): Promise<string> {
  const uid = requireUid();
  const ref = await addDoc(productsCol(), {
    seller_id: uid,
    title: input.title,
    description: input.description || null,
    price: input.price,
    commission_percent: input.commission_percent,
    image_url: input.image_url || null,
    status: input.status,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  requireUid();
  await updateDoc(doc(db, "products", id), {
    title: input.title,
    description: input.description || null,
    price: input.price,
    commission_percent: input.commission_percent,
    image_url: input.image_url || null,
    status: input.status,
    updated_at: serverTimestamp(),
  });
}

export async function setProductStatus(id: string, status: ProductStatus): Promise<void> {
  requireUid();
  await updateDoc(doc(db, "products", id), { status, updated_at: serverTimestamp() });
}

export async function deleteProduct(id: string): Promise<void> {
  requireUid();
  await deleteDoc(doc(db, "products", id));
}

export function subscribeMyProducts(
  next: (data: Product[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    onError?.(new Error("Not signed in"));
    return () => {};
  }
  const q = query(productsCol(), where("seller_id", "==", uid), orderBy("created_at", "desc"));
  return onSnapshot(
    q,
    (snap) => next(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }))),
    (e) => onError?.(e as Error),
  );
}

export function subscribePublishedProductsBySeller(
  sellerId: string,
  next: (data: Product[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const q = query(
    productsCol(),
    where("seller_id", "==", sellerId),
    where("status", "==", "published"),
    orderBy("created_at", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => next(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }))),
    (e) => onError?.(e as Error),
  );
}
