import { prisma } from "@/lib/prisma";
import { getCached } from "@/lib/cache";

export interface SalesReport {
  totalOrders: number;
  totalRevenue: number;
  totalFees: number;
  netRevenue: number;
  byCity: Record<string, { orders: number; revenue: number }>;
  byProduct: { name: string; quantity: number; revenue: number }[];
}

export async function generateSalesReport(
  tenantId: string
): Promise<SalesReport> {
  return getCached(`report:${tenantId}`, async () => {
    const orders = await prisma.order.findMany({
      where: { tenantId, status: { in: ["CONFIRMED", "DELIVERED"] } },
      include: {
        items: { include: { product: true } },
      },
    });

    const byCity: Record<string, { orders: number; revenue: number }> = {};
    const productMap: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};

    let totalRevenue = 0;
    let totalFees = 0;

    for (const order of orders) {
      totalRevenue += order.totalAmount;
      totalFees += order.platformFee;

      for (const item of order.items) {
        const city = item.product.city;
        if (!byCity[city]) byCity[city] = { orders: 0, revenue: 0 };
        byCity[city].orders += 1;
        byCity[city].revenue += item.unitPrice * item.quantity;

        const pid = item.productId;
        if (!productMap[pid])
          productMap[pid] = { name: item.product.name, quantity: 0, revenue: 0 };
        productMap[pid].quantity += item.quantity;
        productMap[pid].revenue += item.unitPrice * item.quantity;
      }
    }

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalFees,
      netRevenue: totalRevenue - totalFees,
      byCity,
      byProduct: Object.values(productMap).sort(
        (a, b) => b.revenue - a.revenue
      ),
    };
  });
}
