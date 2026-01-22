import { useContext, useEffect } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { callService } from "@/services/callService";

/**
 * Ensures the call listener is initialized as soon as a user session exists.
 * This is important on kiosk/CM30 devices where incoming calls should work
 * even if the user is not currently on the Messenger page.
 *
 * NOTE: We intentionally useContext directly instead of useAuth() so we can
 * gracefully handle the case when AuthProvider hasn't mounted yet
 * (e.g. during HMR or fast-refresh). Using the hook directly would throw.
 */
export default function CallServiceBootstrap() {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.id;

  useEffect(() => {
    if (!userId) return;

    callService.initialize(userId).catch((e) => {
      console.error("CallService init failed:", e);
    });
  }, [userId]);

  return null;
}
