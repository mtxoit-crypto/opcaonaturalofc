export function formatMoney(amount: string | number, currencyCode = "BRL") {
  const value = typeof amount === "number" ? amount : Number(amount);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currencyCode,
  }).format(Number.isFinite(value) ? value : 0);
}
