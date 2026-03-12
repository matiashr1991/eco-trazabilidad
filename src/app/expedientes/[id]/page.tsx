import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { CustodyStatus, UserRole } from "@prisma/client";
import {
  archiveExpedienteAction,
  dispatchExternalAction,
  dispatchInternalAction,
  receiveInternalAction,
  returnExternalAction,
} from "@/actions/expedientes";
import { canMoveExpediente, canOperateArea, requireUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, statusLabel } from "@/lib/format";
import { QrLabelActions } from "@/components/qr-label-actions";

function statusClass(status: CustodyStatus) {
  if (status === CustodyStatus.IN_INTERNAL_NODE) return "badge ok";
  if (status === CustodyStatus.IN_INTERNAL_TRANSIT) return "badge warn";
  if (status === CustodyStatus.OUT_OF_BUILDING) return "badge danger";
  return "badge info";
}

export default async function ExpedienteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;

  const expediente = await prisma.expediente.findUnique({
    where: { id },
    include: {
      documentType: true,
      currentInternalNode: true,
      currentExternalNode: true,
      lastInternalNode: true,
      internalDispatches: {
        include: {
          fromInternalNode: true,
          toInternalNode: true,
          dispatchedBy: true,
          receivedBy: true,
        },
        orderBy: { dispatchedAt: "desc" },
      },
      externalTransfers: {
        include: {
          fromInternalNode: true,
          toExternalNode: true,
          returnedToInternalNode: true,
          dispatchedBy: true,
          returnedBy: true,
        },
        orderBy: { dispatchedAt: "desc" },
      },
      auditLogs: {
        include: { actor: true },
        orderBy: { occurredAt: "desc" },
        take: 15,
      },
    },
  }) as any;

  if (!expediente) {
    return (
      <main>
        <p className="notice error">Expediente no encontrado.</p>
      </main>
    );
  }

  const inScope =
    hasPermission(user, "MANAGE_PARAMETRICS") ||
    expediente.currentInternalNodeId === user.internalNodeId ||
    expediente.lastInternalNodeId === user.internalNodeId;

  if (!inScope) {
    return (
      <main>
        <p className="notice error">No tenes acceso a este expediente.</p>
      </main>
    );
  }

  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:3000";
  const protocol = hdrs.get("x-forwarded-proto") || "http";
  const verificationUrl = `${protocol}://${host}/v/${expediente.qrToken}`;

  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 400, margin: 2 });

  const canMove = canMoveExpediente(user);
  const canDispatchInternal =
    canMove &&
    expediente.custodyStatus === CustodyStatus.IN_INTERNAL_NODE &&
    !!expediente.currentInternalNodeId &&
    canOperateArea(user, expediente.currentInternalNodeId);

  const canRegisterExternal = canDispatchInternal;

  const pendingToReceive =
    canMove &&
    expediente.custodyStatus === CustodyStatus.IN_INTERNAL_TRANSIT &&
    expediente.internalDispatches.some((d) => d.status === "PENDING" && canOperateArea(user, d.toInternalNodeId));

  const canReturnExternal =
    canMove &&
    expediente.custodyStatus === CustodyStatus.OUT_OF_BUILDING &&
    (hasPermission(user, "MANAGE_PARAMETRICS") || !!user.internalNodeId);

  const availableRoutes = canDispatchInternal
    ? await prisma.internalRoute.findMany({
        where: {
          fromInternalNodeId: expediente.currentInternalNodeId!,
          activo: true,
        },
        include: { toInternalNode: true },
        orderBy: [{ orden: "asc" }, { toInternalNode: { nombre: "asc" } }],
      })
    : [];

  const externalNodes = canRegisterExternal
    ? await prisma.externalNode.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
      })
    : [];

  const internalNodesForReturn = canReturnExternal
    ? await prisma.internalNode.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } })
    : [];

  return (
    <main>
      <div className="pageHeader">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <h1>{expediente.numeroExpediente}</h1>
            <span className={statusClass(expediente.custodyStatus)}>{statusLabel(expediente.custodyStatus)}</span>
          </div>
          <p className="small">
            {expediente.documentType.nombre} · Registrado el {formatDate(expediente.createdAt)}
          </p>
        </div>
        <Link className="btn secondary" href="/">
          Volver al panel
        </Link>
      </div>

      {query.ok && <div className="notice ok">{query.ok}</div>}
      {query.error && <div className="notice error">{query.error}</div>}

      <section className="grid cols-2" style={{ marginBottom: "2rem" }}>
        <article className="card" style={{ padding: "2rem" }}>
          <h2>Estado de Custodia</h2>
          <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
            <div>
              <label className="small">UBICACIÓN ACTUAL</label>
              <div style={{ fontWeight: "600", fontSize: "1.1rem" }}>
                {expediente.currentInternalNode?.nombre ?? expediente.currentExternalNode?.nombre ?? "En tránsito"}
              </div>
            </div>
            {expediente.lastInternalNode && (
              <div>
                <label className="small">ÚLTIMO REGISTRO INTERNO</label>
                <div style={{ fontWeight: "500" }}>{expediente.lastInternalNode.nombre}</div>
              </div>
            )}
            <div>
              <label className="small">ÚLTIMO CAMBIO</label>
              <div style={{ fontWeight: "500" }}>{formatDate(expediente.updatedAt)}</div>
            </div>
          </div>
          
          {pendingToReceive && (
            <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--panel)", borderRadius: "var(--radius-md)", border: "1px solid var(--accent)" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Recepcionar Expediente</h3>
              <p className="small" style={{ marginBottom: "1rem" }}>El documento ha sido enviado a su área y se encuentra en tránsito.</p>
              <form action={receiveInternalAction}>
                <input type="hidden" name="expedienteId" value={expediente.id} />
                <div className="formRow">
                  <label htmlFor="receiveNote">Nota de recepción (opcional)</label>
                  <textarea id="receiveNote" name="note" rows={2} placeholder="Escriba una observación si es necesario..." />
                </div>
                <button type="submit" style={{ width: "100%", background: "var(--ok)" }}>Confirmar Recepción</button>
              </form>
            </div>
          )}
        </article>

        <article className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
            <Image src={qrDataUrl} alt="QR expediente" width={220} height={220} priority />
            <div style={{ marginTop: "1rem", fontSize: "0.875rem", fontFamily: "var(--font-mono)", color: "var(--muted)", wordBreak: "break-all" }}>
              {expediente.id}
            </div>
          </div>
          <div style={{ marginTop: "1.5rem", width: "100%" }}>
            <div style={{ marginBottom: "1rem", textAlign: "center" }}>
              <Link href={`/v/${expediente.qrToken}`} target="_blank" className="small" style={{ textDecoration: "underline", color: "var(--accent)" }}>
                Abrir enlace de verificación pública
              </Link>
            </div>
            <QrLabelActions expedienteNumero={expediente.numeroExpediente} qrDataUrl={qrDataUrl} />
          </div>
        </article>
      </section>

      {(canDispatchInternal || canRegisterExternal || canReturnExternal) && (
        <section className="grid cols-2" style={{ marginBottom: "2rem" }}>
          {canDispatchInternal && (
            <article className="card" style={{ padding: "2rem" }}>
              <h2>Despacho Interno</h2>
              <form action={dispatchInternalAction} style={{ marginTop: "1.5rem" }}>
                <input type="hidden" name="expedienteId" value={expediente.id} />
                <div className="formRow">
                  <label htmlFor="toInternalNodeId">Área de destino</label>
                  <select id="toInternalNodeId" name="toInternalNodeId" required>
                    <option value="">Seleccione destino...</option>
                    {availableRoutes.map((route) => (
                      <option key={route.id} value={route.toInternalNodeId}>
                        {route.toInternalNode.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="formRow">
                  <label htmlFor="internalNote">Nota de envío</label>
                  <textarea id="internalNote" name="note" rows={2} placeholder="Opcional..." />
                </div>
                <button type="submit" style={{ width: "100%" }}>Registrar Despacho</button>
              </form>
            </article>
          )}

          {canRegisterExternal && (
            <article className="card" style={{ padding: "2rem" }}>
              <h2>Salida Documental</h2>
              <form action={dispatchExternalAction} style={{ marginTop: "1.5rem" }}>
                <input type="hidden" name="expedienteId" value={expediente.id} />
                <div className="formRow">
                  <label htmlFor="toExternalNodeId">Destinatario / Organismo Externo</label>
                  <select id="toExternalNodeId" name="toExternalNodeId" required>
                    <option value="">Seleccione destino...</option>
                    {externalNodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="formRow">
                  <label htmlFor="extNote">Observaciones de salida</label>
                  <textarea id="extNote" name="note" rows={2} placeholder="Opcional..." />
                </div>
                <button type="submit" style={{ width: "100%", background: "var(--danger)" }}>Registrar Salida</button>
              </form>
            </article>
          )}

          {canReturnExternal && (
            <article className="card" style={{ padding: "2rem" }}>
              <h2>Reingreso al Edificio</h2>
              <form action={returnExternalAction} style={{ marginTop: "1.5rem" }}>
                <input type="hidden" name="expedienteId" value={expediente.id} />
                <div className="formRow">
                  <label htmlFor="toInternalNodeReturn">Área de recepción</label>
                  <select
                    id="toInternalNodeReturn"
                    name="toInternalNodeId"
                    required
                    defaultValue={user.internalNodeId ?? ""}
                    disabled={!hasPermission(user, "MANAGE_PARAMETRICS")}
                  >
                    <option value="">Seleccione área...</option>
                    {internalNodesForReturn.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="formRow">
                  <label htmlFor="returnNote">Nota de reingreso</label>
                  <textarea id="returnNote" name="note" rows={2} placeholder="Opcional..." />
                </div>
                <button type="submit" style={{ width: "100%" }}>Registrar Reingreso</button>
              </form>
            </article>
          )}
        </section>
      )}

      <section className="grid">
        <article className="card" style={{ padding: "2rem" }}>
          <div className="pageHeader" style={{ marginBottom: "1rem" }}>
            <h2>Historial de Movimientos</h2>
            <span className="badge info">Cronología completa</span>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo / Estado</th>
                  <th>Detalle de la Operación</th>
                  <th>Fecha y Hora</th>
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
                      <div style={{ fontWeight: "600" }}>{mov.fromInternalNode.nombre} &rarr; {mov.toInternalNode.nombre}</div>
                      <div className="small">Despachado por: {mov.dispatchedBy.nombre}</div>
                      {mov.receivedBy && <div className="small">Recibido por: {mov.receivedBy.nombre}</div>}
                      {mov.dispatchNote && <div className="small" style={{ fontStyle: "italic", marginTop: "0.25rem" }}>"{mov.dispatchNote}"</div>}
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
                      <div style={{ fontWeight: "600" }}>Salida: {mov.fromInternalNode.nombre} &rarr; {mov.toExternalNode.nombre}</div>
                      <div className="small">Registrado por: {mov.dispatchedBy.nombre}</div>
                      {mov.returnedToInternalNode && (
                        <div className="small">Reingreso a: {mov.returnedToInternalNode.nombre}</div>
                      )}
                      {mov.dispatchNote && <div className="small" style={{ fontStyle: "italic", marginTop: "0.25rem" }}>"{mov.dispatchNote}"</div>}
                    </td>
                    <td>{formatDate(mov.returnedAt ?? mov.dispatchedAt)}</td>
                  </tr>
                ))}
                {expediente.internalDispatches.length === 0 && expediente.externalTransfers.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "3rem" }}>
                      <p className="small">Aun no se han registrado movimientos para este expediente.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {hasPermission(user, "MANAGE_PARAMETRICS") && expediente.custodyStatus !== CustodyStatus.ARCHIVED && (
        <div style={{ marginTop: "3rem", display: "flex", justifyContent: "flex-end" }}>
          <form action={archiveExpedienteAction}>
            <input type="hidden" name="expedienteId" value={expediente.id} />
            <button type="submit" className="btn secondary" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
              Archivar y finalizar trazabilidad
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
