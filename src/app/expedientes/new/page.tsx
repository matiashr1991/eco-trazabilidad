import Link from "next/link";
import { createExpedienteAction } from "@/actions/expedientes";
import { requireUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NewExpedientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  if (!hasPermission(user, "CREATE_EXPEDIENTE")) {
    return (
      <main>
        <p className="notice error">No tenes permiso para crear expedientes.</p>
      </main>
    );
  }

  const [docTypes, internalNodes] = await Promise.all([
    prisma.documentType.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.internalNode.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);

  // Si no es admin, solo puede enviar por rutas autorizadas desde su nodo
  const isAdmin = hasPermission(user, "MANAGE_PARAMETRICS");
  const availableDestinations = isAdmin
    ? internalNodes 
    : user.internalNodeId 
      ? (await prisma.internalRoute.findMany({
          where: { fromInternalNodeId: user.internalNodeId, activo: true },
          include: { toInternalNode: true },
          orderBy: { toInternalNode: { nombre: "asc" } }
        })).map(r => r.toInternalNode)
      : [];

  return (
    <main>
      <div className="pageHeader">
        <div>
          <h1>Nuevo expediente</h1>
          <p className="small">Registre la custodia inicial de un nuevo documento físico.</p>
        </div>
        <Link className="btn secondary" href="/">
          Volver al panel
        </Link>
      </div>

      {params.error && <div className="notice error">{params.error}</div>}

      <div style={{ display: "flex", justifyContent: "center" }}>
        <section className="card" style={{ padding: "2.5rem", maxWidth: "600px", width: "100%" }}>
          <form id="new-expediente-form" action={createExpedienteAction}>
            <div className="formRow">
              <label htmlFor="numeroExpediente">Número de expediente</label>
              <input 
                id="numeroExpediente" 
                name="numeroExpediente" 
                placeholder="Ej: COMPRA-2024-001"
                required 
              />
            </div>

            <div className="formRow">
              <label htmlFor="documentTypeId">Tipo documental</label>
              <select id="documentTypeId" name="documentTypeId" required>
                <option value="">Seleccione un tipo...</option>
                {docTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="formRow">
              <label htmlFor="internalNodeId">Área interna de origen</label>
              <select
                id="internalNodeId"
                name="internalNodeId"
                required
                defaultValue={user.internalNodeId ?? ""}
                disabled={!hasPermission(user, "MANAGE_PARAMETRICS")}
              >
                <option value="">Seleccione el área de origen...</option>
                {internalNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.nombre}
                  </option>
                ))}
              </select>
              {!hasPermission(user, "MANAGE_PARAMETRICS") && (
                <span className="small">Como gestor de área, el origen es la suya por defecto.</span>
              )}
            </div>

            <div className="formRow">
              <label htmlFor="toInternalNodeId">Área de destino (Opcional - Despacho inmediato)</label>
              <select id="toInternalNodeId" name="toInternalNodeId">
                <option value="">Permanecer en origen...</option>
                {availableDestinations.map((node) => (
                  <option key={node.id} value={node.id}>
                    {isAdmin ? `Enviar a: ${node.nombre}` : node.nombre}
                  </option>
                ))}
              </select>
              <p className="small" style={{ color: "var(--muted)" }}>
                {isAdmin 
                  ? "Si elige un destino, el expediente se creará y se registrará su envío automáticamente."
                  : "Destinos habilitados para su área. Si elige uno, se registrará el despacho inicial."}
              </p>
            </div>

            <div className="formRow">
              <label htmlFor="descripcionCorta">Observación inicial (opcional)</label>
              <textarea 
                id="descripcionCorta" 
                name="descripcionCorta" 
                rows={3} 
                placeholder="Agregue detalles sobre el estado físico o contenido..."
              />
            </div>

            <div style={{ marginTop: "2rem" }}>
              <button type="submit" style={{ width: "100%" }}>
                Crear y registrar custodia
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

