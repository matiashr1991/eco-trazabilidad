# Instrucciones de Despliegue (Docker Swarm + Traefik)

Este proyecto está configurado para desplegarse en un cluster de **Docker Swarm** en tu VPS (**72.61.134.65**).

## 1. Requisitos Previos en el VPS
- Docker Swarm inicializado: `docker swarm init` (si no lo está).
- Red externa creada: `docker network create --driver overlay matdevnet`.
- Tener Traefik configurado (si usas la infraestructura estándar de matdev).

## 2. Configuración de Variables
Asegúrate de editar el archivo `stack.env` en el servidor con los datos reales:
- `APP_DOMAIN`: `trazabilidad.[tu-dominio].com` (según tu registro A).
- `APP_URL`: `https://trazabilidad.[tu-dominio].com`
- `NEXT_PUBLIC_APP_URL`: Igual que `APP_URL`
- `DB_PASSWORD`: Una contraseña segura.
- `AUTH_SECRET`: Generar con `openssl rand -base64 32`.

## 3. Despliegue del Stack
Desde la carpeta raíz del proyecto en el VPS:

1. **Construir la imagen localmente**:
   ```bash
   docker build -t trazabilidad_app:latest .
   ```

2. **Lanzar el stack**:
   ```bash
   docker stack deploy -c stack.yml --env-file stack.env trazabilidad
   ```

## 4. Inicialización de la Base de Datos (Muy Importante)
Una vez que los contenedores estén corriendo, debes ejecutar las migraciones y el seed para configurar los roles y permisos:

1. **Obtener el ID del contenedor de la app**:
   ```bash
   docker ps | grep trazabilidad_app
   ```

2. **Ejecutar migraciones y seed**:
   ```bash
   docker exec -it [ID_CONTENEDOR] npx prisma migrate deploy
   docker exec -it [ID_CONTENEDOR] npm run prisma:seed
   ```

## 5. Monitoreo
Si algo no carga, revisa los logs:
```bash
docker service logs -f trazabilidad_app
```
