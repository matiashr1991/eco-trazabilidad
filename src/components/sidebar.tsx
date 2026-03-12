"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export function Sidebar({ user }: { user: AuthenticatedUser }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    operacion: true,
    configuracion: true,
    seguridad: true,
    control: true
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const isAdmin = hasPermission(user, "MANAGE_PARAMETRICS");
  const canManageUsers = hasPermission(user, "MANAGE_USERS");

  const NavLink = ({ href, name, icon }: { href: string; name: string; icon: React.ReactNode }) => (
    <Link 
      href={href} 
      className={`sidebar-link ${pathname === href ? 'active' : ''}`}
    >
      {icon}
      <span>{name}</span>
    </Link>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <ShieldCheck size={28} />
        Trazabilidad
      </div>

      <nav className="sidebar-nav">
        {/* Siempre visible */}
        <NavLink href="/" name="Panel" icon={<LayoutDashboard size={18} />} />

        {/* Grupo: Operación */}
        <div className="sidebar-group">
          <button className="sidebar-group-header" onClick={() => toggleGroup('operacion')}>
            OPERACIÓN
            {openGroups.operacion ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openGroups.operacion && (
            <div className="sidebar-group-content">
              <NavLink href="/expedientes" name="Buscador" icon={<Search size={18} />} />
              <NavLink href="/qr-scanner" name="Escanear QR" icon={<QrCode size={18} />} />
              {hasPermission(user, "CREATE_EXPEDIENTE") && (
                <NavLink href="/expedientes/new" name="Nuevo expediente" icon={<FilePlus size={18} />} />
              )}
            </div>
          )}
        </div>

        {/* Grupo: Configuración (Solo Admin) */}
        {isAdmin && (
          <div className="sidebar-group">
            <button className="sidebar-group-header" onClick={() => toggleGroup('configuracion')}>
              CONFIGURACIÓN
              {openGroups.configuracion ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {openGroups.configuracion && (
              <div className="sidebar-group-content">
                <NavLink href="/parametricas/areas" name="Áreas" icon={<Building2 size={18} />} />
                <NavLink href="/parametricas/rutas" name="Rutas" icon={<Route size={18} />} />
                <NavLink href="/parametricas/documentos" name="Documentos" icon={<FileText size={18} />} />
                <NavLink href="/parametricas/externos" name="Destinos" icon={<ExternalLink size={18} />} />
              </div>
            )}
          </div>
        )}

        {/* Grupo: Seguridad & Control (Solo Admin) */}
        {canManageUsers && (
          <>
            <div className="sidebar-group">
              <button className="sidebar-group-header" onClick={() => toggleGroup('seguridad')}>
                SEGURIDAD
                {openGroups.seguridad ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {openGroups.seguridad && (
                <div className="sidebar-group-content">
                  <NavLink href="/parametricas/usuarios" name="Usuarios" icon={<Users size={18} />} />
                  <NavLink href="/parametricas/roles" name="Permisos" icon={<Key size={18} />} />
                </div>
              )}
            </div>

            <div className="sidebar-group">
              <button className="sidebar-group-header" onClick={() => toggleGroup('control')}>
                CONTROL
                {openGroups.control ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {openGroups.control && (
                <div className="sidebar-group-content">
                  <NavLink href="/auditoria" name="Auditoría" icon={<History size={18} />} />
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-profile">
        <div className="sidebar-profile-info">
          <strong title={user.nombre}>{user.nombre}</strong>
          <span>{user.internalNodeName ?? user.roleName ?? "Personal"}</span>
        </div>
        <form action={logoutAction}>
          <button 
            type="submit" 
            className="sidebar-link" 
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "#ef4444", paddingLeft: "0.25rem" }}
          >
            <LogOut size={18} />
            Salir
          </button>
        </form>
      </div>
    </aside>
  );
}
