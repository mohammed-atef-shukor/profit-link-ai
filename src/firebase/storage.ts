import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirebaseApp } from "./config";
import { getFirebaseAuth } from "./auth";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

let _storage: FirebaseStorage | undefined;

export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(getFirebaseApp());
  return _storage;
}

export type UploadProgressHandler = (progress: number) => void;

/** Validate file before upload (type + size). */
export function validateImageFile(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }
}

/** Validate store logo before upload (PNG, JPG/JPEG, WebP — max 5 MB). */
export function validateLogoFile(file: File): void {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new Error("Only PNG, JPG, JPEG, and WebP logos are allowed.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Logo must be 5 MB or smaller.");
  }
}

function fileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

function requireUid(): string {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

/** Refresh auth token before Storage writes (avoids permission-denied races). */
async function ensureStorageAuth(): Promise<string> {
  const user = getFirebaseAuth().currentUser;
  if (!user?.uid) throw new Error("Not signed in");
  await user.getIdToken();
  return user.uid;
}

function resolveImageContentType(file: File): string {
  if (file.type.startsWith("image/")) return file.type;
  const ext = fileExtension(file);
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

async function uploadToPath(
  storagePath: string,
  file: File,
  onProgress?: UploadProgressHandler,
  validate: (file: File) => void = validateImageFile,
): Promise<string> {
  validate(file);
  await ensureStorageAuth();
  const contentType = resolveImageContentType(file);
  const storageRef = ref(getFirebaseStorage(), storagePath);
  const task = uploadBytesResumable(storageRef, file, { contentType });

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      reject,
      async () => {
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (e) {
          reject(e);
        }
      },
    );
  });
}

/**
 * Upload a file to Firebase Storage under `users/{uid}/{path}`.
 * Returns the public download URL.
 */
export async function uploadUserFile(
  path: string,
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<string> {
  const uid = requireUid();
  return uploadToPath(`users/${uid}/${path}`, file, onProgress);
}

/**
 * Upload a product cover before the Firestore doc exists.
 * Path: products/{userId}/pending-{id}/cover.{ext}
 */
export async function uploadPendingProductImage(
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<{ url: string; path: string }> {
  const uid = requireUid();
  const pendingId = crypto.randomUUID();
  const ext = fileExtension(file);
  const path = `products/${uid}/pending-${pendingId}/cover.${ext}`;

  try {
    const url = await uploadToPath(path, file, onProgress);
    return { url, path };
  } catch (error) {
    try {
      await deleteObject(ref(getFirebaseStorage(), path));
    } catch {
      // Best-effort cleanup on failed upload.
    }
    throw error;
  }
}

/**
 * Upload a product cover image for an existing product.
 * Path: products/{userId}/{productId}/cover.{ext}
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<{ url: string; path: string }> {
  const uid = requireUid();
  const ext = fileExtension(file);
  const path = `products/${uid}/${productId}/cover.${ext}`;

  try {
    const url = await uploadToPath(path, file, onProgress);
    return { url, path };
  } catch (error) {
    try {
      await deleteObject(ref(getFirebaseStorage(), path));
    } catch {
      // Best-effort cleanup on failed upload.
    }
    throw error;
  }
}

/** Delete a file from Firebase Storage using its full storage path. */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  await deleteObject(ref(getFirebaseStorage(), storagePath));
}

/** @deprecated Use deleteStorageFile */
export async function deleteProductImage(storagePath: string): Promise<void> {
  await deleteStorageFile(storagePath);
}

/**
 * Upload or replace a seller store logo.
 * Path: store-logos/{userId}/logo.{ext}
 */
export async function uploadStoreLogo(
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<{ url: string; path: string }> {
  const uid = await ensureStorageAuth();
  const ext = fileExtension(file);
  const normalizedExt = ext === "jpeg" ? "jpg" : ext;
  const path = `store-logos/${uid}/logo.${normalizedExt}`;

  try {
    const url = await uploadToPath(path, file, onProgress, validateLogoFile);
    return { url, path };
  } catch (error) {
    try {
      await deleteStorageFile(path);
    } catch {
      // Best-effort cleanup on failed upload.
    }
    throw error;
  }
}

/** Remove a store logo from Storage. */
export async function deleteStoreLogo(storagePath: string): Promise<void> {
  await ensureStorageAuth();
  await deleteStorageFile(storagePath);
}

/** Delete a file from Firebase Storage under `users/{uid}/{path}`. */
export async function deleteUserFile(path: string): Promise<void> {
  const uid = requireUid();
  await deleteObject(ref(getFirebaseStorage(), `users/${uid}/${path}`));
}
