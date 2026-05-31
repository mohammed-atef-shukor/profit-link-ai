import { Link } from "@tanstack/react-router";
import { Sparkles, Quote } from "lucide-react";
import type { ReactNode } from "react";

export function AuthSplitLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <Link to="/" className="flex items-center gap-2 self-start">
          <span className="grid place-items-center size-9 rounded-xl bg-gradient-primary shadow-elegant">
            <Sparkles className="size-4 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-bold">
            LinkProfit <span className="text-gradient-primary">AI</span>
          </span>
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md py-10">
            <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} LinkProfit AI
        </p>
      </div>

      <div className="hidden lg:flex relative overflow-hidden bg-gradient-primary p-12">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        <div className="absolute -bottom-32 -right-32 size-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -top-20 -left-20 size-[24rem] rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col justify-between text-primary-foreground">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="size-1.5 rounded-full bg-white" /> Live marketplace
            </span>
            <h2 className="mt-6 font-display text-4xl font-bold leading-tight">
              Where products meet performance.
            </h2>
            <p className="mt-4 max-w-md text-white/80">
              Launch products, recruit affiliates, and grow revenue with AI-powered tools built for modern commerce.
            </p>
          </div>

          <div className="grid gap-4">
            <Stat label="Active marketers" value="12,400+" />
            <Stat label="Avg. seller revenue lift" value="3.2×" />
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur border border-white/20">
              <Quote className="size-5 opacity-70" />
              <p className="mt-3 text-sm leading-relaxed">
                "LinkProfit AI helps sellers grow faster through affiliate marketing, smart tracking, and AI-powered promotion."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="grid place-items-center size-9 shrink-0 rounded-full bg-white/30 text-xs font-semibold">
                  MS
                </div>
                <div>
                  <div className="text-sm font-semibold">Mohammed Atef Shokor</div>
                  <div className="text-xs text-white/70">Founder, LinkProfit AI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur border border-white/15">
      <span className="text-sm text-white/80">{label}</span>
      <span className="font-display text-xl font-bold">{value}</span>
    </div>
  );
}
