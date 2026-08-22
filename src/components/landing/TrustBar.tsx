import { useQuery } from "@tanstack/react-query";
import { storeSettingsQuery } from "@/lib/store";
import { landing } from "@/lib/landing-copy";

function realWhatsapp(value: string | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (/^55?0+$/.test(digits) || digits.includes("000000")) return null;
  return digits;
}

export function TrustBar() {
  const { data } = useQuery(storeSettingsQuery);
  const wa = realWhatsapp(data?.whatsapp_number);
  const items = [
    ...landing.trust,
    ...(wa
      ? [{ title: "Atendimento", detail: "WhatsApp disponível no rodapé." }]
      : []),
  ];

  return (
    <section aria-label="Informações da loja" className="border-b border-border bg-sand">
      <ul className="mx-auto grid max-w-6xl gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.title}>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
