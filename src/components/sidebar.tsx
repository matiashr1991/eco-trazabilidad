import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AuthenticatedUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

export function Sidebar({ user }: { user: AuthenticatedUser }) {
  const isAdmin = user.role === UserRole.ADMIN;
  const canCreate = user.role === UserRole.ADMIN || user.role === UserRole.AREA_MANAGER;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        Trazabilidad
      </div>

      <nav className="sidebar-nav">
        <Link href="/" className="sidebar-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          Panel Control
        </Link>

        {isAdmin && (
          <>
            <div className="small" style={{ padding: "1rem 1rem 0.5rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Administración</div>
            <Link href="/parametricas/areas" className="sidebar-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7"/></svg>
              Áreas Internas
            </Link>
            <Link href="/parametricas/rutas" className="sidebar-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/><path d="M3 12h12"/></svg>
              Rutas Permitidas
            </Link>
            <Link href="/parametricas/documentos" className="sidebar-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              Tipos de Documento
            </Link>
            <Link href="/parametricas/externos" className="sidebar-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Destinos Externos
            </Link>
          </>
        )}

        <div className="small" style={{ padding: "1rem 1rem 0.5rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Operaciones</div>
        <Link href="/expedientes" className="sidebar-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          Buscador
        </Link>
        <Link href="/scan" className="sidebar-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v.01"/></svg>
          Escanear QR
        </Link>
        {canCreate && (
          <Link href="/expedientes/new" className="sidebar-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Nuevo Expediente
          </Link>
        )}
      </nav>

      <div className="sidebar-profile">
        <div className="sidebar-profile-info">
          <strong>{user.nombre}</strong>
          <span>{user.internalNodeName ?? user.role}</span>
        </div>
        <form action={logoutAction}>
          <button 
            type="submit" 
            className="sidebar-link" 
            data-variant="danger"
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Salir del sistema
          </button>
        </form>
      </div>
    </aside>
  );
}
