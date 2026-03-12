import Link from "next/link";
import { CustodyStatus, InternalDispatchStatus, UserRole } from "@prisma/client";
import { logoutAction } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, statusLabel } from "@/lib/format";

function statusBadge(status: CustodyStatus) {
  if (status === CustodyStatus.IN_INTERNAL_NODE) return "badge ok";
  if (status === CustodyStatus.IN_INTERNAL_TRANSIT) return "badge warn";
  if (status === CustodyStatus.OUT_OF_BUILDING) return "badge danger";
  return "badge info";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const whereScope =
    user.role === UserRole.ADMIN
      ? {}
      : {
          OR: [
            { currentInternalNodeId: user.internalNodeId },
            { lastInternalNodeId: user.internalNodeId },
          ],
        };

  const [totalActivos, enTransito, fueraEdificio, misExpedientes, recientes, pendientes] = await Promise.all([
    prisma.expediente.count({ where: { activo: true, ...whereScope } }),
    prisma.expediente.count({ where: { custodyStatus: CustodyStatus.IN_INTERNAL_TRANSIT, ...whereScope } }),
    prisma.expediente.count({ where: { custodyStatus: CustodyStatus.OUT_OF_BUILDING, ...whereScope } }),
    user.internalNodeId
      ? prisma.expediente.count({
          where: {
            custodyStatus: CustodyStatus.IN_INTERNAL_NODE,
            currentInternalNodeId: user.internalNodeId,
          },
        })
      : Promise.resolve(0),
    prisma.expediente.findMany({
      where: whereScope,
      include: {
        currentInternalNode: true,
        currentExternalNode: true,
        documentType: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    user.internalNodeId
      ? prisma.internalDispatch.findMany({
          where: {
            status: InternalDispatchStatus.PENDING,
            toInternalNodeId: user.internalNodeId,
          },
          include: {
            expediente: true,
            fromInternalNode: true,
          },
          orderBy: { dispatchedAt: "asc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  return (
    <main>
        <div className="pageHeader">
          <div>
            <h1>Panel de Control</h1>
            <p className="small">Estado actual de la trazabilidad documental</p>
          </div>
          <div className="small" style={{ textAlign: "right" }}>
            {formatDate(new Date())}
          </div>
        </div>

        {params.error && <div className="notice error">{params.error}</div>}

        <section className="grid cols-4" style={{ marginBottom: "2rem" }}>
          <article className="card metric">
            <span>Activos</span>
            <strong>{totalActivos}</strong>
          </article>
          <article className="card metric">
            <span>En tránsito</span>
            <strong>{enTransito}</strong>
          </article>
          <article className="card metric">
            <span>Fuera del edificio</span>
            <strong>{fueraEdificio}</strong>
          </article>
          <article className="card metric">
            <span>En mi área</span>
            <strong>{misExpedientes}</strong>
          </article>
        </section>

        <section className="grid cols-2">
          <article className="card" style={{ padding: "1.5rem" }}>
            <div className="pageHeader" style={{ marginBottom: "1rem" }}>
              <h2>Expedientes recientes</h2>
              <span className="badge info">{recientes.length}</span>
            </div>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Identificación</th>
                    <th>Estado</th>
                    <th>Ubicación</th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.map((exp) => (
                    <tr key={exp.id}>
                      <td>
                        <Link href={`/expedientes/${exp.id}`}>
                          <div style={{ fontWeight: "700", color: "var(--accent)" }}>{exp.numeroExpediente}</div>
                        </Link>
                        <div className="small">{exp.documentType.nombre}</div>
                      </td>
                      <td>
                        <span className={statusBadge(exp.custodyStatus)}>{statusLabel(exp.custodyStatus)}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: "500" }}>{exp.currentInternalNode?.nombre ?? exp.currentExternalNode?.nombre ?? "---"}</div>
                        <div className="small">{formatDate(exp.updatedAt)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="card" style={{ padding: "1.5rem" }}>
            <div className="pageHeader" style={{ marginBottom: "1rem" }}>
              <h2>Pendientes de recibir</h2>
              <span className="badge warn">{pendientes.length}</span>
            </div>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Expediente</th>
                    <th>Origen</th>
                    <th>Fecha Despacho</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.map((pending) => (
                    <tr key={pending.id}>
                      <td>
                        <Link href={`/expedientes/${pending.expediente.id}`}>
                          <div style={{ fontWeight: "700" }}>{pending.expediente.numeroExpediente}</div>
                        </Link>
                      </td>
                      <td>{pending.fromInternalNode.nombre}</td>
                      <td>{formatDate(pending.dispatchedAt)}</td>
                    </tr>
                  ))}
                  {pendientes.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "2rem" }}>
                        <div className="small">No hay despachos pendientes hacia su área.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>
  );
}
