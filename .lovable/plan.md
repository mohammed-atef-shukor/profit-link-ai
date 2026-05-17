
# Firebase Migration Plan

Project: `linkprofit-ai` (Firebase). Replace all Lovable Cloud backend with Firebase Auth + Firestore. Frontend stays on TanStack Start.

## 1. SDK & config
- `bun add firebase`
- New `src/integrations/firebase/client.ts` — initializes app with your config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) and exports `auth`, `db`, `googleProvider`.
- Move config to `.env` as `VITE_FIREBASE_*` for cleanliness.

## 2. Auth (replaces Supabase Auth)
- `src/hooks/use-firebase-auth.ts` — wraps `onAuthStateChanged`, exposes `user`, `loading`, `role`.
- Rewrite:
  - `src/routes/login.tsx` → `signInWithEmailAndPassword` + `signInWithPopup(googleProvider)`
  - `src/routes/register.tsx` → `createUserWithEmailAndPassword`, then write `users/{uid}` doc with `display_name` and `role` (default `marketer`)
  - `src/routes/forgot-password.tsx` → `sendPasswordResetEmail`
  - `src/routes/reset-password.tsx` → `confirmPasswordReset` using `oobCode` from URL
- Remove Lovable broker (`@/integrations/lovable`) calls — Firebase handles Google directly. Your Firebase console must have **Email/Password** and **Google** providers enabled (you do this in Firebase Console → Authentication → Sign-in method).

## 3. Routing guards
- Replace `_authenticated.tsx` `beforeLoad` (Supabase session check) with a Firebase `auth.currentUser` / `authStateReady()` check, redirect to `/login` if absent.
- Drop all `requireSupabaseAuth` middleware. No more server functions for app logic — Firestore SDK runs client-side with security rules.

## 4. Data layer (replaces `products` table + server fns)
- Delete `src/lib/products.functions.ts` and `src/lib/auth.functions.ts`.
- New `src/lib/products.firestore.ts` with: `listMyProducts`, `getProduct`, `createProduct`, `updateProduct`, `setProductStatus`, `deleteProduct` — using `collection`, `query`, `where`, `getDocs`, `addDoc`, `updateDoc`, `deleteDoc`, `serverTimestamp`.
- Update `seller.index.tsx`, `seller.products.new.tsx`, `seller.products.$productId.tsx` to call Firestore helpers via `useQuery` (queryClient still works fine).

## 5. Roles
- Store role on `users/{uid}` doc (`role: 'seller' | 'marketer' | 'admin'`).
- `useRole()` hook reads it once on auth change.
- Dashboard route uses it to redirect to `/seller` or `/marketer`.

## 6. Cleanup
- Remove `src/start.ts` `attachSupabaseAuth` middleware registration.
- Keep `@/integrations/supabase/*` files (auto-generated, harmless if unused) but stop importing them from feature code. **Don't disable Lovable Cloud** — the platform still needs the scaffold.
- Update root layout: drop Supabase `onAuthStateChange` listener, add Firebase equivalent that calls `router.invalidate()` + `queryClient.invalidateQueries()`.

## 7. Things you must do in Firebase Console (I can't)
1. Authentication → Sign-in method → enable **Email/Password** and **Google**.
2. Authentication → Settings → Authorized domains → add your Lovable preview domain (`id-preview--aeb3924c-3eb1-4ef9-9c69-c4e00a93a312.lovable.app`) and any custom domain.
3. Firestore Database → Create database (production mode).
4. Firestore → Rules → paste the rules I'll generate (users can read own user doc; sellers can CRUD own products; everyone authenticated can read `status == 'published'` products).

## Technical notes
- Firebase auth persists in IndexedDB by default — works in TanStack SSR if we gate calls behind `typeof window !== 'undefined'`.
- All data access becomes client-side; security relies entirely on Firestore Rules. No more service-role bypass option.
- Existing Supabase `products` data will NOT be migrated automatically (no rows in your DB anyway based on context).

## Out of scope
- Migrating existing user accounts from Supabase → Firebase (none exist yet).
- File storage (no buckets currently). Can add Firebase Storage later if needed.
- Server-side rendering of user data (Firebase Admin SDK on Workers is non-trivial; skip unless asked).
