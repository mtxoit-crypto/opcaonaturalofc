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
  partitionMediaFiles,
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
import { cn } from "@/lib/utils";

type Slot = "photo" | "video";

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
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState<Slot | null>(null);
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

  async function applyCover(path: string, quiet = false) {
    if (!catalogId) return;
    const url = await coverPublicUrl(path);
    await saveCover(catalogId, url);
    onCoverChange?.(url);
    if (!quiet) toast.success("Foto de perfil atualizada");
    invalidate();
  }

  async function ingest(files: FileList | File[] | null, slot: Slot) {
    if (!catalogId || !files?.length) return;
    const { images, videos, models } = partitionMediaFiles(Array.from(files));
    if (slot === "photo" && !images.length && videos.length) {
      toast.message("O vídeo foi para o quadro da direita.");
    }
    if (slot === "video" && !videos.length && images.length) {
      toast.message("A foto foi para o quadro da esquerda.");
    }
    const queue = slot === "video" ? [...videos, ...images, ...models] : [...images, ...videos, ...models];
    if (!queue.length) return;
    setBusy(true);
    try {
      let firstImagePath: string | null = null;
      let uploadedVideo = false;
      for (const file of queue) {
        const { type, path } = await uploadProductMedia(catalogId, file);
        if (type === "image" && !firstImagePath) firstImagePath = path;
        if (type === "video") uploadedVideo = true;
      }
      if (firstImagePath && (slot === "photo" || !coverUrl)) await applyCover(firstImagePath, true);
      else invalidate();
      toast.success(
        firstImagePath && uploadedVideo
          ? "Foto e vídeo lado a lado"
          : firstImagePath
            ? "Foto enviada"
            : "Vídeo enviado",
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (photoInput.current) photoInput.current.value = "";
      if (videoInput.current) videoInput.current.value = "";
    }
  }

  async function addUrl() {
    if (!catalogId) return;
    setBusy(true);
    try {
      await addVideoLink(catalogId, videoUrl);
      setVideoUrl("");
      toast.success("Vídeo ao lado da foto");
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
      <p className="text-sm text-muted-foreground">
        Salve o produto uma vez para abrir os quadros de foto e vídeo.
      </p>
    );
  }

  if (!catalogId) {
    return (
      <p className="text-sm text-muted-foreground">
        Este item ainda existe só na Shopify. Salve no catálogo da loja para enviar foto e vídeo.
      </p>
    );
  }

  const photos = (media ?? []).filter((item) => item.media_type === "image");
  const videos = (media ?? []).filter((item) => item.media_type === "video");
  const extras = (media ?? []).filter((item) => item.media_type === "model");
  const cover =
    photos.find((item) => coverUrl && (coverUrl === item.url || coverUrl.includes(item.storage_path))) ??
    photos[0];
  const featureVideo = videos[0];
  const rest = [
    ...photos.filter((item) => item.id !== cover?.id),
    ...videos.filter((item) => item.id !== featureVideo?.id),
    ...extras,
  ];

  function onSlotDrag(e: React.DragEvent, slot: Slot) {
    const types = [...e.dataTransfer.types];
    if (!types.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setOver(slot);
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight">Foto e vídeo</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste a foto de perfil à esquerda e o vídeo à direita. Se soltar os dois juntos, cada
          um cai no seu quadro.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <DropFrame
          label="Foto de perfil"
          hint="JPEG, PNG ou WebP · até 8 MB"
          active={over === "photo"}
          busy={busy}
          filled={Boolean(cover?.url || coverUrl)}
          onBrowse={() => photoInput.current?.click()}
          onDragOver={(e) => onSlotDrag(e, "photo")}
          onDragLeave={() => setOver((s) => (s === "photo" ? null : s))}
          onDrop={(e) => {
            e.preventDefault();
            setOver(null);
            void ingest(e.dataTransfer.files, "photo");
          }}
        >
          {cover?.url || coverUrl ? (
            <img
              src={cover?.url || coverUrl || ""}
              alt={cover?.alt ?? "Foto de perfil"}
              className="size-full object-contain p-3"
            />
          ) : (
            <EmptySlot icon={PhotoPlus} text="Solte a foto do pote" />
          )}
        </DropFrame>

        <DropFrame
          label="Vídeo"
          hint="MP4 ou WebM · até 50 MB"
          active={over === "video"}
          busy={busy}
          filled={Boolean(featureVideo?.url)}
          onBrowse={() => videoInput.current?.click()}
          onDragOver={(e) => onSlotDrag(e, "video")}
          onDragLeave={() => setOver((s) => (s === "video" ? null : s))}
          onDrop={(e) => {
            e.preventDefault();
            setOver(null);
            void ingest(e.dataTransfer.files, "video");
          }}
        >
          {featureVideo?.url ? (
            <video src={featureVideo.url} className="size-full object-cover" muted playsInline controls />
          ) : (
            <EmptySlot icon={Film} text="Solte o vídeo ao lado" />
          )}
        </DropFrame>
      </div>

      <input
        ref={photoInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple
        className="hidden"
        onChange={(e) => void ingest(e.target.files, "photo")}
      />
      <input
        ref={videoInput}
        type="file"
        accept="video/mp4,video/webm,.glb,.gltf"
        multiple
        className="hidden"
        onChange={(e) => void ingest(e.target.files, "video")}
      />

      <div className="space-y-1.5">
        <Label htmlFor="video-url">Ou cole o link do vídeo (.mp4 / .webm)</Label>
        <div className="flex gap-2">
          <Input
            id="video-url"
            value={videoUrl}
            placeholder="https://…"
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <Button type="button" variant="outline" disabled={busy || !videoUrl.trim()} onClick={() => void addUrl()}>
            <LinkIcon className="size-4" />
            Colocar ao lado
          </Button>
        </div>
      </div>

      {rest.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Galeria extra</p>
          <ul className="grid grid-cols-3 gap-2">
            {rest.map((item) => (
              <GalleryTile
                key={item.id}
                item={item}
                dragging={draggingId === item.id}
                onDragStart={() => setDraggingId(item.id)}
                onDragEnd={() => setDraggingId(null)}
                onDropOn={() => {
                  if (draggingId) void onReorder(draggingId, item.id);
                  setDraggingId(null);
                }}
                onCover={
                  item.media_type === "image" ? () => void applyCover(item.storage_path) : undefined
                }
                onRemove={() => remove.mutate(item)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {cover || featureVideo ? (
        <div className="flex flex-wrap gap-2">
          {cover ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => remove.mutate(cover)}
            >
              <Trash2 className="size-3.5" />
              Tirar foto
            </Button>
          ) : null}
          {featureVideo ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => remove.mutate(featureVideo)}
            >
              <Trash2 className="size-3.5" />
              Tirar vídeo
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => photoInput.current?.click()}
          >
            {busy ? <Spinner className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            Trocar foto
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function DropFrame({
  label,
  hint,
  active,
  busy,
  filled,
  children,
  onBrowse,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  label: string;
  hint: string;
  active: boolean;
  busy: boolean;
  filled: boolean;
  children: React.ReactNode;
  onBrowse: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative overflow-hidden rounded-2xl bg-sand transition-[box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
          active ? "ring-2 ring-clay" : "ring-1 ring-border/70",
        )}
      >
        <div className="aspect-[4/5]">{children}</div>
        {!filled ? (
          <button
            type="button"
            disabled={busy}
            onClick={onBrowse}
            className="absolute inset-0"
            aria-label={label}
          />
        ) : null}
        {busy ? (
          <span className="pointer-events-none absolute inset-0 grid place-items-center bg-card/70">
            <Spinner className="size-6 animate-spin" />
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptySlot({ icon: Icon, text }: { icon: typeof PhotoPlus; text: string }) {
  return (
    <span className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
      <Icon className="size-8" />
      <span className="text-sm">{text}</span>
    </span>
  );
}

function GalleryTile({
  item,
  dragging,
  onDragStart,
  onDragEnd,
  onDropOn,
  onCover,
  onRemove,
}: {
  item: ProductMedia;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropOn: () => void;
  onCover?: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropOn}
      className={cn("group relative overflow-hidden rounded-xl bg-sand", dragging && "opacity-60")}
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
      <div className="absolute right-1 top-1 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        {onCover ? (
          <Button type="button" size="icon" variant="secondary" className="size-6" title="Usar de perfil" onClick={onCover}>
            <Star className="size-3" />
          </Button>
        ) : null}
        <Button type="button" size="icon" variant="ghost" className="size-6 bg-background/80" onClick={onRemove}>
          <Trash2 className="size-3" />
        </Button>
      </div>
    </li>
  );
}
