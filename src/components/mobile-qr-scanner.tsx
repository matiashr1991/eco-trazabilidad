"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ScannerStatus = "idle" | "running" | "error";

function extractExpedienteId(raw: string) {
  const value = raw.trim();

  const urlMatch = value.match(/\/expedientes\/([^/?#]+)/i);
  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  if (/^[a-zA-Z0-9_-]{8,}$/.test(value)) {
    return value;
  }

  return null;
}

export function MobileQrScanner() {
  const router = useRouter();
  const regionId = useMemo(() => `mobile-qr-${Math.random().toString(36).slice(2)}`, []);
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const mod = await import("html5-qrcode");
        const Html5Qrcode = mod.Html5Qrcode;

        const scanner = new Html5Qrcode(regionId, { verbose: false }) as unknown as {
          start: (
            cameraConfig: { facingMode: string },
            config: { fps: number; qrbox: { width: number; height: number } },
            onSuccess: (decodedText: string) => void,
            onError: (errorMessage: string) => void,
          ) => Promise<void>;
          stop: () => Promise<void>;
          clear: () => void;
        };

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          async (decodedText: string) => {
            if (cancelled) {
              return;
            }

            const expedienteId = extractExpedienteId(decodedText);
            if (!expedienteId) {
              setError("El QR no corresponde a un expediente valido.");
              return;
            }

            await scanner.stop();
            scanner.clear();
            router.push(`/mobile/expedientes/${expedienteId}`);
          },
          () => {
            // Ignorar errores de frame.
          },
        );

        if (!cancelled) {
          setStatus("running");
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("No se pudo iniciar la camara. Revisa permisos del navegador.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => null)
          .finally(() => {
            scannerRef.current?.clear();
          });
      }
    };
  }, [regionId, router]);

  return (
    <section className="card" style={{ padding: "1rem" }}>
      <h2>Escanear QR</h2>
      <p className="small" style={{ marginTop: "0.35rem" }}>
        Enfoca el codigo del expediente.
      </p>

      <div id={regionId} style={{ width: "100%", marginTop: "0.75rem" }} />

      {status === "running" && <p className="notice ok">Camara activa.</p>}
      {error && <p className="notice error">{error}</p>}
    </section>
  );
}
