# Instrucciones de Despliegue (Docker Swarm + Traefik)

Este proyecto está configurado para desplegarse en un cluster de **Docker Swarm** utilizando **Traefik** como Reverse Proxy.

## 1. Requisitos Previos
- Docker Swarm inicializado (`docker swarm init`).
- Red externa `matdevnet` creada (`docker network create --driver overlay matdevnet`).
- Traefik configurado en el cluster escuchando en los entrypoints `web` y `websecure`.

## 2. Configuración
1. Copia el archivo `stack.env` y ajusta los valores (dominios, contraseñas, secretos):
   ```bash
   cp stack.env.example stack.env # Si existiera un .example
   ```
2. Asegúrate de que `AUTH_SECRET` sea una cadena aleatoria segura.

## 3. Construcción de la Imagen
Construye la imagen de la aplicación (reemplaza `v1.0.0` por la versión deseada):
```bash
docker build -t trazabilidad_app:v1.0.0 .
```

## 4. Despliegue
Para desplegar el stack completo (Base de Datos + App):
```bash
docker stack deploy -c stack.yml --env-file stack.env trazabilidad
```

## 5. Persistencia
La base de datos utiliza un volumen nombrado `trazabilidad_db_data`. Docker Swarm se encargará de mantener este volumen en el nodo donde corra el servicio `db`. En un entorno multi-nodo, se recomienda usar un driver de volumen compartido (como NFS o GlusterFS) o fijar el servicio `db` a un nodo específico mediante etiquetas.

## 6. Monitoreo y Logs
```bash
docker service logs -f trazabilidad_app
docker service logs -f trazabilidad_db
```
