import Link from "next/link";
import { requireUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { upsertInternalRoute, deleteInternalRoute } from "@/actions/parametrics";

export default async function RutasPage() {
  const user = await requireUser();
  if (!hasPermission(user, "MANAGE_PARAMETRICS")) return <main>No autorizado</main>;

  const [nodes, routes] = await Promise.all([
    prisma.internalNode.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.internalRoute.findMany({
      include: { fromInternalNode: true, toInternalNode: true },
      orderBy: { fromInternalNode: { nombre: "asc" } },
    }),
  ]);

  return (
    <main>
      <div className="pageHeader">
        <div>
          <h1>Rutas Internas</h1>
          <p className="small">Defina qué áreas pueden enviarse expedientes entre sí.</p>
        </div>
        <Link href="/" className="btn secondary">Volver</Link>
      </div>

      <div className="grid cols-2">
        <article className="card" style={{ padding: "2rem", height: "fit-content" }}>
          <h2>Habilitar Nueva Ruta</h2>
          <form action={upsertInternalRoute} style={{ marginTop: "1.5rem" }}>
            <div className="formRow">
              <label>Origen (Quién envía)</label>
              <select name="fromInternalNodeId" required>
                <option value="">Seleccione...</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </select>
            </div>
            <div className="formRow">
              <label>Destino (Quién recibe)</label>
              <select name="toInternalNodeId" required>
                <option value="">Seleccione...</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </select>
            </div>
            <div className="formRow" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem" }}>
              <input type="checkbox" name="activo" defaultChecked style={{ width: "auto" }} />
              <label>Ruta Activa</label>
            </div>
            <button type="submit" style={{ width: "100%", marginTop: "1rem" }}>Crear Ruta</button>
          </form>
        </article>

        <article className="card" style={{ padding: "2rem" }}>
          <h2>Rutas Configuradas</h2>
          <div className="tableWrap" style={{ marginTop: "1.5rem" }}>
            <table>
              <thead><tr><th>Origen</th><th>Destino</th><th style={{ textAlign: "right" }}>Acciones</th></tr></thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fromInternalNode.nombre}</td>
                    <td>{r.toInternalNode.nombre}</td>
                    <td style={{ textAlign: "right" }}>
                      <form action={deleteInternalRoute.bind(null, r.id)}>
                        <button type="submit" className="btn danger" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Eliminar</button>
                      </form>
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
