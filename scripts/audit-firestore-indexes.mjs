/**
 * Validates firestore.indexes.json against every composite query in the app.
 * Run: npm run firebase:audit:indexes
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexesPath = join(root, "firestore.indexes.json");

/** @type {{ collectionGroup: string; queryScope?: string; fields: [string, "ASCENDING" | "DESCENDING"][]; usedBy: string[] }[]} */
const REQUIRED_COMPOSITE_INDEXES = [
  {
    collectionGroup: "products",
    fields: [
      ["seller_id", "ASCENDING"],
      ["created_at", "DESCENDING"],
    ],
    usedBy: [
      "products.firestore: listMyProducts, subscribeMyProducts",
      "Seller dashboard → Products",
    ],
  },
  {
    collectionGroup: "products",
    fields: [
      ["status", "ASCENDING"],
      ["created_at", "DESCENDING"],
    ],
    usedBy: ["referrals.firestore: listPublishedProducts", "Marketer → Marketplace"],
  },
  {
    collectionGroup: "products",
    fields: [
      ["seller_id", "ASCENDING"],
      ["status", "ASCENDING"],
      ["created_at", "DESCENDING"],
    ],
    usedBy: [
      "products.firestore: subscribePublishedProductsBySeller",
      "store.$uid.tsx: public store page",
    ],
  },
  {
    collectionGroup: "referral_links",
    fields: [
      ["marketer_id", "ASCENDING"],
      ["created_at", "DESCENDING"],
    ],
    usedBy: [
      "referrals.firestore: listMyReferralLinks, subscribeMyReferralLinks",
      "Marketer → Links / dashboard",
    ],
  },
  {
    collectionGroup: "referral_links",
    fields: [
      ["marketer_id", "ASCENDING"],
      ["product_id", "ASCENDING"],
    ],
    usedBy: ["referrals.firestore: findMyLinkForProduct (create link dedupe)"],
  },
  {
    collectionGroup: "referral_links",
    fields: [
      ["product_id", "ASCENDING"],
      ["clicks", "DESCENDING"],
    ],
    usedBy: [
      "sales.firestore: listLinksForProduct, subscribeLinksForProduct",
      "Seller → product analytics",
    ],
  },
  {
    collectionGroup: "referral_links",
    fields: [
      ["seller_id", "ASCENDING"],
      ["created_at", "DESCENDING"],
    ],
    usedBy: [
      "referrals.firestore: subscribeReferralLinksForSeller",
      "Seller → Marketers",
    ],
  },
  {
    collectionGroup: "referral_links",
    fields: [
      ["product_id", "ASCENDING"],
      ["created_at", "DESCENDING"],
    ],
    usedBy: [
      "referrals.firestore: subscribeReferralLinksForSeller (legacy links, product_id in)",
    ],
  },
  {
    collectionGroup: "sales",
    fields: [
      ["seller_id", "ASCENDING"],
      ["created_at", "DESCENDING"],
    ],
    usedBy: [
      "sales.firestore: listSalesForSeller, subscribeSalesForSeller",
      "Seller → Sales, Earnings, dashboard",
    ],
  },
  {
    collectionGroup: "sales",
    fields: [
      ["marketer_id", "ASCENDING"],
      ["created_at", "DESCENDING"],
    ],
    usedBy: [
      "sales.firestore: listSalesForMarketer, subscribeSalesForMarketer",
      "Marketer → Sales, Earnings",
    ],
  },
  {
    collectionGroup: "sales",
    fields: [
      ["product_id", "ASCENDING"],
      ["seller_id", "ASCENDING"],
      ["created_at", "DESCENDING"],
    ],
    usedBy: [
      "sales.firestore: listSalesForProduct, subscribeSalesForProduct",
      "Seller → product analytics / sales",
    ],
  },
];

/** Single-field / getDoc queries — no composite index in firestore.indexes.json */
const SINGLE_FIELD_QUERIES = [
  { collection: "referral_links", filter: "code ==", note: "getLinkByCode — auto single-field index" },
  { collection: "products", filter: "getDoc by id", note: "product detail, checkout" },
  { collection: "users", filter: "getDoc by id", note: "profiles" },
];

function indexKey(collectionGroup, fields) {
  const fieldStr = fields.map(([p, o]) => `${p}:${o}`).join("|");
  return `${collectionGroup}::${fieldStr}`;
}

function loadDeployedIndexes() {
  const raw = JSON.parse(readFileSync(indexesPath, "utf8"));
  const map = new Map();
  for (const idx of raw.indexes ?? []) {
    const fields = (idx.fields ?? []).map((f) => [f.fieldPath, f.order]);
    map.set(indexKey(idx.collectionGroup, fields), idx);
  }
  return map;
}

const deployed = loadDeployedIndexes();
const missing = [];
const ok = [];

for (const req of REQUIRED_COMPOSITE_INDEXES) {
  const key = indexKey(req.collectionGroup, req.fields);
  if (deployed.has(key)) {
    ok.push(req);
  } else {
    missing.push({ ...req, key });
  }
}

console.log("Firestore composite index audit\n");
console.log(`Required: ${REQUIRED_COMPOSITE_INDEXES.length}`);
console.log(`Present:  ${ok.length}`);
console.log(`Missing:  ${missing.length}\n`);

if (missing.length > 0) {
  console.error("MISSING INDEXES (add to firestore.indexes.json):\n");
  for (const m of missing) {
    console.error(`  ${m.collectionGroup}`);
    for (const [path, order] of m.fields) {
      console.error(`    - ${path} ${order}`);
    }
    console.error(`    Used by: ${m.usedBy.join("; ")}\n`);
  }
  process.exit(1);
}

console.log("All composite indexes are defined in firestore.indexes.json.\n");
console.log("Single-field queries (no composite entry needed):");
for (const q of SINGLE_FIELD_QUERIES) {
  console.log(`  - ${q.collection}: ${q.filter} (${q.note})`);
}
console.log("\nDeploy indexes: npm run firebase:deploy:indexes");
