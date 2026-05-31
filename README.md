# LinkProfit AI



AI-powered affiliate marketplace built with **TanStack Start**, **React 19**, and **Firebase**.



## Stack



- **Frontend:** TanStack Router + Start, React Query, Tailwind CSS

- **Auth & data:** Firebase Auth, Firestore, Storage

- **Deploy:** Netlify (SSR via `@netlify/vite-plugin-tanstack-start`)



**Production:** https://linkprofit-ai.netlify.app



## Quick start



1. **Install dependencies**



   ```bash

   npm install

   ```



2. **Configure Firebase**



   Copy the example env file and fill in values from [Firebase Console](https://console.firebase.google.com/) → Project settings → Your apps → Web app:



   ```bash

   cp .env.example .env

   ```



   Required variables:



   - `VITE_FIREBASE_API_KEY`

   - `VITE_FIREBASE_AUTH_DOMAIN`

   - `VITE_FIREBASE_PROJECT_ID`

   - `VITE_FIREBASE_STORAGE_BUCKET`

   - `VITE_FIREBASE_MESSAGING_SENDER_ID`

   - `VITE_FIREBASE_APP_ID`



   For Netlify builds, import the same variables:



   ```bash

   netlify env:import .env

   ```



3. **Link Firebase project & deploy rules (CLI)**



   ```bash

   npm install

   npm run firebase:use

   npm run firebase:deploy

   ```



   Or step by step:



   ```bash

   firebase login

   firebase use linkprofit-ai

   firebase deploy --only firestore,storage

   ```



   Enable **Email/Password** and **Google** sign-in in Firebase Console → Authentication → Sign-in method (not available via CLI).



   **Storage CORS (required for browser image/logo uploads):**



   ```bash

   npm run firebase:deploy:storage-cors

   ```



   Or deploy Storage rules **and** CORS together:



   ```bash

   npm run firebase:deploy:storage

   ```



   Requires [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`) authenticated with access to the Firebase project. Run once per bucket (and again when adding production domains — edit `storage.cors.json` first).



4. **Run locally**



   ```bash

   npm run dev

   ```



## Netlify deployment



The app uses Netlify SSR (not static SPA). Routing and hard refresh are handled by the TanStack Start Netlify function (`.netlify/v1/functions/server.mjs`).



```bash

npm run deploy:preview   # draft URL

npm run deploy:prod      # production

```



Configuration lives in [`netlify.toml`](netlify.toml): build command `npm run build`, publish dir `dist/client`.



### Production checklist



Before go-live (or after changing domains):



1. **Environment variables** — `netlify env:import .env` (all `VITE_FIREBASE_*` vars)

2. **Firebase Auth authorized domain** — add your Netlify hostname:



   ```bash

   npm run firebase:auth:add-domain

   # or: npm run firebase:auth:add-domain -- your-site.netlify.app

   ```



   Manual fallback: [Firebase Console → Authentication → Authorized domains](https://console.firebase.google.com/project/linkprofit-ai/authentication/settings)



3. **Storage CORS** — ensure production origin is in [`storage.cors.json`](storage.cors.json), then:



   ```bash

   npm run firebase:deploy:storage-cors

   ```



4. **Firestore rules & indexes** — `npm run firebase:deploy`



### Preview deploys and auth



Firebase does **not** support wildcard authorized domains (`*.netlify.app`). Draft URLs like `abc123--linkprofit-ai.netlify.app` are not authorized by default.



- **Recommended:** test auth on production only

- **Optional:** add a specific preview hostname when needed:



  ```bash

  npm run firebase:auth:add-domain -- abc123--linkprofit-ai.netlify.app

  ```



## Firebase architecture



```

src/firebase/

├── config.ts      # Env-based app initialization

├── auth.ts        # Auth helpers (login, signup, roles)

├── firestore.ts   # Firestore singleton

├── storage.ts     # Storage upload helpers

└── index.ts       # Public exports



src/context/

└── AuthProvider.tsx   # Global auth + role state



src/lib/

├── *.firestore.ts     # Domain data access

├── auth-guard.ts      # Route beforeLoad guards

└── firebase-errors.ts # User-friendly error messages

```



## Scripts



| Command        | Description              |

|----------------|--------------------------|

| `npm run dev`  | Start dev server         |

| `npm run build`| Production build         |

| `npm run lint` | ESLint                   |

| `npm run preview` | Preview production build |

| `npm run deploy:preview` | Netlify draft deploy |

| `npm run deploy:prod` | Netlify production deploy |

| `npm run firebase:use` | Set active Firebase project (`linkprofit-ai`) |

| `npm run firebase:deploy` | Deploy Firestore rules, indexes, and Storage rules |

| `npm run firebase:deploy:rules` | Deploy security rules only |

| `npm run firebase:deploy:indexes` | Deploy Firestore composite indexes only |

| `npm run firebase:audit:indexes` | Verify `firestore.indexes.json` covers all app queries |

| `npm run firebase:deploy:storage-cors` | Apply Storage CORS for browser uploads (requires `gcloud`) |

| `npm run firebase:auth:add-domain` | Add hostname to Firebase Auth authorized domains |

| `npm run firebase:status` | List project, apps, and Firestore databases |

| `npm run smoke:e2e` | End-to-end smoke test against live Firebase |



## Firestore indexes



Composite queries (`where` + `orderBy`, or multiple `where` clauses) require indexes defined in `firestore.indexes.json`. See [docs/firestore-indexes.md](docs/firestore-indexes.md) for the full query map.



```bash

npm run firebase:audit:indexes    # validate before deploy

npm run firebase:deploy:indexes   # push indexes to Firebase

```



## Security notes



- Firestore rules live in `firestore.rules` — deploy before production.

- Demo checkout writes sales from the client; replace with a payment webhook before real payouts.

- Never commit `.env` — use `.env.example` as a template.

- Run `npm audit` periodically; apply safe fixes with `npm audit fix`.

