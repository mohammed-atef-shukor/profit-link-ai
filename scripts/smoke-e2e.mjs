/**
 * End-to-end smoke test against live Firebase (linkprofit-ai).
 * Run: npm run smoke:e2e
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = join(root, ".env");
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnv();

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

for (const [k, v] of Object.entries(config)) {
  if (!v) throw new Error(`Missing env: ${k}`);
}

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

const runId = Date.now().toString(36);
const sellerEmail = `smoke-seller-${runId}@linkprofit-test.local`;
const marketerEmail = `smoke-marketer-${runId}@linkprofit-test.local`;
const password = `SmokeTest1!${runId}`;

const results = [];
function pass(step, detail = "") {
  results.push({ step, ok: true, detail });
  console.log(`✓ ${step}${detail ? ` — ${detail}` : ""}`);
}
function fail(step, err) {
  const msg = err?.message ?? String(err);
  results.push({ step, ok: false, detail: msg });
  console.error(`✗ ${step} — ${msg}`);
  throw err;
}

function calcCommission(price, percent) {
  return Math.round(price * percent) / 100;
}

async function createProfile(uid, { display_name, role, email, store_name }) {
  await setDoc(doc(db, "users", uid), {
    display_name,
    email,
    role,
    store_name: store_name ?? null,
    created_at: serverTimestamp(),
  });
}

async function cleanupUsers() {
  if (auth.currentUser) {
    try {
      await deleteUser(auth.currentUser);
    } catch {
      // test accounts may require recent login — leave docs for manual cleanup
    }
  }
}

let productId = "";
let linkId = "";
let linkCode = "";
let marketerUid = "";
let sellerUid = "";

try {
  // ── 1. Seller signup + profile ──────────────────────────────────────
  console.log("\n=== SELLER FLOW ===\n");
  const sellerCred = await createUserWithEmailAndPassword(auth, sellerEmail, password);
  sellerUid = sellerCred.user.uid;
  await createProfile(sellerUid, {
    display_name: "Smoke Seller",
    role: "seller",
    email: sellerEmail,
    store_name: `Smoke Store ${runId}`,
  });
  pass("Seller signup + profile");

  // Store branding update
  await updateDoc(doc(db, "users", sellerUid), {
    store_tagline: "Smoke test storefront",
    updated_at: serverTimestamp(),
  });
  pass("Seller branding update");

  // Create published product
  const productRef = await addDoc(collection(db, "products"), {
    seller_id: sellerUid,
    seller_name: "Smoke Seller",
    title: `Smoke Product ${runId}`,
    description: "Automated smoke test product",
    price: 49.99,
    commission_percent: 20,
    image_url: null,
    storage_path: null,
    category: "Other",
    discount_percent: null,
    status: "published",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  productId = productRef.id;
  pass("Seller creates published product", productId);

  await signOut(auth);
  pass("Seller logout");

  // ── 2. Marketer flow ────────────────────────────────────────────────
  console.log("\n=== MARKETER FLOW ===\n");
  const marketerCred = await createUserWithEmailAndPassword(auth, marketerEmail, password);
  marketerUid = marketerCred.user.uid;
  await createProfile(marketerUid, {
    display_name: "Smoke Marketer",
    role: "marketer",
    email: marketerEmail,
  });
  pass("Marketer signup + profile");

  // List marketplace (published products)
  const marketplaceQ = query(
    collection(db, "products"),
    where("status", "==", "published"),
    orderBy("created_at", "desc"),
  );
  const marketplaceSnap = await getDocs(marketplaceQ);
  const foundProduct = marketplaceSnap.docs.find((d) => d.id === productId);
  if (!foundProduct) fail("Marketer marketplace lists seller product", new Error("Product not in marketplace query"));
  pass("Marketer marketplace query", `${marketplaceSnap.size} products`);

  // Generate referral link
  linkCode = `smk${runId.slice(0, 5)}`;
  const linkRef = await addDoc(collection(db, "referral_links"), {
    marketer_id: marketerUid,
    seller_id: sellerUid,
    product_id: productId,
    product_title: foundProduct.data().title,
    product_price: Number(foundProduct.data().price),
    commission_percent: Number(foundProduct.data().commission_percent),
    code: linkCode,
    clicks: 0,
    sales: 0,
    commissions: 0,
    created_at: serverTimestamp(),
  });
  linkId = linkRef.id;
  pass("Marketer generates referral link", `/r/${linkCode}`);

  await signOut(auth);
  pass("Marketer logout");

  // ── 3. Referral + checkout (guest) ──────────────────────────────────
  console.log("\n=== CHECKOUT FLOW ===\n");

  // Click tracking (guest)
  await updateDoc(doc(db, "referral_links", linkId), { clicks: increment(1) });
  const afterClick = await getDoc(doc(db, "referral_links", linkId));
  if (Number(afterClick.data()?.clicks) !== 1) {
    fail("Click tracking", new Error(`Expected 1 click, got ${afterClick.data()?.clicks}`));
  }
  pass("Referral click tracked");

  // Record referral sale (guest checkout — no auth)
  const productSnap = await getDoc(doc(db, "products", productId));
  const product = productSnap.data();
  const price = Number(product.price);
  const commissionPercent = Number(product.commission_percent);
  const commissionAmount = calcCommission(price, commissionPercent);

  const referralSaleRef = await addDoc(collection(db, "sales"), {
    product_id: productId,
    product_title: product.title,
    seller_id: sellerUid,
    marketer_id: marketerUid,
    referral_link_id: linkId,
    referral_code: linkCode,
    commission_owner: "marketer",
    buyer_name: "Smoke Buyer Referral",
    buyer_email: "referral@smoke-test.local",
    price,
    commission_percent: commissionPercent,
    commission_amount: commissionAmount,
    status: "completed",
    created_at: serverTimestamp(),
  });

  await addDoc(collection(db, "commissions"), {
    marketer_id: marketerUid,
    seller_id: sellerUid,
    product_id: productId,
    sale_id: referralSaleRef.id,
    amount: commissionAmount,
    status: "completed",
    created_at: serverTimestamp(),
  });

  const linkCommissionBump = calcCommission(
    Number(afterClick.data()?.product_price ?? price),
    Number(afterClick.data()?.commission_percent ?? commissionPercent),
  );
  await updateDoc(doc(db, "referral_links", linkId), {
    sales: increment(1),
    commissions: increment(linkCommissionBump),
  });
  pass("Referral guest checkout + marketer commission", `$${commissionAmount.toFixed(2)}`);

  // Direct platform sale (guest checkout — no auth, no referral)
  const directSaleRef = await addDoc(collection(db, "sales"), {
    product_id: productId,
    product_title: product.title,
    seller_id: sellerUid,
    marketer_id: null,
    referral_link_id: null,
    referral_code: null,
    commission_owner: "platform",
    buyer_name: "Smoke Buyer Direct",
    buyer_email: "direct@smoke-test.local",
    price,
    commission_percent: commissionPercent,
    commission_amount: commissionAmount,
    status: "completed",
    created_at: serverTimestamp(),
  });

  await addDoc(collection(db, "platform_earnings"), {
    sale_id: directSaleRef.id,
    product_id: productId,
    seller_id: sellerUid,
    amount: price,
    commission_amount: commissionAmount,
    created_at: serverTimestamp(),
  });
  pass("Direct guest checkout + platform earning", `$${commissionAmount.toFixed(2)}`);

  // ── 4. Seller ↔ marketer sync ───────────────────────────────────────
  console.log("\n=== SELLER ↔ MARKETER SYNC ===\n");

  await signInWithEmailAndPassword(auth, sellerEmail, password);

  const linksQ = query(
    collection(db, "referral_links"),
    where("seller_id", "==", sellerUid),
    orderBy("created_at", "desc"),
  );
  const sellerLinks = await getDocs(linksQ);
  const marketerLink = sellerLinks.docs.find((d) => d.data().marketer_id === marketerUid);
  if (!marketerLink) fail("Seller sees marketer referral link", new Error("No link for marketer"));
  pass("Seller referral_links query by seller_id", `${sellerLinks.size} link(s)`);

  const salesQ = query(
    collection(db, "sales"),
    where("seller_id", "==", sellerUid),
    orderBy("created_at", "desc"),
  );
  const sellerSales = await getDocs(salesQ);
  const referralSale = sellerSales.docs.find(
    (d) => d.data().commission_owner === "marketer" && d.data().marketer_id === marketerUid,
  );
  const directSale = sellerSales.docs.find((d) => d.data().commission_owner === "platform");
  if (!referralSale) fail("Seller sees marketer referral sale", new Error("No referral sale found"));
  if (!directSale) fail("Seller sees direct platform sale", new Error("No direct sale found"));
  pass("Seller sales query", `${sellerSales.size} sale(s) — referral + direct`);

  if (directSale.data().commission_owner !== "platform") {
    fail("Direct sale commission owner", new Error(`Expected platform, got ${directSale.data().commission_owner}`));
  }
  pass("Direct sale commission_owner", "platform");

  const linkData = (await getDoc(doc(db, "referral_links", linkId))).data();
  if (Number(linkData?.clicks) !== 1 || Number(linkData?.sales) !== 1) {
    fail("Link analytics", new Error(`clicks=${linkData?.clicks} sales=${linkData?.sales}`));
  }
  pass("Link analytics", `clicks=1 sales=1 commissions=$${Number(linkData?.commissions).toFixed(2)}`);

  // ── 5. HTTP route smoke (dev server) ────────────────────────────────
  console.log("\n=== HTTP ROUTES ===\n");
  const base = process.env.SMOKE_BASE_URL ?? "http://localhost:8081";
  const routes = [
    `/`,
    `/login`,
    `/products/${productId}/checkout`,
    `/r/${linkCode}`,
    `/r/${linkCode}/checkout`,
  ];
  for (const path of routes) {
    const res = await fetch(`${base}${path}`, { redirect: "follow" });
    if (!res.ok) fail(`HTTP ${path}`, new Error(`Status ${res.status}`));
    pass(`HTTP ${path}`, String(res.status));
  }

  const productsRes = await fetch(`${base}/products`);
  const productsHtml = await productsRes.text();
  if (productsHtml.includes("Discover products to promote")) {
    fail("HTTP /products guest/seller blocked", new Error("Marketplace listing exposed"));
  }
  pass("HTTP /products protected", "marketplace not publicly listed");

  // ── 6. Persistence (re-query after sign-in) ─────────────────────────
  console.log("\n=== PERSISTENCE ===\n");
  await signOut(auth);
  await signInWithEmailAndPassword(auth, sellerEmail, password);
  const productCheck = await getDoc(doc(db, "products", productId));
  if (!productCheck.exists() || productCheck.data()?.seller_id !== sellerUid) {
    fail("Product persistence", new Error("Product missing after re-login"));
  }
  pass("Product persists after re-login");

  await signOut(auth);
  await signInWithEmailAndPassword(auth, marketerEmail, password);
  const myLinksQ = query(
    collection(db, "referral_links"),
    where("marketer_id", "==", marketerUid),
    orderBy("created_at", "desc"),
  );
  const myLinks = await getDocs(myLinksQ);
  if (!myLinks.docs.some((d) => d.id === linkId)) {
    fail("Referral link persistence", new Error("Link missing after re-login"));
  }
  pass("Referral link persists after re-login");

  const commissionsSnap = await getDocs(
    query(collection(db, "commissions"), where("marketer_id", "==", marketerUid)),
  );
  if (commissionsSnap.empty) fail("Marketer commission record", new Error("No commission doc"));
  pass("Marketer commission record", `${commissionsSnap.size} commission(s)`);

  console.log("\n========================================");
  console.log("SMOKE TEST PASSED — all steps OK");
  console.log("========================================");
  console.log(`\nTest accounts (optional cleanup):`);
  console.log(`  Seller:   ${sellerEmail}`);
  console.log(`  Marketer: ${marketerEmail}`);
  console.log(`  Referral: ${base}/r/${linkCode}`);
  console.log(`  Password: ${password}\n`);

  process.exit(0);
} catch (err) {
  console.log("\n========================================");
  console.log("SMOKE TEST FAILED");
  console.log("========================================\n");
  for (const r of results) {
    console.log(`${r.ok ? "✓" : "✗"} ${r.step}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  await cleanupUsers();
  process.exit(1);
}
