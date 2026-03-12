import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando migración de Roles dinámicos ---');

  // 1. Crear Roles predeterminados con permisos
  const adminRole = await prisma.role.upsert({
    where: { nombre: 'Administrador' },
    update: {},
    create: {
      nombre: 'Administrador',
      descripcion: 'Acceso total al sistema',
      permissions: [
        'CREATE_EXPEDIENTE',
        'DISPATCH_INTERNAL',
        'RECEIVE_INTERNAL',
        'MANAGE_EXTERNAL',
        'MANAGE_PARAMETRICS',
        'MANAGE_USERS'
      ]
    }
  });

  const operatorRole = await prisma.role.upsert({
    where: { nombre: 'Operador' },
    update: {},
    create: {
      nombre: 'Operador',
      descripcion: 'Operaciones básicas de trazabilidad',
      permissions: [
        'CREATE_EXPEDIENTE',
        'DISPATCH_INTERNAL',
        'RECEIVE_INTERNAL'
      ]
    }
  });

  console.log(`Roles creados: ${adminRole.nombre}, ${operatorRole.nombre}`);

  // 2. Migrar usuarios existentes
  const users = await prisma.user.findMany();
  let migratedCount = 0;

  for (const user of users) {
    let targetRoleId = null;
    
    // Si ya tiene roleId, no hacer nada
    if (user.roleId) continue;

    if (user.legacyRole === 'ADMIN') {
      targetRoleId = adminRole.id;
    } else if (user.legacyRole === 'AREA_MANAGER' || user.legacyRole === 'AREA_OPERATOR') {
      targetRoleId = operatorRole.id;
    }

    if (targetRoleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: targetRoleId }
      });
      migratedCount++;
    }
  }

  console.log(`Migración completada. Usuarios actualizados: ${migratedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
