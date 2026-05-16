import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { supabase } from "@/integrations/supabase/client";
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <AuthSplitLayout title="Set a new password" subtitle="Choose a strong password you don't reuse elsewhere.">
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
    </AuthSplitLayout>
  );
}
