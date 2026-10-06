import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const PLANS = {
  STARTER: {
    name: "Starter",
    price: 19,
    credits: 1_000,
    priceId: () => process.env.STRIPE_STARTER_PRICE_ID,
  },
  PRO: {
    name: "Pro",
    price: 49,
    credits: null,
    priceId: () => process.env.STRIPE_PRO_PRICE_ID,
  },
} as const;