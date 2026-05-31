import { createFileRoute, Link } from "@tanstack/react-router";

import { useMemo } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {

  Megaphone,

  Link2,

  DollarSign,

  MousePointerClick,

  ArrowRight,

  TrendingUp,

} from "lucide-react";

import { toast } from "sonner";

import { listMyReferralLinks, fetchTopMyReferralLinks } from "@/lib/referrals.firestore";

import { getMarketerLinkTotals } from "@/lib/aggregates.firestore";

import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

import { getUserProfile, dismissMarketerOnboarding } from "@/lib/users.firestore";

import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";

import { EmptyState } from "@/components/dashboard/EmptyState";

import { StatCardSkeleton } from "@/components/dashboard/StatCardSkeleton";

import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

import { MarketerBadges } from "@/components/dashboard/MarketerBadges";

import { MarketerLeaderboard } from "@/components/dashboard/MarketerLeaderboard";

import {

  buildMarketerOnboardingSteps,

  isMarketerOnboardingComplete,

  marketerMotivation,

  onboardingProgress,

} from "@/lib/onboarding";

import { getFirebaseErrorMessage } from "@/lib/firebase-errors";



export const Route = createFileRoute("/_authenticated/marketer/")({

  head: () => ({ meta: [{ title: "Marketer dashboard — LinkProfit AI" }] }),

  component: MarketerOverview,

});



function MarketerOverview() {

  const { user, authReady } = useFirebaseAuth();

  const qc = useQueryClient();



  const profileQ = useQuery({

    queryKey: ["user-profile", user?.uid],

    queryFn: () => getUserProfile(user!.uid),

    enabled: authReady && !!user,

  });



  const totalsQ = useQuery({

    queryKey: ["marketer-link-totals", user?.uid],

    queryFn: () => getMarketerLinkTotals(),

    enabled: authReady && !!user,

  });



  const topLinksQ = useQuery({

    queryKey: ["marketer-top-links", user?.uid],

    queryFn: () => fetchTopMyReferralLinks(5),

    enabled: authReady && !!user,

  });



  const onboardingLinksQ = useQuery({

    queryKey: ["my-referral-links-onboarding", user?.uid],

    queryFn: listMyReferralLinks,

    enabled: authReady && !!user,

  });



  const totals = totalsQ.data ?? { linkCount: 0, clicks: 0, sales: 0, commissions: 0 };

  const conversion = totals.clicks > 0 ? (totals.sales / totals.clicks) * 100 : 0;

  const top = topLinksQ.data ?? [];

  const onboardingLinks = onboardingLinksQ.data ?? [];



  const onboardingSteps = useMemo(

    () => buildMarketerOnboardingSteps(profileQ.data, onboardingLinks),

    [profileQ.data, onboardingLinks],

  );

  const showOnboarding =

    !profileQ.data?.marketer_onboarding_dismissed && !isMarketerOnboardingComplete(onboardingSteps);



  const dismissOnboarding = useMutation({

    mutationFn: dismissMarketerOnboarding,

    onSuccess: () => {

      qc.invalidateQueries({ queryKey: ["user-profile", user?.uid] });

      toast.success("Onboarding checklist dismissed");

    },

    onError: (e) => toast.error(getFirebaseErrorMessage(e, "Could not dismiss checklist")),

  });



  return (

    <main>

      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>

          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Marketer overview</div>

          <h1 className="font-display text-3xl font-bold tracking-tight">Promote & earn</h1>

          <p className="mt-1 text-sm text-muted-foreground">Live performance from your referral links.</p>

        </div>

        <Link to="/marketer/marketplace" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant">

          Browse marketplace <ArrowRight className="size-4" />

        </Link>

      </div>



      {showOnboarding && (

        <OnboardingChecklist

          title="Start earning commissions"

          subtitle="Follow these steps to launch your first campaign."

          steps={onboardingSteps}

          progress={onboardingProgress(onboardingSteps)}

          motivation={marketerMotivation(onboardingSteps)}

          onDismiss={() => dismissOnboarding.mutate()}

        />

      )}



      <MarketerBadges clicks={totals.clicks} sales={totals.sales} commissions={totals.commissions} />



      {totalsQ.isLoading ? (

        <div className="mt-8">

          <StatCardSkeleton count={4} />

        </div>

      ) : (

        <>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Stat label="Clicks" value={String(totals.clicks)} icon={<MousePointerClick className="size-4" />} />

            <Stat label="Sales" value={String(totals.sales)} icon={<Link2 className="size-4" />} />

            <Stat label="Commissions" value={`$${totals.commissions.toFixed(2)}`} icon={<DollarSign className="size-4" />} />

            <Stat label="Active links" value={String(totals.linkCount)} icon={<Megaphone className="size-4" />} />

          </div>



          <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-soft flex items-center gap-4 transition-shadow hover:shadow-elegant">

            <span className="grid place-items-center size-10 rounded-xl bg-accent text-accent-foreground">

              <TrendingUp className="size-5" />

            </span>

            <div>

              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversion rate</div>

              <div className="font-display text-2xl font-bold">{conversion.toFixed(2)}%</div>

            </div>

          </div>

        </>

      )}



      <section className="mt-10 rounded-2xl border border-border bg-surface shadow-soft p-5">

        <div className="flex items-center justify-between gap-2 mb-3">

          <h2 className="font-display text-lg font-semibold">Top performing links</h2>

          <Link to="/marketer/links" className="text-xs font-semibold text-primary inline-flex items-center gap-1">

            View all <ArrowRight className="size-3" />

          </Link>

        </div>

        {topLinksQ.isLoading ? (

          <TableSkeleton rows={4} />

        ) : topLinksQ.error ? (

          <div className="py-6 text-center text-sm text-destructive">

            Could not load links. Try refreshing the page.

          </div>

        ) : top.length === 0 ? (

          <EmptyState

            icon={Link2}

            title="No referral links yet"

            description="Explore the marketplace, pick a product with a strong commission, and generate your first trackable link."

            action={{ label: "Explore marketplace", to: "/marketer/marketplace" }}

          />

        ) : (

          <ul className="divide-y divide-border">

            {top.map((l) => (

              <li key={l.id} className="py-3 flex items-center justify-between gap-3">

                <div className="min-w-0">

                  <div className="font-medium truncate">{l.product_title}</div>

                  <div className="text-xs text-muted-foreground">{l.commission_percent}% · {l.clicks} clicks · {l.sales} sales</div>

                </div>

                <div className="text-sm font-semibold text-primary tabular-nums">

                  ${Number(l.commissions ?? 0).toFixed(2)}

                </div>

              </li>

            ))}

          </ul>

        )}

      </section>



      {!topLinksQ.isLoading && top.length > 0 && <MarketerLeaderboard links={top} />}

    </main>

  );

}



function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {

  return (

    <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft transition-shadow hover:shadow-elegant">

      <div className="flex items-center justify-between">

        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>

        <span className="grid place-items-center size-8 rounded-lg bg-accent text-accent-foreground">{icon}</span>

      </div>

      <div className="mt-3 font-display text-3xl font-bold">{value}</div>

    </div>

  );

}

