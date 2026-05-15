import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCached } from "@/lib/cache";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || auth.role !== "ADMIN") {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  const stats = await getCached("admin:stats", async () => {
    const [totalUsers, totalProducts, totalOrders, totalTenants, recentOrders] =
      await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.tenant.count(),
        prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true } },
            tenant: { select: { name: true } },
          },
        }),
      ]);

    const revenue = await prisma.order.aggregate({
      where: { status: { in: ["CONFIRMED", "DELIVERED"] } },
      _sum: { totalAmount: true, platformFee: true },
    });

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalTenants,
      totalRevenue: revenue._sum.totalAmount || 0,
      totalPlatformFees: revenue._sum.platformFee || 0,
      recentOrders,
    };
  }, 30);

  return Response.json({ stats });
}
