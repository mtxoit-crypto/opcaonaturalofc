import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Box, ExternalLink, Film, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  downloadAdminMediaBlob,
  isRemoteMediaPath,
  productMediaLibraryQuery,
  type MediaType,
  type ProductMedia,
} from "@/lib/media";
import type { Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { ModelViewer } from "@/components/ModelViewer";

const MEDIA_GROUPS: Array<{ type: MediaType; label: string }> = [
  { type: "image", label: "Imagens" },
  { type: "video", label: "Vídeos" },
  { type: "model", label: "Modelos 3D" },
];

export function AdminMedia({
  products,
  productsLoading,
  productsError,
}: {
  products: Product[];
  productsLoading: boolean;
  productsError?: unknown;
}) {
  const mediaQuery = useQuery(productMediaLibraryQuery());
  const names = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );
  const media = mediaQuery.data ?? [];

  if (mediaQuery.isLoading) {
    return <p className="mt-8 text-sm text-muted-foreground">Carregando mídias…</p>;
  }

  if (mediaQuery.error) {
    return (
      <div className="surface-card mt-8 p-5">
        <h2 className="font-medium">Não foi possível carregar as mídias.</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mediaQuery.error instanceof Error
            ? mediaQuery.error.message
            : "Tente novamente em alguns instantes."}
        </p>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="surface-card mt-8 p-6">
        <h2 className="text-lg font-semibold">Nenhuma mídia cadastrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Fotos, vídeos e modelos 3D salvos nos produtos aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-8 space-y-8">
      {productsError ? (
        <p className="rounded-xl border border-border/70 bg-card p-3 text-sm text-muted-foreground">
          Os produtos não puderam ser carregados; exibindo os IDs relacionados às mídias.
        </p>
      ) : productsLoading ? (
        <p className="text-sm text-muted-foreground">Carregando nomes dos produtos…</p>
      ) : null}
      {MEDIA_GROUPS.map((group) => {
        const grouped = media.filter((item) => item.media_type === group.type);
        if (grouped.length === 0) return null;
        return (
          <section key={group.type}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">{group.label}</h2>
              <span className="text-xs tabular-nums text-muted-foreground">{grouped.length}</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {grouped.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  {...(names.has(item.product_id) ? { productName: names.get(item.product_id)! } : {})}
                />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

function useAdminMediaUrl(item: ProductMedia) {
  const remote = isRemoteMediaPath(item.storage_path);
  const [url, setUrl] = useState(remote ? item.storage_path : "");
  const [loading, setLoading] = useState(!remote);

  useEffect(() => {
    if (remote) {
      setUrl(item.storage_path);
      setLoading(false);
      return;
    }
    let active = true;
    let objectUrl = "";
    setLoading(true);
    setUrl("");
    downloadAdminMediaBlob(item.storage_path)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setUrl("");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.storage_path, remote]);

  return { url, loading, remote };
}

function MediaCard({ item, productName }: { item: ProductMedia; productName?: string }) {
  const { url, loading, remote } = useAdminMediaUrl(item);
  const [opening, setOpening] = useState(false);
  const label = productName ?? `Produto ${item.product_id.slice(0, 8)}`;
  const status = loading ? "Carregando…" : url ? "Disponível" : "Prévia indisponível";
  const resolvedItem = useMemo(() => ({ ...item, url }), [item, url]);

  async function handleOpenFile() {
    setOpening(true);
    try {
      const blob = await downloadAdminMediaBlob(item.storage_path);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      toast.error("Não foi possível abrir o arquivo.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <article className="surface-card overflow-hidden">
      <div className="aspect-[4/3] overflow-hidden bg-sand">
        <MediaPreview item={resolvedItem} />
      </div>
      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{label}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{item.storage_path}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded-full bg-secondary px-2 py-0.5">{status}</span>
          <span
            className={`rounded-full px-2 py-0.5 ${
              item.alt?.trim() ? "bg-secondary" : "bg-clay/15 text-clay"
            }`}
          >
            {item.alt?.trim() ? "Alt definido" : "Sem alt"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link
              to="/admin"
              search={{ tab: "catalogo", product: item.product_id, section: "media" }}
            >
              Abrir produto
            </Link>
          </Button>
          {remote ? (
            <Button size="sm" variant="ghost" asChild>
              <a href={item.storage_path} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                Abrir arquivo
              </a>
            </Button>
          ) : url ? (
            <Button size="sm" variant="ghost" onClick={handleOpenFile} disabled={opening}>
              <ExternalLink className="size-3.5" />
              {opening ? "Abrindo…" : "Abrir arquivo"}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function MediaPreview({ item }: { item: ProductMedia }) {
  if (item.media_type === "image") {
    return item.url ? (
      <img src={item.url} alt={item.alt ?? ""} className="size-full object-contain p-3" />
    ) : (
      <PreviewPlaceholder icon={ImageIcon} label="Imagem sem prévia" />
    );
  }

  if (item.media_type === "video") {
    return item.url ? (
      <video src={item.url} className="size-full object-cover" controls muted preload="metadata" />
    ) : (
      <PreviewPlaceholder icon={Film} label="Vídeo sem prévia" />
    );
  }

  return item.url ? (
    <ModelViewer url={item.url} className="size-full" compact />
  ) : (
    <PreviewPlaceholder icon={Box} label="Modelo sem prévia" />
  );
}

function PreviewPlaceholder({
  icon: Icon,
  label,
}: {
  icon: typeof Box;
  label: string;
}) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <Icon className="size-8" />
      {label}
    </div>
  );
}
