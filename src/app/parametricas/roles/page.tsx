import { prisma } from "@/lib/db";
import { requireUser, hasPermission } from "@/lib/auth";
import { upsertRole, deleteRole } from "@/actions/users";

const AVAILABLE_PERMISSIONS = [
  { id: "CREATE_EXPEDIENTE", label: "Crear Expedientes" },
  { id: "DISPATCH_INTERNAL", label: "Despachar (Movimientos)" },
  { id: "RECEIVE_INTERNAL", label: "Recibir (Movimientos)" },
  { id: "MANAGE_EXTERNAL", label: "Gestionar Destinos Externos" },
  { id: "MANAGE_PARAMETRICS", label: "Gestionar Paramétricas (Áreas, Tipos)" },
  { id: "MANAGE_USERS", label: "Gestionar Usuarios y Roles" },
];

export default async function RolesPage() {
  const user = await requireUser();
  if (!hasPermission(user, "MANAGE_USERS")) {
    return <main className="p-8">No autorizado</main>;
  }

  const roles = await prisma.role.findMany({
    orderBy: { nombre: "asc" },
  });

  return (
    <main className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-pink-500 bg-clip-text text-transparent">
            Gestión de Roles
          </h1>
          <p className="text-gray-500">Define qué pueden hacer los usuarios en el sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Creación/Edición */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 sticky top-24">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Nuevo / Editar Rol</h2>
            <form action={async (formData: FormData) => {
              "use server";
              const id = formData.get("id") as string;
              const nombre = formData.get("nombre") as string;
              const descripcion = formData.get("descripcion") as string;
              const permissions = AVAILABLE_PERMISSIONS
                .filter(p => formData.get(`perm_${p.id}`) === "on")
                .map(p => p.id);
              
              await upsertRole({ 
                id: id || undefined, 
                nombre, 
                descripcion, 
                permissions 
              });
            }} className="space-y-4">
              <input type="hidden" name="id" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol</label>
                <input
                  name="nombre"
                  placeholder="Ej: Auditor"
                  required
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  placeholder="Explica qué hace este rol..."
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all h-20"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Permisos</label>
                {AVAILABLE_PERMISSIONS.map(permission => (
                  <label key={permission.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name={`perm_${permission.id}`}
                      className="w-5 h-5 rounded text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{permission.label}</span>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white p-3 rounded-xl font-bold hover:shadow-lg hover:shadow-green-200 transition-all active:scale-95"
              >
                Guardar Rol
              </button>
            </form>
          </div>
        </div>

        {/* Listado de Roles */}
        <div className="lg:col-span-2 space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-800">{role.nombre}</h3>
                  {!role.activo && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Inactivo</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">{role.descripcion || "Sin descripción"}</p>
                
                <div className="flex flex-wrap gap-2">
                  {(role.permissions as string[]).map((p) => {
                    const label = AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label || p;
                    return (
                      <span key={p} className="text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        {label}
                      </span>
                    );
                  })}
                  {(role.permissions as string[]).length === 0 && (
                    <span className="text-xs text-gray-400 italic">Sin permisos asignados</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <form action={async () => {
                  "use server";
                  await deleteRole(role.id);
                }}>
                  <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Desactivar">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
