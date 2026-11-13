# KalaSathi

KalaSathi is an artisan-first business manager and living heritage marketplace for Indian craft clusters.

## Architecture

- `frontend/`: React, TypeScript, Vite, React Router, and TanStack Query.
- `server/`: Java 17 and Spring Boot API, with JPA, Flyway, Spring Security, Redis, and OpenAPI documentation.
- PostgreSQL stores application data; Redis provides caching and rate limiting.
- `Dockerfile` and `server/Dockerfile` build the Spring API. `docker-compose.yml` runs the API, PostgreSQL 17, and Redis 7.

The API is served under `/api`; `GET /api/health` is the application health route. Actuator exposes only `/actuator/health`.

## Run locally

Requirements: Docker with Compose, Java 17, Maven, and Node.js 22.

In PowerShell, set the required local-only values in the current session:

```powershell
$env:DB_PASSWORD = Read-Host "Local Compose database password"
```

Check: `if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) { throw "DB_PASSWORD is missing" } else { "DB_PASSWORD is set" }`

```powershell
$env:JWT_SECRET = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
```

Check: `if ($env:JWT_SECRET.Length -lt 32) { throw "JWT_SECRET is too short" } else { "JWT_SECRET is set" }`

Start the services:

```powershell
docker compose up --build
```

Check: `docker compose ps`

Open `http://localhost:8080/api/health`. PostgreSQL and Redis are available on loopback; PostgreSQL data persists in the `postgres_data` volume.

For frontend development, set `VITE_API_URL` to the local API URL ending in `/api`, then run `npm ci --prefix frontend` followed by `npm run dev --prefix frontend`. Check each command's exit code with `$LASTEXITCODE`; Vite uses port 5173 by default.

## Tests and builds

```powershell
mvn -f server/pom.xml test
```

Check: `$LASTEXITCODE` is `0`.

```powershell
npm run test:ui --prefix frontend
```

Check: `$LASTEXITCODE` is `0`.

```powershell
npm run build --prefix frontend
```

Check: `$LASTEXITCODE` is `0`.

See [DEPLOYMENT.md](DEPLOYMENT.md) for Render and Vercel setup and environment variable names.
