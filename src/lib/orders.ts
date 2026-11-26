const PAID_STATUSES = new Set(["pago", "enviado", "entregue"]);
const PAID_MARKERS = new Set(["paid", "pago"]);
const UNPAID_STATUSES = new Set(["aguardando_pagamento", "novo", "pendente", "teste"]);

export const ADMIN_ORDER_STATUSES = ["pago", "enviado", "entregue", "cancelado"] as const;

/** Pedido visível no painel: pagamento concluído (ou já em envio). */
export function isPaidOrder(order: {
  status: string;
  payment_status?: string | null;
  financial_status?: string | null;
}) {
  const payment = (order.payment_status ?? "").toLowerCase();
  const financial = (order.financial_status ?? "").toLowerCase();
  const markedPaid = PAID_MARKERS.has(payment) || PAID_MARKERS.has(financial);
  if (order.status === "teste") return false;
  if (markedPaid) return true;
  if (UNPAID_STATUSES.has(order.status)) return false;
  return PAID_STATUSES.has(order.status);
}

