import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";

import { useEffect } from "react";

import { Loader2, LayoutDashboard, Store, Link2, ShoppingBag, DollarSign, Settings } from "lucide-react";

import { DashboardShell, type DashboardNavItem } from "@/components/layout/DashboardShell";

import { useAuth } from "@/hooks/useAuth";

import { isAuthReady, roleHomePath } from "@/lib/auth-guard";



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

  const { currentUser, loading, role, roleLoading } = useAuth();

  const ready = isAuthReady(loading, roleLoading, currentUser);



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

    if (role !== "marketer") {

      void navigate({ to: roleHomePath(role), replace: true });

    }

  }, [currentUser, loading, role, roleLoading, ready, navigate]);



  if (!ready) {

    return <RoleLoadingState label="Loading marketer workspace…" />;

  }



  if (!currentUser || role !== "marketer") {

    return <RoleLoadingState label="Redirecting…" />;

  }



  return (

    <DashboardShell title="Marketer" items={items}>

      <Outlet />

    </DashboardShell>

  );

}



function RoleLoadingState({ label }: { label: string }) {

  return (

    <div className="min-h-[60vh] grid place-items-center text-muted-foreground" role="status" aria-live="polite">

      <Loader2 className="size-5 animate-spin" aria-hidden />

      <span className="sr-only">{label}</span>

    </div>

  );

}


