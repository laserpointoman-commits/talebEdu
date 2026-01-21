import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useActiveBusTrips(busIds: string[]) {
  const [activeBusIds, setActiveBusIds] = useState<Set<string>>(new Set());

  // Create a stable key from the sorted bus IDs to prevent infinite loops
  const busIdsKey = useMemo(() => {
    const filtered = busIds.filter(Boolean);
    const sorted = [...new Set(filtered)].sort();
    return sorted.join(',');
  }, [busIds]);

  const stableBusIds = useMemo(() => {
    if (!busIdsKey) return [];
    return busIdsKey.split(',').filter(Boolean);
  }, [busIdsKey]);

  // Track previous key to avoid unnecessary state updates
  const prevKeyRef = useRef(busIdsKey);

  useEffect(() => {
    // Only reset when the key actually changes
    if (prevKeyRef.current !== busIdsKey) {
      prevKeyRef.current = busIdsKey;
    }

    if (stableBusIds.length === 0) {
      setActiveBusIds((prev) => (prev.size === 0 ? prev : new Set()));
      return;
    }

    let cancelled = false;

    const load = async () => {
      // Only consider trips from TODAY as active
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("bus_trips")
        .select("bus_id")
        .eq("status", "in_progress")
        .gte("created_at", `${today}T00:00:00`)
        .in("bus_id", stableBusIds);

      if (cancelled) return;

      if (error) {
        console.error("Error loading active bus trips:", error);
        return;
      }

      const next = new Set((data || []).map((r) => r.bus_id as string));
      setActiveBusIds((prev) => {
        // Avoid unnecessary re-renders if the set is the same
        if (prev.size === next.size && [...prev].every((id) => next.has(id))) {
          return prev;
        }
        return next;
      });
    };

    load();

    const channel = supabase
      .channel(`active-bus-trips-${busIdsKey.slice(0, 20)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bus_trips" },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [busIdsKey, stableBusIds]);

  return { activeBusIds };
}
