import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LayoutDashboard, Store, Link2, ShoppingBag, DollarSign, Settings } from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/DashboardShell";
import { fetchCurrentRole } from "@/lib/role-guard";

export const Route = createFileRoute("/_authenticated/marketer")({
  component: MarketerLayout,
});

const items: DashboardNavItem[] = [
  { label: "Overview", to: "/marketer", icon: LayoutDashboard, exact: true },
  { label: "Marketplace", to: "/marketer/marketplace", icon: Store },
  { label: "My Links", to: "/marketer/links", icon: Link2 },
  { label: "Sales", to: "/marketer/sales", icon: ShoppingBag },
  { label: "Earnings", to: "/marketer/earnings", icon: DollarSign },
  { label: "Settings", to: "/marketer/settings", icon: Settings },
];

function MarketerLayout() {
  const navigate = useNavigate();
  const { data: role, isLoading } = useQuery({
    queryKey: ["current-role"],
    queryFn: fetchCurrentRole,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isLoading && (role === "seller" || role === "admin")) {
      navigate({ to: "/seller" });
    }
  }, [role, isLoading, navigate]);

  if (isLoading || !role) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (role === "seller" || role === "admin") return null;

  return (
    <DashboardShell title="Marketer" items={items}>
      <Outlet />
    </DashboardShell>
  );
}
