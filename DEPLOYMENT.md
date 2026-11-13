# KalaSathi Deployment

The API is a Java 17 / Spring Boot service backed by PostgreSQL and Redis. Render hosts the API and data services; Vercel hosts the React/Vite frontend.

## Local development

Requirements: Docker with Compose, Java 17, Maven, and Node.js 22.

Set `DB_PASSWORD` and a random `JWT_SECRET` in the current PowerShell session, then start the services:

```powershell
docker compose up --build
```

Check the containers with `docker compose ps`. The API listens on port 8080; verify `http://localhost:8080/api/health`. PostgreSQL and Redis ports are bound to loopback. Compose persists PostgreSQL data in `postgres_data`.

For frontend development, set `VITE_API_URL` to the local API URL ending in `/api`, then run `npm ci --prefix frontend` and `npm run dev --prefix frontend`. The Vite development server uses port 5173 by default.

## Render API, PostgreSQL, and Redis

1. Create a PostgreSQL 17 service and a Redis 7 Key Value service on Render. Keep their internal endpoints private.
2. Create a Render Web Service from this repository with Docker as the runtime and `server/Dockerfile` as the Dockerfile path. Use the repository root as the build context.
3. Configure the service's environment variables in Render. Set `DATABASE_URL` to the PostgreSQL JDBC URL and set `DB_USERNAME` and `DB_PASSWORD` from the database service. Set `REDIS_HOST` and `REDIS_PORT` from the Redis service.
4. Set `JWT_SECRET` to a high-entropy secret and `CORS_ORIGIN` to the exact Vercel site origin. The application honors Render's `PORT` environment variable and otherwise defaults to 8080.
5. Configure `CACHE_TTL_MINUTES`, `JWT_EXPIRY_MINUTES`, `AUTH_RATE_LIMIT_MAX_REQUESTS`, and `AUTH_RATE_LIMIT_WINDOW_MINUTES` as needed. Set payment, Razorpay, AWS region, and S3 bucket variables only when enabling those integrations.
6. Configure the Render health check path as `/actuator/health`. The existing `/api/health` endpoint remains available. Only the Actuator health endpoint is exposed.

The application uses the AWS SDK default credential provider chain for S3 credentials. No application-specific access-key variables are required; use an appropriate runtime identity or credential provider supported by the SDK. Keep the bucket private.

## Vercel frontend

Import the repository as a Vercel project and set the root directory to `frontend`. Configure `VITE_API_URL` to the HTTPS API URL ending in `/api`; set the same site origin in the Render `CORS_ORIGIN` variable. The production frontend requires an HTTPS API URL.

## Environment variable names

Configure values in the Render dashboard or the current local shell; Spring does not load `.env` files automatically.

```text
SERVER_PORT
DATABASE_URL
DB_USERNAME
DB_PASSWORD
REDIS_HOST
REDIS_PORT
JWT_SECRET
JWT_EXPIRY_MINUTES
CORS_ORIGIN
CACHE_TTL_MINUTES
AUTH_RATE_LIMIT_MAX_REQUESTS
AUTH_RATE_LIMIT_WINDOW_MINUTES
PAYMENT_MODE
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
AWS_REGION
S3_BUCKET
S3_ENDPOINT_URL
```

Never put backend credentials in Vite environment variables. `VITE_API_URL` is a public frontend setting and must contain only the API URL.

## Verification

Run backend tests with `mvn -f server/pom.xml test`, frontend tests with `npm run test:ui --prefix frontend`, and the frontend production build with `npm run build --prefix frontend`. Test S3 and payment integrations only with isolated test resources and credentials.
