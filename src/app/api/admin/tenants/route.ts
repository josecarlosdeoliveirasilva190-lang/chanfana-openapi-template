import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || auth.role !== "ADMIN") {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  const tenants = await prisma.tenant.findMany({
    include: {
      _count: { select: { users: true, products: true, orders: true } },
      balances: true,
    },
  });

  return Response.json({ tenants });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth || auth.role !== "ADMIN") {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { name, slug, city, state, logoUrl } = await request.json();

  if (!name || !slug || !city || !state) {
    return Response.json(
      { error: "name, slug, city e state são obrigatórios" },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.create({
    data: { name, slug, city, state, logoUrl },
  });

  return Response.json({ tenant }, { status: 201 });
}
