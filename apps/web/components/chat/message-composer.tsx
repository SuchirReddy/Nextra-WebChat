"use client";

import { Send, Smile, Plus, Mic } from "lucide-react";
import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useUploadThing } from "@/lib/uploadthing";

export type PendingAttachment = {
  type: "image" | "file";
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export const MessageComposer = ({
  onSubmit,
  onTyping
}: {
  onSubmit: (payload: { body?: string; attachments?: PendingAttachment[] }) => Promise<void>;
  onTyping: (typing: boolean) => void;
}) => {
  const [text, setText] = useState("");
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [sending, setSending] = useState(false);

  const { startUpload, isUploading } = useUploadThing("chatMedia");

  const hasContent = useMemo(() => text.trim().length > 0 || pending.length > 0, [pending.length, text]);

  const uploadFiles = async (files: File[]) => {
    const uploaded = await startUpload(files);
    if (!uploaded) {
      return;
    }

    setPending((current) => [
      ...current,
      ...uploaded.map((item) => ({
        type: (item.type.startsWith("image/") ? "image" : "file") as "image" | "file",
        url: item.serverData?.url ?? item.url,
        fileName: item.name,
        mimeType: item.type,
        sizeBytes: item.size
      }))
    ]);
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    await uploadFiles(Array.from(files));
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!event.dataTransfer.files.length) {
      return;
    }

    await uploadFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <div className="bg-transparent px-6 py-4 pb-6" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      {pending.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {pending.map((item) => (
            <div key={`${item.url}:${item.fileName}`} className="rounded-md bg-background px-3 py-1.5 text-xs shadow-sm">
              {item.fileName}
            </div>
          ))}
        </div>
      ) : null}

      <form
        className="flex items-center gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!hasContent || sending) {
            return;
          }

          const payload = {
            body: text.trim() || undefined,
            attachments: pending.length ? pending : undefined
          };

          // Clear immediately — don't wait for the network round-trip
          setText("");
          setPending([]);
          onTyping(false);

          try {
            setSending(true);
            await onSubmit(payload);
          } catch (error) {
            // Restore text so the user can retry
            setText(payload.body ?? "");
            toast.error(error instanceof Error ? error.message : "Unable to send message");
          } finally {
            setSending(false);
          }
        }}
      >
        <div className="flex items-center gap-1 text-muted-foreground">
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="rounded-full p-2.5 text-[var(--clay-primary)] hover:shadow-clay-sm dark:hover:shadow-clay-dark-sm hover:-translate-y-0.5 transition-all bg-[var(--clay-bg-panel)] shadow-sm" aria-label="Emoji">
                <Smile className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto p-0 border-none shadow-none bg-transparent mb-2">
              <EmojiPicker
                onEmojiClick={(emojiData: EmojiClickData) => {
                  const newText = text + emojiData.emoji;
                  setText(newText);
                  onTyping(newText.trim().length > 0);
                }}
                lazyLoadEmojis
              />
            </PopoverContent>
          </Popover>

          <label className="cursor-pointer">
            <Input type="file" className="hidden" multiple onChange={handleFileSelect} />
            <div className="rounded-full p-2.5 text-[var(--clay-primary)] hover:shadow-clay-sm dark:hover:shadow-clay-dark-sm hover:-translate-y-0.5 transition-all bg-[var(--clay-bg-panel)] shadow-sm">
              <Plus className="h-5 w-5" />
            </div>
          </label>
        </div>

        <div className="flex-1">
          <Input
            value={text}
            className="h-12 w-full rounded-3xl bg-[var(--clay-bg-app)] px-6 border-none shadow-clay-inset dark:shadow-clay-dark-inset focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px]"
            onChange={(e) => {
              const value = e.target.value;
              setText(value);
              onTyping(value.trim().length > 0);
            }}
          />
        </div>

        <button 
          type={hasContent ? "submit" : "button"} 
          disabled={sending || isUploading}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-all shadow-clay-sm dark:shadow-clay-dark-sm hover:shadow-clay-md dark:hover:shadow-clay-dark-md hover:-translate-y-0.5 ${hasContent ? "bg-[var(--clay-primary)] text-white" : "bg-[var(--clay-bg-panel)] text-[var(--clay-primary)]"}`}
        >
          {hasContent ? (
            <Send className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </button>
      </form>

      {isUploading ? <p className="mt-1 text-xs text-muted-foreground">Uploading files...</p> : null}
    </div>
  );
};
