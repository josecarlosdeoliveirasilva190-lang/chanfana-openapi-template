import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";
import { sendMessage } from "@/modules/peri/messaging";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role = "BUYER", tenantSlug } = body;

    if (!email || !password || !name) {
      return Response.json(
        { error: "Email, senha e nome são obrigatórios" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      );
    }

    let tenantId: string | undefined;
    if (tenantSlug && role === "SELLER") {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });
      if (tenant) tenantId = tenant.id;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role as "BUYER" | "SELLER" | "ADMIN",
        tenantId,
      },
    });

    await sendMessage(user.id, "welcome", { name: user.name });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ?? undefined,
    });

    const response = Response.json(
      {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
      },
      { status: 201 }
    );

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
