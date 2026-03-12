"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/password";
import { AuditAction } from "@prisma/client";

// --- Roles ---

export async function upsertRole(data: {
  id?: string;
  nombre: string;
  descripcion?: string;
  permissions: string[];
  activo?: boolean;
}) {
  const admin = await requireAdmin();

  if (data.id) {
    const oldRole = await prisma.role.findUnique({ where: { id: data.id } });
    await prisma.role.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        permissions: data.permissions,
        activo: data.activo ?? true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "Role",
        entityId: data.id,
        action: AuditAction.UPSERT_ROLE,
        beforeJson: oldRole ? (oldRole as any) : undefined,
        afterJson: { nombre: data.nombre, permissions: data.permissions, activo: data.activo ?? true },
      },
    });
  } else {
    const newRole = await prisma.role.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        permissions: data.permissions,
        activo: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "Role",
        entityId: newRole.id,
        action: AuditAction.UPSERT_ROLE,
        afterJson: { nombre: data.nombre, permissions: data.permissions },
      },
    });
  }

  revalidatePath("/parametricas/roles");
}

export async function deleteRole(id: string) {
  const admin = await requireAdmin();
  
  const role = await prisma.role.findUnique({ where: { id } });
  if (role?.nombre === "Administrador") {
    throw new Error("No se puede eliminar el rol Administrador de sistema.");
  }

  await prisma.role.update({
    where: { id },
    data: { activo: false }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      entityType: "Role",
      entityId: id,
      action: AuditAction.DELETE_ROLE,
      afterJson: { activo: false, roleName: role?.nombre },
    },
  });

  revalidatePath("/parametricas/roles");
}

// --- Usuarios ---

export async function upsertUser(data: {
  id?: string;
  nombre: string;
  username: string;
  password?: string;
  roleId: string;
  internalNodeId?: string;
  activo?: boolean;
}) {
  const admin = await requireAdmin();

  const userData: any = {
    nombre: data.nombre,
    username: data.username,
    roleId: data.roleId,
    internalNodeId: data.internalNodeId || null,
    activo: data.activo ?? true,
  };

  if (data.password) {
    userData.passwordHash = await hashPassword(data.password);
  }

  if (data.id) {
    const oldUser = await prisma.user.findUnique({ where: { id: data.id } });
    await prisma.user.update({
      where: { id: data.id },
      data: userData,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "User",
        entityId: data.id,
        action: AuditAction.UPDATE_USER,
        beforeJson: oldUser ? { username: oldUser.username, nombre: oldUser.nombre, roleId: oldUser.roleId, internalNodeId: oldUser.internalNodeId } : undefined,
        afterJson: { username: data.username, nombre: data.nombre, roleId: data.roleId, internalNodeId: data.internalNodeId },
      },
    });
  } else {
    if (!data.password) throw new Error("La contraseña es requerida para nuevos usuarios.");
    const newUser = await prisma.user.create({
      data: userData,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "User",
        entityId: newUser.id,
        action: AuditAction.CREATE_USER,
        afterJson: { username: data.username, nombre: data.nombre, roleId: data.roleId, internalNodeId: data.internalNodeId },
      },
    });
  }

  revalidatePath("/parametricas/usuarios");
}

export async function toggleUserStatus(id: string, active: boolean) {
  const admin = await requireAdmin();
  await prisma.user.update({
    where: { id },
    data: { activo: active }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      entityType: "User",
      entityId: id,
      action: AuditAction.TOGGLE_USER_STATUS,
      afterJson: { activo: active },
    },
  });

  revalidatePath("/parametricas/usuarios");
}
