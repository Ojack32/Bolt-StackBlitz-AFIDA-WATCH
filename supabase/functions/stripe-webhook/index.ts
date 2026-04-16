import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.99.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TIER_NAME_MAP: Record<string, string> = {
  basic: "Basic",
  pro: "Professional",
  professional: "Professional",
  enterprise: "Enterprise",
  government: "Government",
};

const TIER_AMOUNTS: Record<string, number> = {
  basic: 4900,
  pro: 9900,
  professional: 9900,
  enterprise: 19900,
  government: 19900,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-12-18.acacia",
    });

    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Missing signature or webhook secret" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const tierKey = (session.metadata?.tier || "").toLowerCase();
      const tierName = TIER_NAME_MAP[tierKey];
      const customerEmail = session.customer_details?.email;
      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : null;

      if (!tierName || !customerEmail) {
        console.error("Missing tier or customer email in session", { tierKey, customerEmail });
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: tierRow } = await supabase
        .from("subscription_tiers")
        .select("id")
        .eq("name", tierName)
        .maybeSingle();

      const now = new Date().toISOString();
      const { data: customer } = await supabase
        .from("customers")
        .upsert(
          {
            email: customerEmail,
            stripe_customer_id: stripeCustomerId,
            subscription_tier_id: tierRow?.id ?? null,
            subscription_status: "active",
            subscription_start_date: now,
            updated_at: now,
          },
          { onConflict: "email", ignoreDuplicates: false }
        )
        .select("id")
        .maybeSingle();

      const customerId = customer?.id ?? null;

      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);

      let subscriptionId: string | null = null;

      if (customerId) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .insert({
            customer_id: customerId,
            tier: tierKey,
            status: "active",
            annual_amount: TIER_AMOUNTS[tierKey] ?? session.amount_total ?? 0,
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
            metadata: {
              stripe_session_id: session.id,
              stripe_customer_id: stripeCustomerId,
            },
          })
          .select("id")
          .maybeSingle();

        subscriptionId = sub?.id ?? null;
      }

      await supabase
        .from("payment_events")
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          amount: session.amount_total,
          status: session.payment_status || "unknown",
          customer_id: customerId,
          subscription_id: subscriptionId,
          metadata: {
            session_id: session.id,
            tier: tierKey,
            customer_email: customerEmail,
          },
        });
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
