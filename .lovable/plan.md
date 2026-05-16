# LinkProfit AI — Phase 1 Build Plan

## Scope (this phase)
1. Premium public landing page
2. Authentication (Login, Register, Forgot Password, Reset Password)
3. Role selection during signup (Seller / Marketer)
4. Authenticated shell with role-aware redirect to a placeholder dashboard

Future phases (NOT in this build): Seller dashboard, Marketer dashboard, Admin dashboard, Marketplace, AI assistant, referral tracking, orders, payouts.

---

## Stack adjustments from your spec
- **Angular → React + TanStack Start** (Lovable only supports React).
- **Firebase → Lovable Cloud** (Postgres + auth + storage + server functions + AI gateway, zero setup). Same data model intent; collections become tables.
- Tailwind CSS v4, TypeScript, semantic design tokens in `src/styles.css`.

---

## Design direction
Premium SaaS, Stripe/Linear/Framer caliber:
- Indigo→violet gradient primary, near-white background, soft gray sections, deep ink text.
- Display font: Space Grotesk; body: Inter.
- Glassmorphism on nav + hero device mocks, soft shadows, generous spacing, 12–16px radius.
- Subtle motion (fade/slide on scroll, hover lift on cards).
- Light theme first; dark tokens prepared.

I'll lock these in `src/styles.css` as semantic tokens (no hardcoded colors in components).

---

## Pages & routes

```text
/                       Landing page
/login                  Login (email/password + Google)
/register               Register with role picker (Seller | Marketer)
/forgot-password        Request reset email
/reset-password         Set new password (recovery flow)
/onboarding             Role confirmation if missing
/_authenticated/
  /dashboard            Role-aware placeholder (routes Seller → /seller, Marketer → /marketer)
  /seller               Stub "Seller dashboard coming soon"
  /marketer             Stub "Marketer dashboard coming soon"
```

---

## Landing page sections
1. Sticky glass nav: Home · Features · Sellers · Marketers · AI Assistant · Login · Get Started
2. Hero: "Turn Products into Income Opportunities" + 3 CTAs (Start as Seller, Start as Marketer, Explore Marketplace) + animated dashboard mock
3. Problem statement (3-up)
4. Solution explanation (split layout)
5. How it works (4 numbered steps)
6. Features grid (6 cards)
7. Seller benefits (split + bullet list + mock)
8. Marketer benefits (split + bullet list + mock)
9. AI Assistant preview (prompt → generated card UI mock)
10. Business model (3 pillars)
11. Impact / social proof band
12. Final CTA banner
13. Footer (multi-column)

---

## Auth UX
- Split-screen: left = form card with validation + loading states; right = gradient panel with brand pitch + testimonial.
- Email/password + Google.
- Register: role toggle (Seller / Marketer) — stored on the user's profile row at signup.
- Form validation with inline errors, disabled-while-loading buttons, success toasts.

---

## Component architecture

```text
src/components/
  layout/
    SiteNav.tsx           Public glass nav
    SiteFooter.tsx
    AuthSplitLayout.tsx   Shared split-screen auth shell
  landing/
    Hero.tsx
    ProblemSection.tsx
    SolutionSection.tsx
    HowItWorks.tsx
    FeaturesGrid.tsx
    SellerBenefits.tsx
    MarketerBenefits.tsx
    AIAssistantPreview.tsx
    BusinessModel.tsx
    ImpactBand.tsx
    FinalCTA.tsx
    DashboardMock.tsx     Reusable fake dashboard visual
  ui/                     (existing shadcn)
src/lib/
  auth.functions.ts       Server fns: getProfile, setRole
  profile.server.ts
```

---

## Technical details

**Backend (Lovable Cloud)**
- Enable Lovable Cloud.
- `profiles` table: `id (uuid, FK auth.users)`, `role ('seller'|'marketer'|'admin')`, `display_name`, `created_at`. RLS: user can read/update own row.
- Trigger: auto-insert profile on `auth.users` signup; role taken from signup metadata.
- Auth: email/password + Google enabled. `emailRedirectTo = origin`, password reset `redirectTo = origin + '/reset-password'`.
- `_authenticated` layout guards dashboard routes via `beforeLoad` session check.

**Frontend**
- Session via `supabase.auth.onAuthStateChange` set up before `getSession()` in a top-level auth hook.
- Role fetched via `useServerFn(getProfile)` + react-query.
- Tailwind tokens (oklch) for: `--primary`, `--primary-glow`, `--gradient-primary`, `--surface-muted`, `--shadow-elegant`.
- Motion via `motion/react` (lightweight scroll-fade + hover transforms only).

**SEO**
- Per-route `head()` with unique title <60c, meta description <160c, og:title/description, JSON-LD `Organization` on landing.
- Single H1 per page, semantic sectioning.

---

## Out of scope this phase (so you know)
Dashboards, marketplace, product CRUD, referral link generation, click/order tracking, payouts, admin tools, AI generation endpoints. These get their own focused phases so each ships at investor-ready quality.

Reply **Implement plan** and I'll build it.