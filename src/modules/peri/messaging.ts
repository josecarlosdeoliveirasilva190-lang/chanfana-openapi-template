import { prisma } from "@/lib/prisma";

export type MessageType =
  | "order_confirmed"
  | "order_cancelled"
  | "order_delivered"
  | "negotiation_accepted"
  | "negotiation_rejected"
  | "welcome"
  | "info";

const MESSAGE_TEMPLATES: Record<string, (data: Record<string, string>) => string> = {
  order_confirmed: (d) =>
    `Pedido #${d.orderId} confirmado! Total: R$${d.total}. Acompanhe o status na sua conta.`,
  order_cancelled: (d) =>
    `Pedido #${d.orderId} cancelado. Motivo: ${d.reason || "margem insuficiente"}.`,
  order_delivered: (d) =>
    `Pedido #${d.orderId} entregue com sucesso! Obrigado pela compra.`,
  negotiation_accepted: (d) =>
    `Proposta aceita! ${d.productName} agora por R$${d.price}. Aproveite!`,
  negotiation_rejected: (d) =>
    `Proposta para ${d.productName} não aprovada. Preço mínimo: R$${d.minPrice}.`,
  welcome: (d) =>
    `Bem-vindo ao marketplace, ${d.name}! Explore nossa vitrine de produtos.`,
  info: (d) => d.message || "Nova mensagem do sistema.",
};

export async function sendMessage(
  userId: string,
  type: MessageType,
  data: Record<string, string>
) {
  const template = MESSAGE_TEMPLATES[type];
  const content = template ? template(data) : data.message || "Nova notificação";

  return prisma.message.create({
    data: {
      userId,
      type,
      content,
    },
  });
}

export async function getUserMessages(userId: string, limit: number = 20) {
  return prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markAsRead(messageId: string) {
  return prisma.message.update({
    where: { id: messageId },
    data: { isRead: true },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.message.count({
    where: { userId, isRead: false },
  });
}
