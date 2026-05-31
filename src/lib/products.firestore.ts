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
  limit,
  serverTimestamp,
  Timestamp,
  type DocumentSnapshot,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/firebase";
import { getFirebaseAuth } from "@/firebase/auth";
import { fetchPage, type PaginatedResult } from "@/lib/firestore-pagination";
import {
  deleteProductImage,
  uploadPendingProductImage,
  uploadProductImage,
  type UploadProgressHandler,
} from "@/firebase/storage";

export type ProductStatus = "draft" | "published";

export const PRODUCT_CATEGORIES = [
  "Software & SaaS",
  "Courses & Education",
  "Digital Downloads",
  "Physical Products",
  "Services",
  "Marketing & Tools",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type Product = {
  id: string;
  seller_id: string;
  seller_name?: string | null;
  title: string;
  description: string | null;
  price: number;
  commission_percent: number;
  image_url: string | null;
  storage_path?: string | null;
  category: string;
  discount_percent?: number | null;
  status: ProductStatus;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
};

const productsCol = () => collection(db, "products");

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function requireUid(): string {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

export function normalizeProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    seller_id: String(data.seller_id ?? ""),
    seller_name: (data.seller_name as string | null) ?? null,
    title: String(data.title ?? "Untitled product"),
    description: (data.description as string | null) ?? null,
    price: toFiniteNumber(data.price, 0),
    commission_percent: toFiniteNumber(data.commission_percent, 0),
    image_url: (data.image_url as string | null) ?? null,
    storage_path: (data.storage_path as string | null) ?? null,
    category: String(data.category ?? "Other"),
    discount_percent:
      data.discount_percent == null || data.discount_percent === ""
        ? null
        : toFiniteNumber(data.discount_percent, 0),
    status: data.status === "published" ? "published" : "draft",
    created_at: (data.created_at as Timestamp | null) ?? null,
    updated_at: (data.updated_at as Timestamp | null) ?? null,
  };
}

export async function listMyProducts(): Promise<Product[]> {
  const uid = requireUid();
  const q = query(productsCol(), where("seller_id", "==", uid), orderBy("created_at", "desc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeProduct(d.id, d.data()));
}

export async function fetchMyProductsPage(
  pageSize: number,
  cursor: DocumentSnapshot | null,
): Promise<PaginatedResult<Product>> {
  const uid = requireUid();
  return fetchPage(
    productsCol(),
    [where("seller_id", "==", uid), orderBy("created_at", "desc")],
    cursor,
    pageSize,
    normalizeProduct,
  );
}

export async function fetchRecentMyProducts(limitCount: number): Promise<Product[]> {
  const uid = requireUid();
  const q = query(
    productsCol(),
    where("seller_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeProduct(d.id, d.data()));
}

export type PublishedProductSort = "newest" | "commission" | "price";

function publishedProductsConstraints(sort: PublishedProductSort): QueryConstraint[] {
  const base: QueryConstraint[] = [where("status", "==", "published")];
  if (sort === "commission") return [...base, orderBy("commission_percent", "desc"), orderBy("created_at", "desc")];
  if (sort === "price") return [...base, orderBy("price", "asc"), orderBy("created_at", "desc")];
  return [...base, orderBy("created_at", "desc")];
}

export async function fetchPublishedProductsPage(
  pageSize: number,
  cursor: DocumentSnapshot | null,
  sort: PublishedProductSort = "newest",
): Promise<PaginatedResult<Product>> {
  return fetchPage(
    productsCol(),
    publishedProductsConstraints(sort),
    cursor,
    pageSize,
    normalizeProduct,
  );
}

export async function fetchPublishedProductsBySellerPage(
  sellerId: string,
  pageSize: number,
  cursor: DocumentSnapshot | null,
): Promise<PaginatedResult<Product>> {
  return fetchPage(
    productsCol(),
    [where("seller_id", "==", sellerId), where("status", "==", "published"), orderBy("created_at", "desc")],
    cursor,
    pageSize,
    normalizeProduct,
  );
}

export async function getProduct(id: string): Promise<Product | null> {
  const uid = requireUid();
  const snap = await getDoc(doc(db, "products", id));
  if (!snap.exists()) return null;
  const product = normalizeProduct(snap.id, snap.data());
  if (product.seller_id !== uid) return null;
  return product;
}

export type ProductInput = {
  title: string;
  description: string | null;
  price: number;
  commission_percent: number;
  image_url: string | null;
  storage_path?: string | null;
  category: string;
  discount_percent?: number | null;
  status: ProductStatus;
  seller_name?: string | null;
};

function buildProductPayload(uid: string, input: ProductInput) {
  return {
    seller_id: uid,
    seller_name: input.seller_name ?? null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    price: Number(input.price),
    commission_percent: Number(input.commission_percent),
    image_url: input.image_url || null,
    storage_path: input.storage_path ?? null,
    category: input.category.trim() || "Other",
    discount_percent:
      input.discount_percent == null || Number.isNaN(input.discount_percent)
        ? null
        : Number(input.discount_percent),
    status: input.status,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
}

export async function createProduct(input: ProductInput): Promise<string> {
  const uid = requireUid();
  const ref = await addDoc(productsCol(), buildProductPayload(uid, input));
  return ref.id;
}

/** Upload image first (if any), then create product in a single Firestore write. */
export async function createProductWithImage(
  input: ProductInput,
  imageFile?: File | null,
  onProgress?: UploadProgressHandler,
): Promise<string> {
  let uploadedPath: string | null = null;

  try {
    let nextInput = { ...input };

    if (imageFile) {
      const { url, path } = await uploadPendingProductImage(imageFile, onProgress);
      uploadedPath = path;
      nextInput = { ...nextInput, image_url: url, storage_path: path };
    }

    return await createProduct(nextInput);
  } catch (error) {
    if (uploadedPath) {
      try {
        await deleteProductImage(uploadedPath);
      } catch {
        // Best-effort cleanup if Firestore create fails after upload.
      }
    }
    throw error;
  }
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const uid = requireUid();
  const existing = await getProduct(id);
  if (!existing || existing.seller_id !== uid) {
    throw new Error("Product not found or access denied");
  }
  await updateDoc(doc(db, "products", id), {
    seller_name: input.seller_name ?? existing.seller_name ?? null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    price: Number(input.price),
    commission_percent: Number(input.commission_percent),
    image_url: input.image_url || null,
    storage_path: input.storage_path ?? existing.storage_path ?? null,
    category: input.category.trim() || "Other",
    discount_percent:
      input.discount_percent == null || Number.isNaN(input.discount_percent)
        ? null
        : Number(input.discount_percent),
    status: input.status,
    updated_at: serverTimestamp(),
  });

  try {
    await syncReferralLinksForProduct(id, {
      title: input.title.trim(),
      price: Number(input.price),
      commission_percent: Number(input.commission_percent),
    });
  } catch {
    // Product saved; link denorm sync is best-effort.
  }
}

async function syncReferralLinksForProduct(
  productId: string,
  meta: { title: string; price: number; commission_percent: number },
): Promise<void> {
  const q = query(collection(db, "referral_links"), where("product_id", "==", productId));
  const snap = await getDocs(q);
  if (snap.empty) return;

  await Promise.all(
    snap.docs.map((d) =>
      updateDoc(doc(db, "referral_links", d.id), {
        product_title: meta.title,
        product_price: Number(meta.price),
        commission_percent: Number(meta.commission_percent),
      }),
    ),
  );
}

export async function updateProductWithImage(
  id: string,
  input: ProductInput,
  imageFile?: File | null,
  onProgress?: UploadProgressHandler,
): Promise<void> {
  const existing = await getProduct(id);
  if (!existing) throw new Error("Product not found or access denied");

  let nextInput = { ...input };
  let newUploadPath: string | null = null;
  let oldStorageToDelete: string | null = null;
  let oldStorageToCleanupNow: string | null = null;

  if (imageFile) {
    const { url, path } = await uploadProductImage(id, imageFile, onProgress);
    newUploadPath = path;
    oldStorageToDelete = existing.storage_path && existing.storage_path !== path ? existing.storage_path : null;
    nextInput = { ...nextInput, image_url: url, storage_path: path };
  } else {
    const rawImage = input.image_url?.trim() || "";
    const isStorageImage = rawImage.includes("firebasestorage.googleapis.com") || rawImage.includes("firebasestorage.app");
    if (!rawImage) {
      nextInput = { ...nextInput, image_url: null, storage_path: null };
      oldStorageToCleanupNow = existing.storage_path ?? null;
    } else if (!isStorageImage) {
      nextInput = { ...nextInput, image_url: rawImage, storage_path: null };
      oldStorageToCleanupNow = existing.storage_path ?? null;
    }
  }

  try {
    await updateProduct(id, nextInput);
  } catch (error) {
    if (newUploadPath) {
      try {
        await deleteProductImage(newUploadPath);
      } catch {
        // Best-effort rollback if Firestore update fails after upload.
      }
    }
    throw error;
  }

  if (oldStorageToDelete) {
    try {
      await deleteProductImage(oldStorageToDelete);
    } catch {
      // Old image cleanup is best-effort after Firestore success.
    }
  }

  if (oldStorageToCleanupNow) {
    try {
      await deleteProductImage(oldStorageToCleanupNow);
    } catch {
      // Best-effort cleanup when switching to external/no image.
    }
  }
}

export async function setProductStatus(id: string, status: ProductStatus): Promise<void> {
  const uid = requireUid();
  const existing = await getProduct(id);
  if (!existing || existing.seller_id !== uid) {
    throw new Error("Product not found or access denied");
  }
  await updateDoc(doc(db, "products", id), { status, updated_at: serverTimestamp() });
}

export async function deleteProduct(id: string): Promise<void> {
  const uid = requireUid();
  const existing = await getProduct(id);
  if (!existing || existing.seller_id !== uid) {
    throw new Error("Product not found or access denied");
  }

  if (existing.storage_path) {
    try {
      await deleteProductImage(existing.storage_path);
    } catch {
      // Continue deleting Firestore doc even if storage cleanup fails.
    }
  }

  await deleteDoc(doc(db, "products", id));
}

export function subscribeMyProducts(
  next: (data: Product[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) {
    next([]);
    return () => {};
  }
  const q = query(productsCol(), where("seller_id", "==", uid), orderBy("created_at", "desc"));
  return onSnapshot(
    q,
    (snap) => next(snap.docs.map((d) => normalizeProduct(d.id, d.data()))),
    (e) => onError?.(e as Error),
  );
}

function publishedProductsBySellerQuery(sellerId: string) {
  return query(
    productsCol(),
    where("seller_id", "==", sellerId),
    where("status", "==", "published"),
    orderBy("created_at", "desc"),
  );
}

export async function listPublishedProductsBySeller(sellerId: string): Promise<Product[]> {
  const snap = await getDocs(publishedProductsBySellerQuery(sellerId));
  return snap.docs.map((d) => normalizeProduct(d.id, d.data()));
}

export function subscribePublishedProductsBySeller(
  sellerId: string,
  next: (data: Product[]) => void,
  onError?: (e: Error) => void,
): () => void {
  return onSnapshot(
    publishedProductsBySellerQuery(sellerId),
    (snap) => next(snap.docs.map((d) => normalizeProduct(d.id, d.data()))),
    (e) => onError?.(e as Error),
  );
}
