import Link from "next/link";
import { requireUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { upsertExternalNode } from "@/actions/parametrics";

export default async function ExternosPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await requireUser();
  if (!hasPermission(user, "MANAGE_PARAMETRICS")) return <main>No autorizado</main>;

  const { id: editId } = await searchParams;
  const nodes = await prisma.externalNode.findMany({ orderBy: { nombre: "asc" } });
  const editingNode = editId ? nodes.find((n) => n.id === editId) : null;

  return (
    <main>
      <div className="pageHeader">
        <div>
          <h1>Destinos Externos</h1>
          <p className="small">Organismos, dependencias y nodos fuera del circuito interno.</p>
        </div>
        <Link href="/" className="btn secondary">Volver</Link>
      </div>

      <div className="grid cols-2">
        <article className="card" style={{ padding: "2rem", height: "fit-content" }}>
          <h2>{editingNode ? "Editar Organismo" : "Nuevo Organismo"}</h2>
          <form action={upsertExternalNode} style={{ marginTop: "1.5rem" }}>
            {editingNode && <input type="hidden" name="id" value={editingNode.id} />}
            
            <div className="formRow">
              <label>Nombre del Organismo</label>
              <input name="nombre" required defaultValue={editingNode?.nombre ?? ""} placeholder="Ej: Contención del Gasto" />
            </div>

            <div className="formRow">
              <label>Edificio / Dependencia</label>
              <input name="edificioDependencia" defaultValue={editingNode?.edificioDependencia ?? ""} placeholder="Ej: Ministerio de Hacienda" />
            </div>

            <div className="formRow">
              <label>Dirección (Opcional)</label>
              <input name="direccionOpcional" defaultValue={editingNode?.direccionOpcional ?? ""} placeholder="Calle 123, 1er Piso" />
            </div>

            <div className="formRow">
              <label>Descripción / Notas</label>
              <textarea name="descripcion" defaultValue={editingNode?.descripcion ?? ""} rows={2} placeholder="Notas adicionales..." />
            </div>

            <div className="formRow" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem" }}>
              <input type="checkbox" name="activo" defaultChecked={editingNode ? editingNode.activo : true} style={{ width: "auto" }} />
              <label>Habilitado para envíos/recepciones</label>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit" style={{ flex: 1 }}>{editingNode ? "Guardar" : "Crear"}</button>
              {editingNode && <Link href="/parametricas/externos" className="btn secondary" style={{ flex: 1 }}>Cancelar</Link>}
            </div>
          </form>
        </article>

        <article className="card" style={{ padding: "2rem" }}>
          <h2>Listado de Externos</h2>
          <div className="tableWrap" style={{ marginTop: "1.5rem" }}>
            <table>
              <thead><tr><th>Nombre / Ubicación</th><th>Estado</th><th style={{ textAlign: "right" }}>Acciones</th></tr></thead>
              <tbody>
                {nodes.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div style={{ fontWeight: "600" }}>{n.nombre}</div>
                      {n.edificioDependencia && <div className="small">{n.edificioDependencia}</div>}
                      {n.direccionOpcional && <div className="small" style={{ opacity: 0.7 }}>{n.direccionOpcional}</div>}
                    </td>
                    <td><span className={n.activo ? "badge ok" : "badge danger"}>{n.activo ? "Activo" : "Inactivo"}</span></td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/parametricas/externos?id=${n.id}`} className="btn secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Editar</Link>
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
