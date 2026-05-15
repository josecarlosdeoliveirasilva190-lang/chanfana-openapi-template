import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getCached, invalidateCache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const city = searchParams.get("city");
  const search = searchParams.get("search");
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 12;

  const cacheKey = `products:${category}:${city}:${search}:${page}`;

  const result = await getCached(
    cacheKey,
    async () => {
      const where: Record<string, unknown> = { isActive: true };

      if (category) where.category = category;
      if (city) where.city = city;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            seller: { select: { name: true } },
            tenant: { select: { name: true, city: true } },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where }),
      ]);

      return { products, total, pages: Math.ceil(total / limit), page };
    },
    60
  );

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth || (auth.role !== "SELLER" && auth.role !== "ADMIN")) {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, basePrice, category, city, stock, imageUrl, minMargin } =
      body;

    if (!name || !description || !basePrice || !category || !city) {
      return Response.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    if (!auth.tenantId) {
      return Response.json(
        { error: "Vendedor deve estar associado a um comércio" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        basePrice,
        currentPrice: basePrice,
        category,
        city,
        stock: stock || 0,
        imageUrl,
        minMargin: minMargin || 7,
        sellerId: auth.userId,
        tenantId: auth.tenantId,
      },
    });

    invalidateCache("products");

    return Response.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
