import { createFileRoute } from "@tanstack/react-router";

import { useCallback, useState } from "react";

import { Copy, Check, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";

import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

import { DataTablePagination } from "@/components/dashboard/DataTablePagination";

import { Button } from "@/components/ui/button";

import { toast } from "sonner";

import { fetchMyReferralLinksPage, buildShareUrl } from "@/lib/referrals.firestore";

import { useFirestorePagination } from "@/hooks/use-firestore-pagination";

import { useFirebaseAuth } from "@/hooks/use-firebase-auth";



export const Route = createFileRoute("/_authenticated/marketer/links")({

  head: () => ({ meta: [{ title: "My Links — Marketer — LinkProfit AI" }] }),

  component: MarketerLinks,

});



function MarketerLinks() {

  const { user, authReady } = useFirebaseAuth();



  const fetchPage = useCallback(

    (pageSize: number, cursor: Parameters<typeof fetchMyReferralLinksPage>[1]) =>

      fetchMyReferralLinksPage(pageSize, cursor),

    [],

  );



  const pagination = useFirestorePagination(fetchPage, [user?.uid], {

    enabled: authReady && !!user,

  });



  const rows = pagination.items;



  return (

    <main>

      <div>

        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Marketer</div>

        <h1 className="font-display text-3xl font-bold tracking-tight">My referral links</h1>

        <p className="mt-1 text-sm text-muted-foreground">Share anywhere. Clicks &amp; sales update live.</p>

      </div>



      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">

        {pagination.isLoading && rows.length === 0 ? (

          <TableSkeleton rows={5} />

        ) : rows.length === 0 && !pagination.isLoading ? (

          <EmptyState

            icon={Sparkles}

            title="No referral links yet"

            description="Pick a high-commission product from the marketplace and generate a trackable link to start earning."

            action={{ label: "Browse marketplace", to: "/marketer/marketplace" }}

          />

        ) : (

          <>

            <table className="w-full text-sm">

              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">

                <tr>

                  <th className="text-left px-5 py-3 font-semibold">Product</th>

                  <th className="text-left px-5 py-3 font-semibold">Share URL</th>

                  <th className="text-right px-5 py-3 font-semibold">Clicks</th>

                  <th className="text-right px-5 py-3 font-semibold">Sales</th>

                  <th className="text-right px-5 py-3 font-semibold">Commissions</th>

                </tr>

              </thead>

              <tbody>

                {rows.map((l) => (

                  <tr key={l.id} className="border-t border-border">

                    <td className="px-5 py-4">

                      <div className="font-medium">{l.product_title}</div>

                      <div className="text-xs text-muted-foreground">

                        ${l.product_price.toFixed(2)} · {l.commission_percent}% commission

                      </div>

                    </td>

                    <td className="px-5 py-4"><CopyUrl url={buildShareUrl(l.code)} /></td>

                    <td className="px-5 py-4 text-right font-medium">{l.clicks}</td>

                    <td className="px-5 py-4 text-right">{l.sales}</td>

                    <td className="px-5 py-4 text-right font-semibold text-primary">${Number(l.commissions ?? 0).toFixed(2)}</td>

                  </tr>

                ))}

              </tbody>

            </table>

            <DataTablePagination

              page={pagination.page}

              rangeStart={pagination.rangeStart}

              rangeEnd={pagination.rangeEnd}

              hasPrev={pagination.hasPrev}

              hasNext={pagination.hasNext}

              isLoading={pagination.isLoading}

              onPrev={pagination.prevPage}

              onNext={pagination.nextPage}

            />

          </>

        )}

      </div>

    </main>

  );

}



function CopyUrl({ url }: { url: string }) {

  const [copied, setCopied] = useState(false);

  const onCopy = async () => {

    try {

      await navigator.clipboard.writeText(url);

      setCopied(true);

      toast.success("Link copied");

      setTimeout(() => setCopied(false), 1800);

    } catch {

      toast.error("Could not copy");

    }

  };

  return (

    <div className="flex items-center gap-2 max-w-md">

      <code className="flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs">{url}</code>

      <Button size="sm" variant="outline" onClick={onCopy} className="gap-1.5">

        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}

        {copied ? "Copied" : "Copy"}

      </Button>

    </div>

  );

}


