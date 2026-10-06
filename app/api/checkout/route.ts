import { auth } from "@/auth";
import { PLANS, stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

const checkoutSchema = z.object({ plan: z.enum(["STARTER", "PRO"]) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Log in om een abonnement te kiezen." }, { status: 401 });
  }
  if (!stripe) {
    return NextResponse.json({ error: "Betalingen zijn nog niet geconfigureerd." }, { status: 503 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldig abonnement." }, { status: 400 });

  const plan = parsed.data.plan;
  const priceId = PLANS[plan].priceId();
  const baseUrl = process.env.AUTH_URL;
  if (!priceId || !baseUrl) {
    return NextResponse.json({ error: "Stripe-prijzen of AUTH_URL ontbreken in de configuratie." }, { status: 503 });
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/#pricing`,
      client_reference_id: session.user.id,
      metadata: { userId: session.user.id, plan },
      subscription_data: { metadata: { userId: session.user.id, plan } },
    });
    return NextResponse.json({ url: checkout.url });
  } catch {
    return NextResponse.json({ error: "Stripe kon de betaling niet starten." }, { status: 502 });
  }
}