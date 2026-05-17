# Full Firebase Integration Plan

Most dashboards already read from Firestore. This plan closes the four remaining gaps you selected.

## 1. Real marketer names/emails (not UIDs)

**New helper** `src/lib/users.firestore.ts`:
- `getUserProfile(uid)` — read `users/{uid}` doc
- `getUserProfilesByIds(uids[])` — batched parallel `getDoc` calls, returns `Map<uid, {displayName, email, photoURL}>`

**Updated pages:**
- `seller.marketers.tsx` — after aggregating sales, fetch all unique `marketer_id` profiles in one query, render name + email instead of truncated UID.
- `seller.sales.tsx` — add "Marketer" column with the marketer's name (lookup via same hook).
- `marketer.sales.tsx` — add "Seller" column with seller's name.

**Profile write on signup:** confirm `register.tsx` writes `{ displayName, email, role, createdAt }` to `users/{uid}` — patch if missing fields.

## 2. Editable Settings pages

**New helper** `updateUserProfile(uid, patch)` in `users.firestore.ts` — `updateDoc` on `users/{uid}` with `updated_at: serverTimestamp()`.

**`seller.settings.tsx`** — full form (react-hook-form + zod):
- Display name, store name, store tagline, store logo URL, payout email
- Saved to `users/{uid}` doc
- Also updates Firebase Auth `displayName` via `updateProfile(auth.currentUser, …)`

**`marketer.settings.tsx`** — form:
- Display name, payout email, payout method (PayPal / Bank), payout details (textarea)
- Same write path

Toasts on save; query invalidation for any dashboard reading the profile.

## 3. Realtime dashboards (onSnapshot)

**New hook** `src/hooks/use-firestore-query.ts`:
- `useCollectionSnapshot<T>(queryFactory, deps)` — sets up `onSnapshot`, returns `{data, loading, error}`, auto-unsubscribes.

**Convert these pages from `useQuery` to the realtime hook:**
- `seller.index.tsx` (products + sales)
- `seller.sales.tsx`, `seller.marketers.tsx`, `seller.earnings.tsx`
- `seller.products.tsx`
- `seller.products.$productId.analytics.tsx`
- `marketer.index.tsx`, `marketer.links.tsx`, `marketer.sales.tsx`, `marketer.earnings.tsx`

Marketplace stays on `useQuery` (one-shot list is fine; no need to stream every change).

Result: a sale recorded in another tab/checkout appears in the dashboard within ~1s with no refresh.

## 4. Firebase-backed seller storefront

**New public route** `src/routes/store.$sellerSlug.tsx` (and a fallback `store.$uid.tsx`):
- Reads `users/{uid}` for `store_name`, `store_tagline`, `logo_url`
- Queries `products` where `seller_id == uid && status == 'published'`, ordered by `created_at desc`
- Renders branded header + product grid, each card links to existing `/products/$productId`

**Link from products & marketplace** — clicking the seller name on a product detail jumps to that store.

**Optional slug:** store `store_slug` on the user doc (unique-ish). If empty, fall back to UID in URL.

## Technical notes

- **No schema migration required**; all new fields live on the existing `users` doc as optional keys.
- **Firestore rules update needed** (you apply in Firebase Console):
  ```js
  match /users/{uid} {
    allow read: if true;                                  // public storefront + profile joins
    allow update: if request.auth != null && request.auth.uid == uid;
    allow create: if request.auth != null && request.auth.uid == uid;
  }
  ```
- `getUserProfilesByIds` batches via `Promise.all(getDoc(...))` — Firestore web SDK has no `in` query >30 ids, parallel `getDoc` is simpler and cache-friendly.
- Realtime hook listens on mount and tears down on unmount; query keys still mirror existing ones so mutation invalidations remain a no-op once converted.
- `updateProfile` from `firebase/auth` keeps Auth `displayName` in sync with the Firestore doc.

## Out of scope

- Image upload to Firebase Storage (logos use URL input for now — say the word and I'll add Storage)
- Payouts processing (still a field-only stub)
- Admin role / moderation
- Email notifications
