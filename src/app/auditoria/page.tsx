import { prisma } from "@/lib/db";
import { requireAdmin, hasPermission } from "@/lib/auth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await requireAdmin();
  const sp = await searchParams;
  
  const page = Number(sp.page) || 1;
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const logs = await prisma.auditLog.findMany({
    take: pageSize,
    skip,
    orderBy: { occurredAt: "desc" },
    include: {
      actor: {
        select: {
          nombre: true,
          username: true,
        },
      },
    },
  });

  const totalLogs = await prisma.auditLog.count();
  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-pink-500 bg-clip-text text-transparent">
          Registro de Auditoría
        </h1>
        <p className="text-gray-500">Historial completo de acciones y cambios en el sistema</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha / Hora</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Acción</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Entidad</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Cambios (JSON)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(log.occurredAt, "dd MMM yyyy HH:mm:ss", { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{log.actor.nombre}</div>
                    <div className="text-xs text-gray-400">@{log.actor.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight ${
                      log.action.includes("CREATE") || log.action.includes("UPSERT") ? "bg-green-100 text-green-700" :
                      log.action.includes("UPDATE") ? "bg-blue-100 text-blue-700" :
                      log.action.includes("DELETE") || log.action.includes("TOGGLE") ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 font-medium">{log.entityType}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{log.entityId}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <details className="cursor-pointer group">
                      <summary className="text-xs text-green-600 font-bold hover:underline mb-1">Ver detalles</summary>
                      <div className="bg-gray-900 text-green-400 p-3 rounded-xl font-mono text-[10px] max-h-40 overflow-auto border border-gray-800 shadow-inner">
                        <div className="mb-2">
                          <div className="text-gray-500 uppercase mb-1">Antes:</div>
                          <pre>{JSON.stringify(log.beforeJson, null, 2) || "null"}</pre>
                        </div>
                        <div>
                          <div className="text-gray-500 uppercase mb-1">Después:</div>
                          <pre>{JSON.stringify(log.afterJson, null, 2) || "null"}</pre>
                        </div>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación sencilla */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500 font-medium">
            Página {page} de {totalPages} ({totalLogs} registros totales)
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?page=${page - 1}`} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all shadow-sm">
                Anterior
              </a>
            )}
            {page < totalPages && (
              <a href={`?page=${page + 1}`} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all shadow-sm">
                Siguiente
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
