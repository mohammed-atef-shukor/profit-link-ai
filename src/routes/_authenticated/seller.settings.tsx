import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ExternalLink } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { updateProfile as updateAuthProfile } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StoreLogoUpload } from "@/components/seller/StoreLogoUpload";
import { dashboardFormWidth } from "@/components/layout/DashboardShell";
import { getFirebaseAuth } from "@/firebase";
import { deleteStoreLogo, uploadStoreLogo } from "@/firebase/storage";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { getUserProfile, updateUserProfile } from "@/lib/users.firestore";

export const Route = createFileRoute("/_authenticated/seller/settings")({
  head: () => ({ meta: [{ title: "Settings — Seller — LinkProfit AI" }] }),
  component: SellerSettings,
});

const schema = z.object({
  display_name: z.string().trim().min(2, "At least 2 characters").max(80),
  store_name: z.string().trim().max(80).optional().or(z.literal("")),
  store_tagline: z.string().trim().max(160).optional().or(z.literal("")),
  payout_email: z.string().trim().email("Invalid email").max(200).optional().or(z.literal("")),
});

function SellerSettings() {
  const { user } = useFirebaseAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ["my-profile", user?.uid],
    queryFn: () => getUserProfile(user!.uid),
    enabled: !!user,
  });

  const [form, setForm] = useState({
    display_name: "",
    store_name: "",
    store_tagline: "",
    payout_email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoRemoving, setLogoRemoving] = useState(false);
  const [logoProgress, setLogoProgress] = useState<number | null>(null);

  useEffect(() => {
    if (profile.data) {
      setForm({
        display_name: profile.data.display_name ?? "",
        store_name: profile.data.store_name ?? "",
        store_tagline: profile.data.store_tagline ?? "",
        payout_email: profile.data.payout_email ?? "",
      });
    }
  }, [profile.data]);

  const invalidateProfile = () => {
    qc.invalidateQueries({ queryKey: ["my-profile"] });
    qc.invalidateQueries({ queryKey: ["user-profiles"] });
    if (user?.uid) {
      qc.invalidateQueries({ queryKey: ["store", user.uid] });
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!user?.uid) {
      toast.error("Please sign in to upload a logo.");
      return;
    }

    setLogoUploading(true);
    setLogoProgress(0);
    const previousPath = profile.data?.logo_storage_path ?? null;
    let uploadedPath: string | null = null;
    try {
      const { url, path } = await uploadStoreLogo(file, (p) => setLogoProgress(p));
      uploadedPath = path;
      await updateUserProfile({ logo_url: url, logo_storage_path: path });
      if (previousPath && previousPath !== path) {
        try {
          await deleteStoreLogo(previousPath);
        } catch {
          // Best-effort cleanup of old logo after profile update succeeds.
        }
      }
      toast.success("Store logo updated");
      invalidateProfile();
    } catch (e) {
      // If Firestore update fails after upload succeeds, try to rollback the new upload.
      if (uploadedPath && uploadedPath !== previousPath) {
        try {
          await deleteStoreLogo(uploadedPath);
        } catch {
          // Best-effort rollback.
        }
      }
      toast.error(getFirebaseErrorMessage(e, "Failed to upload logo"));
    } finally {
      setLogoUploading(false);
      setLogoProgress(null);
    }
  };

  const handleLogoRemove = async () => {
    if (!user?.uid) {
      toast.error("Please sign in to remove your logo.");
      return;
    }

    const storagePath = profile.data?.logo_storage_path;
    setLogoRemoving(true);
    try {
      if (storagePath) {
        try {
          await deleteStoreLogo(storagePath);
        } catch {
          // Continue clearing Firestore even if Storage delete fails.
        }
      }
      await updateUserProfile({ logo_url: null, logo_storage_path: null });
      toast.success("Logo removed successfully");
      invalidateProfile();
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, "Failed to remove logo"));
    } finally {
      setLogoRemoving(false);
    }
  };

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
        store_name: form.store_name || null,
        store_tagline: form.store_tagline || null,
        payout_email: form.payout_email || null,
      });
      const currentUser = getFirebaseAuth().currentUser;
      if (currentUser && form.display_name !== currentUser.displayName) {
        await updateAuthProfile(currentUser, { displayName: form.display_name });
      }
    },
    onSuccess: () => {
      toast.success("Settings saved");
      invalidateProfile();
    },
    onError: (e: unknown) => toast.error(getFirebaseErrorMessage(e, "Failed to save")),
  });

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Seller</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your storefront profile and payout details.</p>
        </div>
        {user && (
          <Link to="/store/$uid" params={{ uid: user.uid }} className="text-sm font-semibold text-primary inline-flex items-center gap-1.5">
            View public storefront <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className={`mt-8 grid gap-6 ${dashboardFormWidth}`}
      >
        <Section title="Profile">
          <Row label="Display name" error={errors.display_name}>
            <Input value={form.display_name} onChange={onChange("display_name")} maxLength={80} />
          </Row>
          <Row label="Account email">
            <Input value={user?.email ?? ""} disabled readOnly />
          </Row>
        </Section>

        <Section title="Storefront branding">
          <Row label="Store name" error={errors.store_name}>
            <Input value={form.store_name} onChange={onChange("store_name")} placeholder="Acme Co" maxLength={80} />
          </Row>
          <Row label="Tagline" error={errors.store_tagline}>
            <Textarea value={form.store_tagline} onChange={onChange("store_tagline")} placeholder="One sentence about your store" maxLength={160} rows={2} />
          </Row>
          <Row label="Store logo">
            <StoreLogoUpload
              logoUrl={profile.data?.logo_url ?? null}
              uploading={logoUploading}
              uploadProgress={logoProgress}
              removing={logoRemoving}
              onUpload={handleLogoUpload}
              onRemove={handleLogoRemove}
            />
          </Row>
        </Section>

        <Section title="Payout">
          <Row label="Payout email (PayPal / Wise)" error={errors.payout_email}>
            <Input type="email" value={form.payout_email} onChange={onChange("payout_email")} placeholder="payouts@you.com" maxLength={200} />
          </Row>
        </Section>

        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending || logoUploading || logoRemoving} className="gap-2">
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
