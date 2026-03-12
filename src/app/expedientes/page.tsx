import Link from "next/link";
import { CustodyStatus, Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, statusLabel } from "@/lib/format";

export default async function SearchExpedientesPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    q?: string; 
    status?: string; 
    nodeId?: string;
    typeId?: string;
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const [nodes, docTypes] = await Promise.all([
    prisma.internalNode.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.documentType.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);

  // Build Filter
  const where: Prisma.ExpedienteWhereInput = {};
  
  if (params.q) {
    where.numeroExpediente = { contains: params.q, mode: 'insensitive' };
  }
  
  if (params.status && params.status !== "ALL") {
    where.custodyStatus = params.status as CustodyStatus;
  }
  
  if (params.nodeId && params.nodeId !== "ALL") {
    where.currentInternalNodeId = params.nodeId;
  }

  if (params.typeId && params.typeId !== "ALL") {
    where.documentTypeId = params.typeId;
  }

  const results = await prisma.expediente.findMany({
    where,
    include: {
      documentType: true,
      currentInternalNode: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <main>
      <div className="pageHeader">
        <div>
          <h1>Buscador de Expedientes</h1>
          <p className="small">Localice cualquier documento físico en el sistema.</p>
        </div>
      </div>

      <article className="card" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <form method="GET" action="/expedientes" className="grid cols-4" style={{ gap: "1rem", alignItems: "end" }}>
          <div className="formRow" style={{ marginBottom: 0 }}>
            <label htmlFor="q">Nro. Expediente</label>
            <input 
              id="q" 
              name="q" 
              defaultValue={params.q ?? ""} 
              placeholder="Buscar..."
            />
          </div>

          <div className="formRow" style={{ marginBottom: 0 }}>
            <label htmlFor="status">Estado</label>
            <select id="status" name="status" defaultValue={params.status ?? "ALL"}>
              <option value="ALL">Cualquier estado</option>
              <option value={CustodyStatus.IN_INTERNAL_NODE}>En Oficina (Custodia)</option>
              <option value={CustodyStatus.IN_INTERNAL_TRANSIT}>En Tránsito Interno</option>
              <option value={CustodyStatus.OUT_OF_BUILDING}>Fuera del Edificio</option>
              <option value={CustodyStatus.ARCHIVED}>Archivado / Finalizado</option>
            </select>
          </div>

          <div className="formRow" style={{ marginBottom: 0 }}>
            <label htmlFor="nodeId">Ubicación / Área</label>
            <select id="nodeId" name="nodeId" defaultValue={params.nodeId ?? "ALL"}>
              <option value="ALL">Todas las áreas</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" style={{ flex: 1 }}>Filtrar</button>
            <Link href="/expedientes" className="btn secondary" style={{ padding: "0.75rem" }}>Limpiar</Link>
          </div>
        </form>
      </article>

      <article className="card" style={{ padding: "2rem" }}>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Expediente</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Ubicación Actual</th>
                <th>Últ. Movimiento</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {results.map((expe) => (
                <tr key={expe.id}>
                  <td>
                    <div style={{ fontWeight: "700" }}>{expe.numeroExpediente}</div>
                  </td>
                  <td>{expe.documentType.nombre}</td>
                  <td>
                    <span className={
                      expe.custodyStatus === CustodyStatus.IN_INTERNAL_NODE ? "badge ok" :
                      expe.custodyStatus === CustodyStatus.IN_INTERNAL_TRANSIT ? "badge warn" : "badge danger"
                    }>
                      {statusLabel(expe.custodyStatus)}
                    </span>
                  </td>
                  <td>{expe.currentInternalNode?.nombre ?? "N/A"}</td>
                  <td className="small">{formatDate(expe.updatedAt)}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/expedientes/${expe.id}`} className="btn secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                      Ver Detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "4rem" }}>
                    <div className="muted">No se encontraron expedientes con los filtros seleccionados.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </main>
  );
}
