import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Layout for referral landing, checkout, and success — child routes render via Outlet. */
export const Route = createFileRoute("/r/$code")({
  component: ReferralLayout,
});

function ReferralLayout() {
  return <Outlet />;
}
