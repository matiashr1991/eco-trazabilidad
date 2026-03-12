import Link from "next/link";
import { CustodyStatus, InternalDispatchStatus, UserRole } from "@prisma/client";
import { dispatchInternalAction, receiveInternalAction } from "@/actions/expedientes";
import { canMoveExpediente, canOperateArea, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, statusLabel } from "@/lib/format";

export default async function MobileExpedientePage({
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
      currentInternalNode: true,
      currentExternalNode: true,
      internalDispatches: {
        where: { status: InternalDispatchStatus.PENDING },
        include: {
          fromInternalNode: true,
          toInternalNode: true,
        },
        orderBy: { dispatchedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!expediente) {
    return (
      <main style={{ maxWidth: 560 }}>
        <p className="notice error">Expediente no encontrado.</p>
        <Link className="btn secondary" href="/mobile/scan">
          Volver a escanear
        </Link>
      </main>
    );
  }

  const inScope =
    user.role === UserRole.ADMIN ||
    expediente.currentInternalNodeId === user.internalNodeId ||
    expediente.lastInternalNodeId === user.internalNodeId;

  if (!inScope) {
    return (
      <main style={{ maxWidth: 560 }}>
        <p className="notice error">No tenes acceso a este expediente.</p>
        <Link className="btn secondary" href="/mobile/scan">
          Volver a escanear
        </Link>
      </main>
    );
  }

  const canMove = canMoveExpediente(user);
  const canDispatch =
    canMove &&
    expediente.custodyStatus === CustodyStatus.IN_INTERNAL_NODE &&
    !!expediente.currentInternalNodeId &&
    canOperateArea(user, expediente.currentInternalNodeId);

  const pendingDispatch = expediente.internalDispatches[0] ?? null;
  const canReceive =
    canMove &&
    expediente.custodyStatus === CustodyStatus.IN_INTERNAL_TRANSIT &&
    !!pendingDispatch &&
    canOperateArea(user, pendingDispatch.toInternalNodeId);

  const routes = canDispatch
    ? await prisma.internalRoute.findMany({
        where: {
          fromInternalNodeId: expediente.currentInternalNodeId!,
          activo: true,
        },
        include: { toInternalNode: true },
        orderBy: [{ orden: "asc" }, { toInternalNode: { nombre: "asc" } }],
      })
    : [];

  return (
    <main style={{ maxWidth: 560 }}>
      <div className="pageHeader">
        <h1 style={{ fontSize: "1.35rem" }}>{expediente.numeroExpediente}</h1>
        <Link className="btn secondary" href="/mobile/scan">
          Escanear otro
        </Link>
      </div>

      {query.ok && <p className="notice ok">{query.ok}</p>}
      {query.error && <p className="notice error">{query.error}</p>}

      <section className="card" style={{ padding: "1rem", marginBottom: "0.8rem" }}>
        <p className="small">Estado actual</p>
        <h2 style={{ marginTop: "0.3rem" }}>{statusLabel(expediente.custodyStatus)}</h2>
        <p className="small" style={{ marginTop: "0.55rem" }}>
          En area: {expediente.currentInternalNode?.nombre ?? "-"}
        </p>
        <p className="small">Destino externo: {expediente.currentExternalNode?.nombre ?? "-"}</p>
        <p className="small">Ultimo cambio: {formatDate(expediente.updatedAt)}</p>
      </section>

      {canReceive && pendingDispatch && (
        <section className="card" style={{ padding: "1rem", marginBottom: "0.8rem" }}>
          <h2>Recibir</h2>
          <p className="small" style={{ margin: "0.4rem 0 0.75rem" }}>
            Desde: {pendingDispatch.fromInternalNode.nombre}
          </p>
          <form action={receiveInternalAction}>
            <input type="hidden" name="expedienteId" value={expediente.id} />
            <input type="hidden" name="note" value="" />
            <input
              type="hidden"
              name="redirectTo"
              value={`/mobile/expedientes/${expediente.id}?ok=Recepcion+confirmada`}
            />
            <button type="submit" style={{ width: "100%", padding: "0.9rem" }}>
              Confirmar recepcion
            </button>
          </form>
        </section>
      )}

      {canDispatch && (
        <section className="card" style={{ padding: "1rem", marginBottom: "0.8rem" }}>
          <h2>Despachar</h2>
          <form action={dispatchInternalAction} style={{ marginTop: "0.55rem" }}>
            <input type="hidden" name="expedienteId" value={expediente.id} />
            <input type="hidden" name="note" value="" />
            <input
              type="hidden"
              name="redirectTo"
              value={`/mobile/expedientes/${expediente.id}?ok=Despacho+interno+registrado`}
            />
            <div className="formRow">
              <label htmlFor="toInternalNodeId">Destino</label>
              <select id="toInternalNodeId" name="toInternalNodeId" required>
                <option value="">Seleccione...</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.toInternalNodeId}>
                    {route.toInternalNode.nombre}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" style={{ width: "100%", padding: "0.9rem" }}>
              Confirmar despacho
            </button>
          </form>
        </section>
      )}

      {!canReceive && !canDispatch && (
        <section className="card" style={{ padding: "1rem" }}>
          <h2>Sin accion rapida disponible</h2>
          <p className="small" style={{ marginTop: "0.4rem" }}>
            Para este estado usa el detalle completo en desktop o la vista general.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <Link className="btn secondary" href={`/expedientes/${expediente.id}`}>
              Ver detalle completo
            </Link>
            <Link className="btn secondary" href="/mobile/scan">
              Escanear otro
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
