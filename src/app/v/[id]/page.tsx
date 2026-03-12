import { prisma } from "@/lib/db";
import { CustodyStatus } from "@prisma/client";
import { formatDate, statusLabel } from "@/lib/format";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

function statusClass(status: CustodyStatus) {
  if (status === CustodyStatus.IN_INTERNAL_NODE) return "badge ok";
  if (status === CustodyStatus.IN_INTERNAL_TRANSIT) return "badge warn";
  if (status === CustodyStatus.OUT_OF_BUILDING) return "badge danger";
  return "badge info";
}

export default async function PublicVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Intentamos buscar por ID o por Token
  const expediente = await prisma.expediente.findFirst({
    where: {
      OR: [
        { id: id },
        { qrToken: id }
      ]
    },
    include: {
      documentType: true,
      currentInternalNode: true,
      currentExternalNode: true,
      internalDispatches: {
        include: {
          fromInternalNode: true,
          toInternalNode: true,
        },
        orderBy: { dispatchedAt: "desc" },
      },
      externalTransfers: {
        include: {
          fromInternalNode: true,
          toExternalNode: true,
          returnedToInternalNode: true,
        },
        orderBy: { dispatchedAt: "desc" },
      },
    },
  }) as any;

  if (!expediente) {
    return (
      <main className="container" style={{ textAlign: "center", paddingTop: "5rem" }}>
        <ShieldCheck size={48} style={{ color: "var(--danger)", marginBottom: "1rem" }} />
        <h1>Verificación Fallida</h1>
        <p className="notice error" style={{ display: "inline-block" }}>No se encontró un documento válido con ese identificador.</p>
        <div style={{ marginTop: "2rem" }}>
          <Link href="/login" className="btn secondary">Ir al sistema</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <ShieldCheck size={40} style={{ color: "var(--accent)", marginBottom: "0.5rem" }} />
        <h1 style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>Consulta Pública de Trazabilidad</h1>
        <p className="small">Validación segura de documentos físicos</p>
      </header>

      <div className="card" style={{ padding: "2rem", marginBottom: "2rem", border: "1px solid var(--accent)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>{expediente.numeroExpediente}</h2>
            <p className="small" style={{ color: "var(--muted)" }}>{expediente.documentType.nombre}</p>
          </div>
          <span className={statusClass(expediente.custodyStatus)} style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
            {statusLabel(expediente.custodyStatus)}
          </span>
        </div>

        <hr style={{ margin: "2rem 0", opacity: 0.1 }} />

        <div className="grid cols-2">
          <div>
            <label className="small">UBICACIÓN ACTUAL</label>
            <div style={{ fontWeight: "600", fontSize: "1.1rem", marginTop: "0.25rem" }}>
              {expediente.currentInternalNode?.nombre ?? expediente.currentExternalNode?.nombre ?? "En tránsito"}
            </div>
          </div>
          <div>
            <label className="small">ÚLTIMA ACTUALIZACIÓN</label>
            <div style={{ fontWeight: "500", marginTop: "0.25rem" }}>
              {formatDate(expediente.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      <section>
        <h3 style={{ marginBottom: "1.5rem", fontWeight: "600" }}>Historial de Trazabilidad</h3>
        <div className="tableWrap shadow-sm">
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Origen / Destino</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {expediente.internalDispatches.map((mov) => (
                <tr key={`int-${mov.id}`}>
                  <td>
                    <span className={mov.status === "RECEIVED" ? "badge ok" : "badge warn"}>
                      {mov.status === "RECEIVED" ? "Recibido" : "Pendiente"}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "500" }}>{mov.fromInternalNode.nombre} &rarr; {mov.toInternalNode.nombre}</div>
                  </td>
                  <td>{formatDate(mov.receivedAt ?? mov.dispatchedAt)}</td>
                </tr>
              ))}
              {expediente.externalTransfers.map((mov) => (
                <tr key={`ext-${mov.id}`}>
                  <td>
                    <span className={mov.status === "RETURNED" ? "badge ok" : "badge danger"}>
                      {mov.status === "RETURNED" ? "Reingresado" : "Externo"}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "500" }}>{mov.fromInternalNode.nombre} &rarr; {mov.toExternalNode.nombre}</div>
                  </td>
                  <td>{formatDate(mov.returnedAt ?? mov.dispatchedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer style={{ marginTop: "4rem", textAlign: "center", opacity: 0.6 }}>
        <p className="small">Este es un sistema de control interno. La información mostrada es solo para validación de tránsito físico.</p>
        <div style={{ marginTop: "1rem" }}>
          <Link href="/login" className="small" style={{ textDecoration: "underline" }}>Acceso restringido</Link>
        </div>
      </footer>
    </main>
  );
}
