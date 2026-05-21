import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function QRCodeModal({
  open,
  onOpenChange,
  url,
  title,
  subtitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  title: string;
  subtitle?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/95 backdrop-blur-md" />
        <DialogContent
          className="max-w-xl border-0 bg-transparent p-0 shadow-none sm:rounded-none"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-2 top-2 z-10 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center px-4 py-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
              Aponte a câmera
            </div>
            <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 max-w-md text-center text-sm text-white/60">
                {subtitle}
              </p>
            )}

            <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_0_80px_-10px_rgba(255,255,255,0.35)]">
              {url ? (
                <QRCodeSVG
                  value={url}
                  size={340}
                  level="H"
                  marginSize={0}
                  fgColor="#0a0a0a"
                  bgColor="#ffffff"
                />
              ) : (
                <div className="h-[340px] w-[340px]" />
              )}
            </div>

            <div className="mt-6 flex w-full max-w-md items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
              <span className="flex-1 truncate font-mono text-xs text-white/80">
                {url || "—"}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={copy}
                className="h-7 gap-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
