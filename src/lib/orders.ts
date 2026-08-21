const PAID_STATUSES = new Set(["pago", "enviado", "entregue"]);
const PAID_MARKERS = new Set(["paid", "pago", "partially_paid"]);
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
  if (UNPAID_STATUSES.has(order.status)) return false;
  if (PAID_STATUSES.has(order.status)) return true;
  if (order.status === "cancelado") return markedPaid;
  return markedPaid;
}

