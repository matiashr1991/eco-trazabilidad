"use server";

import { randomUUID } from "crypto";
import { CustodyStatus, InternalDispatchStatus, ExternalTransferStatus, AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canCreateExpediente, canMoveExpediente, canOperateArea, requireUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function appBaseUrl() {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function forbiddenRedirect(message: string) {
  redirect(`/?error=${encodeURIComponent(message)}`);
}

function resolveRedirectPath(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  if (redirectTo.startsWith("/")) {
    return redirectTo;
  }
  return fallback;
}

export async function createExpedienteAction(formData: FormData) {
  const user = await requireUser();
  if (!canCreateExpediente(user)) {
    forbiddenRedirect("No tenes permisos para crear expedientes");
  }

  const numeroExpediente = String(formData.get("numeroExpediente") ?? "").trim();
  const descripcionCorta = String(formData.get("descripcionCorta") ?? "").trim();
  const documentTypeId = String(formData.get("documentTypeId") ?? "").trim();
  const requestedNode = String(formData.get("internalNodeId") ?? "").trim();
  const toInternalNodeId = String(formData.get("toInternalNodeId") ?? "").trim();

  if (!numeroExpediente || !documentTypeId) {
    redirect("/expedientes/new?error=Numero+y+tipo+son+obligatorios");
  }

  const internalNodeId = hasPermission(user, "MANAGE_PARAMETRICS") ? requestedNode : user.internalNodeId;
  if (!internalNodeId) {
    redirect("/expedientes/new?error=Debe+existir+un+area+interna+inicial");
  }

  // Validar ruta si hay despacho inmediato y no es admin
  if (toInternalNodeId && !hasPermission(user, "MANAGE_PARAMETRICS")) {
    const route = await prisma.internalRoute.findFirst({
      where: {
        fromInternalNodeId: internalNodeId,
        toInternalNodeId,
        activo: true
      }
    });
    if (!route) {
      redirect("/expedientes/new?error=Esa+ruta+de+destino+no+esta+habilitada+para+su+area");
    }
  }

  const id = randomUUID();
  const qrToken = `TRZ-${randomUUID().split("-")[0].toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const qrCodeValue = qrToken; // QR content is now JUST the obfuscated token

  const expediente = await prisma.$transaction(async (tx) => {
    const exp = await tx.expediente.create({
      data: {
        id,
        numeroExpediente,
        descripcionCorta,
        documentTypeId,
        currentInternalNodeId: toInternalNodeId ? null : internalNodeId,
        lastInternalNodeId: toInternalNodeId ? internalNodeId : null,
        qrToken,
        qrCodeValue,
        custodyStatus: toInternalNodeId ? CustodyStatus.IN_INTERNAL_TRANSIT : CustodyStatus.IN_INTERNAL_NODE,
      },
    });

    if (toInternalNodeId) {
      await tx.internalDispatch.create({
        data: {
          expedienteId: exp.id,
          fromInternalNodeId: internalNodeId,
          toInternalNodeId,
          dispatchedByUserId: user.id,
          dispatchedAt: new Date(),
          dispatchNote: "Despacho inicial al crear expediente",
          status: InternalDispatchStatus.PENDING,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        expedienteId: exp.id,
        entityType: "Expediente",
        entityId: exp.id,
        action: AuditAction.CREATE_EXPEDIENTE,
        afterJson: { 
          ...exp, 
          initialDispatch: toInternalNodeId ? { toInternalNodeId } : undefined 
        } as any,
      },
    });

    return exp;
  });

  revalidatePath("/");
  redirect(`/expedientes/${expediente.id}?ok=Expediente+creado`);
}

export async function dispatchInternalAction(formData: FormData) {
  const user = await requireUser();
  if (!canMoveExpediente(user)) {
    forbiddenRedirect("No tenes permisos para despachar");
  }

  const expedienteId = String(formData.get("expedienteId") ?? "");
  const toInternalNodeId = String(formData.get("toInternalNodeId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const successRedirect = resolveRedirectPath(
    formData,
    `/expedientes/${expedienteId}?ok=Despacho+interno+registrado`,
  );

  const expediente = await prisma.expediente.findUnique({ where: { id: expedienteId } });
  if (!expediente || expediente.custodyStatus !== CustodyStatus.IN_INTERNAL_NODE || !expediente.currentInternalNodeId) {
    redirect(`/expedientes/${expedienteId}?error=El+expediente+no+puede+despacharse`);
  }

  if (!canOperateArea(user, expediente.currentInternalNodeId)) {
    redirect(`/expedientes/${expedienteId}?error=No+tenes+custodia+del+expediente`);
  }

  const route = await prisma.internalRoute.findFirst({
    where: {
      fromInternalNodeId: expediente.currentInternalNodeId,
      toInternalNodeId,
      activo: true,
    },
  });

  if (!route) {
    redirect(`/expedientes/${expedienteId}?error=Destino+interno+no+habilitado`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.internalDispatch.create({
      data: {
        expedienteId,
        fromInternalNodeId: expediente.currentInternalNodeId!,
        toInternalNodeId,
        dispatchedByUserId: user.id,
        dispatchedAt: new Date(),
        dispatchNote: note || null,
        status: InternalDispatchStatus.PENDING,
      },
    });

    await tx.expediente.update({
      where: { id: expedienteId },
      data: {
        custodyStatus: CustodyStatus.IN_INTERNAL_TRANSIT,
        currentInternalNodeId: null,
        currentExternalNodeId: null,
        lastInternalNodeId: expediente.currentInternalNodeId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        expedienteId,
        entityType: "Expediente",
        entityId: expedienteId,
        action: AuditAction.DISPATCH_INTERNAL,
        beforeJson: expediente,
        afterJson: { toInternalNodeId, note },
      },
    });
  });

  revalidatePath("/");
  revalidatePath(`/expedientes/${expedienteId}`);
  revalidatePath(`/mobile/expedientes/${expedienteId}`);
  redirect(successRedirect);
}

export async function receiveInternalAction(formData: FormData) {
  const user = await requireUser();
  if (!canMoveExpediente(user)) {
    forbiddenRedirect("No tenes permisos para recibir");
  }

  const expedienteId = String(formData.get("expedienteId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const successRedirect = resolveRedirectPath(
    formData,
    `/expedientes/${expedienteId}?ok=Recepcion+confirmada`,
  );

  const pendiente = await prisma.internalDispatch.findFirst({
    where: {
      expedienteId,
      status: InternalDispatchStatus.PENDING,
    },
    orderBy: { dispatchedAt: "desc" },
  });

  if (!pendiente) {
    redirect(`/expedientes/${expedienteId}?error=No+hay+despacho+pendiente`);
  }

  if (!canOperateArea(user, pendiente.toInternalNodeId)) {
    redirect(`/expedientes/${expedienteId}?error=Solo+el+destino+puede+recibir`);
  }

  const expediente = await prisma.expediente.findUnique({ where: { id: expedienteId } });
  if (!expediente || expediente.custodyStatus !== CustodyStatus.IN_INTERNAL_TRANSIT) {
    redirect(`/expedientes/${expedienteId}?error=Estado+invalido+para+recepcion`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.internalDispatch.update({
      where: { id: pendiente.id },
      data: {
        status: InternalDispatchStatus.RECEIVED,
        receivedByUserId: user.id,
        receivedAt: new Date(),
        receiveNote: note || null,
      },
    });

    await tx.expediente.update({
      where: { id: expedienteId },
      data: {
        custodyStatus: CustodyStatus.IN_INTERNAL_NODE,
        currentInternalNodeId: pendiente.toInternalNodeId,
        currentExternalNodeId: null,
        lastInternalNodeId: pendiente.toInternalNodeId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        expedienteId,
        entityType: "Expediente",
        entityId: expedienteId,
        action: AuditAction.RECEIVE_INTERNAL,
        beforeJson: expediente,
        afterJson: { toInternalNodeId: pendiente.toInternalNodeId, note },
      },
    });
  });

  revalidatePath("/");
  revalidatePath(`/expedientes/${expedienteId}`);
  revalidatePath(`/mobile/expedientes/${expedienteId}`);
  redirect(successRedirect);
}

export async function dispatchExternalAction(formData: FormData) {
  const user = await requireUser();
  if (!canMoveExpediente(user)) {
    forbiddenRedirect("No tenes permisos para registrar salida externa");
  }

  const expedienteId = String(formData.get("expedienteId") ?? "");
  const toExternalNodeId = String(formData.get("toExternalNodeId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const expediente = await prisma.expediente.findUnique({ where: { id: expedienteId } });
  if (!expediente || expediente.custodyStatus !== CustodyStatus.IN_INTERNAL_NODE || !expediente.currentInternalNodeId) {
    redirect(`/expedientes/${expedienteId}?error=El+expediente+no+puede+salir+a+externo`);
  }

  if (!canOperateArea(user, expediente.currentInternalNodeId)) {
    redirect(`/expedientes/${expedienteId}?error=No+tenes+custodia+del+expediente`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.externalTransfer.create({
      data: {
        expedienteId,
        fromInternalNodeId: expediente.currentInternalNodeId!,
        toExternalNodeId,
        dispatchedByUserId: user.id,
        dispatchedAt: new Date(),
        dispatchNote: note || null,
        status: ExternalTransferStatus.OUT,
      },
    });

    await tx.expediente.update({
      where: { id: expedienteId },
      data: {
        custodyStatus: CustodyStatus.OUT_OF_BUILDING,
        currentExternalNodeId: toExternalNodeId,
        currentInternalNodeId: null,
        lastInternalNodeId: expediente.currentInternalNodeId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        expedienteId,
        entityType: "Expediente",
        entityId: expedienteId,
        action: AuditAction.DISPATCH_EXTERNAL,
        beforeJson: expediente,
        afterJson: { toExternalNodeId, note },
      },
    });
  });

  revalidatePath("/");
  revalidatePath(`/expedientes/${expedienteId}`);
  redirect(`/expedientes/${expedienteId}?ok=Salida+externa+registrada`);
}

export async function returnExternalAction(formData: FormData) {
  const user = await requireUser();
  if (!canMoveExpediente(user)) {
    forbiddenRedirect("No tenes permisos para registrar reingreso");
  }

  const expedienteId = String(formData.get("expedienteId") ?? "");
  const toInternalNodeId = String(formData.get("toInternalNodeId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const expediente = await prisma.expediente.findUnique({ where: { id: expedienteId } });
  if (!expediente || expediente.custodyStatus !== CustodyStatus.OUT_OF_BUILDING) {
    redirect(`/expedientes/${expedienteId}?error=El+expediente+no+esta+fuera+del+edificio`);
  }

  if (!toInternalNodeId) {
    redirect(`/expedientes/${expedienteId}?error=Debe+informar+el+area+de+reingreso`);
  }

  if (!canOperateArea(user, toInternalNodeId)) {
    redirect(`/expedientes/${expedienteId}?error=No+podes+reingresar+a+otra+area`);
  }

  const transfer = await prisma.externalTransfer.findFirst({
    where: {
      expedienteId,
      status: ExternalTransferStatus.OUT,
    },
    orderBy: { dispatchedAt: "desc" },
  });

  if (!transfer) {
    redirect(`/expedientes/${expedienteId}?error=No+hay+salida+externa+abierta`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.externalTransfer.update({
      where: { id: transfer.id },
      data: {
        status: ExternalTransferStatus.RETURNED,
        returnedToInternalNodeId: toInternalNodeId,
        returnedByUserId: user.id,
        returnedAt: new Date(),
        returnNote: note || null,
      },
    });

    await tx.expediente.update({
      where: { id: expedienteId },
      data: {
        custodyStatus: CustodyStatus.IN_INTERNAL_NODE,
        currentInternalNodeId: toInternalNodeId,
        currentExternalNodeId: null,
        lastInternalNodeId: toInternalNodeId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        expedienteId,
        entityType: "Expediente",
        entityId: expedienteId,
        action: AuditAction.RETURN_EXTERNAL,
        beforeJson: expediente,
        afterJson: { fromExternalNodeId: transfer.toExternalNodeId, toInternalNodeId, note },
      },
    });
  });

  revalidatePath("/");
  revalidatePath(`/expedientes/${expedienteId}`);
  redirect(`/expedientes/${expedienteId}?ok=Reingreso+registrado`);
}

export async function archiveExpedienteAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "MANAGE_PARAMETRICS")) {
    forbiddenRedirect("Solo administrador puede archivar");
  }

  const expedienteId = String(formData.get("expedienteId") ?? "");
  const expediente = await prisma.expediente.findUnique({ where: { id: expedienteId } });

  if (!expediente || expediente.custodyStatus === CustodyStatus.ARCHIVED) {
    redirect(`/expedientes/${expedienteId}?error=Expediente+invalido+para+archivo`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.expediente.update({
      where: { id: expedienteId },
      data: {
        custodyStatus: CustodyStatus.ARCHIVED,
        archivedAt: new Date(),
        activo: false,
        currentInternalNodeId: null,
        currentExternalNodeId: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        expedienteId,
        entityType: "Expediente",
        entityId: expedienteId,
        action: AuditAction.ARCHIVE_EXPEDIENTE,
        beforeJson: expediente,
        afterJson: { archived: true },
      },
    });
  });

  revalidatePath("/");
  revalidatePath(`/expedientes/${expedienteId}`);
  redirect(`/expedientes/${expedienteId}?ok=Expediente+archivado`);
}

export async function resolveQrToken(token: string) {
  const user = await requireUser();
  if (!user) throw new Error("No autorizado");

  const expediente = await prisma.expediente.findUnique({
    where: { qrToken: token },
    select: { id: true },
  });

  return expediente?.id ?? null;
}
