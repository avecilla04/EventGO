import React, { useEffect, useRef, useState } from "react";
import { X, Download, Printer, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { canvasToBlob, drawPoster, followUrl } from "@/lib/poster";

const slug = (text) =>
  String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Ventana con el cartel QR del local: vista previa, descarga, impresión y enlace. */
export default function QrPosterDialog({ venue, onClose }) {
  const { toast } = useToast();
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);
  const url = followUrl(venue.id);

  useEffect(() => {
    let cancelled = false;
    drawPoster(venue).then((canvas) => {
      if (cancelled) return;
      canvasRef.current = canvas;
      setPreview(canvas.toDataURL("image/png"));
    });
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelled = true;
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [venue, onClose]);

  const download = async () => {
    const blob = await canvasToBlob(canvasRef.current);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cartel-eventgo-${slug(venue.name) || "local"}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const print = () => {
    const win = window.open("", "_blank");
    if (!win) {
      toast({ title: "Permite las ventanas emergentes para imprimir", className: "info-toast" });
      return;
    }
    const safeName = String(venue.name).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    win.document.write(`<!doctype html><title>Cartel ${safeName}</title>
      <style>@page{size:A4;margin:0}html,body{margin:0;height:100%}img{display:block;width:100%;height:100%;object-fit:contain}</style>
      <img src="${preview}" onload="setTimeout(()=>{print();close()},100)">`);
    win.document.close();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "No se pudo copiar", description: url, className: "info-toast" });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm animate-in fade-in-0 sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Cartel QR de ${venue.name}`}
    >
      <div className="relative flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-lift sm:rounded-[28px] md:flex-row">
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-muted shadow-soft hover:text-ink" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-center bg-canvas p-6 md:w-1/2">
          {preview ? (
            <img src={preview} alt={`Cartel QR de ${venue.name}`} className="max-h-[50vh] w-auto rounded-xl shadow-lift md:max-h-[70vh]" />
          ) : (
            <div className="flex aspect-[1240/1754] w-48 items-center justify-center rounded-xl bg-line">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto p-6 md:w-1/2 md:p-8">
          <div>
            <p className="eyebrow">Cartel para tu local</p>
            <h2 className="mt-1 font-display text-2xl font-bold">{venue.name}</h2>
            <p className="mt-2 text-sm text-muted">
              Imprímelo y ponlo en la barra, las mesas o la puerta. Quien lo escanee empezará a seguir tu local y verá tus próximos planes.
            </p>
          </div>

          <div className="grid gap-2">
            <button onClick={download} disabled={!preview} className="btn-primary w-full">
              <Download className="h-4 w-4" />
              Descargar PNG
            </button>
            <button onClick={print} disabled={!preview} className="btn-outline w-full">
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>

          <div>
            <span className="form-label">O comparte el enlace</span>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas p-1.5 pl-3">
              <span className="min-w-0 flex-1 truncate text-xs text-muted" title={url}>{url}</span>
              <button onClick={copy} className="btn-dark btn-sm shrink-0">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="form-hint">Ponlo en tu Instagram o en WhatsApp para ganar seguidores.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
