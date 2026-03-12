import Link from "next/link";
import { UserRole } from "@prisma/client";
import { createExpedienteAction } from "@/actions/expedientes";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NewExpedientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  if (user.role === UserRole.AREA_OPERATOR) {
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
              <label htmlFor="internalNodeId">Área interna inicial</label>
              <select
                id="internalNodeId"
                name="internalNodeId"
                required
                defaultValue={user.internalNodeId ?? ""}
                disabled={user.role !== UserRole.ADMIN}
              >
                <option value="">Seleccione el área de origen...</option>
                {internalNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.nombre}
                  </option>
                ))}
              </select>
              {user.role !== UserRole.ADMIN && (
                <span className="small">Como Area Manager, el área inicial es la suya por defecto.</span>
              )}
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

