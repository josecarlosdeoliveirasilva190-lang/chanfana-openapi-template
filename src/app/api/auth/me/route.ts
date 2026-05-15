import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      createdAt: true,
    },
  });

  if (!user) {
    return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  return Response.json({ user });
}
