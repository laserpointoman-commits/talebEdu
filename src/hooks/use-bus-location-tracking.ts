import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useBusLocationTracking({
  enabled,
  busId,
}: {
  enabled: boolean;
  busId: string | null | undefined;
}) {
  const watchId = useRef<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const sendLocationUpdate = useCallback(
    async (position: GeolocationPosition) => {
      if (!enabled || !busId) return;
      try {
        await supabase.functions.invoke("update-bus-location", {
          body: {
            busId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0,
          },
        });
      } catch {
        // keep silent for device mode (no toasts) to stay fast
      }
    },
    [enabled, busId],
  );

  useEffect(() => {
    if (!enabled || !busId) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      setIsTracking(false);
      return;
    }

    if (!navigator.geolocation) {
      setIsTracking(false);
      return;
    }

    let shownError = false;
    setIsTracking(true);

    // Prime location quickly
    navigator.geolocation.getCurrentPosition(
      (pos) => sendLocationUpdate(pos),
      () => {
        // ignore
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        shownError = false;
        sendLocationUpdate(pos);
      },
      (err) => {
        // Avoid spamming; ignore timeout noise.
        if (shownError) return;
        shownError = true;
        if (err.code === 3) return;
      },
      { enableHighAccuracy: true, timeout: 60000, maximumAge: 10000 },
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      setIsTracking(false);
    };
  }, [enabled, busId, sendLocationUpdate]);

  return { isTracking };
}
