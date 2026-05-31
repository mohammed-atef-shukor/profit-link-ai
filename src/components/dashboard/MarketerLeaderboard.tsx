import { Trophy } from "lucide-react";
import type { ReferralLink } from "@/lib/referrals.firestore";

type MarketerLeaderboardProps = {
  links: ReferralLink[];
  limit?: number;
};

/** Personal performance leaderboard from the marketer's own referral links. */
export function MarketerLeaderboard({ links, limit = 5 }: MarketerLeaderboardProps) {
  const ranked = [...links]
    .sort((a, b) => (b.commissions ?? 0) - (a.commissions ?? 0) || (b.clicks ?? 0) - (a.clicks ?? 0))
    .slice(0, limit);

  if (ranked.length === 0) return null;

  return (
    <section className="mt-10 rounded-2xl border border-border bg-surface shadow-soft p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="size-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">Top campaigns this month</h2>
      </div>
      <ul className="divide-y divide-border">
        {ranked.map((l, i) => (
          <li key={l.id} className="py-3 flex items-center gap-4">
            <span
              className={`grid place-items-center size-8 shrink-0 rounded-full text-xs font-bold ${
                i === 0
                  ? "bg-gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{l.product_title}</div>
              <div className="text-xs text-muted-foreground">
                {l.clicks ?? 0} clicks · {l.sales ?? 0} sales
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-primary tabular-nums">
                ${Number(l.commissions ?? 0).toFixed(2)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">earned</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
