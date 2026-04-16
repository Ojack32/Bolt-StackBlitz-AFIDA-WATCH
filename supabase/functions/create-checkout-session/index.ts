import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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

    const { tier } = await req.json();

    const prices: Record<string, { amount: number; name: string }> = {
      basic: { amount: 4900, name: "Basic Tier - County Access" },
      pro: { amount: 9900, name: "Pro Tier - State Access" },
      enterprise: { amount: 19900, name: "Enterprise Tier - National Access" },
    };

    if (!prices[tier]) {
      return new Response(
        JSON.stringify({ error: "Invalid tier" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { amount, name } = prices[tier];
    const origin = req.headers.get("origin") || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: name,
              description: `Access to ${tier} tier AFIDA data`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${origin}/checkout.html`,
      metadata: {
        tier: tier,
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
