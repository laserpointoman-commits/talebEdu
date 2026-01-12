import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  busId?: string;
}

interface StudentStatus {
  id: string;
  name: string;
  nameAr: string;
  class: string;
  nfcId: string;
  status: "waiting" | "boarded" | "exited";
  scanTime?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json().catch(() => ({} as RequestBody));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate the caller and get auth.uid()
    const authed = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: userData, error: userError } = await authed.auth.getUser();
    const userId = userData?.user?.id;

    if (userError || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for reads (bypasses RLS), but enforce access in code.
    const admin = createClient(supabaseUrl, serviceKey);

    // Find the supervisor's bus
    const { data: bus, error: busError } = await admin
      .from("buses")
      .select("id, bus_number, supervisor_id")
      .eq("supervisor_id", userId)
      .single();

    if (busError || !bus) {
      return new Response(JSON.stringify({ error: "No bus assigned" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.busId && body.busId !== bus.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: assignments, error: assignmentError } = await admin
      .from("student_bus_assignments")
      .select("student_id")
      .eq("bus_id", bus.id)
      .eq("is_active", true);

    if (assignmentError) {
      return new Response(JSON.stringify({ error: "Failed to load assignments" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const studentIds = (assignments ?? [])
      .map((a) => a.student_id as string | null)
      .filter((v): v is string => !!v);

    if (studentIds.length === 0) {
      return new Response(
        JSON.stringify({ bus, students: [] as StudentStatus[] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: studentsData, error: studentsError } = await admin
      .from("students")
      .select("id, first_name, last_name, first_name_ar, last_name_ar, class, nfc_id")
      .in("id", studentIds);

    if (studentsError) {
      return new Response(JSON.stringify({ error: "Failed to load students" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const { data: logs } = await admin
      .from("bus_boarding_logs")
      .select("student_id, action, timestamp")
      .eq("bus_id", bus.id)
      .gte("timestamp", `${today}T00:00:00`)
      .order("timestamp", { ascending: false });

    const students: StudentStatus[] = (studentsData ?? []).map((s) => {
      const latestLog = logs?.find((l) => l.student_id === s.id);
      const status =
        latestLog?.action === "board"
          ? "boarded"
          : latestLog?.action === "exit"
            ? "exited"
            : "waiting";

      return {
        id: s.id,
        name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
        nameAr: `${(s.first_name_ar ?? s.first_name) ?? ""} ${(s.last_name_ar ?? s.last_name) ?? ""}`.trim(),
        class: (s.class ?? "").toString(),
        nfcId: (s.nfc_id ?? "").toString(),
        status,
        scanTime: latestLog ? new Date(latestLog.timestamp).toLocaleTimeString() : undefined,
      };
    });

    return new Response(JSON.stringify({ bus, students }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-supervisor-bus-students error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
