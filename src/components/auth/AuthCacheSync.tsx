import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuthOptional } from "@/context/AuthProvider";

/** Invalidate role-scoped caches when the signed-in user changes (not on every mount). */
export function AuthCacheSync() {
  const qc = useQueryClient();
  const auth = useAuthOptional();
  const prevUidRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!auth || auth.loading) return;

    const uid = auth.currentUser?.uid ?? null;
    if (prevUidRef.current === undefined) {
      prevUidRef.current = uid;
      return;
    }
    if (prevUidRef.current === uid) return;

    const wasSignedIn = prevUidRef.current !== null;
    prevUidRef.current = uid;

    qc.invalidateQueries({ queryKey: ["current-role"] });
    qc.invalidateQueries({ queryKey: ["user-role"] });
    qc.removeQueries({ queryKey: ["my-products"] });
    qc.removeQueries({ queryKey: ["my-referral-links"] });
    qc.removeQueries({ queryKey: ["user-profiles"] });

    if (wasSignedIn && uid === null) {
      qc.clear();
    }
  }, [auth?.currentUser?.uid, auth?.loading, qc]);

  return null;
}
