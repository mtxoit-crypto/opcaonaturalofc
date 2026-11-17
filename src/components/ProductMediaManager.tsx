import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
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
  assertMediaFile,
  deleteProductMedia,
  isDatabaseProductId as isCatalogId,
  partitionMediaFiles,
  productMediaQuery as mediaQuery,
  publicMediaUrl as coverPublicUrl,
  reorderProductMedia as saveMediaOrder,
  replaceProductMedia,
  setProductCover as saveCover,
  updateProductMediaAlt,
  uploadProductMedia,
  type MediaUploadProgress,
  type ProductMedia,
} from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ModelViewer } from "@/components/ModelViewer";

type Slot = "photo" | "video" | "model";
type UploadFileInfo = { name: string; size: number };

export function ProductMediaManager({
  productId,
  coverUrl,
  onCoverChange,
  uploadDropAreaRef,
  showModel = false,
}: {
  productId?: string;
  coverUrl?: string | null;
  onCoverChange?: (url: string) => void;
  uploadDropAreaRef?: React.RefObject<HTMLDivElement | null>;
  showModel?: boolean;
}) {
  const qc = useQueryClient();
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const modelInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState<Slot | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFileInfo, setUploadFileInfo] = useState<UploadFileInfo | null>(null);
  const [pendingPhotoFiles, setPendingPhotoFiles] = useState<File[]>([]);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  const catalogId = isCatalogId(productId) ? productId : undefined;
  const { data: media, isLoading: mediaLoading } = useQuery(mediaQuery(catalogId));
  const frameBusy = busy || mediaLoading;

  useEffect(() => {
    setPendingPhotoFiles([]);
    setUploadError(null);
    if (photoInput.current) photoInput.current.value = "";
  }, [productId]);

  useEffect(() => {
    const file = pendingPhotoFiles[0];
    if (!file) {
      setPendingPhotoPreview(null);
      return;
    }
    const preview = URL.createObjectURL(file);
    setPendingPhotoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [pendingPhotoFiles]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["product-media", catalogId] });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
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

  const saveAlt = useMutation({
    mutationFn: ({ id, alt }: { id: string; alt: string }) => updateProductMediaAlt(id, alt),
    onSuccess: () => {
      toast.success("Texto alternativo salvo");
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
    const { images, videos, models, invalid } = partitionMediaFiles(Array.from(files));
    const queue = slot === "photo" ? images : slot === "video" ? videos : models;
    const ignored = Array.from(files).length - queue.length - invalid.length;
    if (invalid.length) {
      const message = "Apenas modelos .glb são aceitos nesta área.";
      setUploadError(message);
      toast.error(message);
    }
    if (ignored > 0) {
      toast.message(
        slot === "photo"
          ? "Só fotos foram adicionadas nesta área."
          : slot === "video"
            ? "Só vídeos foram adicionados nesta área."
            : "Só modelos .glb foram adicionados nesta área.",
      );
    }
    if (!queue.length) return;
    setBusy(true);
    setUploadError(null);
    setUploadFileInfo({ name: queue[0]?.name ?? "arquivo", size: queue[0]?.size ?? 0 });
    setUploadProgress({ stage: "validating", progress: 0 });
    try {
      let firstImagePath: string | null = null;
      let uploadedVideo = false;
      let replacedCover = false;
      const replacement =
        queue.length === 1
          ? slot === "photo"
            ? cover
            : slot === "video"
              ? featureVideo
              : model
          : undefined;
      for (const [index, file] of queue.entries()) {
        const progress = (next: MediaUploadProgress) =>
          setUploadProgress({
            ...next,
            progress: Math.min(99, Math.round((index / queue.length) * 100 + next.progress / queue.length)),
          });
        const result = replacement
          ? await replaceProductMedia(catalogId, replacement, file, {
              onProgress: progress,
              setCover: replacement.media_type === "image",
            })
          : await uploadProductMedia(catalogId, file, { onProgress: progress });
        const { type, path } = result;
        if (type === "image" && !firstImagePath) firstImagePath = path;
        if (type === "video") uploadedVideo = true;
        replacedCover = Boolean(replacement && replacement.media_type === "image");
      }
      if (firstImagePath && !replacedCover && (slot === "photo" || !coverUrl)) {
        await applyCover(firstImagePath, true);
      }
      else invalidate();
      setUploadProgress({ stage: "complete", progress: 100 });
      if (slot === "photo") setPendingPhotoFiles([]);
      toast.success(
        slot === "model"
          ? "Modelo 3D enviado"
          : firstImagePath && uploadedVideo
            ? "Foto e vídeo enviados"
          : firstImagePath
            ? "Foto enviada"
            : "Vídeo enviado",
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Não foi possível enviar o arquivo.";
      setUploadError(message);
      setUploadProgress(null);
      toast.error(message);
    } finally {
      setBusy(false);
      if (photoInput.current) photoInput.current.value = "";
      if (videoInput.current) videoInput.current.value = "";
      if (modelInput.current) modelInput.current.value = "";
    }
  }

  function stagePhoto(files: FileList | File[] | null) {
    if (!files?.length) return;
    const { images, videos, models, invalid } = partitionMediaFiles(Array.from(files));
    const validImages: File[] = [];
    for (const file of images) {
      try {
        if (assertMediaFile(file) === "image") validImages.push(file);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `${file.name}: foto inválida.`);
      }
    }
    if (invalid.length) toast.error("Apenas modelos .glb são aceitos na área 3D.");
    if (videos.length || models.length) toast.message("Para enviar vídeo ou modelo, use a área correspondente.");
    if (!validImages.length) return;
    setUploadError(null);
    setPendingPhotoFiles(validImages);
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
        Salve o produto uma vez para abrir os quadros de mídia.
      </p>
    );
  }

  if (!catalogId) {
    return (
      <div className="rounded-xl border border-clay/30 bg-clay/5 p-4 text-sm">
        <p className="font-medium">Este produto ainda não foi cadastrado no catálogo da loja.</p>
        <p className="mt-1 text-muted-foreground">
          Para trocar a foto, volte em <strong>Geral</strong>, clique em <strong>Salvar produto</strong> e
          depois abra <strong>Mídia</strong> novamente. Isso cria o registro local sem alterar o preço do checkout.
        </p>
      </div>
    );
  }

  const photos = (media ?? []).filter((item) => item.media_type === "image");
  const videos = (media ?? []).filter((item) => item.media_type === "video");
  const models = (media ?? []).filter((item) => item.media_type === "model");
  const model = models[0];
  const cover =
    photos.find((item) => coverUrl && (coverUrl === item.url || coverUrl.includes(item.storage_path))) ??
    photos[0];
  const featureVideo = videos[0];
  const rest = showModel
    ? []
    : [...photos.filter((item) => item.id !== cover?.id), ...videos.filter((item) => item.id !== featureVideo?.id)];

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
        <h3 className="text-base font-semibold tracking-tight">{showModel ? "Modelo 3D" : "Mídia do produto"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {showModel
            ? "Envie um modelo GLB para usar na visualização 3D do produto."
            : "Organize a foto principal e o vídeo em áreas separadas."}
        </p>
      </div>

      <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", showModel && "max-w-sm")}>
        {!showModel ? (
          <>
            <DropFrame
              {...(uploadDropAreaRef ? { dropAreaRef: uploadDropAreaRef } : {})}
              label="Foto"
              hint="JPEG, PNG ou WebP · até 8 MB"
              active={over === "photo"}
              busy={frameBusy}
              filled={Boolean(pendingPhotoPreview || cover?.url || coverUrl)}
              onBrowse={() => photoInput.current?.click()}
              onDragOver={(e) => onSlotDrag(e, "photo")}
              onDragLeave={() => setOver((s) => (s === "photo" ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                stagePhoto(e.dataTransfer.files);
              }}
              replaceLabel="Trocar foto"
              altValue={cover?.alt ?? ""}
              {...(cover ? { onAltSave: (alt: string) => saveAlt.mutate({ id: cover.id, alt }) } : {})}
            >
              {pendingPhotoPreview ? (
                <img src={pendingPhotoPreview} alt="Prévia da nova foto de perfil" className="size-full object-contain p-3" />
              ) : cover?.url || coverUrl ? (
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
              busy={frameBusy}
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
          </>
        ) : (
          <DropFrame
            label="Modelo 3D / GLB"
            hint="Somente .glb · até 50 MB"
            active={over === "model"}
            busy={frameBusy}
            filled={Boolean(model?.url)}
            onBrowse={() => modelInput.current?.click()}
            onDragOver={(e) => onSlotDrag(e, "model")}
            onDragLeave={() => setOver((s) => (s === "model" ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              void ingest(e.dataTransfer.files, "model");
            }}
          >
            {model?.url ? (
              <div className="size-full">
                <ModelViewer url={model.url} className="size-full" compact />
                <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-2 py-1 text-[10px] text-muted-foreground">
                  GLB interativo
                </p>
              </div>
            ) : (
              <EmptySlot icon={Box} text="Solte o modelo .glb" />
            )}
          </DropFrame>
        )}
      </div>

      {uploadProgress ? (
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3" aria-live="polite">
          <div className="flex items-center justify-between text-xs">
            <span>
              {uploadProgress.stage === "validating"
                ? "Validando arquivo…"
                : uploadProgress.stage === "uploading"
                  ? "Enviando arquivo…"
                  : uploadProgress.stage === "saving"
                    ? "Salvando mídia…"
                    : "Mídia pronta"}
            </span>
            <span>{uploadProgress.progress}%</span>
          </div>
          {uploadFileInfo ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {uploadFileInfo.name} · {formatBytes(uploadFileInfo.size)}
            </p>
          ) : null}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-accent transition-[width]" style={{ width: `${uploadProgress.progress}%` }} />
          </div>
        </div>
      ) : null}
      {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}

      {!showModel ? (
        <>
          <input
            ref={photoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            multiple
            className="hidden"
            onChange={(e) => stagePhoto(e.target.files)}
          />
          <input
            ref={videoInput}
            type="file"
            accept="video/mp4,video/webm"
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
            <Button type="button" variant="outline" disabled={frameBusy || !videoUrl.trim()} onClick={() => void addUrl()}>
                <LinkIcon className="size-4" />
                Colocar ao lado
              </Button>
            </div>
          </div>
        </>
      ) : null}
      {showModel ? (
        <input
          ref={modelInput}
          type="file"
          accept=".glb,model/gltf-binary,application/octet-stream"
          className="hidden"
          onChange={(e) => void ingest(e.target.files, "model")}
        />
      ) : null}

      {!showModel && rest.length > 0 ? (
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
                {...(item.media_type === "image"
                  ? {
                      onCover: () => void applyCover(item.storage_path),
                      onAltSave: (alt: string) => saveAlt.mutate({ id: item.id, alt }),
                    }
                  : {})}
                onRemove={() => remove.mutate(item)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {showModel ? (
        model ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(model)}>
              <Trash2 className="size-3.5" />
              Tirar modelo
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={frameBusy} onClick={() => modelInput.current?.click()}>
              <Upload className="size-3.5" />
              Trocar modelo
            </Button>
          </div>
        ) : null
      ) : cover || featureVideo ? (
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
            disabled={frameBusy}
            onClick={() => photoInput.current?.click()}
          >
            {busy ? <Spinner className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            Trocar foto
          </Button>
          {featureVideo ? (
            <Button type="button" size="sm" variant="secondary" disabled={frameBusy} onClick={() => videoInput.current?.click()}>
              <Upload className="size-3.5" />
              Trocar vídeo
            </Button>
          ) : null}
        </div>
      ) : null}
      {!showModel && pendingPhotoFiles.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/5 p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Prévia pronta</p>
            <p className="truncate text-xs text-muted-foreground">
              {pendingPhotoFiles.length === 1
                ? pendingPhotoFiles[0]?.name
                : `${pendingPhotoFiles.length} fotos selecionadas`}
              {" · "}
              toque em Enviar para atualizar o perfil
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={frameBusy}
              onClick={() => {
                setPendingPhotoFiles([]);
                setUploadError(null);
                if (photoInput.current) photoInput.current.value = "";
              }}
            >
              Escolher outra
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={frameBusy}
              onClick={() => void ingest(pendingPhotoFiles, "photo")}
            >
              {busy ? <Spinner className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              Enviar foto
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DropFrame({
  dropAreaRef,
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
  replaceLabel,
  altValue,
  onAltSave,
}: {
  dropAreaRef?: React.RefObject<HTMLDivElement | null>;
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
  replaceLabel?: string;
  altValue?: string;
  onAltSave?: (alt: string) => void;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div
        ref={dropAreaRef}
        tabIndex={-1}
        aria-label={`${label} — área para envio`}
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
        {filled && replaceLabel ? (
          <button
            type="button"
            disabled={busy}
            onClick={onBrowse}
            className="absolute inset-0 flex items-end justify-center p-2"
          >
            <span className="rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-card">
              {replaceLabel}
            </span>
          </button>
        ) : null}
        {busy ? (
          <span className="pointer-events-none absolute inset-0 grid place-items-center bg-card/70">
            <Spinner className="size-6 animate-spin" />
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{hint}</p>
      {onAltSave ? <AltEditor value={altValue ?? ""} onSave={onAltSave} /> : null}
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

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function GalleryTile({
  item,
  dragging,
  onDragStart,
  onDragEnd,
  onDropOn,
  onCover,
  onAltSave,
  onRemove,
}: {
  item: ProductMedia;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropOn: () => void;
  onCover?: () => void;
  onAltSave?: (alt: string) => void;
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
      <div className="aspect-square">
        {item.media_type === "video" ? (
          <video src={item.url} className="size-full object-cover" muted />
        ) : (
          <img src={item.url} alt={item.alt ?? ""} className="size-full object-cover" />
        )}
      </div>
      {onAltSave ? <AltEditor value={item.alt ?? ""} onSave={onAltSave} /> : null}
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

function AltEditor({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  return (
    <div className="space-y-1 bg-card/95 p-1.5">
      <Label className="sr-only">Texto alternativo da imagem</Label>
      <Input
        value={draft}
        placeholder="Texto alternativo"
        aria-label="Texto alternativo da imagem"
        className="h-7 text-[11px]"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSave(draft);
          }
        }}
        onBlur={() => onSave(draft)}
      />
    </div>
  );
}
