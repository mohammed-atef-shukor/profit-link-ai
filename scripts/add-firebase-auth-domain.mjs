/**
 * Add a domain to Firebase Auth authorized domains (idempotent).
 *
 * Usage:
 *   node scripts/add-firebase-auth-domain.mjs
 *   node scripts/add-firebase-auth-domain.mjs linkprofit-ai.netlify.app
 *   node scripts/add-firebase-auth-domain.mjs abc123--linkprofit-ai.netlify.app
 *
 * Requires gcloud CLI authenticated with roles/firebaseauth.admin on the project.
 * Run: gcloud config set project linkprofit-ai
 *
 * Fallback: Firebase Console → Authentication → Settings → Authorized domains
 */
import { execSync } from "node:child_process";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "linkprofit-ai";
const domain = process.argv[2]?.trim() || "linkprofit-ai.netlify.app";

function getAccessToken() {
  try {
    return execSync(`gcloud auth print-access-token --project=${PROJECT_ID}`, {
      encoding: "utf8",
    }).trim();
  } catch {
    throw new Error(
      "Could not get gcloud access token. Run: gcloud auth login && gcloud config set project " +
        PROJECT_ID,
    );
  }
}

function apiHeaders(token, { json = false } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "x-goog-user-project": PROJECT_ID,
  };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function getConfig(token) {
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`;
  const res = await fetch(url, { headers: apiHeaders(token) });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET config failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function patchConfig(token, authorizedDomains) {
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=authorizedDomains`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: apiHeaders(token, { json: true }),
    body: JSON.stringify({ authorizedDomains }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH config failed (${res.status}): ${body}`);
  }
  return res.json();
}

try {
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Domain:  ${domain}`);

  const token = getAccessToken();
  const config = await getConfig(token);
  const current = config.authorizedDomains ?? [];

  if (current.includes(domain)) {
    console.log(`✓ "${domain}" is already authorized.`);
    console.log("Current domains:", current.join(", "));
    process.exit(0);
  }

  const updated = [...current, domain];
  await patchConfig(token, updated);

  console.log(`✓ Added "${domain}" to authorized domains.`);
  console.log("Updated domains:", updated.join(", "));
} catch (err) {
  console.error("\n✗ Failed to add authorized domain.");
  console.error(err.message);
  console.error("\nManual fallback:");
  console.error(
    `  https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings`,
  );
  console.error(`  Add domain: ${domain}`);
  process.exit(1);
}
