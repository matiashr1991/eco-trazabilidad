import Link from "next/link";
import { AuthenticatedUser, hasPermission } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { 
  LayoutDashboard, 
  Search, 
  FilePlus, 
  QrCode, 
  Building2, 
  Route, 
  FileText, 
  Users, 
  Key, 
  ExternalLink, 
  History,
  LogOut 
} from "lucide-react";

export function Sidebar({ user }: { user: AuthenticatedUser }) {
  const canManageParametrics = hasPermission(user, "MANAGE_PARAMETRICS");
  const canManageUsers = hasPermission(user, "MANAGE_USERS");
  const canCreateExpediente = hasPermission(user, "CREATE_EXPEDIENTE");

  const navigations = [
    { name: "Panel Control", icon: <LayoutDashboard size={20} />, href: "/" },
    { name: "Buscador", icon: <Search size={20} />, href: "/expedientes" },
    { name: "Nuevo Expediente", icon: <FilePlus size={20} />, href: "/expedientes/new", hidden: !canCreateExpediente },
    { name: "Escanear QR", icon: <QrCode size={20} />, href: "/qr-scanner" },
  ];

  const parametricas = [
    { name: "Áreas Internas", icon: <Building2 size={20} />, href: "/parametricas/areas", hidden: !canManageParametrics },
    { name: "Rutas Permitidas", icon: <Route size={20} />, href: "/parametricas/rutas", hidden: !canManageParametrics },
    { name: "Tipos de Documento", icon: <FileText size={20} />, href: "/parametricas/documentos", hidden: !canManageParametrics },
    { name: "Destinos Externos", icon: <ExternalLink size={20} />, href: "/parametricas/externos", hidden: !canManageParametrics },
    { name: "Usuarios", icon: <Users size={20} />, href: "/parametricas/usuarios", hidden: !canManageUsers },
    { name: "Roles y Permisos", icon: <Key size={20} />, href: "/parametricas/roles", hidden: !canManageUsers },
    { name: "Auditoría Sistema", icon: <History size={20} />, href: "/auditoria", hidden: !canManageUsers },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        Trazabilidad
      </div>

      <nav className="sidebar-nav">
        <div className="small" style={{ padding: "1rem 1rem 0.5rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent)" }}>Operaciones</div>
        {navigations.filter(n => !n.hidden).map((item) => (
          <Link key={item.href} href={item.href} className="sidebar-link">
            {item.icon}
            {item.name}
          </Link>
        ))}

        {(canManageParametrics || canManageUsers) && (
          <>
            <div className="small" style={{ padding: "1rem 1rem 0.5rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent)" }}>Administración</div>
            {parametricas.filter(n => !n.hidden).map((item) => (
              <Link key={item.href} href={item.href} className="sidebar-link">
                {item.icon}
                {item.name}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-profile">
        <div className="sidebar-profile-info">
          <strong>{user.nombre}</strong>
          <span>{user.internalNodeName ?? user.roleName ?? "Personal Externo"}</span>
        </div>
        <form action={logoutAction}>
          <button 
            type="submit" 
            className="sidebar-link" 
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "#fca5a5" }}
          >
            <LogOut size={20} />
            Salir del sistema
          </button>
        </form>
      </div>
    </aside>
  );
}
