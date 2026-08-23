import { ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { storeSettingsQuery } from "@/lib/store";
import { landing } from "@/lib/landing-copy";

function realWhatsapp(value: string | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (/^55?0+$/.test(digits) || digits.includes("000000")) return null;
  return digits;
}

const ICONS = [ShieldCheck, Truck, RefreshCw] as const;

export function TrustBar() {
  const { data } = useQuery(storeSettingsQuery);
  const wa = realWhatsapp(data?.whatsapp_number);
  const items = [
    ...landing.trust,
    ...(wa ? [{ title: "Atendimento", detail: "WhatsApp no rodapé." }] : []),
  ];

  return (
    <section aria-label="Informações da loja" className="border-b border-border bg-sand">
      <ul className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-6">
        {items.map((item, i) => {
          const Icon = ICONS[i] ?? ShieldCheck;
          return (
            <li key={item.title} className="flex min-w-[12rem] flex-1 items-start gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="block text-sm text-muted-foreground">{item.detail}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
