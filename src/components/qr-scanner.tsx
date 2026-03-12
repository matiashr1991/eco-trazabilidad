"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveQrToken } from "@/actions/expedientes";

type ScannerStatus = "idle" | "running" | "error";

async function resolveToken(token: string) {
  const expedienteId = await resolveQrToken(token);
  if (!expedienteId) return null;
  return `/expedientes/${expedienteId}`;
}

export function QrScanner() {
  const router = useRouter();
  const regionId = useMemo(() => `qr-region-${Math.random().toString(36).slice(2)}`, []);
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

        if (!Html5Qrcode.getCameras) {
          setStatus("error");
          setError("El navegador no soporta acceso a camara.");
          return;
        }

        const scanner = new Html5Qrcode(regionId, {
          verbose: false,
        }) as unknown as {
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
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText: string) => {
            if (cancelled) {
              return;
            }

            const token = decodedText.trim();
            const target = await resolveToken(token);
            
            if (!target) {
              setError("QR leído, pero no pertenece a este sistema o no tienes acceso.");
              return;
            }

            await scanner.stop();
            scanner.clear();
            router.push(target);
          },
          () => {
            // Ignorar errores de frame para evitar ruido visual.
          },
        );

        if (!cancelled) {
          setStatus("running");
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("No se pudo iniciar la camara. Verifica permisos del navegador.");
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
      <p className="small" style={{ marginTop: "0.4rem" }}>
        Apunta la camara al codigo QR del expediente.
      </p>

      <div id={regionId} style={{ width: "100%", maxWidth: 420, marginTop: "0.8rem" }} />

      {status === "running" && <p className="notice ok">Camara activa.</p>}
      {error && <p className="notice error">{error}</p>}
    </section>
  );
}
