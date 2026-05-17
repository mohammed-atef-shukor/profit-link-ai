import { createFileRoute } from "@tanstack/react-router";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

export const Route = createFileRoute("/_authenticated/seller/settings")({
  head: () => ({ meta: [{ title: "Settings — Seller — LinkProfit AI" }] }),
  component: SellerSettings,
});

function SellerSettings() {
  const { user } = useFirebaseAuth();
  return (
    <main>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Seller</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your store profile.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-soft p-6 max-w-2xl">
        <h2 className="font-display text-lg font-semibold">Account</h2>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="col-span-2 font-medium">{user?.email ?? "—"}</dd>
          <dt className="text-muted-foreground">Display name</dt>
          <dd className="col-span-2 font-medium">{user?.displayName ?? "—"}</dd>
          <dt className="text-muted-foreground">UID</dt>
          <dd className="col-span-2 font-mono text-xs">{user?.uid ?? "—"}</dd>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="col-span-2 font-medium">Seller</dd>
        </dl>
        <p className="mt-6 text-xs text-muted-foreground">
          More store settings (logo, payout details, brand) coming soon.
        </p>
      </div>
    </main>
  );
}
