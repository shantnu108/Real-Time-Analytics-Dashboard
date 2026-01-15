# Realtime Analytics

Full-stack real-time analytics app (MongoDB + Node.js API + web client) shipped as a Docker Compose stack. Includes an optional Node-based load generator.

## Tech stack

- **Orchestration:** Docker, Docker Compose
- **Database:** MongoDB 6
- **Backend:** Node.js (server container)
- **Frontend:** Client container (served on port **3000**)
- **Optional:** Node.js load generator (`/loadgen/load.js`)

## Prerequisites

Required:

- **Git** (to clone the repo)
- **Docker Desktop** (Windows/macOS) or **Docker Engine** (Linux)
  - Docker must be running **before** you execute the start scripts.

Optional (only if you want the load generator to run):

- **Node.js 18+** (or any version compatible with your `loadgen` dependencies)

## Quick start (all services)

### 1) Clone

```bash
git clone <YOUR_REPO_URL>
cd realtime-analytics
```

### 2) Start Docker manually

- **Windows/macOS:** Start **Docker Desktop** and wait until it shows **Docker is running**.
- **Linux:** Ensure the Docker daemon is running.

### 3) Start everything (choose your OS)

#### Windows (PowerShell)

Run from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-all.ps1
```

What it does:

- Verifies Docker Desktop + engine readiness
- Runs `docker-compose up --build`
- Starts the optional load generator (if `/loadgen` exists)
- Opens:
  - `http://localhost:4000/health`
  - `http://localhost:3000/`

#### Linux/macOS (Bash)

Run from the repo root:

```bash
chmod +x ./start-all.sh
./start-all.sh
```

What it does:

- Verifies Docker engine readiness (`docker ps`)
- Runs `docker-compose up --build` (background)
- Starts the optional load generator (if `/loadgen` exists)
- Opens:
  - `http://localhost:4000/health`
  - `http://localhost:3000/`

## Services and ports

The Docker Compose stack exposes:

- **Client:** `http://localhost:3000/` (container port 80)
- **Server/API:** `http://localhost:4000/`
- **Health check:** `http://localhost:4000/health`
- **MongoDB:** `localhost:27017`

Ports are driven by `.env`:

- `CLIENT_PORT=3000`
- `SERVER_PORT=4000`
- `MONGO_PORT=27017`

## Startup time expectations

First boot is not instant.

- Wait **100–150 seconds** after running the start script.
- During this warm-up window, the UI/API may be unreachable or partially responsive.
- If you see `Error sending event socket hang up`, treat it as **transient** during startup. Don’t stop the stack unless it persists well past the warm-up window.

## How to verify it’s running

After the warm-up window:

1) Confirm containers are up:

```bash
docker ps
```

You should see **mongo**, **server**, and **client** containers running.

2) Confirm backend health:

- Open: `http://localhost:4000/health`
- Expected: HTTP 200 response (content depends on implementation).

3) Confirm frontend:

- Open: `http://localhost:3000/`
- Expected: Client UI loads.

## Stop / clean up

From the repo root:

```bash
docker-compose down
```

To also remove the MongoDB volume (destructive):

```bash
docker-compose down -v
```

## Common errors and fixes

### Docker is not running

Symptoms:

- Script prints Docker is not running / engine not ready
- `docker ps` fails

Fix:

- Start **Docker Desktop** and wait until it’s fully ready (Windows/macOS).
- Start the Docker daemon on Linux.

### Ports already in use (3000 / 4000 / 27017)

Symptoms:

- Compose fails with "port is already allocated" / bind errors

Fix options:

- Stop the process using the port.
- Or change ports in `.env`:
  - `CLIENT_PORT`
  - `SERVER_PORT`
  - `MONGO_PORT`

Then re-run:

```bash
docker-compose up --build
```

### `docker-compose` not found

Symptoms:

- Script fails with `docker-compose: command not found`

Fix:

- Install Docker Compose (or ensure Docker Desktop includes it).
- If your system uses the Compose v2 plugin (`docker compose`), either:
  - install legacy `docker-compose`, or
  - update the scripts to use `docker compose`.

### “Error sending event socket hang up”

When it happens:

- Most commonly during initial startup while services are still coming up.

What to do:

- Wait **100–150 seconds** after starting.
- Re-check the health endpoint: `http://localhost:4000/health`.
- If it still happens after warm-up, check container logs:

```bash
docker-compose logs -f server
```

### Load generator fails (`node: command not found`)

Cause:

- Load generator runs on your host and requires Node.js.

Fix:

- Install Node.js, or
- Don’t use the load generator (remove/rename `/loadgen` or start services without it).

### Client can’t reach server (CORS / origin issues)

Check `.env`:

- `ALLOWED_ORIGINS=http://localhost:3000`

If you change `CLIENT_PORT`, update `ALLOWED_ORIGINS` accordingly.

## Security notes

- Do **not** commit real secrets.
- `.env` contains values like `JWT_SECRET`. Treat it as sensitive.
- For real deployments:
  - Use strong secrets
  - Use secret management (CI/CD secrets, Docker secrets, vault, etc.)
  - Lock down CORS (`ALLOWED_ORIGINS`)

## Optional: Load generator

Location:

- `loadgen/load.js`

Behavior:

- The start scripts will run it automatically if the `/loadgen` directory exists.
- It runs on your **host machine** (not in Docker), so it needs local Node.js.

Manual run:

```bash
cd loadgen
npm install
node load.js
```
