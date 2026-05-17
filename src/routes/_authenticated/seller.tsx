import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LayoutDashboard, Package, ShoppingBag, Users, DollarSign, Settings } from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/DashboardShell";
import { fetchCurrentRole } from "@/lib/role-guard";

export const Route = createFileRoute("/_authenticated/seller")({
  component: SellerLayout,
});

const items: DashboardNavItem[] = [
  { label: "Overview", to: "/seller", icon: LayoutDashboard, exact: true },
  { label: "Products", to: "/seller/products", icon: Package },
  { label: "Sales", to: "/seller/sales", icon: ShoppingBag },
  { label: "Marketers", to: "/seller/marketers", icon: Users },
  { label: "Earnings", to: "/seller/earnings", icon: DollarSign },
  { label: "Settings", to: "/seller/settings", icon: Settings },
];

function SellerLayout() {
  const navigate = useNavigate();
  const { data: role, isLoading } = useQuery({
    queryKey: ["current-role"],
    queryFn: fetchCurrentRole,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isLoading && role && role !== "seller" && role !== "admin") {
      navigate({ to: "/marketer" });
    }
  }, [role, isLoading, navigate]);

  if (isLoading || !role) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (role !== "seller" && role !== "admin") return null;

  return (
    <DashboardShell title="Seller" items={items}>
      <Outlet />
    </DashboardShell>
  );
}
