# 🐳 SocietyOS Docker Deployment Guide

This guide describes how to run the **SocietyOS** application stack (Database, Cache, Backend, and Frontend) locally or in production using Docker and Docker Compose.

---

## 🚀 Quick Start

To start the entire application stack in a single command:

```bash
docker-compose up --build
```

This command will:
1. Start a **PostgreSQL 15** container on internal port `5432` (mapped to host port `54322`).
2. Start a **Redis** container on port `6379`.
3. Build and launch the **Express Backend** container on port `5000`. It automatically waits for the database, runs database schema synchronization (`prisma db push`), seeds default test accounts, and starts the server.
4. Build and launch the **React + Vite Frontend** container served by **Nginx** on port `3000`. Nginx is pre-configured to reverse-proxy `/api` and `/socket.io` WebSocket connections directly to the backend.

Once started, open your browser and navigate to:
* **Frontend Web Dashboard**: [http://localhost:3000](http://localhost:3000)
* **Backend API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Default Seeded Accounts

The database is pre-seeded with the following test credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@societyos.com` | `Admin@123` |
| **Resident 1** | `resident1@test.com` | `Resident@123` |
| **Resident 2** | `resident2@test.com` | `Resident@123` |
| **Security 1** | `guard1@test.com` | `Guard@123` |
| **Security 2** | `guard2@test.com` | `Guard@123` |

---

## ⚙️ Configuration & Environment Variables

The default configurations in `docker-compose.yml` are ready to go out of the box. However, you can customize them by editing the `environment` section of the `backend` service in `docker-compose.yml` or creating a `.env` file at the root level.

### Backend Configuration
* `DATABASE_URL`: Database connection string. Automatically set to connect to the internal `db` container.
* `REDIS_URL`: Redis connection URL. Automatically set to connect to the internal `redis` container.
* `JWT_SECRET`: Secret key for JWT generation (defaults to `societyos-super-secret-jwt-key-change-in-production`).
* `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`: (Optional) Add these values for file uploads.
* `SMTP_USER` / `SMTP_PASS`: (Optional) Credentials to enable automated login OTP/email notifications.

### Frontend Routing
Vite is built with `VITE_API_URL=/api`. Nginx acts as a reverse proxy, mapping:
* `http://localhost:3000/` ➔ Static React Assets
* `http://localhost:3000/api/*` ➔ `http://backend:5000/api/*`
* `http://localhost:3000/socket.io/*` ➔ `http://backend:5000/socket.io/*` (WebSockets)

This avoids any CORS issues and eliminates the need to expose port 5000 on production servers.

---

## 🛠️ Useful Commands

### Stopping the Stack
```bash
docker-compose down
```

### Stopping the Stack and Removing Saved Volumes (Fresh DB Reset)
```bash
docker-compose down -v
```

### Viewing Logs
```bash
docker-compose logs -f
# Or for a specific service:
docker-compose logs -f backend
```
