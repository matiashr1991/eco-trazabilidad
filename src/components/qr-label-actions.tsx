"use client";

import { useState } from "react";

type Props = {
  expedienteNumero: string;
  qrDataUrl: string;
};

const LABEL_WIDTH_PX = 464;
const LABEL_HEIGHT_PX = 240;

function buildFileName(numero: string) {
  return `${numero.toLowerCase().replace(/[^a-z0-9_-]+/gi, "-")}-etiqueta-58x30.png`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function renderLabel(expedienteNumero: string, qrDataUrl: string) {
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_WIDTH_PX;
  canvas.height = LABEL_HEIGHT_PX;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo inicializar el lienzo de etiqueta");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, LABEL_WIDTH_PX, LABEL_HEIGHT_PX);

  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, LABEL_WIDTH_PX - 2, LABEL_HEIGHT_PX - 2);

  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 160;
  const qrX = 14;
  const qrY = 40;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "#111111";
  ctx.font = "bold 30px Arial";
  ctx.textBaseline = "top";

  const title = expedienteNumero.length > 22 ? `${expedienteNumero.slice(0, 22)}...` : expedienteNumero;
  ctx.fillText(title, 190, 50, LABEL_WIDTH_PX - 200);

  ctx.font = "20px Arial";
  ctx.fillText("Trazabilidad fisica", 190, 102, LABEL_WIDTH_PX - 200);

  ctx.font = "18px Arial";
  ctx.fillText("Escanear para abrir", 190, 136, LABEL_WIDTH_PX - 200);

  return canvas;
}

export function QrLabelActions({ expedienteNumero, qrDataUrl }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadLabel() {
    setBusy(true);
    setError(null);

    try {
      const canvas = await renderLabel(expedienteNumero, qrDataUrl);
      const href = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = href;
      link.download = buildFileName(expedienteNumero);
      link.click();
    } catch {
      setError("No se pudo generar la etiqueta.");
    } finally {
      setBusy(false);
    }
  }

  async function printLabel() {
    setBusy(true);
    setError(null);

    try {
      const canvas = await renderLabel(expedienteNumero, qrDataUrl);
      const dataUrl = canvas.toDataURL("image/png");
      const printWindow = window.open("", "_blank", "noopener,noreferrer,width=640,height=480");

      if (!printWindow) {
        setError("Bloqueo del navegador: habilita popups para imprimir.");
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Etiqueta ${expedienteNumero}</title>
            <style>
              @page { size: 58mm 30mm; margin: 0; }
              html, body { margin: 0; padding: 0; width: 58mm; height: 30mm; }
              img { width: 58mm; height: 30mm; display: block; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="Etiqueta ${expedienteNumero}" />
            <script>
              window.onload = function () { window.print(); };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch {
      setError("No se pudo preparar la impresion.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ width: "100%", marginTop: "0.7rem" }}>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <button type="button" onClick={downloadLabel} disabled={busy}>
          {busy ? "Generando..." : "Descargar etiqueta 58x30"}
        </button>
        <button type="button" className="btn secondary" onClick={printLabel} disabled={busy}>
          Imprimir etiqueta
        </button>
      </div>
      {error && <p className="notice error">{error}</p>}
    </div>
  );
}
