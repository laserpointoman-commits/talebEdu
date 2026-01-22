import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { callService } from "@/services/callService";

/**
 * Ensures the call listener is initialized as soon as a user session exists.
 * This is important on kiosk/CM30 devices where incoming calls should work
 * even if the user is not currently on the Messenger page.
 */
export default function CallServiceBootstrap() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    callService.initialize(user.id).catch((e) => {
      console.error("CallService init failed:", e);
    });
  }, [user?.id]);

  return null;
}
