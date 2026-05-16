import { createFileRoute } from "@tanstack/react-router";
import { Store, Package, TrendingUp, Users } from "lucide-react";
import { ComingSoonDashboard } from "@/components/layout/ComingSoonDashboard";

export const Route = createFileRoute("/_authenticated/seller")({
  head: () => ({ meta: [{ title: "Seller dashboard — LinkProfit AI" }] }),
  component: () => (
    <ComingSoonDashboard
      role="Seller"
      icon={<Store className="size-5" />}
      stats={[
        { label: "Products", value: "—", icon: <Package className="size-4" /> },
        { label: "Active affiliates", value: "—", icon: <Users className="size-4" /> },
        { label: "Revenue", value: "—", icon: <TrendingUp className="size-4" /> },
        { label: "Orders", value: "—", icon: <Package className="size-4" /> },
      ]}
      next={["Add your first product", "Set commission tiers", "Invite affiliates"]}
    />
  ),
});
