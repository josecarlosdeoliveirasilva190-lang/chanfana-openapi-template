import { checkMargin } from "@/modules/nexus/margin";
import { prisma } from "@/lib/prisma";

export interface NegotiationResult {
  accepted: boolean;
  originalPrice: number;
  proposedPrice: number;
  discount: number;
  margin: number;
  reason: string;
}

export function generateDynamicPrice(
  basePrice: number,
  demandFactor: number = 1.0,
  competitorPrice?: number
): number {
  let discount = basePrice * 0.05 * (1 / demandFactor);

  if (competitorPrice && competitorPrice < basePrice) {
    discount = Math.max(discount, basePrice - competitorPrice + 1);
  }

  discount = Math.min(discount, basePrice * 0.3);

  return Math.round((basePrice - discount) * 100) / 100;
}

export async function negotiatePrice(
  productId: string,
  proposedPrice: number
): Promise<NegotiationResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  const marginCheck = checkMargin(
    product.basePrice,
    proposedPrice,
    product.minMargin
  );

  const result: NegotiationResult = {
    accepted: marginCheck.isValid,
    originalPrice: product.basePrice,
    proposedPrice,
    discount: product.basePrice - proposedPrice,
    margin: marginCheck.margin,
    reason: marginCheck.reason,
  };

  await prisma.negotiation.create({
    data: {
      productId,
      originalPrice: product.basePrice,
      proposedPrice,
      margin: marginCheck.margin,
      accepted: marginCheck.isValid,
      reason: marginCheck.reason,
    },
  });

  if (marginCheck.isValid) {
    await prisma.product.update({
      where: { id: productId },
      data: { currentPrice: proposedPrice },
    });
  }

  return result;
}
