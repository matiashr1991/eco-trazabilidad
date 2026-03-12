import Link from "next/link";
import { requireUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { upsertDocumentType, toggleDocumentTypeStatus } from "@/actions/parametrics";

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await requireUser();

  if (!hasPermission(user, "MANAGE_PARAMETRICS")) {
    return (
      <main>
        <div className="notice error">No tienes permisos para acceder a esta sección.</div>
      </main>
    );
  }

  const { id: editId } = await searchParams;
  const docs = await prisma.documentType.findMany({
    orderBy: { nombre: "asc" },
  });

  const editingDoc = editId ? docs.find((d) => d.id === editId) : null;

  return (
    <main>
      <div className="pageHeader">
        <div>
          <h1>Tipos de Documento</h1>
          <p className="small">Gestión de categorías de expedientes y documentos.</p>
        </div>
        <Link href="/" className="btn secondary">Volver al panel</Link>
      </div>

      <div className="grid cols-2">
        <article className="card" style={{ padding: "2rem", height: "fit-content" }}>
          <h2>{editingDoc ? "Editar Tipo" : "Nuevo Tipo"}</h2>
          <form action={upsertDocumentType} style={{ marginTop: "1.5rem" }}>
            {editingDoc && <input type="hidden" name="id" value={editingDoc.id} />}
            
            <div className="formRow">
              <label htmlFor="nombre">Nombre</label>
              <input 
                id="nombre" 
                name="nombre" 
                required 
                defaultValue={editingDoc?.nombre ?? ""} 
                placeholder="Ej: Expediente Administrativo"
              />
            </div>

            <div className="formRow">
              <label htmlFor="descripcion">Descripción (opcional)</label>
              <textarea 
                id="descripcion" 
                name="descripcion" 
                rows={3} 
                defaultValue={editingDoc?.descripcion ?? ""} 
                placeholder="Breve descripción del propósito..."
              />
            </div>

            <div className="formRow" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem" }}>
              <input 
                type="checkbox" 
                id="activo" 
                name="activo" 
                defaultChecked={editingDoc ? editingDoc.activo : true} 
                style={{ width: "auto" }}
              />
              <label htmlFor="activo" style={{ cursor: "pointer" }}>Activo / Visible</label>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit" style={{ flex: 1 }}>
                {editingDoc ? "Guardar Cambios" : "Crear Tipo"}
              </button>
              {editingDoc && (
                <Link href="/parametricas/documentos" className="btn secondary" style={{ flex: 1 }}>
                  Cancelar
                </Link>
              )}
            </div>
          </form>
        </article>

        <article className="card" style={{ padding: "2rem" }}>
          <h2>Listado de Tipos</h2>
          <div className="tableWrap" style={{ marginTop: "1.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: "600" }}>{doc.nombre}</div>
                      {doc.descripcion && <div className="small">{doc.descripcion}</div>}
                    </td>
                    <td>
                      <span className={doc.activo ? "badge ok" : "badge danger"}>
                        {doc.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <Link 
                          href={`/parametricas/documentos?id=${doc.id}`}
                          className="btn secondary" 
                          style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </main>
  );
}
