"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AuditAction } from "@prisma/client";

/**
 * DOCUMENT TYPES
 */

export async function upsertDocumentType(formData: FormData) {
  const admin = await requireAdmin();

  const id = formData.get("id") as string | null;
  const nombre = formData.get("nombre") as string;
  const descripcion = formData.get("descripcion") as string;
  const activo = formData.get("activo") === "on";

  if (!nombre) throw new Error("El nombre es requerido.");

  if (id) {
    const old = await prisma.documentType.findUnique({ where: { id } });
    await prisma.documentType.update({
      where: { id },
      data: { nombre, descripcion, activo },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "DocumentType",
        entityId: id,
        action: AuditAction.UPSERT_PARAMETRIC,
        beforeJson: old ? (old as any) : undefined,
        afterJson: { nombre, descripcion, activo },
      },
    });
  } else {
    const res = await prisma.documentType.create({
      data: { nombre, descripcion, activo },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "DocumentType",
        entityId: res.id,
        action: AuditAction.UPSERT_PARAMETRIC,
        afterJson: { nombre, descripcion, activo },
      },
    });
  }

  revalidatePath("/parametricas/documentos");
}

export async function toggleDocumentTypeStatus(id: string) {
  const admin = await requireAdmin();

  const doc = await prisma.documentType.findUnique({ where: { id } });
  if (!doc) throw new Error("No encontrado");

  await prisma.documentType.update({
    where: { id },
    data: { activo: !doc.activo },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      entityType: "DocumentType",
      entityId: id,
      action: AuditAction.UPSERT_PARAMETRIC,
      beforeJson: { activo: doc.activo },
      afterJson: { activo: !doc.activo },
    },
  });

  revalidatePath("/parametricas/documentos");
}

/**
 * INTERNAL NODES (AREAS)
 */

export async function upsertInternalNode(formData: FormData) {
  const admin = await requireAdmin();

  const id = formData.get("id") as string | null;
  const nombre = formData.get("nombre") as string;
  const edificio = formData.get("edificio") as string;
  const planta = formData.get("planta") as string;
  const activo = formData.get("activo") === "on";

  if (!nombre) throw new Error("El nombre es requerido.");

  if (id) {
    const old = await prisma.internalNode.findUnique({ where: { id } });
    await prisma.internalNode.update({
      where: { id },
      data: { nombre, edificio, planta, activo },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "InternalNode",
        entityId: id,
        action: AuditAction.UPSERT_PARAMETRIC,
        beforeJson: old ? (old as any) : undefined,
        afterJson: { nombre, edificio, planta, activo },
      },
    });
  } else {
    const res = await prisma.internalNode.create({
      data: { nombre, edificio, planta, activo },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "InternalNode",
        entityId: res.id,
        action: AuditAction.UPSERT_PARAMETRIC,
        afterJson: { nombre, edificio, planta, activo },
      },
    });
  }

  revalidatePath("/parametricas/areas");
}

export async function toggleInternalNodeStatus(id: string) {
  const admin = await requireAdmin();

  const node = await prisma.internalNode.findUnique({ where: { id } });
  if (!node) throw new Error("No encontrado");

  await prisma.internalNode.update({
    where: { id },
    data: { activo: !node.activo },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      entityType: "InternalNode",
      entityId: id,
      action: AuditAction.UPSERT_PARAMETRIC,
      beforeJson: { activo: node.activo },
      afterJson: { activo: !node.activo },
    },
  });

  revalidatePath("/parametricas/areas");
}

/**
 * EXTERNAL NODES
 */

export async function upsertExternalNode(formData: FormData) {
  const admin = await requireAdmin();

  const id = formData.get("id") as string | null;
  const nombre = formData.get("nombre") as string;
  const descripcion = formData.get("descripcion") as string;
  const edificioDependencia = formData.get("edificioDependencia") as string;
  const direccionOpcional = formData.get("direccionOpcional") as string;
  const activo = formData.get("activo") === "on";

  if (!nombre) throw new Error("Nombre requerido");

  const data = {
    nombre,
    descripcion,
    edificioDependencia,
    direccionOpcional,
    activo,
  };

  if (id) {
    const old = await prisma.externalNode.findUnique({ where: { id } });
    await prisma.externalNode.update({
      where: { id },
      data,
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "ExternalNode",
        entityId: id,
        action: AuditAction.UPSERT_PARAMETRIC,
        beforeJson: old ? (old as any) : undefined,
        afterJson: data,
      },
    });
  } else {
    const res = await prisma.externalNode.create({
      data,
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "ExternalNode",
        entityId: res.id,
        action: AuditAction.UPSERT_PARAMETRIC,
        afterJson: data,
      },
    });
  }

  revalidatePath("/parametricas/externos");
}

/**
 * INTERNAL ROUTES
 */

export async function upsertInternalRoute(formData: FormData) {
  const admin = await requireAdmin();

  const id = formData.get("id") as string | null;
  const fromInternalNodeId = formData.get("fromInternalNodeId") as string;
  const toInternalNodeId = formData.get("toInternalNodeId") as string;
  const activo = formData.get("activo") === "on";

  if (!fromInternalNodeId || !toInternalNodeId) throw new Error("Áreas requeridas");

  if (id) {
    const old = await prisma.internalRoute.findUnique({ where: { id } });
    await prisma.internalRoute.update({
      where: { id },
      data: { fromInternalNodeId, toInternalNodeId, activo },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "InternalRoute",
        entityId: id,
        action: AuditAction.UPSERT_PARAMETRIC,
        beforeJson: old ? (old as any) : undefined,
        afterJson: { fromInternalNodeId, toInternalNodeId, activo },
      },
    });
  } else {
    const res = await prisma.internalRoute.create({
      data: { fromInternalNodeId, toInternalNodeId, activo },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "InternalRoute",
        entityId: res.id,
        action: AuditAction.UPSERT_PARAMETRIC,
        afterJson: { fromInternalNodeId, toInternalNodeId, activo },
      },
    });
  }

  revalidatePath("/parametricas/rutas");
}

export async function deleteInternalRoute(id: string) {
  const admin = await requireAdmin();

  const route = await prisma.internalRoute.findUnique({ where: { id } });

  await prisma.internalRoute.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      entityType: "InternalRoute",
      entityId: id,
      action: AuditAction.UPSERT_PARAMETRIC,
      beforeJson: route ? (route as any) : undefined,
      afterJson: { deleted: true },
    },
  });

  revalidatePath("/parametricas/rutas");
}
