import { prisma } from "@/lib/prisma";

export async function getTenantBalance(tenantId: string) {
  const balance = await prisma.balance.findUnique({
    where: { tenantId },
  });
  return balance;
}

export async function updateBalance(
  tenantId: string,
  amount: number,
  fee: number
) {
  return prisma.balance.upsert({
    where: { tenantId },
    update: {
      currentBalance: { increment: amount - fee },
      totalRevenue: { increment: amount },
      totalFees: { increment: fee },
    },
    create: {
      tenantId,
      currentBalance: amount - fee,
      totalRevenue: amount,
      totalFees: fee,
    },
  });
}
