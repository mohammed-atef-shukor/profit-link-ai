import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-muted/50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center size-8 rounded-xl bg-gradient-primary shadow-elegant">
                <Sparkles className="size-4 text-primary-foreground" />
              </span>
              <span className="font-display text-lg font-bold">
                LinkProfit <span className="text-gradient-primary">AI</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The AI-powered affiliate marketplace that turns every product into an income opportunity.
            </p>
          </div>
          <FooterCol title="Product" items={[
            { label: "Features", href: "#features" },
            { label: "For Sellers", href: "#sellers" },
            { label: "For Marketers", href: "#marketers" },
            { label: "AI Assistant", href: "#ai" },
          ]} />
          <FooterCol title="Company" items={[
            { label: "About", href: "#" },
            { label: "Blog", href: "#" },
            { label: "Careers", href: "#" },
            { label: "Contact", href: "#" },
          ]} />
          <FooterCol title="Get Started" items={[
            { label: "Login", to: "/login" },
            { label: "Create account", to: "/register" },
          ]} />
        </div>
        <div className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LinkProfit AI. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; href?: string; to?: string }>;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {items.map((i) => (
          <li key={i.label}>
            {i.to ? (
              <Link to={i.to} className="text-sm text-muted-foreground hover:text-foreground">
                {i.label}
              </Link>
            ) : (
              <a href={i.href} className="text-sm text-muted-foreground hover:text-foreground">
                {i.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
