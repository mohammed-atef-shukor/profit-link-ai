# Firestore composite indexes

This project uses composite indexes for any query that combines `where()` filters with `orderBy()` (or multiple equality filters). Single-field lookups use Firestore’s automatic single-field indexes.

## Audit

```bash
npm run firebase:audit:indexes
```

Fails CI-style if `firestore.indexes.json` is missing a required index.

## Deploy

```bash
npm run firebase:deploy:indexes
# or full Firestore deploy (rules + indexes):
npm run firebase:deploy
```

Indexes can take several minutes to build in the Firebase console. Until status is **Enabled**, queries may still return “requires an index” with a console link.

## Query inventory

| Collection | Query | Index fields | Dashboard / feature |
|------------|-------|--------------|---------------------|
| `products` | `seller_id ==` + `orderBy(created_at desc)` | seller_id ↑, created_at ↓ | Seller → Products |
| `products` | `status == published` + `orderBy(created_at desc)` | status ↑, created_at ↓ | Marketer → Marketplace |
| `products` | `seller_id ==` + `status == published` + `orderBy(created_at desc)` | seller_id ↑, status ↑, created_at ↓ | Public store, seller storefront |
| `referral_links` | `marketer_id ==` + `orderBy(created_at desc)` | marketer_id ↑, created_at ↓ | Marketer → Links |
| `referral_links` | `marketer_id ==` + `product_id ==` + `limit(1)` | marketer_id ↑, product_id ↑ | Create referral link |
| `referral_links` | `product_id ==` + `orderBy(clicks desc)` | product_id ↑, clicks ↓ | Product analytics |
| `referral_links` | `seller_id ==` + `orderBy(created_at desc)` | seller_id ↑, created_at ↓ | Seller → Marketers |
| `referral_links` | `product_id in (...)` + `orderBy(created_at desc)` | product_id ↑, created_at ↓ | Seller → Marketers (legacy links) |
| `sales` | `seller_id ==` + `orderBy(created_at desc)` | seller_id ↑, created_at ↓ | Seller → Sales / Earnings |
| `sales` | `marketer_id ==` + `orderBy(created_at desc)` | marketer_id ↑, created_at ↓ | Marketer → Sales / Earnings |
| `sales` | `product_id ==` + `seller_id ==` + `orderBy(created_at desc)` | product_id ↑, seller_id ↑, created_at ↓ | Product sales / analytics |

### No composite index required

| Collection | Query | Notes |
|------------|-------|--------|
| `referral_links` | `code ==` + `limit(1)` | Single-field equality |
| `products`, `users`, `referral_links` | `getDoc(doc(id))` | Document ID lookup |

`limit()` does not change index requirements.

## Source files

- `src/lib/products.firestore.ts`
- `src/lib/referrals.firestore.ts`
- `src/lib/sales.firestore.ts`
- `src/routes/store.$uid.tsx` (uses `listPublishedProductsBySeller`)

## Configuration

- Index definitions: [`firestore.indexes.json`](../firestore.indexes.json)
- Firebase config: [`firebase.json`](../firebase.json) → `"indexes": "firestore.indexes.json"`
