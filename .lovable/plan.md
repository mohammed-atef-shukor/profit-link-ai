# Full Workflow Implementation Plan

Stack stays as is: **TanStack Start (React 19) + Tailwind v4 + Firebase Auth + Firestore**. Current visual design is preserved — no restyling. All existing routes, auth, roles, Firestore services, and dashboards stay intact; this plan only adds the missing pieces of the end-to-end flow.

## Defaults I'm assuming (say so if you want different)

1. **Public Products page (`/products`)** — added as a public marketplace. Anyone can browse published products without logging in.
2. **Checkout** — **mock checkout** (no Stripe). Clicking "Buy" on `/r/$code` records a sale in Firestore, increments the marketer's sales + commission, and shows a success screen. We can swap in Stripe later.
3. **Sales & commissions** — become real via the mock checkout above (no more hardcoded zeros).
4. **Seller analytics** — sellers see per-product clicks, sales, revenue, and which marketers are promoting them.
5. **Out of scope for this round**: payouts, admin panel, email notifications, marketer onboarding wizard.

## Screen-by-screen scope

### 1. Landing (`/`)
- Keep existing design.
- Wire CTAs: "Become a seller" → `/register?role=seller`, "Earn as marketer" → `/register?role=marketer`, "Browse products" → `/products` (new).
- Add a "Featured products" strip pulling 3–6 latest published products from Firestore (public read).

### 2. Products (`/products` — NEW, public)
- Public route, no auth required.
- Grid of all `status: "published"` products with search + sort (newest / commission % / price).
- Each card → `/products/$productId` (public product detail).
- Logged-in marketers see a "Generate my link" button on the detail page; logged-out users see "Sign in as marketer to promote".

### 3. Marketer (`/marketer`)
- Keep current design and tabs.
- Replace placeholder stats with **real aggregates** from `referral_links` (sum clicks, sales, commissions).
- Per-link row already shows clicks; now also shows sales + commission (live from Firestore).
- "Copy link" + share buttons unchanged.

### 4. Seller (`/seller`)
- Keep current table.
- Add per-product analytics columns: **Clicks**, **Sales**, **Revenue** (aggregated from `referral_links` where `product_id == p.id`).
- New `/seller/products/$productId/analytics` page: top marketers for this product, recent sales, totals.

### 5. Checkout flow (`/r/$code` → `/r/$code/checkout` → `/r/$code/success`)
- `/r/$code` already records the click — unchanged.
- "Continue to checkout" → `/r/$code/checkout`: simple form (name + email) + "Confirm purchase" button.
- On confirm: write a `sales` doc, `increment` the link's `sales` and `commissions`, redirect to `/r/$code/success`.
- Success page shows order summary.

## Technical details

**New Firestore collection: `sales`**
```
sales/{saleId} = {
  product_id, seller_id, marketer_id, referral_link_id, referral_code,
  buyer_name, buyer_email,
  price, commission_percent, commission_amount,
  created_at: serverTimestamp()
}
```

**Updated `referral_links` doc** — `clicks`, `sales`, `commissions` all maintained via `increment()`.

**New / changed files**
- New: `src/lib/sales.firestore.ts` — `recordSale()`, `listSalesForSeller()`, `listSalesForProduct()`.
- New: `src/lib/products.public.ts` — `listPublishedProducts()`, `getPublishedProduct(id)` (public reads).
- New routes: `src/routes/products.tsx` (list), `src/routes/products.$productId.tsx` (detail), `src/routes/r.$code.checkout.tsx`, `src/routes/r.$code.success.tsx`, `src/routes/_authenticated/seller.products.$productId.analytics.tsx`.
- Edits: `src/routes/index.tsx` (featured strip + CTA wiring), `src/routes/register.tsx` (read `?role=` from search), `src/routes/_authenticated/marketer.tsx` (real aggregates), `src/routes/_authenticated/seller.index.tsx` (analytics columns), `src/lib/referrals.firestore.ts` (add `incrementSale()` helper).

**Firestore rules — additions you'll need to deploy:**
```
match /products/{pid} {
  allow read: if resource.data.status == 'published'
              || (request.auth != null && resource.data.seller_id == request.auth.uid);
  // create/update/delete unchanged
}
match /sales/{sid} {
  allow create: if true; // public checkout writes; validated by required fields
  allow read:   if request.auth != null
                && (resource.data.seller_id == request.auth.uid
                    || resource.data.marketer_id == request.auth.uid);
}
match /referral_links/{linkId} {
  // existing rules + allow public increment of clicks/sales/commissions only
  allow update: if request.resource.data.diff(resource.data)
                  .affectedKeys().hasOnly(['clicks','sales','commissions']);
}
```

**Auth/roles** — untouched. `useFirebaseAuth` + `getUserRole` continue to gate `_authenticated` and the dashboard router.

## Out of scope (flag for a later round)
- Real payments (Stripe)
- Marketer payouts
- Admin role UI
- Email notifications on sale
- Fraud / click deduplication

If anything above is wrong (especially mock checkout vs Stripe), tell me before I implement.