import { prisma } from "@/lib/prisma";
import { generateDynamicPrice } from "./negotiation";

export async function applyDynamicPricing(productId: string): Promise<{
  originalPrice: number;
  newPrice: number;
  savings: number;
}> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) throw new Error("Produto não encontrado");

  const orderCount = await prisma.orderItem.count({
    where: { productId },
  });

  const demandFactor = Math.max(0.5, Math.min(2.0, orderCount / 10));

  const newPrice = generateDynamicPrice(product.basePrice, demandFactor);

  return {
    originalPrice: product.basePrice,
    newPrice,
    savings: product.basePrice - newPrice,
  };
}

export async function getProductPriceSuggestion(productId: string) {
  const pricing = await applyDynamicPricing(productId);
  return {
    ...pricing,
    discountPercent:
      ((pricing.savings / pricing.originalPrice) * 100).toFixed(1) + "%",
  };
}
