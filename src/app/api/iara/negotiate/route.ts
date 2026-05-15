import { NextRequest } from "next/server";
import { negotiatePrice } from "@/modules/iara/negotiation";
import { getProductPriceSuggestion } from "@/modules/iara/pricing";
import { getAuthUser } from "@/lib/auth";
import { sendMessage } from "@/modules/peri/messaging";

export async function POST(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { productId, proposedPrice } = await request.json();

    if (!productId || proposedPrice === undefined) {
      return Response.json(
        { error: "productId e proposedPrice são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await negotiatePrice(productId, proposedPrice);

    if (result.accepted) {
      await sendMessage(auth.userId, "negotiation_accepted", {
        productName: productId,
        price: result.proposedPrice.toFixed(2),
      });
    } else {
      await sendMessage(auth.userId, "negotiation_rejected", {
        productName: productId,
        minPrice: (result.originalPrice - result.margin).toFixed(2),
      });
    }

    return Response.json({ negotiation: result });
  } catch (error) {
    console.error("Negotiation error:", error);
    return Response.json({ error: "Erro na negociação" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    return Response.json(
      { error: "productId obrigatório" },
      { status: 400 }
    );
  }

  try {
    const suggestion = await getProductPriceSuggestion(productId);
    return Response.json({ suggestion });
  } catch (error) {
    console.error("Price suggestion error:", error);
    return Response.json(
      { error: "Erro ao gerar sugestão" },
      { status: 500 }
    );
  }
}
