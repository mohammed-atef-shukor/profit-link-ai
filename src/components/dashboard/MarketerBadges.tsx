import { Flame, Rocket, Trophy } from "lucide-react";

type MarketerBadgesProps = {
  clicks: number;
  sales: number;
  commissions: number;
};

export function MarketerBadges({ clicks, sales, commissions }: MarketerBadgesProps) {
  const badges: Array<{ icon: typeof Flame; label: string; earned: boolean }> = [
    { icon: Flame, label: "Rising", earned: clicks >= 5 && sales === 0 },
    { icon: Trophy, label: "Top earner", earned: commissions >= 100 },
    { icon: Rocket, label: "Fast growth", earned: clicks >= 25 || sales >= 3 },
  ];

  const earned = badges.filter((b) => b.earned);
  if (earned.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {earned.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold"
        >
          <Icon className="size-3.5 text-primary" />
          {label}
        </span>
      ))}
    </div>
  );
}
