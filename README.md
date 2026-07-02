# Sistema de Gestión de Barbería — Backend

Backend del Trabajo Final Integrador (Programación y Servicios Web —
UNJu). API REST desarrollada en Node.js + Express, con PostgreSQL 17 vía
Docker y Sequelize como ORM.

## Stack

- Node.js + Express
- PostgreSQL 17 (contenedor Docker)
- Sequelize (ORM)
- JWT + bcryptjs (autenticación) — en desarrollo (Fase 2)
- Angular como frontend (repo separado: `proyfrontendgrupo11`)

## Requisitos previos

- Node.js instalado
- Docker Desktop instalado y corriendo

## Cómo levantar el proyecto (primera vez)

1. Clonar el repo y entrar a la carpeta:
   ```bash
   git clone <url-del-repo>
   cd proybackendgrupo11
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear tu archivo `.env` a partir del ejemplo:
   ```bash
   cp .env.example .env
   ```
   Completar `.env` con tus propias credenciales locales (usuario/contraseña
   de tu Postgres en Docker). **Nunca subir el `.env` real a Git.**

4. Levantar la base de datos con Docker:
   ```bash
   docker compose up -d
   ```
   Esto crea el contenedor `barberia_db` (Postgres 17) en el puerto `5435`
   (mapeado al `5432` interno del contenedor, para no chocar con otras
   instancias de Postgres que puedas tener corriendo en tu máquina).

5. Levantar el servidor:
   ```bash
   npm run dev
   ```
   (usa `nodemon`, se reinicia solo con cada cambio). Alternativa sin
   auto-reload: `npm start`.

6. Verificar que todo funciona:
   ```
   GET http://localhost:3002/api/health
   ```
   Debería devolver:
   ```json
   { "server": "up", "database": "up" }
   ```

## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto donde corre el servidor Express (default `3002`) |
| `NODE_ENV` | `development` / `production` |
| `DB_HOST` | Host de la base (`localhost` en desarrollo) |
| `DB_PORT` | Puerto publicado por Docker (`5435`, no `5432`) |
| `DB_NAME` | Nombre de la base (`barberia_db`) |
| `DB_USER` / `DB_PASSWORD` | Credenciales de tu Postgres local |
| `CORS_ORIGIN` | Origen permitido para el frontend Angular (`http://localhost:4200`) |

Ver `.env.example` para la plantilla completa.

## Estructura del proyecto

```
src/
├── config/        # conexión a la base de datos (Sequelize)
├── controllers/   # lógica de cada endpoint
├── middlewares/    # auth, manejo de errores, validaciones
├── models/         # modelos Sequelize (Usuario, Turno, Servicio, etc.)
├── routes/         # definición de rutas Express
├── services/       # lógica de negocio reutilizable
└── utils/          # helpers varios
```

## Comandos útiles de Docker

```bash
docker compose up -d       # levantar la base
docker compose down        # apagar (sin borrar datos)
docker compose down -v     # apagar Y borrar todos los datos (usar con cuidado)
docker ps                  # ver contenedores corriendo
docker logs barberia_db    # ver logs de Postgres
```

## Estado del proyecto

- [x] **Fase 1** — Setup backend: servidor Express + conexión Sequelize/PostgreSQL vía Docker
- [x] **Fase 2** — Autenticación (Usuario, JWT, roles, auditoría de login)
- [ ] **Fase 3** — CRUDs de negocio (Turnos, Servicios, Barberos, Disponibilidad)
- [ ] **Fase 4** — Integraciones externas (MercadoPago, etc.) y extras

## Autenticación (Fase 2)

Variables de entorno adicionales necesarias en tu `.env`:
```
JWT_SECRET=<clave larga y aleatoria>
SEED_SECRET=<otra clave distinta, solo para vos>
```
Para generar una clave aleatoria rápido:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Crear el primer Administrador
El registro público (`POST /api/auth/register`) solo permite crear usuarios
`CLIENTE`. Para crear el primer Admin del sistema, usá el endpoint semilla
**una sola vez** (se autodeshabilita después):
```
POST /api/auth/seed-admin
Headers: x-seed-secret: <tu SEED_SECRET>
Body: { "nombre", "apellido", "email", "password", "celular" }
```
Una vez creado el Admin, usá el login normal (`POST /api/auth/login`) y con
ese token podés crear Barberos/Recepcionistas/otros Admins vía
`POST /api/auth/usuarios` (protegida, requiere rol ADMINISTRADOR).

### Rutas disponibles
| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | No | Registro público (rol CLIENTE fijo) |
| POST | `/api/auth/login` | No | Login, devuelve JWT |
| POST | `/api/auth/seed-admin` | Clave secreta | Crear el primer Admin (una vez) |
| GET | `/api/auth/perfil` | Sí (cualquier rol) | Datos del usuario logueado |
| POST | `/api/auth/usuarios` | Sí (solo ADMINISTRADOR) | Crear usuario con rol específico |

## Documentación de diseño

Las specs de cada feature (qué se construye, decisiones técnicas y tareas de
implementación) están en `/docs/changes/` — ver `001-setup-backend/` para el
detalle completo de esta fase.