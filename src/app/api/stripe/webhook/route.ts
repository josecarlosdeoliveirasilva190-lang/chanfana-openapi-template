import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        await prisma.order.updateMany({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: "CONFIRMED" },
        });
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        await prisma.order.updateMany({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: "CANCELLED" },
        });
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: "Webhook error" }, { status: 400 });
  }
}
