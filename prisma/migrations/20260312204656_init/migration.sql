-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'AREA_MANAGER', 'AREA_OPERATOR');

-- CreateEnum
CREATE TYPE "public"."CustodyStatus" AS ENUM ('IN_INTERNAL_NODE', 'IN_INTERNAL_TRANSIT', 'OUT_OF_BUILDING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."InternalDispatchStatus" AS ENUM ('PENDING', 'RECEIVED', 'CORRECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."ExternalTransferStatus" AS ENUM ('OUT', 'RETURNED', 'CORRECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('LOGIN', 'CREATE_EXPEDIENTE', 'DISPATCH_INTERNAL', 'RECEIVE_INTERNAL', 'DISPATCH_EXTERNAL', 'RETURN_EXTERNAL', 'ARCHIVE_EXPEDIENTE', 'CORRECT_MOVEMENT');

-- CreateTable
CREATE TABLE "public"."InternalNode" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "planta" TEXT,
    "edificio" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExternalNode" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "edificioDependencia" TEXT,
    "direccionOpcional" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "internalNodeId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentType" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expediente" (
    "id" TEXT NOT NULL,
    "numeroExpediente" TEXT NOT NULL,
    "descripcionCorta" TEXT,
    "custodyStatus" "public"."CustodyStatus" NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "currentInternalNodeId" TEXT,
    "currentExternalNodeId" TEXT,
    "lastInternalNodeId" TEXT,
    "qrCodeValue" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InternalDispatch" (
    "id" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "fromInternalNodeId" TEXT NOT NULL,
    "toInternalNodeId" TEXT NOT NULL,
    "dispatchedByUserId" TEXT NOT NULL,
    "dispatchedAt" TIMESTAMP(3) NOT NULL,
    "dispatchNote" TEXT,
    "status" "public"."InternalDispatchStatus" NOT NULL DEFAULT 'PENDING',
    "receivedByUserId" TEXT,
    "receivedAt" TIMESTAMP(3),
    "receiveNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExternalTransfer" (
    "id" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "fromInternalNodeId" TEXT NOT NULL,
    "toExternalNodeId" TEXT NOT NULL,
    "dispatchedByUserId" TEXT NOT NULL,
    "dispatchedAt" TIMESTAMP(3) NOT NULL,
    "dispatchNote" TEXT,
    "status" "public"."ExternalTransferStatus" NOT NULL DEFAULT 'OUT',
    "returnedToInternalNodeId" TEXT,
    "returnedByUserId" TEXT,
    "returnedAt" TIMESTAMP(3),
    "returnNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InternalRoute" (
    "id" TEXT NOT NULL,
    "fromInternalNodeId" TEXT NOT NULL,
    "toInternalNodeId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "expedienteId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternalNode_nombre_key" ON "public"."InternalNode"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalNode_nombre_key" ON "public"."ExternalNode"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_nombre_key" ON "public"."DocumentType"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Expediente_numeroExpediente_key" ON "public"."Expediente"("numeroExpediente");

-- CreateIndex
CREATE UNIQUE INDEX "Expediente_qrCodeValue_key" ON "public"."Expediente"("qrCodeValue");

-- CreateIndex
CREATE INDEX "Expediente_custodyStatus_idx" ON "public"."Expediente"("custodyStatus");

-- CreateIndex
CREATE INDEX "Expediente_currentInternalNodeId_idx" ON "public"."Expediente"("currentInternalNodeId");

-- CreateIndex
CREATE INDEX "Expediente_currentExternalNodeId_idx" ON "public"."Expediente"("currentExternalNodeId");

-- CreateIndex
CREATE INDEX "InternalDispatch_expedienteId_status_idx" ON "public"."InternalDispatch"("expedienteId", "status");

-- CreateIndex
CREATE INDEX "ExternalTransfer_expedienteId_status_idx" ON "public"."ExternalTransfer"("expedienteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InternalRoute_fromInternalNodeId_toInternalNodeId_key" ON "public"."InternalRoute"("fromInternalNodeId", "toInternalNodeId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "public"."AuditLog"("occurredAt");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_internalNodeId_fkey" FOREIGN KEY ("internalNodeId") REFERENCES "public"."InternalNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expediente" ADD CONSTRAINT "Expediente_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "public"."DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expediente" ADD CONSTRAINT "Expediente_currentInternalNodeId_fkey" FOREIGN KEY ("currentInternalNodeId") REFERENCES "public"."InternalNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expediente" ADD CONSTRAINT "Expediente_currentExternalNodeId_fkey" FOREIGN KEY ("currentExternalNodeId") REFERENCES "public"."ExternalNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expediente" ADD CONSTRAINT "Expediente_lastInternalNodeId_fkey" FOREIGN KEY ("lastInternalNodeId") REFERENCES "public"."InternalNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InternalDispatch" ADD CONSTRAINT "InternalDispatch_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "public"."Expediente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InternalDispatch" ADD CONSTRAINT "InternalDispatch_fromInternalNodeId_fkey" FOREIGN KEY ("fromInternalNodeId") REFERENCES "public"."InternalNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InternalDispatch" ADD CONSTRAINT "InternalDispatch_toInternalNodeId_fkey" FOREIGN KEY ("toInternalNodeId") REFERENCES "public"."InternalNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InternalDispatch" ADD CONSTRAINT "InternalDispatch_dispatchedByUserId_fkey" FOREIGN KEY ("dispatchedByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InternalDispatch" ADD CONSTRAINT "InternalDispatch_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExternalTransfer" ADD CONSTRAINT "ExternalTransfer_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "public"."Expediente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExternalTransfer" ADD CONSTRAINT "ExternalTransfer_fromInternalNodeId_fkey" FOREIGN KEY ("fromInternalNodeId") REFERENCES "public"."InternalNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExternalTransfer" ADD CONSTRAINT "ExternalTransfer_toExternalNodeId_fkey" FOREIGN KEY ("toExternalNodeId") REFERENCES "public"."ExternalNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExternalTransfer" ADD CONSTRAINT "ExternalTransfer_dispatchedByUserId_fkey" FOREIGN KEY ("dispatchedByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExternalTransfer" ADD CONSTRAINT "ExternalTransfer_returnedToInternalNodeId_fkey" FOREIGN KEY ("returnedToInternalNodeId") REFERENCES "public"."InternalNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExternalTransfer" ADD CONSTRAINT "ExternalTransfer_returnedByUserId_fkey" FOREIGN KEY ("returnedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InternalRoute" ADD CONSTRAINT "InternalRoute_fromInternalNodeId_fkey" FOREIGN KEY ("fromInternalNodeId") REFERENCES "public"."InternalNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InternalRoute" ADD CONSTRAINT "InternalRoute_toInternalNodeId_fkey" FOREIGN KEY ("toInternalNodeId") REFERENCES "public"."InternalNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "public"."Expediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
