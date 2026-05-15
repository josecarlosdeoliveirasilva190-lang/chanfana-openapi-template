import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT) || 10;

export function calculateFees(totalAmount: number) {
  const platformFee = totalAmount * (PLATFORM_FEE_PERCENT / 100);
  const sellerAmount = totalAmount - platformFee;
  return { platformFee, sellerAmount };
}

export async function createPaymentIntent(
  amount: number,
  currency: string = "brl"
) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
  });
}

export async function createSubscription(
  customerId: string,
  priceId: string
) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
  });
}
