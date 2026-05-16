import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Link2, DollarSign, MousePointerClick } from "lucide-react";
import { ComingSoonDashboard } from "@/components/layout/ComingSoonDashboard";

export const Route = createFileRoute("/_authenticated/marketer")({
  head: () => ({ meta: [{ title: "Marketer dashboard — LinkProfit AI" }] }),
  component: () => (
    <ComingSoonDashboard
      role="Marketer"
      icon={<Megaphone className="size-5" />}
      stats={[
        { label: "Clicks", value: "—", icon: <MousePointerClick className="size-4" /> },
        { label: "Sales", value: "—", icon: <Link2 className="size-4" /> },
        { label: "Earnings", value: "—", icon: <DollarSign className="size-4" /> },
        { label: "Active campaigns", value: "—", icon: <Megaphone className="size-4" /> },
      ]}
      next={["Explore the marketplace", "Generate your first referral link", "Use the AI assistant to draft a post"]}
    />
  ),
});
