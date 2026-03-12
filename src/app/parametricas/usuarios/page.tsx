import { prisma } from "@/lib/db";
import { requireUser, hasPermission } from "@/lib/auth";
import { upsertUser, toggleUserStatus } from "@/actions/users";
import { revalidatePath } from "next/cache";

export default async function UsuariosPage() {
  const adminUser = await requireUser();
  if (!hasPermission(adminUser, "MANAGE_USERS")) {
    return <main className="p-8">No autorizado</main>;
  }
  const users = await prisma.user.findMany({
    include: {
      role: true,
      internalNode: true,
    },
    orderBy: { nombre: "asc" },
  });

  const roles = await prisma.role.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
  const areas = await prisma.internalNode.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });

  return (
    <main className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-pink-500 bg-clip-text text-transparent">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500">Administra el acceso al sistema y asigna responsabilidades</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 sticky top-24">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Nuevo / Editar Usuario</h2>
            <form action={async (formData: FormData) => {
              "use server";
              const id = formData.get("id") as string;
              const nombre = formData.get("nombre") as string;
              const username = formData.get("username") as string;
              const password = formData.get("password") as string;
              const roleId = formData.get("roleId") as string;
              const internalNodeId = formData.get("internalNodeId") as string;
              
              await upsertUser({
                id: id || undefined,
                nombre,
                username,
                password: password || undefined,
                roleId,
                internalNodeId: internalNodeId || undefined,
              });
            }} className="space-y-4">
              <input type="hidden" name="id" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input name="nombre" placeholder="Ej: Juan Perez" required className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario (Login)</label>
                <input name="username" placeholder="ej: jperez" required className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input name="password" type="password" placeholder="Mínimo 6 caracteres" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                <p className="text-[10px] text-gray-400 mt-1 italic">Dejar vacío para no cambiar en ediciones</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select name="roleId" required className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all">
                  <option value="">Seleccionar rol...</option>
                  {roles.map((r: any) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área Asignada</label>
                <select name="internalNodeId" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all">
                  <option value="">Sin área (Acceso Global)</option>
                  {areas.map((a: any) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white p-3 rounded-xl font-bold hover:shadow-lg hover:shadow-green-200 transition-all active:scale-95">
                Guardar Usuario
              </button>
            </form>
          </div>
        </div>

        {/* Listado */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Área</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{u.nombre}</div>
                      <div className="text-xs text-gray-400">@{u.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-md uppercase">
                        {u.role?.nombre || "Sin Rol"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{u.internalNode?.nombre || "Nivel Central"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`w-2 h-2 rounded-full inline-block mr-2 ${u.activo ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-xs text-gray-500">{u.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={async () => {
                        "use server";
                        await toggleUserStatus(u.id, !u.activo);
                      }}>
                        <button className={`p-2 rounded-lg transition-colors ${u.activo ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
                          {u.activo ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
