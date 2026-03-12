export type AuthenticatedUser = {
  id: string;
  nombre: string;
  username: string;
  roleId: string | null;
  roleName: string | null;
  permissions: string[];
  internalNodeId: string | null;
  internalNodeName: string | null;
};

export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  // El Administrador siempre tiene todo
  if (user.roleName === "Administrador") return true;
  return user.permissions.includes(permission);
}

export function canOperateArea(user: AuthenticatedUser, internalNodeId: string) {
  if (hasPermission(user, "MANAGE_PARAMETRICS")) {
    return true;
  }

  if (!user.internalNodeId) {
    return false;
  }

  return user.internalNodeId === internalNodeId;
}

export function canCreateExpediente(user: AuthenticatedUser) {
  return hasPermission(user, "CREATE_EXPEDIENTE");
}

export function canMoveExpediente(user: AuthenticatedUser) {
  return hasPermission(user, "DISPATCH_INTERNAL");
}
