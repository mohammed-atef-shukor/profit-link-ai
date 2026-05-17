import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { sendPasswordResetEmail } from "firebase/auth";

import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { auth } from "@/integrations/firebase/client";
import { Field } from "./login";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — LinkProfit AI" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
      });
      setSent(true);
      toast.success("Reset link sent. Check your inbox.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout title="Forgot your password?" subtitle="We'll email you a link to reset it.">
      {sent ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-sm">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-muted-foreground">
            We sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            ← Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email" icon={<Mail className="size-4" />}>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
            />
          </Field>
          <button
            type="submit" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Send reset link
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Back to login</Link>
          </p>
        </form>
      )}
    </AuthSplitLayout>
  );
}
