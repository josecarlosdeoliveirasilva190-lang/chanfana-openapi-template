import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { calculateFees } from "@/lib/stripe";
import { checkMargin } from "@/modules/nexus/margin";
import { updateBalance } from "@/modules/nexus/balance";
import { sendMessage } from "@/modules/peri/messaging";
import { invalidateCache } from "@/lib/cache";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: auth.userId },
    include: {
      items: { include: { product: true } },
      tenant: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ orders });
}

export async function POST() {
  const auth = await getAuthUser();
  if (!auth) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: auth.userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return Response.json(
        { error: "Carrinho vazio" },
        { status: 400 }
      );
    }

    const itemsByTenant: Record<
      string,
      typeof cartItems
    > = {};

    for (const item of cartItems) {
      const tid = item.product.tenantId;
      if (!itemsByTenant[tid]) itemsByTenant[tid] = [];
      itemsByTenant[tid].push(item);
    }

    const orders = [];

    for (const [tenantId, items] of Object.entries(itemsByTenant)) {
      let totalAmount = 0;
      let allValid = true;
      const cancelReasons: string[] = [];

      for (const item of items) {
        const marginCheck = checkMargin(
          item.product.basePrice,
          item.product.currentPrice,
          item.product.minMargin
        );

        if (!marginCheck.isValid) {
          allValid = false;
          cancelReasons.push(
            `${item.product.name}: ${marginCheck.reason}`
          );
        }

        totalAmount += item.product.currentPrice * item.quantity;
      }

      if (!allValid) {
        await sendMessage(auth.userId, "order_cancelled", {
          orderId: "N/A",
          reason: cancelReasons.join("; "),
        });
        continue;
      }

      const { platformFee, sellerAmount } = calculateFees(totalAmount);

      const order = await prisma.order.create({
        data: {
          userId: auth.userId,
          tenantId,
          totalAmount,
          platformFee,
          sellerAmount,
          status: "CONFIRMED",
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.currentPrice,
            })),
          },
        },
        include: { items: true },
      });

      await updateBalance(tenantId, totalAmount, platformFee);

      await sendMessage(auth.userId, "order_confirmed", {
        orderId: order.id,
        total: totalAmount.toFixed(2),
      });

      orders.push(order);
    }

    await prisma.cartItem.deleteMany({
      where: { userId: auth.userId },
    });

    invalidateCache("products");

    return Response.json({ orders }, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
