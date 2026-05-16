import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { getMyRole } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LinkProfit AI" }] }),
  component: DashboardRouter,
});

function DashboardRouter() {
  const navigate = useNavigate();
  const fetchRole = useServerFn(getMyRole);
  const { data, isLoading } = useQuery({
    queryKey: ["my-role"],
    queryFn: () => fetchRole(),
  });

  useEffect(() => {
    if (!data) return;
    if (data.role === "seller") navigate({ to: "/seller" });
    else if (data.role === "marketer") navigate({ to: "/marketer" });
    else if (data.role === "admin") navigate({ to: "/seller" });
    else navigate({ to: "/marketer" });
  }, [data, navigate]);

  return (
    <div className="min-h-[60vh] grid place-items-center text-muted-foreground">
      {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Loading dashboard…"}
    </div>
  );
}
