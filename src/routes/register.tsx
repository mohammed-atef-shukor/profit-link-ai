import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail, Lock, User, Store, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Field, GoogleIcon } from "./login";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — LinkProfit AI" }] }),
  component: RegisterPage,
});

const schema = z.object({
  displayName: z.string().min(2, "At least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

type Role = "seller" | "marketer";

function RegisterPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("marketer");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; email?: string; password?: string }>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      const errs: typeof errors = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as keyof typeof errs] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName, role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — check your email to verify.");
    router.invalidate();
    navigate({ to: "/login" });
  };

  const handleGoogle = async () => {
    // Store chosen role so the trigger can use it via metadata isn't available in OAuth flow;
    // we'll fall back to default 'marketer'. (Role can be changed later.)
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    router.invalidate();
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthSplitLayout title="Create your account" subtitle="Choose how you want to use LinkProfit AI.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">I want to…</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <RoleCard
              active={role === "seller"} onClick={() => setRole("seller")}
              icon={<Store className="size-5" />}
              title="Sell products"
              desc="List products & recruit affiliates"
            />
            <RoleCard
              active={role === "marketer"} onClick={() => setRole("marketer")}
              icon={<Megaphone className="size-5" />}
              title="Promote & earn"
              desc="Share links, earn commissions"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold hover:bg-muted disabled:opacity-60"
        >
          {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or with email</span></div>
        </div>

        <Field label="Full name" icon={<User className="size-4" />} error={errors.displayName}>
          <input
            value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Jane Doe" autoComplete="name"
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
        </Field>

        <Field label="Email" icon={<Mail className="size-4" />} error={errors.email}>
          <input
            type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com"
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
        </Field>

        <Field label="Password" icon={<Lock className="size-4" />} error={errors.password}>
          <input
            type="password" autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
        </Field>

        <button
          type="submit" disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 disabled:opacity-60"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Create account
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}

function RoleCard({
  active, onClick, icon, title, desc,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      type="button" onClick={onClick}
      className={cn(
        "text-left rounded-xl border p-4 transition-all",
        active
          ? "border-primary/60 bg-accent shadow-elegant"
          : "border-border bg-surface hover:bg-muted"
      )}
    >
      <span className={cn(
        "grid place-items-center size-9 rounded-lg",
        active ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-foreground"
      )}>
        {icon}
      </span>
      <div className="mt-3 font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
