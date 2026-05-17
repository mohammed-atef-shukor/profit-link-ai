import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useFirebaseAuth, getUserRole } from "@/hooks/use-firebase-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LinkProfit AI" }] }),
  component: DashboardRouter,
});

function DashboardRouter() {
  const navigate = useNavigate();
  const { user } = useFirebaseAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", user?.uid],
    queryFn: () => getUserRole(user!.uid),
    enabled: !!user,
  });

  useEffect(() => {
    if (isLoading || !user) return;
    if (role === "seller" || role === "admin") navigate({ to: "/seller" });
    else navigate({ to: "/marketer" });
  }, [role, isLoading, user, navigate]);

  return (
    <div className="min-h-[60vh] grid place-items-center text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}
