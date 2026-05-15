import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUserMessages, markAsRead, getUnreadCount } from "@/modules/peri/messaging";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [messages, unreadCount] = await Promise.all([
    getUserMessages(auth.userId),
    getUnreadCount(auth.userId),
  ]);

  return Response.json({ messages, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { messageId } = await request.json();
  if (!messageId) {
    return Response.json(
      { error: "messageId obrigatório" },
      { status: 400 }
    );
  }

  const message = await markAsRead(messageId);
  return Response.json({ message });
}
