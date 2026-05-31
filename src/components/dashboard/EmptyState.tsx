import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    to: string;
    onClick?: () => void;
  };
  children?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="py-12 px-6 text-center">
      <div className="mx-auto grid place-items-center size-14 rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
        <Icon className="size-6" />
      </div>
      <h2 className="mt-5 font-display text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{description}</p>
      {action && (
        <div className="mt-6">
          {action.onClick ? (
            <Button onClick={action.onClick} className="gap-2">
              {action.label}
            </Button>
          ) : (
            <Button asChild className="gap-2">
              <Link to={action.to}>{action.label}</Link>
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
