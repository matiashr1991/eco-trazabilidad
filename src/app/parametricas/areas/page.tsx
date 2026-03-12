import Link from "next/link";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { upsertInternalNode } from "@/actions/parametrics";

export default async function AreasPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) {
    return (
      <main>
        <div className="notice error">No tienes permisos para acceder a esta sección.</div>
      </main>
    );
  }

  const { id: editId } = await searchParams;
  const nodes = await prisma.internalNode.findMany({
    orderBy: { nombre: "asc" },
  });

  const editingNode = editId ? nodes.find((n) => n.id === editId) : null;

  return (
    <main>
      <div className="pageHeader">
        <div>
          <h1>Áreas Internas</h1>
          <p className="small">Configuración de oficinas, departamentos y nodos de control.</p>
        </div>
        <Link href="/" className="btn secondary">Volver al panel</Link>
      </div>

      <div className="grid cols-2">
        <article className="card" style={{ padding: "2rem", height: "fit-content" }}>
          <h2>{editingNode ? "Editar Área" : "Nueva Área"}</h2>
          <form action={upsertInternalNode} style={{ marginTop: "1.5rem" }}>
            {editingNode && <input type="hidden" name="id" value={editingNode.id} />}
            
            <div className="formRow">
              <label htmlFor="nombre">Nombre de la Unidad / Oficina</label>
              <input 
                id="nombre" 
                name="nombre" 
                required 
                defaultValue={editingNode?.nombre ?? ""} 
                placeholder="Ej: Departamento de Compras"
              />
            </div>

            <div className="grid cols-2" style={{ gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="formRow" style={{ marginBottom: 0 }}>
                <label htmlFor="edificio">Edificio</label>
                <input 
                  id="edificio" 
                  name="edificio" 
                  defaultValue={editingNode?.edificio ?? ""} 
                  placeholder="Ej: Central"
                />
              </div>
              <div className="formRow" style={{ marginBottom: 0 }}>
                <label htmlFor="planta">Planta / Piso</label>
                <input 
                  id="planta" 
                  name="planta" 
                  defaultValue={editingNode?.planta ?? ""} 
                  placeholder="Ej: Planta Baja"
                />
              </div>
            </div>

            <div className="formRow" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem" }}>
              <input 
                type="checkbox" 
                id="activo" 
                name="activo" 
                defaultChecked={editingNode ? editingNode.activo : true} 
                style={{ width: "auto" }}
              />
              <label htmlFor="activo" style={{ cursor: "pointer" }}>Habilitada para recibir expedientes</label>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit" style={{ flex: 1 }}>
                {editingNode ? "Guardar Cambios" : "Crear Área"}
              </button>
              {editingNode && (
                <Link href="/parametricas/areas" className="btn secondary" style={{ flex: 1 }}>
                  Cancelar
                </Link>
              )}
            </div>
          </form>
        </article>

        <article className="card" style={{ padding: "2rem" }}>
          <h2>Listado de Áreas</h2>
          <div className="tableWrap" style={{ marginTop: "1.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Nombre / Ubicación</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr key={node.id}>
                    <td>
                      <div style={{ fontWeight: "600" }}>{node.nombre}</div>
                      {(node.edificio || node.planta) && (
                        <div className="small">
                          {node.edificio}{node.planta && ` - ${node.planta}`}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={node.activo ? "badge ok" : "badge danger"}>
                        {node.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link 
                        href={`/parametricas/areas?id=${node.id}`}
                        className="btn secondary" 
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                      >
                        Editar
                      </Link>
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
