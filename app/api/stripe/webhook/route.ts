import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const record = invoice as unknown as {
    id: string;
    subscription?: string | { id: string } | null;
    parent?: {
      subscription_details?: { subscription?: string | { id: string } | null } | null;
    } | null;
  };
  const value = record.parent?.subscription_details?.subscription ?? record.subscription;
  return typeof value === "string" ? value : value?.id;
}

export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook is niet geconfigureerd." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Webhook signature ontbreekt." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Ongeldige webhook signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const checkout = event.data.object as Stripe.Checkout.Session;
      const userId = checkout.metadata?.userId ?? checkout.client_reference_id;
      const plan = checkout.metadata?.plan;
      const subscriptionId =
        typeof checkout.subscription === "string" ? checkout.subscription : checkout.subscription?.id;
      const customerId = typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id;

      if (
        userId &&
        subscriptionId &&
        customerId &&
        checkout.payment_status === "paid" &&
        (plan === "STARTER" || plan === "PRO")
      ) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { plan, unlimitedCredits: plan === "PRO", stripeCustomerId: customerId },
          }),
          prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId,
              plan,
              status: "active",
            },
            update: {
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId,
              plan,
              status: "active",
            },
          }),
        ]);
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceId = invoice.id;
      const stripeSubscriptionId = subscriptionIdFromInvoice(invoice);
      if (stripeSubscriptionId && invoiceId) {
        const subscription = await prisma.subscription.findUnique({ where: { stripeSubscriptionId } });
        if (subscription?.plan === "STARTER") {
          await prisma.$transaction(async (transaction) => {
            await transaction.creditGrant.create({
              data: { stripeInvoiceId: invoiceId, credits: 1_000, userId: subscription.userId },
            });
            await transaction.user.update({
              where: { id: subscription.userId },
              data: { credits: { increment: 1_000 }, plan: "STARTER", unlimitedCredits: false },
            });
          });
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const deleted = event.data.object as Stripe.Subscription;
      const current = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: deleted.id } });
      if (current) {
        await prisma.$transaction([
          prisma.subscription.update({ where: { id: current.id }, data: { status: "canceled" } }),
          prisma.user.update({
            where: { id: current.userId },
            data: { plan: "FREE", unlimitedCredits: false },
          }),
        ]);
      }
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) return NextResponse.json({ received: true });
    return NextResponse.json({ error: "Webhook verwerking is mislukt." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}