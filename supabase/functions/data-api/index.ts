import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TIER_LEVELS: Record<string, number> = {
  Basic: 1,
  Professional: 2,
  Enterprise: 3,
  Government: 4,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("tier, status")
      .eq("customer_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return new Response(JSON.stringify({ error: "No active subscription" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tierLevel = TIER_LEVELS[sub.tier] || 0;
    if (tierLevel < 2) {
      return new Response(JSON.stringify({ error: "API access requires Professional plan or higher" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/data-api/, "");
    const params = url.searchParams;

    if (path === "/holdings" || path === "/holdings/") {
      const tier = params.get("tier");
      const state = params.get("state");
      const limit = Math.min(parseInt(params.get("limit") || "100"), 1000);
      const offset = parseInt(params.get("offset") || "0");
      const format = params.get("format") || "json";

      let query = adminClient
        .from("flagged_parcels")
        .select("state,county,county_fips,owner_name,country,acres,risk_score,risk_tier,flag_adversary_nation,flag_ambiguity,flag_trust_beneficiary,flag_leasehold,flag_secondary_any,has_hard_flag,top_reason_codes", { count: "exact" })
        .range(offset, offset + limit - 1);

      if (tier) query = query.eq("risk_tier", tier.toUpperCase());
      if (state) query = query.ilike("state", state);

      const { data, error, count } = await query;
      if (error) throw error;

      if (format === "csv") {
        const csv = toCSV(data || []);
        return new Response(csv, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="afida_holdings.csv"`,
          },
        });
      }

      return new Response(JSON.stringify({ data, total: count, offset, limit }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "/tiers" || path === "/tiers/") {
      const { data, error } = await adminClient.rpc("get_tier_counts");
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      endpoints: [
        { path: "/data-api/holdings", description: "List flagged parcels", params: ["tier", "state", "limit", "offset", "format"] },
        { path: "/data-api/tiers", description: "Get tier counts" },
      ]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function toCSV(records: Record<string, unknown>[]): string {
  if (!records.length) return "";
  const headers = Object.keys(records[0]);
  const rows = records.map(r =>
    headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}
