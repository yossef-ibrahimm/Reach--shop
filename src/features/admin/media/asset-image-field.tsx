'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Undo2, X } from 'lucide-react';
import { ImageProcessError, compressToWebp } from '@/features/admin/media/image-compress';
import { useToast } from '@/features/admin/ui/toast';

type ImageMessages = {
  choose: string;
  hint: string;
  pending: string;
  removePending: string;
  removeCurrent: string;
  undoRemove: string;
  empty: string;
  imageType: string;
  imageTooBig: string;
  imageDecode: string;
  webpUnsupported: string;
};

type Props = {
  currentUrl: string | null;
  file: Blob | null;
  removeCurrent: boolean;
  onFileChange: (file: Blob | null) => void;
  onRemoveCurrentChange: (remove: boolean) => void;
  messages: ImageMessages;
  disabled?: boolean;
};

/** Single staged site asset image; upload remains the caller's responsibility on Save. */
export function AssetImageField({
  currentUrl,
  file,
  removeCurrent,
  onFileChange,
  onRemoveCurrentChange,
  messages,
  disabled = false,
}: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const handleFile = async (picked: File | undefined) => {
    if (!picked) return;
    setProcessing(true);
    try {
      const { blob } = await compressToWebp(picked);
      onFileChange(blob);
      onRemoveCurrentChange(false);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (error) {
      const code = error instanceof ImageProcessError ? error.code : 'decode';
      const message =
        code === 'type'
          ? messages.imageType
          : code === 'size'
            ? messages.imageTooBig
            : code === 'webp'
              ? messages.webpUnsupported
              : messages.imageDecode;
      toast(message, 'error');
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const shownUrl = previewUrl ?? (!removeCurrent ? currentUrl : null);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted text-xs font-bold">{messages.hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled || processing}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || processing}
          onClick={() => inputRef.current?.click()}
          className="border-border bg-surface hover:bg-surface-alt inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <ImagePlus aria-hidden="true" className="size-4" />
          )}
          {messages.choose}
        </button>
        {file && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onFileChange(null);
              setPreviewUrl(null);
            }}
            className="text-fire-700 inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-bold"
          >
            <Undo2 aria-hidden="true" className="size-4" />
            {messages.removePending}
          </button>
        )}
        {!file && currentUrl && !removeCurrent && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemoveCurrentChange(true)}
            className="text-fire-700 inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-bold"
          >
            <X aria-hidden="true" className="size-4" />
            {messages.removeCurrent}
          </button>
        )}
        {removeCurrent && currentUrl && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemoveCurrentChange(false)}
            className="text-muted inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-bold"
          >
            <Undo2 aria-hidden="true" className="size-4" />
            {messages.undoRemove}
          </button>
        )}
      </div>
      {shownUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element -- preview and public Supabase asset URL */
        <img src={shownUrl} alt="" className="border-border h-28 w-40 rounded-md border bg-white object-contain p-2" />
      ) : (
        <p className="text-muted border-border flex h-20 w-40 items-center justify-center rounded-md border border-dashed text-xs font-bold">
          {messages.empty}
        </p>
      )}
      {removeCurrent && <p className="text-fire-700 text-xs font-bold">{messages.pending}</p>}
    </div>
  );
}
