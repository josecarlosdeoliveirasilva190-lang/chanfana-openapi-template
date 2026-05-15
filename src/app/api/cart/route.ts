import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: auth.userId },
    include: {
      product: {
        include: {
          seller: { select: { name: true } },
          tenant: { select: { name: true } },
        },
      },
    },
  });

  const total = items.reduce(
    (sum, item) => sum + item.product.currentPrice * item.quantity,
    0
  );

  return Response.json({ items, total });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { productId, quantity = 1 } = await request.json();

  if (!productId) {
    return Response.json({ error: "productId obrigatório" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product || !product.isActive) {
    return Response.json({ error: "Produto não disponível" }, { status: 404 });
  }

  const item = await prisma.cartItem.upsert({
    where: {
      userId_productId: { userId: auth.userId, productId },
    },
    update: { quantity: { increment: quantity } },
    create: { userId: auth.userId, productId, quantity },
  });

  return Response.json({ item }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { productId } = await request.json();

  if (productId) {
    await prisma.cartItem.deleteMany({
      where: { userId: auth.userId, productId },
    });
  } else {
    await prisma.cartItem.deleteMany({
      where: { userId: auth.userId },
    });
  }

  return Response.json({ success: true });
}
