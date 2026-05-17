import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { auth } from "@/integrations/firebase/client";
import { Field } from "./login";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — LinkProfit AI" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("oobCode");
    if (!code) {
      setVerifying(false);
      return;
    }
    setOobCode(code);
    verifyPasswordResetCode(auth, code)
      .then((email) => setVerifiedEmail(email))
      .catch(() => toast.error("Reset link is invalid or expired"))
      .finally(() => setVerifying(false));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return toast.error("Missing reset code");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast.success("Password updated. Please sign in.");
      navigate({ to: "/login" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout title="Set a new password" subtitle={verifiedEmail ? `For ${verifiedEmail}` : "Choose a strong password you don't reuse elsewhere."}>
      {verifying ? (
        <div className="grid place-items-center py-12 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
      ) : !oobCode ? (
        <div className="rounded-xl border border-destructive/40 bg-surface p-6 text-sm">
          <p className="font-medium">Invalid reset link</p>
          <p className="mt-1 text-muted-foreground">Request a new one from the forgot password page.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            Request new link
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="New password" icon={<Lock className="size-4" />}>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
            />
          </Field>
          <Field label="Confirm password" icon={<Lock className="size-4" />}>
            <input
              type="password" required value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
            />
          </Field>
          <button
            type="submit" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Update password
          </button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-primary hover:underline">Back to login</Link>
          </p>
        </form>
      )}
    </AuthSplitLayout>
  );
}
