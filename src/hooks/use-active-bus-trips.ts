import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useActiveBusTrips(busIds: string[]) {
  const [activeBusIds, setActiveBusIds] = useState<Set<string>>(new Set());

  const stableBusIds = useMemo(() => {
    // Keep a stable, de-duped list so effects don't thrash
    return Array.from(new Set(busIds.filter(Boolean)));
  }, [busIds]);

  useEffect(() => {
    if (stableBusIds.length === 0) {
      setActiveBusIds(new Set());
      return;
    }

    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("bus_trips")
        .select("bus_id")
        .eq("status", "in_progress")
        .in("bus_id", stableBusIds);

      if (cancelled) return;

      if (error) {
        console.error("Error loading active bus trips:", error);
        return;
      }

      const next = new Set((data || []).map((r) => r.bus_id as string));
      setActiveBusIds(next);
    };

    load();

    const channel = supabase
      .channel("active-bus-trips")
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
  }, [stableBusIds]);

  return { activeBusIds };
}
