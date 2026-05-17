import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight, Sparkles, Link2, MousePointerClick, BarChart3, Wand2, Shield, Zap,
  Store, Users, Bot, TrendingUp, DollarSign, CheckCircle2, Globe2,
} from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.jpg";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LinkProfit AI — AI-Powered Affiliate Marketplace" },
      { name: "description", content: "Turn products into income opportunities. Sellers grow revenue, marketers earn commissions — all powered by AI." },
      { property: "og:title", content: "LinkProfit AI — AI-Powered Affiliate Marketplace" },
      { property: "og:description", content: "AI-powered affiliate marketplace for sellers and marketers." },
    ],
  }),
  component: LandingPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SiteNav />
      <main>
        <Hero />
        <LogosBand />
        <Problem />
        <Solution />
        <HowItWorks />
        <Features />
        <SellersSection />
        <MarketersSection />
        <AIAssistant />
        <BusinessModel />
        <Impact />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="absolute inset-0 bg-gradient-mesh opacity-70" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 backdrop-blur px-3 py-1 text-xs font-medium text-foreground shadow-soft">
            <Sparkles className="size-3.5 text-primary" />
            New: AI campaign generator is live
          </span>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            Turn Products into{" "}
            <span className="text-gradient-primary">Income Opportunities</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            LinkProfit AI is the smart affiliate marketplace that connects sellers and marketers — with referral tracking, real-time analytics, and AI that writes campaigns for you.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              search={{ role: "seller" }}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 active:scale-[0.98] transition"
            >
              Start as Seller
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/register"
              search={{ role: "marketer" }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition"
            >
              Start as Marketer
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-foreground/80 hover:text-foreground transition"
            >
              Explore Marketplace
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-success" /> No setup fees</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-success" /> Pay on results</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-success" /> Cancel anytime</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-6xl"
        >
          <div className="relative rounded-3xl border border-border bg-surface/60 backdrop-blur p-2 shadow-elegant">
            <img
              src={heroDashboard}
              alt="LinkProfit AI dashboard preview"
              width={1920}
              height={1080}
              className="rounded-2xl w-full h-auto"
            />
            <FloatingStat className="absolute -left-4 sm:-left-10 top-12 hidden sm:flex" label="Clicks today" value="12,394" delta="+18%" />
            <FloatingStat className="absolute -right-4 sm:-right-10 bottom-16 hidden sm:flex" label="Revenue" value="$48.2k" delta="+32%" tone="primary" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FloatingStat({
  label, value, delta, tone = "default", className = "",
}: { label: string; value: string; delta: string; tone?: "default" | "primary"; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className={`glass rounded-2xl shadow-glass p-4 min-w-[180px] ${className}`}
    >
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`font-display text-2xl font-bold ${tone === "primary" ? "text-gradient-primary" : ""}`}>{value}</span>
        <span className="text-xs font-semibold text-success">{delta}</span>
      </div>
    </motion.div>
  );
}

/* ---------- LOGO BAND ---------- */
function LogosBand() {
  const logos = ["Atlas Goods", "NorthPeak", "Lumen Labs", "Forma Studio", "Bright Co.", "Verdant"];
  return (
    <section className="border-y border-border bg-surface-muted/40 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Trusted by ambitious brands and creators
        </p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {logos.map((n) => (
            <div key={n} className="text-center font-display text-lg font-semibold text-muted-foreground/70">
              {n}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- PROBLEM ---------- */
function Problem() {
  const items = [
    { icon: Store, title: "Sellers struggle to scale reach", body: "Hiring affiliates is slow, fragmented and hard to track without proper tooling." },
    { icon: Users, title: "Marketers waste time hunting offers", body: "Finding quality products and trustworthy commissions is a daily friction." },
    { icon: BarChart3, title: "Tracking & payouts are messy", body: "Spreadsheets, manual reports, and delayed payouts hurt growth on both sides." },
  ];
  return (
    <Section id="problem" eyebrow="The problem" title="Affiliate marketing is broken in 2026.">
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, title, body }, i) => (
          <motion.div key={title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}>
            <div className="h-full rounded-2xl border border-border bg-surface p-7 shadow-soft hover:shadow-elegant transition-shadow">
              <span className="grid place-items-center size-11 rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- SOLUTION ---------- */
function Solution() {
  return (
    <Section id="solution" eyebrow="The solution" title="One platform. Two sides. AI in the middle.">
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div {...fadeUp}>
          <p className="text-lg text-muted-foreground leading-relaxed">
            LinkProfit AI is a unified marketplace where sellers list products with commissions, marketers grab referral links, and our AI generates the marketing for both sides.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "Automatic referral link generation and click tracking",
              "Real-time commissions, orders, and payouts",
              "AI-generated descriptions, posts and campaign ideas",
              "Role-based dashboards for sellers, marketers and admins",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="size-5 shrink-0 text-success" />
                <span className="text-foreground/90">{t}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
          <div className="relative rounded-3xl bg-gradient-primary p-1 shadow-elegant">
            <div className="rounded-[20px] bg-surface p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overview</span>
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">Live</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Clicks", value: "8.4k" },
                  { label: "Orders", value: "612" },
                  { label: "Revenue", value: "$24.1k" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-surface-muted p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                    <div className="mt-1 font-display text-lg font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-surface-muted p-4">
                <SparkChart />
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { name: "Luma Lamp", rate: "18%", revenue: "$3,240" },
                  { name: "Atlas Bag", rate: "22%", revenue: "$2,180" },
                  { name: "Nova Speaker", rate: "15%", revenue: "$1,990" },
                ].map((r) => (
                  <div key={r.name} className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-gradient-primary" />
                      <span className="font-medium">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-accent-foreground bg-accent rounded-full px-2 py-0.5">{r.rate}</span>
                      <span className="font-semibold">{r.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

function SparkChart() {
  const points = [12, 24, 18, 38, 32, 52, 44, 68, 60, 82, 76, 96];
  const max = Math.max(...points);
  const w = 360, h = 80;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - (p / max) * h;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${w},${h} L0,${h} Z`} fill="url(#sparkFill)" />
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- HOW IT WORKS ---------- */
function HowItWorks() {
  const steps = [
    { icon: Store, title: "List or browse", body: "Sellers publish products with commission rates. Marketers discover offers in the marketplace." },
    { icon: Link2, title: "Generate referral links", body: "One-click link generation, instant tracking and beautiful share assets." },
    { icon: MousePointerClick, title: "Drive traffic & sales", body: "Promote with AI-generated posts, captions and campaigns tailored to your audience." },
    { icon: DollarSign, title: "Earn & get paid", body: "Real-time attribution, automated commission calculation and scheduled payouts." },
  ];
  return (
    <Section id="how" eyebrow="How it works" title="From product to paycheck in four steps.">
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, body }, i) => (
          <motion.div key={title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}>
            <div className="relative h-full rounded-2xl border border-border bg-surface p-6 shadow-soft">
              <div className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-elegant">
                STEP {String(i + 1).padStart(2, "0")}
              </div>
              <span className="grid place-items-center size-11 rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- FEATURES ---------- */
function Features() {
  const items = [
    { icon: Link2, title: "Smart referral tracking", body: "Tamper-proof links with device, geo and source attribution baked in." },
    { icon: BarChart3, title: "Real-time analytics", body: "Clicks, orders, conversion and revenue updated as they happen." },
    { icon: Wand2, title: "AI marketing assistant", body: "Generate captions, posts, slogans and campaign ideas in seconds." },
    { icon: Shield, title: "Built-in fraud protection", body: "Bot filtering and anomaly detection keep commissions clean." },
    { icon: Zap, title: "Lightning payouts", body: "Automated commission calc and scheduled, transparent payouts." },
    { icon: Globe2, title: "Global by default", body: "Multi-currency ready, localized content and region-aware tracking." },
  ];
  return (
    <Section id="features" eyebrow="Features" title="Everything you need to run a modern affiliate program.">
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, body }, i) => (
          <motion.div key={title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.04 }}>
            <div className="h-full rounded-2xl border border-border bg-surface p-6 hover:-translate-y-0.5 hover:shadow-elegant transition-all">
              <span className="grid place-items-center size-10 rounded-xl bg-gradient-primary shadow-elegant">
                <Icon className="size-5 text-primary-foreground" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- SELLERS ---------- */
function SellersSection() {
  return (
    <Section id="sellers" eyebrow="For Sellers" title="Recruit a global affiliate team in minutes.">
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div {...fadeUp}>
          <ul className="space-y-4">
            {[
              { t: "Add products with rich media and commission rules", d: "Flexible commission per product, category or marketer tier." },
              { t: "Track affiliate performance in real time", d: "Leaderboards, top performers, drop-off analytics." },
              { t: "AI product descriptions and listing assets", d: "Generate copy that converts and matches your brand voice." },
              { t: "Centralized orders, revenue and payouts", d: "One source of truth for everything your program produces." },
            ].map((i) => (
              <li key={i.t} className="flex gap-4">
                <span className="mt-0.5 grid place-items-center size-8 shrink-0 rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
                  <CheckCircle2 className="size-4" />
                </span>
                <div>
                  <div className="font-semibold">{i.t}</div>
                  <div className="text-sm text-muted-foreground">{i.d}</div>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95"
          >
            Start as Seller <ArrowRight className="size-4" />
          </Link>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="relative">
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-elegant">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seller dashboard</div>
                <div className="mt-1 font-display text-xl font-semibold">Atlas Goods</div>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">22 affiliates</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { l: "Products", v: "48" },
                { l: "Orders", v: "1,204" },
                { l: "Revenue", v: "$84.2k" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-surface-muted p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.l}</div>
                  <div className="mt-1 font-display text-lg font-bold">{s.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-surface-muted p-4">
              <SparkChart />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Luma Lamp", "Atlas Bag", "Nova Speaker"].map((p) => (
                <div key={p} className="rounded-xl bg-surface-muted p-3">
                  <div className="aspect-square rounded-lg bg-gradient-primary" />
                  <div className="mt-2 text-xs font-semibold">{p}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ---------- MARKETERS ---------- */
function MarketersSection() {
  return (
    <Section id="marketers" eyebrow="For Marketers" title="Find offers worth promoting. Get paid faster." dark>
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div {...fadeUp} className="order-2 lg:order-1">
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-elegant">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marketer earnings</div>
                <div className="mt-1 font-display text-xl font-semibold">This month</div>
              </div>
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">+42% MoM</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gradient-primary p-4 text-primary-foreground">
                <div className="text-xs font-semibold opacity-80">Earnings</div>
                <div className="mt-1 font-display text-3xl font-bold">$6,421</div>
              </div>
              <div className="rounded-xl bg-surface-muted p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clicks</div>
                <div className="mt-1 font-display text-3xl font-bold">14.8k</div>
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              {[
                { name: "Luma Lamp", link: "lpf.ai/luma-72f", clicks: "3.2k" },
                { name: "Nova Speaker", link: "lpf.ai/nova-9a1", clicks: "2.7k" },
                { name: "Atlas Bag", link: "lpf.ai/atlas-1b8", clicks: "1.9k" },
              ].map((r) => (
                <div key={r.name} className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2.5">
                  <div>
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.link}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{r.clicks}</div>
                    <div className="text-[10px] text-muted-foreground">clicks</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="order-1 lg:order-2">
          <ul className="space-y-4">
            {[
              { t: "Browse vetted products and commissions", d: "Filter by category, payout, conversion rate and seller score." },
              { t: "One-click referral links and share assets", d: "Generate trackable links with branded short URLs and QR codes." },
              { t: "AI-written posts, captions and campaign ideas", d: "Spin up content for any channel in seconds." },
              { t: "Transparent earnings and fast payouts", d: "Watch commissions accrue in real-time, withdraw any time." },
            ].map((i) => (
              <li key={i.t} className="flex gap-4">
                <span className="mt-0.5 grid place-items-center size-8 shrink-0 rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
                  <CheckCircle2 className="size-4" />
                </span>
                <div>
                  <div className="font-semibold">{i.t}</div>
                  <div className="text-sm text-muted-foreground">{i.d}</div>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Start as Marketer <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}

/* ---------- AI ASSISTANT ---------- */
function AIAssistant() {
  return (
    <Section id="ai" eyebrow="AI Assistant" title="Marketing copy, written by AI. Tuned for conversion.">
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div {...fadeUp}>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Generate product descriptions, social posts, slogans, campaign briefs and target-audience suggestions — instantly tailored to your brand voice and channel.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { icon: Wand2, t: "Product descriptions" },
              { icon: Bot, t: "Social media posts" },
              { icon: Sparkles, t: "Campaign ideas" },
              { icon: TrendingUp, t: "Audience targeting" },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <span className="grid place-items-center size-9 rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-semibold">{t}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
          <div className="rounded-3xl border border-border bg-surface p-2 shadow-elegant">
            <div className="rounded-[20px] bg-gradient-soft p-6">
              <div className="flex items-center gap-2">
                <span className="grid place-items-center size-8 rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
                  <Bot className="size-4" />
                </span>
                <span className="font-display text-sm font-semibold">LinkProfit AI Assistant</span>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-gradient-primary px-4 py-2.5 text-primary-foreground shadow-elegant">
                  Write 3 Instagram captions for "Luma Lamp" targeting cozy home aesthetics.
                </div>
                <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-surface border border-border px-4 py-3 shadow-soft">
                  <p className="text-foreground/90">Here are 3 caption options:</p>
                  <ul className="mt-2 space-y-2 text-foreground/80">
                    <li>• "Soft glow, slow nights. Luma Lamp turns any room into a sanctuary. ✨"</li>
                    <li>• "Your evenings called. They want warmer lighting. 🕯️"</li>
                    <li>• "Mood-first lighting for the cozy-core era. Tap to shop."</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-muted">Regenerate</button>
                  <button className="rounded-full bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Use these</button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ---------- BUSINESS MODEL ---------- */
function BusinessModel() {
  const items = [
    { title: "Transaction fees", body: "We take a small share of completed affiliate sales — only when you earn." },
    { title: "AI credits", body: "Unlimited basic AI generations; premium models on pay-as-you-go credits." },
    { title: "Pro tier (optional)", body: "Advanced analytics, custom domains, branded payouts and priority support." },
  ];
  return (
    <Section id="business" eyebrow="Business model" title="Aligned with your growth. Always.">
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((i, idx) => (
          <motion.div key={i.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: idx * 0.06 }}>
            <div className="h-full rounded-2xl border border-border bg-surface p-7 shadow-soft">
              <div className="font-display text-4xl font-bold text-gradient-primary">0{idx + 1}</div>
              <h3 className="mt-3 font-display text-xl font-semibold">{i.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{i.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- IMPACT ---------- */
function Impact() {
  const stats = [
    { v: "12,400+", l: "Active marketers" },
    { v: "$4.8M", l: "Paid in commissions" },
    { v: "3.2×", l: "Avg. seller revenue lift" },
    { v: "62%", l: "Time saved with AI" },
  ];
  return (
    <section className="relative my-24 mx-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-primary p-1 shadow-elegant">
        <div className="relative rounded-[22px] bg-surface px-8 py-14 sm:px-14">
          <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Impact</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">
              Real results across thousands of brands and creators.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.l} className="rounded-2xl border border-border bg-surface/80 backdrop-blur p-5">
                  <div className="font-display text-3xl font-bold text-gradient-primary">{s.v}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FINAL CTA ---------- */
function FinalCTA() {
  return (
    <Section id="cta">
      <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 sm:p-16 text-center text-primary-foreground shadow-elegant">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
        <div className="relative">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Start earning together — today.
          </h2>
          <p className="mt-4 text-white/85 max-w-xl mx-auto">
            Join thousands of sellers and marketers using LinkProfit AI to grow revenue with referrals and AI-powered content.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="rounded-full bg-white text-primary px-6 py-3 text-sm font-semibold shadow-elegant hover:opacity-95">
              Create your account
            </Link>
            <Link to="/login" className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10">
              Login
            </Link>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}

/* ---------- SECTION SHELL ---------- */
function Section({
  id, eyebrow, title, children, dark = false,
}: { id?: string; eyebrow?: string; title?: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <section id={id} className={`py-20 sm:py-28 ${dark ? "bg-surface-muted/50" : ""}`}>
      <div className="mx-auto max-w-7xl px-6">
        {(eyebrow || title) && (
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
            )}
            {title && (
              <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight">
                {title}
              </h2>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}
