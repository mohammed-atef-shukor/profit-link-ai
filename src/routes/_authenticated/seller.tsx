import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  Loader2,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  Settings,
  BarChart3,
  Shield,
} from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { isAuthReady, roleHomePath } from "@/lib/auth-guard";

export const Route = createFileRoute("/_authenticated/seller")({
  component: SellerLayout,
});

function SellerLayout() {
  const navigate = useNavigate();
  const { currentUser, loading, role, roleLoading } = useAuth();
  const ready = isAuthReady(loading, roleLoading, currentUser);

  const items = useMemo((): DashboardNavItem[] => {
    const nav: DashboardNavItem[] = [
      { label: "Overview", to: "/seller", icon: LayoutDashboard, exact: true },
      { label: "Analytics", to: "/seller/analytics", icon: BarChart3 },
      { label: "Products", to: "/seller/products", icon: Package },
      { label: "Sales", to: "/seller/sales", icon: ShoppingBag },
      { label: "Marketers", to: "/seller/marketers", icon: Users },
      { label: "Earnings", to: "/seller/earnings", icon: DollarSign },
      { label: "Settings", to: "/seller/settings", icon: Settings },
    ];
    if (role === "admin") {
      nav.splice(2, 0, { label: "Admin", to: "/seller/admin", icon: Shield });
    }
    return nav;
  }, [role]);

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      void navigate({ to: "/login", replace: true });
      return;
    }
    if (role === null) {
      void navigate({ to: "/dashboard", replace: true });
      return;
    }
    if (role !== "seller" && role !== "admin") {
      void navigate({ to: roleHomePath(role), replace: true });
    }
  }, [currentUser, loading, role, roleLoading, ready, navigate]);

  if (!ready) {
    return <WorkspaceLoading label="Loading seller workspace…" />;
  }

  if (!currentUser || (role !== "seller" && role !== "admin")) {
    return <WorkspaceLoading label="Redirecting…" />;
  }

  return (
    <DashboardShell title="Seller" items={items}>
      <Outlet />
    </DashboardShell>
  );
}

function WorkspaceLoading({ label }: { label: string }) {
  return (
    <div className="min-h-[60vh] grid place-items-center text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}
