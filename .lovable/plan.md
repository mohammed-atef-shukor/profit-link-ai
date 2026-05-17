# Split Roles + Full Dashboards (Seller & Marketer)

Today, `/dashboard` already routes by role to `/seller` or `/marketer`, but:
- There is **no role guard** — a seller can manually visit `/marketer` and vice versa.
- Each role only has **one page** (no real "dashboard" with multiple sections).
- The top nav doesn't reflect the logged-in role.

This plan keeps Firebase auth, roles, Firestore services, and all current routes intact, and builds out a real dashboard experience per role behind a strict role guard.

---

## 1. Role guards (security)

Add `beforeLoad` checks that read the user's role from Firestore and redirect mismatches:

- `src/routes/_authenticated/seller.tsx` → if role ≠ `seller`/`admin`, redirect to `/marketer`.
- `src/routes/_authenticated/marketer.tsx` (convert from flat to layout) → if role = `seller`/`admin`, redirect to `/seller`.

Helper: `src/lib/role-guard.ts` exposing `requireRole(role)` that fetches role via existing `getUserRole(uid)` and throws `redirect(...)`.

## 2. Per-role layout with sidebar

New shared component `src/components/layout/DashboardShell.tsx` — sidebar + topbar + `<Outlet />`. Receives `role` + `nav items`.

- **Seller sidebar**: Overview · Products · Sales · Marketers · Earnings · Settings
- **Marketer sidebar**: Overview · Marketplace · My Links · Sales · Earnings · Settings

Convert:
- `src/routes/_authenticated/seller.tsx` → renders `<DashboardShell role="seller">` with `<Outlet/>`.
- `src/routes/_authenticated/marketer.tsx` → becomes a layout (`marketer.tsx` with Outlet + guard), and current dashboard content moves to `marketer.index.tsx`.

## 3. Seller dashboard (new pages)

```
/seller                         → Overview (KPIs + recent activity)
/seller/products                → current product list (moved from /seller)
/seller/products/new            → existing
/seller/products/$id            → existing edit
/seller/products/$id/analytics  → existing
/seller/sales                   → all sales across products (buyer, marketer, product, commission, date)
/seller/marketers               → marketers promoting your products (aggregated from referral_links)
/seller/earnings                → revenue, commission paid out, net, monthly chart
/seller/settings                → profile/store settings stub
```

**Overview KPIs**: total products, published, total clicks, total sales, gross revenue, commissions owed, active marketers. Pulls from `products` + `sales` + `referral_links` (existing collections).

## 4. Marketer dashboard (new pages)

```
/marketer                → Overview (KPIs + top-performing links + recent sales)
/marketer/marketplace    → product grid + generate link (moved from current /marketer)
/marketer/links          → referral links table (moved from current /marketer)
/marketer/sales          → my sales list (from sales collection where marketer_id = me)
/marketer/earnings       → commissions earned, pending, paid (mock paid=0), monthly chart
/marketer/settings       → payout info stub
```

**Overview KPIs**: total clicks, total sales, total commissions, active links, conversion rate, top 3 products.

## 5. Public nav reflects login state

Update `src/components/layout/SiteNav.tsx`:
- If `useFirebaseAuth().user` exists → show **Dashboard** button (links to `/dashboard`, which auto-routes by role) instead of Login/Get Started.
- Add a small avatar/initial + dropdown with Logout.

## 6. Out of scope (preserved as-is)

- Firebase auth flow, `/login`, `/register`, `getUserRole`, `users` collection.
- Existing Firestore services (`products.firestore.ts`, `referrals.firestore.ts`, `sales.firestore.ts`) — only add small read helpers if needed (e.g. `listSalesForSeller`, `listMarketersForSeller`).
- Public routes: `/`, `/products`, `/products/$id`, `/r/$code`, `/r/$code/checkout`, `/r/$code/success`.
- All existing buttons, dashboards CRUD, Firestore rules.

## 7. Technical notes

- New file naming follows TanStack flat dot convention: `seller.sales.tsx`, `marketer.links.tsx`, etc.
- Charts: lightweight inline SVG bars (no new dep) — keeps bundle lean.
- Sales aggregation queries paginated to last 100 (Firestore 1000-row limit aware).
- Charts/aggregations are computed client-side from the existing collections — **no schema changes, no rules changes**.

---

Ready to implement on approval.