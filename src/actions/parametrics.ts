"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * DOCUMENT TYPES
 */

export async function upsertDocumentType(formData: FormData) {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) {
    throw new Error("No tienes permisos para realizar esta acción.");
  }

  const id = formData.get("id") as string | null;
  const nombre = formData.get("nombre") as string;
  const descripcion = formData.get("descripcion") as string;
  const activo = formData.get("activo") === "on";

  if (!nombre) throw new Error("El nombre es requerido.");

  if (id) {
    await prisma.documentType.update({
      where: { id },
      data: { nombre, descripcion, activo },
    });
  } else {
    await prisma.documentType.create({
      data: { nombre, descripcion, activo },
    });
  }

  revalidatePath("/parametricas/documentos");
}

export async function toggleDocumentTypeStatus(id: string) {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) throw new Error("No autorizado");

  const doc = await prisma.documentType.findUnique({ where: { id } });
  if (!doc) throw new Error("No encontrado");

  await prisma.documentType.update({
    where: { id },
    data: { activo: !doc.activo },
  });

  revalidatePath("/parametricas/documentos");
}

/**
 * INTERNAL NODES (AREAS)
 */

export async function upsertInternalNode(formData: FormData) {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) {
    throw new Error("No tienes permisos para realizar esta acción.");
  }

  const id = formData.get("id") as string | null;
  const nombre = formData.get("nombre") as string;
  const edificio = formData.get("edificio") as string;
  const planta = formData.get("planta") as string;
  const activo = formData.get("activo") === "on";

  if (!nombre) throw new Error("El nombre es requerido.");

  if (id) {
    await prisma.internalNode.update({
      where: { id },
      data: { nombre, edificio, planta, activo },
    });
  } else {
    await prisma.internalNode.create({
      data: { nombre, edificio, planta, activo },
    });
  }

  revalidatePath("/parametricas/areas");
}

export async function toggleInternalNodeStatus(id: string) {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) throw new Error("No autorizado");

  const node = await prisma.internalNode.findUnique({ where: { id } });
  if (!node) throw new Error("No encontrado");

  await prisma.internalNode.update({
    where: { id },
    data: { activo: !node.activo },
  });

  revalidatePath("/parametricas/areas");
}

/**
 * EXTERNAL NODES
 */

export async function upsertExternalNode(formData: FormData) {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) throw new Error("No autorizado");

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
    await prisma.externalNode.update({
      where: { id },
      data,
    });
  } else {
    await prisma.externalNode.create({
      data,
    });
  }

  revalidatePath("/parametricas/externos");
}

/**
 * INTERNAL ROUTES
 */

export async function upsertInternalRoute(formData: FormData) {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) throw new Error("No autorizado");

  const id = formData.get("id") as string | null;
  const fromInternalNodeId = formData.get("fromInternalNodeId") as string;
  const toInternalNodeId = formData.get("toInternalNodeId") as string;
  const activo = formData.get("activo") === "on";

  if (!fromInternalNodeId || !toInternalNodeId) throw new Error("Áreas requeridas");

  if (id) {
    await prisma.internalRoute.update({
      where: { id },
      data: { fromInternalNodeId, toInternalNodeId, activo },
    });
  } else {
    await prisma.internalRoute.create({
      data: { fromInternalNodeId, toInternalNodeId, activo },
    });
  }

  revalidatePath("/parametricas/rutas");
}

export async function deleteInternalRoute(id: string) {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) throw new Error("No autorizado");

  await prisma.internalRoute.delete({ where: { id } });
  revalidatePath("/parametricas/rutas");
}
