# Subsistema de Trazabilidad de Expedientes Fisicos (MVP)

Aplicacion web en Next.js + PostgreSQL para rastrear custodia fisica de expedientes con flujo interno y salidas externas.

## Estado actual

Incluye:
- autenticacion por usuario/contrasena y sesion por cookie segura;
- RBAC basico (`ADMIN`, `AREA_MANAGER`, `AREA_OPERATOR`);
- alta de expediente con QR unico;
- pantalla de escaneo QR con camara (`/scan`);
- modo operativo movil simplificado (`/mobile`) para recibir/despachar;
- despacho interno y recepcion interna;
- salida externa y reingreso;
- archivado (solo admin);
- tablero con metricas operativas y pendientes;
- historial de movimientos y auditoria reciente por expediente.

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Configuracion local

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env` a partir de `.env.example`.

3. Generar cliente Prisma:

```bash
npm run prisma:generate
```

4. Crear tablas:

```bash
npm run prisma:migrate -- --name init
```

5. Cargar datos iniciales:

```bash
npm run prisma:seed
```

6. Levantar aplicacion:

```bash
npm run dev
```

Abrir `http://localhost:3000`.

## Uso desde celular (dev)

1. Levantar el server escuchando red local:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

2. En la PC obtener IP local (ej. `192.168.0.25`) y abrir desde el celu:
   `http://192.168.0.25:3000`
3. El escaneo en `/scan` requiere permisos de camara del navegador. En algunos navegadores moviles puede requerir HTTPS.

## Usuarios de prueba

- `admin` / `admin123`
- `dga` / `dga123`
- `patrimonio` / `patrimonio123`
- `juridicos-consulta` / `consulta123`

## Estructura relevante

- `prisma/schema.prisma`: modelo de datos.
- `prisma/seed.mjs`: seed inicial de nodos, rutas, tipos y usuarios.
- `src/actions/`: acciones de login y movimientos.
- `src/lib/auth.ts`: sesion, permisos y helpers RBAC.
- `src/app/`: dashboard, login, alta y detalle de expediente.

## Pendientes MVP+

- escaneo QR con camara desde navegador;
- correccion administrativa asistida;
- alertas de demora configurables;
- reportes exportables.

