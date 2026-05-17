import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail, Lock, User, Store, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { auth, db, googleProvider } from "@/integrations/firebase/client";
import { Field, GoogleIcon } from "./login";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — LinkProfit AI" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    role: s.role === "seller" || s.role === "marketer" ? (s.role as Role) : undefined,
  }),
  component: RegisterPage,
});

const schema = z.object({
  displayName: z.string().min(2, "At least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

type Role = "seller" | "marketer";

async function ensureUserDoc(uid: string, payload: { display_name: string; role: Role; email: string | null }) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    display_name: payload.display_name,
    email: payload.email,
    role: payload.role,
    created_at: serverTimestamp(),
  });
}

function RegisterPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [role, setRole] = useState<Role>(search.role ?? "marketer");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; email?: string; password?: string }>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) navigate({ to: "/dashboard" });
    });
    return unsub;
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
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await ensureUserDoc(cred.user.uid, { display_name: displayName, role, email });
      toast.success("Account created!");
      router.invalidate();
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(cred.user.uid, {
        display_name: cred.user.displayName ?? (cred.user.email?.split("@")[0] ?? "User"),
        role,
        email: cred.user.email,
      });
      router.invalidate();
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
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
