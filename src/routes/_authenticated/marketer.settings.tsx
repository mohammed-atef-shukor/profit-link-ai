import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { updateProfile as updateAuthProfile } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dashboardFormWidth } from "@/components/layout/DashboardShell";
import { auth } from "@/firebase";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { getUserProfile, updateUserProfile } from "@/lib/users.firestore";

export const Route = createFileRoute("/_authenticated/marketer/settings")({
  head: () => ({ meta: [{ title: "Settings — Marketer — LinkProfit AI" }] }),
  component: MarketerSettings,
});

const schema = z.object({
  display_name: z.string().trim().min(2, "At least 2 characters").max(80),
  payout_email: z.string().trim().email("Invalid email").max(200).optional().or(z.literal("")),
  payout_method: z.enum(["paypal", "bank"]).optional(),
  payout_details: z.string().trim().max(500).optional().or(z.literal("")),
});

function MarketerSettings() {
  const { user } = useFirebaseAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ["my-profile", user?.uid],
    queryFn: () => getUserProfile(user!.uid),
    enabled: !!user,
  });

  const [form, setForm] = useState({
    display_name: "",
    payout_email: "",
    payout_method: "paypal" as "paypal" | "bank",
    payout_details: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile.data) {
      setForm({
        display_name: profile.data.display_name ?? "",
        payout_email: profile.data.payout_email ?? "",
        payout_method: (profile.data.payout_method as "paypal" | "bank") ?? "paypal",
        payout_details: profile.data.payout_details ?? "",
      });
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) {
        const errs: Record<string, string> = {};
        parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
        setErrors(errs);
        throw new Error("Fix the highlighted fields");
      }
      setErrors({});
      await updateUserProfile({
        display_name: form.display_name,
        payout_email: form.payout_email || null,
        payout_method: form.payout_method,
        payout_details: form.payout_details || null,
      });
      if (auth.currentUser && form.display_name !== auth.currentUser.displayName) {
        await updateAuthProfile(auth.currentUser, { displayName: form.display_name });
      }
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["user-profiles"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  return (
    <main>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Marketer</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your profile and payout preferences.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        className={`mt-8 grid gap-6 ${dashboardFormWidth}`}
      >
        <Section title="Profile">
          <Row label="Display name" error={errors.display_name}>
            <Input
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              maxLength={80}
            />
          </Row>
          <Row label="Account email">
            <Input value={user?.email ?? ""} disabled readOnly />
          </Row>
        </Section>

        <Section title="Payout">
          <Row label="Method">
            <div className="flex gap-2">
              {(["paypal", "bank"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setForm((f) => ({ ...f, payout_method: m }))}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    form.payout_method === m
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-surface hover:bg-muted"
                  }`}
                >
                  {m === "paypal" ? "PayPal" : "Bank transfer"}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Payout email" error={errors.payout_email}>
            <Input
              type="email"
              value={form.payout_email}
              onChange={(e) => setForm((f) => ({ ...f, payout_email: e.target.value }))}
              placeholder="payouts@you.com"
              maxLength={200}
            />
          </Row>
          <Row label="Additional payout details" error={errors.payout_details}>
            <Textarea
              value={form.payout_details}
              onChange={(e) => setForm((f) => ({ ...f, payout_details: e.target.value }))}
              placeholder="IBAN / account number / notes"
              rows={3}
              maxLength={500}
            />
          </Row>
        </Section>

        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending} className="gap-2">
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save changes
          </Button>
        </div>
      </form>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-soft p-6">
      <h2 className="font-display text-lg font-semibold mb-4">{title}</h2>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Row({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
