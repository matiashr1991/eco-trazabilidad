import { randomBytes, scryptSync } from "crypto";
import { PrismaClient, UserRole, CustodyStatus } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(plainText) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plainText, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const internalNodesData = [
    { nombre: "Direccion General Administrativa", planta: "Planta Baja", edificio: "Principal" },
    { nombre: "Patrimonio", planta: "1er Piso", edificio: "Principal" },
    { nombre: "Juridicos", planta: "2do Piso", edificio: "Principal" },
    { nombre: "Privada", planta: "Planta Baja", edificio: "Principal" },
  ];

  const externalNodesData = [
    { nombre: "Contencion del Gasto", descripcion: "Dependencia externa" },
    { nombre: "Organismo de Control", descripcion: "Destino externo alternativo" },
  ];

  const docTypesData = ["Expediente de compras", "Nota", "Anexo", "Orden", "Dictamen", "Remito", "Otro"];

  const createdNodes = {};
  for (const nodeData of internalNodesData) {
    const node = await prisma.internalNode.upsert({
      where: { nombre: nodeData.nombre },
      update: nodeData,
      create: nodeData,
    });
    createdNodes[node.nombre] = node;
  }

  for (const nodeData of externalNodesData) {
    await prisma.externalNode.upsert({
      where: { nombre: nodeData.nombre },
      update: nodeData,
      create: nodeData,
    });
  }

  for (const nombre of docTypesData) {
    await prisma.documentType.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  const usersData = [
    {
      nombre: "Admin Global",
      username: "admin",
      password: "admin123",
      role: UserRole.ADMIN,
      internalNodeId: null,
    },
    {
      nombre: "Responsable DGA",
      username: "dga",
      password: "dga123",
      role: UserRole.AREA_MANAGER,
      internalNodeId: createdNodes["Direccion General Administrativa"].id,
    },
    {
      nombre: "Responsable Patrimonio",
      username: "patrimonio",
      password: "patrimonio123",
      role: UserRole.AREA_MANAGER,
      internalNodeId: createdNodes["Patrimonio"].id,
    },
    {
      nombre: "Consulta Juridicos",
      username: "juridicos-consulta",
      password: "consulta123",
      role: UserRole.AREA_OPERATOR,
      internalNodeId: createdNodes["Juridicos"].id,
    },
  ];

  for (const userData of usersData) {
    await prisma.user.upsert({
      where: { username: userData.username },
      update: {
        nombre: userData.nombre,
        role: userData.role,
        internalNodeId: userData.internalNodeId,
        activo: true,
      },
      create: {
        nombre: userData.nombre,
        username: userData.username,
        passwordHash: hashPassword(userData.password),
        role: userData.role,
        internalNodeId: userData.internalNodeId,
      },
    });
  }

  const routes = [
    ["Direccion General Administrativa", "Patrimonio"],
    ["Patrimonio", "Juridicos"],
    ["Juridicos", "Privada"],
    ["Privada", "Direccion General Administrativa"],
    ["Direccion General Administrativa", "Juridicos"],
  ];

  for (const [fromName, toName] of routes) {
    await prisma.internalRoute.upsert({
      where: {
        fromInternalNodeId_toInternalNodeId: {
          fromInternalNodeId: createdNodes[fromName].id,
          toInternalNodeId: createdNodes[toName].id,
        },
      },
      update: { activo: true },
      create: {
        fromInternalNodeId: createdNodes[fromName].id,
        toInternalNodeId: createdNodes[toName].id,
      },
    });
  }

  const compras = await prisma.documentType.findFirst({ where: { nombre: "Expediente de compras" } });
  if (compras) {
    await prisma.expediente.upsert({
      where: { numeroExpediente: "COMPRA-2026-001" },
      update: {},
      create: {
        numeroExpediente: "COMPRA-2026-001",
        descripcionCorta: "Expediente de prueba inicial",
        documentTypeId: compras.id,
        custodyStatus: CustodyStatus.IN_INTERNAL_NODE,
        currentInternalNodeId: createdNodes["Direccion General Administrativa"].id,
        lastInternalNodeId: createdNodes["Direccion General Administrativa"].id,
        qrCodeValue: "http://localhost:3000/expedientes/demo-compra-2026-001",
      },
    });
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

