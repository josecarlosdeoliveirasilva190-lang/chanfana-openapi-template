import { getAuthUser } from "@/lib/auth";
import { getTenantBalance } from "@/modules/nexus/balance";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || (auth.role !== "SELLER" && auth.role !== "ADMIN")) {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (!auth.tenantId) {
    return Response.json(
      { error: "Sem comércio associado" },
      { status: 400 }
    );
  }

  const balance = await getTenantBalance(auth.tenantId);
  return Response.json({ balance });
}
