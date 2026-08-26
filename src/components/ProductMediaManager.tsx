import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Film,
  GripVertical as DragHandle,
  ImagePlus as PhotoPlus,
  Link2 as LinkIcon,
  Loader2 as Spinner,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  addProductVideoUrl as addVideoLink,
  deleteProductMedia,
  isDatabaseProductId as isCatalogId,
  productMediaQuery as mediaQuery,
  publicMediaUrl as coverPublicUrl,
  reorderProductMedia as saveMediaOrder,
  setProductCover as saveCover,
  uploadProductMedia,
  type ProductMedia,
} from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProductMediaManager({
  productId,
  coverUrl,
  onCoverChange,
}: {
  productId?: string;
  coverUrl?: string | null;
  onCoverChange?: (url: string) => void;
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const catalogId = isCatalogId(productId) ? productId : undefined;
  const { data: media } = useQuery(mediaQuery(catalogId));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["product-media", catalogId] });
    qc.invalidateQueries({ queryKey: ["products"] });
    if (catalogId) qc.invalidateQueries({ queryKey: ["product"] });
  };

  const remove = useMutation({
    mutationFn: (item: ProductMedia) => deleteProductMedia(item),
    onSuccess: () => {
      toast.success("Arquivo removido");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function applyCover(path: string) {
    if (!catalogId) return;
    const url = await coverPublicUrl(path);
    await saveCover(catalogId, url);
    onCoverChange?.(url);
    toast.success("Foto da vitrine atualizada");
    invalidate();
  }

  async function onFiles(files: FileList | File[] | null) {
    if (!catalogId || !files?.length) return;
    setBusy(true);
    try {
      let firstImagePath: string | null = null;
      for (const file of Array.from(files)) {
        const { type, path } = await uploadProductMedia(catalogId, file);
        if (type === "image" && !firstImagePath) firstImagePath = path;
      }
      toast.success("Mídia enviada");
      if (firstImagePath && !coverUrl) await applyCover(firstImagePath);
      else invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function addUrl() {
    if (!catalogId) return;
    setBusy(true);
    try {
      await addVideoLink(catalogId, videoUrl);
      setVideoUrl("");
      toast.success("Vídeo adicionado");
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onReorder(fromId: string, toId: string) {
    if (!media?.length || fromId === toId) return;
    const ids = media.map((item) => item.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, fromId);
    try {
      await saveMediaOrder(ids);
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (!productId) {
    return (
      <p className="text-xs text-muted-foreground">
        Salve o produto para abrir o estúdio de fotos e vídeos.
      </p>
    );
  }

  if (!catalogId) {
    return (
      <p className="text-xs text-muted-foreground">
        Salve este item no catálogo da loja para enviar fotos e vídeos. Produtos que existem só na
        Shopify ainda não têm galeria aqui.
      </p>
    );
  }

  const cover = media?.find(
    (item) => item.media_type === "image" && coverUrl?.includes(item.storage_path),
  );
  const hero = cover ?? media?.find((item) => item.media_type === "image") ?? media?.[0];

  return (
    <section className="space-y-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Estúdio
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Foto da vitrine, galeria e vídeo. Arraste para reordenar.
        </p>
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl bg-sand ${dragOver ? "ring-2 ring-clay" : ""}`}
        onDragOver={(e) => {
          if (![...e.dataTransfer.types].includes("Files")) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (![...e.dataTransfer.types].includes("Files")) return;
          e.preventDefault();
          setDragOver(false);
          void onFiles(e.dataTransfer.files);
        }}
      >
        {hero?.media_type === "video" ? (
          <video src={hero.url} className="aspect-[4/5] w-full object-cover" muted playsInline controls />
        ) : hero?.url ? (
          <img src={hero.url} alt={hero.alt ?? ""} className="aspect-[4/5] w-full object-contain p-4" />
        ) : (
          <button
            type="button"
            className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 text-muted-foreground"
            onClick={() => inputRef.current?.click()}
          >
            <PhotoPlus className="size-8" />
            <span className="text-sm">Solte a foto do pote aqui</span>
          </button>
        )}
        {cover ? (
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider">
            Vitrine
          </span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,.glb,.gltf"
        multiple
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Spinner className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Enviar arquivo
        </Button>
        <p className="self-center text-[11px] leading-snug text-muted-foreground">
          Foto até 8 MB. Vídeo MP4/WebM até 50 MB.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="video-url">Vídeo por link (https, .mp4 ou .webm)</Label>
        <div className="flex gap-2">
          <Input
            id="video-url"
            value={videoUrl}
            placeholder="https://…"
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <Button type="button" variant="outline" disabled={busy || !videoUrl.trim()} onClick={() => void addUrl()}>
            <LinkIcon className="size-4" />
            Add
          </Button>
        </div>
      </div>

      {media && media.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {media.map((item) => {
            const isCover =
              item.media_type === "image" &&
              Boolean(coverUrl && (coverUrl === item.url || coverUrl.includes(item.storage_path)));
            return (
              <li
                key={item.id}
                draggable
                onDragStart={() => setDraggingId(item.id)}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggingId) void onReorder(draggingId, item.id);
                  setDraggingId(null);
                }}
                className={`group relative overflow-hidden rounded-xl bg-sand ${draggingId === item.id ? "opacity-60" : ""}`}
              >
                {item.media_type === "model" ? (
                  <div className="flex aspect-square items-center justify-center p-2 text-center text-[10px] text-muted-foreground">
                    Modelo 3D
                  </div>
                ) : item.media_type === "video" ? (
                  <video src={item.url} className="aspect-square size-full object-cover" muted />
                ) : (
                  <img src={item.url} alt={item.alt ?? ""} className="aspect-square size-full object-cover" />
                )}
                <span className="absolute left-1 top-1 rounded bg-card/80 p-0.5 text-muted-foreground">
                  <DragHandle className="size-3" />
                </span>
                {item.media_type === "video" ? (
                  <span className="absolute bottom-1 left-1 rounded bg-card/80 p-0.5">
                    <Film className="size-3" />
                  </span>
                ) : null}
                {isCover ? (
                  <span className="absolute bottom-1 left-1 rounded bg-card/90 p-0.5 text-clay">
                    <Star className="size-3 fill-current" />
                  </span>
                ) : null}
                <div className="absolute right-1 top-1 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  {item.media_type === "image" ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="size-6"
                      title="Usar na vitrine"
                      onClick={() => void applyCover(item.storage_path)}
                    >
                      <Star className="size-3" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-6 bg-background/80"
                    onClick={() => remove.mutate(item)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
