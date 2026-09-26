# Production Deployment Guide

This guide targets the application in this repository: a Vite/React SPA and FastAPI/Python API. The concrete reference architecture is Vercel for the frontend and AWS ECS Fargate behind an Application Load Balancer for the API, with RDS PostgreSQL and encrypted EFS for uploaded files. A managed ALB is the recommended reverse proxy on ECS; an Nginx alternative is included below.

## 1. Target Architecture

```text
Browser
  ├── https://app.example.com  -> Vercel edge/CDN -> Vite static frontend
  └── https://api.example.com  -> Route 53/Cloudflare -> ALB (ACM TLS)
                                                       -> ECS Fargate tasks (private subnets)
                                                          ├── RDS PostgreSQL (private)
                                                          └── EFS encrypted uploads
```

Keep the API and database private behind security groups. The ALB is the only public entry to the API. Use at least two Availability Zones for ALB, ECS, RDS, and EFS. Deploy through GitHub Actions using AWS OIDC; do not use long-lived AWS access keys.

## 2. Database, Cache, and Persistence

### PostgreSQL

Recommended choices:

- **Amazon RDS for PostgreSQL** for the reference AWS setup. Enable Multi-AZ, automated backups and point-in-time recovery, encryption with KMS, deletion protection, and private-subnet placement.
- **Supabase Postgres** for managed Postgres with a simpler developer experience. Use its pooled connection URL for serverless/high-connection environments; keep credentials in a cloud secret store.
- **PlanetScale** is primarily a MySQL/Vitess option. Choose it only after validating SQLAlchemy model/driver compatibility and migration behavior. AWS RDS MySQL is another conventional MySQL choice.

Use Postgres for production; the repository defaults to SQLite only for local development. Set `DATABASE_URL` in AWS Secrets Manager, not a checked-in `.env`. Example SQLAlchemy URL:

```text
postgresql+psycopg2://app_user:URL_ENCODED_PASSWORD@db-host.example:5432/sih26090?sslmode=require
```

URL-encode reserved characters in credentials. Prefer `sslmode=verify-full` with the current RDS CA bundle where feasible. Restrict database ingress to the ECS task security group on TCP 5432; never open it to `0.0.0.0/0`. Set connection limits with ECS task count in mind. SQLAlchemy currently uses the default pool (5 connections plus up to 10 overflow per process); for higher task counts, lower per-task pool limits or put **RDS Proxy** between ECS and RDS. Do not assume the current application has configurable pool tuning without adding settings/code for it.

### Redis

Reasonable managed choices are **Amazon ElastiCache for Valkey/Redis OSS** in the same VPC, **Upstash Redis** for serverless workloads, or **Redis Cloud** for provider-neutral managed Redis. Require TLS, authentication/ACLs, private networking where available, and a secret-managed URL. Redis is optional for the current product logic: the code does not currently use a Redis cache, and SlowAPI rate limits are in-process memory. Redis will not make those limits shared until a Redis-backed limiter is explicitly configured. Until then, apply rate-based rules at AWS WAF/Cloudflare and keep per-instance limits as defense in depth.

### Uploaded media

The current storage implementation writes to `UPLOAD_DIR`; the `SupabaseStorage` class is still a local-disk fallback and does not upload to Supabase. The included ECS task definition therefore mounts encrypted EFS at `/app/uploads`, uses TLS and an EFS access point, and persists media through task replacements. Back up EFS and permit NFS 2049 only from the ECS task security group. For a higher-scale design, implement and test an S3 adapter with private buckets, SSE-KMS, and short-lived presigned access; do not simply set `STORAGE_BACKEND=supabase` and expect durable remote storage today.

## 3. AWS Backend Provisioning

1. Create a VPC spanning at least two AZs. Put the ALB in public subnets and ECS tasks, RDS, and EFS mount targets in private subnets. Provide NAT or the needed VPC endpoints for ECR, CloudWatch Logs, Secrets Manager, and image pulls.
2. Create RDS PostgreSQL with encryption, Multi-AZ, backups/PITR, deletion protection, and no public access. Create `DATABASE_URL` as a Secrets Manager secret.
3. Create EFS with encryption at rest, mount targets in the ECS AZs, and an access point scoped to `/uploads`. Require transit encryption and IAM authorization. The ECS task role needs `elasticfilesystem:ClientMount` and `elasticfilesystem:ClientWrite` for that file system/access point.
4. Create an ECR repository with image scanning on push and lifecycle retention. Create an ECS Fargate cluster, task execution role, application task role, and service. Use at least two tasks for availability once capacity permits.
5. Create an ALB HTTPS listener (ACM certificate) forwarding to an IP target group on port 8000. Configure its health check as `GET /healthz`. Allow ECS ingress on 8000 only from the ALB security group. Allow EFS NFS only from ECS. Allow RDS 5432 only from ECS.
6. Create a CloudWatch log group `/ecs/sih26090-backend`, retention policy, and alarms for unhealthy targets, task restarts, 5xx rates, CPU/memory, and database connections/storage.
7. Set the ECS service deployment circuit breaker with rollback and a deployment minimum healthy percentage that preserves capacity during rollout.
8. Register the GitHub OIDC provider in AWS and create a narrowly scoped role trust policy limited to this repository and `main`. Permit only ECR push, task-definition registration, and update of the named ECS service/cluster. The ECS execution role (not GitHub) needs image/log/Secrets Manager permissions; the task role needs only application permissions such as EFS access.

Build and run the image locally before registering it:

```powershell
docker build -t sih26090-backend -f backend/Dockerfile backend
docker run --rm -p 8000:8000 `
  -e DATABASE_URL="postgresql+psycopg2://..." `
  -e JWT_SECRET="use-a-long-random-secret" `
  -e CORS_ORIGINS='["https://app.example.com"]' `
  sih26090-backend
```

The image runs as a non-root user and has a container health check. `backend/.dockerignore` excludes local secrets, databases, virtual environments, test files, and uploads.

### Optional Nginx reverse proxy

On a VM-based deployment, terminate TLS at a load balancer or Nginx and proxy to the private Uvicorn listener. Do not expose Uvicorn directly. Example site block (certificate paths and host must be replaced):

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;
    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    client_max_body_size 26m;

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

For ECS, prefer the managed ALB in the architecture above instead of adding an Nginx sidecar without a concrete need.

## 4. Frontend, Domains, and TLS

1. Import `frontend/` as the Vercel project root. Framework preset: Vite. Build command: `npm run build`; output directory: `dist`; install command: `npm ci`.
2. In Vercel project environment variables, set `VITE_API_BASE_URL=https://api.example.com/api` for Production. The frontend uses same-origin `/api` when unset, which is useful with Vite's local proxy but wrong when frontend and API are hosted separately. API-returned relative upload paths are resolved against this API origin as well.
3. Add `app.example.com` in Vercel Domains and follow the exact DNS records Vercel shows. Commonly the subdomain is a CNAME to Vercel's assigned target; for an apex domain use the current A/ALIAS value shown in its dashboard rather than copying a stale IP.
4. Point `api.example.com` to the ALB DNS name with a Route 53 ALIAS/CNAME as appropriate, or use a CNAME in another DNS provider. Attach an ACM certificate for `api.example.com` to the ALB 443 listener and redirect port 80 to HTTPS.
5. In Cloudflare, initially use DNS-only while validating ACM and ALB routing. Turn on proxying only after origin TLS, client IP forwarding, body-size limits, and WebSocket/API behavior have been checked. Use SSL/TLS mode **Full (strict)**; never use Flexible for an HTTPS origin.
6. Set GitHub variable `CORS_ORIGINS_JSON` to a JSON array containing exact browser origins, e.g. `["https://app.example.com"]`. Origins have no path or trailing slash. Do not use `*` with credentials. `frontend/vercel.json` includes baseline security headers; replace `api.example.com` in its CSP if the API hostname differs. Only enable HSTS `includeSubDomains` when every subdomain is HTTPS-capable.

## 5. HTTP Security

The Vercel configuration sets CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`. Review the policy against any new external image, audio, analytics, or model hosts; add only required sources. Test the policy in report-only mode before tightening it on an established production domain.

The API uses FastAPI CORS middleware with `CORS_ORIGINS`; restrict it to production browser origins. Keep credentialed CORS origins explicit. Enforce TLS at the ALB, cap upload sizes at both edge/proxy and application layers, keep JWT secrets in Secrets Manager, rotate them with a planned token invalidation window, and never log authorization headers, uploaded media, passwords, or database URLs. Use WAF managed rules and rate-based rules on the public API. Current SlowAPI limits are per-process memory, not a distributed quota.

## 6. GitHub Actions Configuration

`.github/workflows/deploy.yml` runs backend tests and a frontend production build for pull requests and pushes to `main`. Only pushes to `main` deploy. The backend image is tagged with the immutable commit SHA, published to ECR, rendered into a new ECS task definition, and deployed with service-stability wait. The frontend is deployed with Vercel CLI.

Configure these repository **Variables**:

| Variable | Example / purpose |
|---|---|
| `AWS_REGION` | `us-east-1` |
| `ECR_REPOSITORY_URI` | `123456789012.dkr.ecr.us-east-1.amazonaws.com/sih26090-backend` |
| `ECS_CLUSTER` | ECS cluster name |
| `ECS_SERVICE` | ECS service name |
| `ECS_TASK_EXECUTION_ROLE_ARN` | ECS execution role ARN |
| `ECS_TASK_ROLE_ARN` | app role ARN with scoped EFS access |
| `DATABASE_URL_SECRET_ARN` | Secrets Manager ARN for `DATABASE_URL` |
| `JWT_SECRET_ARN` | Secrets Manager ARN for `JWT_SECRET` |
| `EFS_FILE_SYSTEM_ID` | EFS filesystem ID |
| `EFS_ACCESS_POINT_ID` | EFS access point ID |
| `CORS_ORIGINS_JSON` | `["https://app.example.com"]` |
| `VITE_API_BASE_URL` | `https://api.example.com/api` |

Configure these repository **Secrets**:

| Secret | Purpose |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | GitHub OIDC role ARN; no static AWS keys |
| `VERCEL_TOKEN` | scoped Vercel CI token |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

Set a GitHub production Environment with required reviewers if deployments need approval. Protect `main` with required CI checks. Restrict the Vercel token to the target team/project and rotate it.

## 7. Monitoring and Health

`GET /healthz` is the lightweight liveness endpoint used by the Docker and ECS health checks. The existing `/health` path remains as a compatibility alias. Use ALB/ECS health for restart decisions; add a separate readiness endpoint that checks database connectivity before using it to gate traffic. Avoid making liveness depend on a transient downstream outage.

ECS sends container stdout/stderr to CloudWatch Logs through the task definition. Uvicorn access/error output is enabled by default. Set a retention period, alarms, and dashboards; add request IDs and structured application logs before relying on logs for incident forensics. Never log secrets or PII. Use CloudWatch alarms and an on-call notification channel for error rate, latency, unhealthy targets, task count, memory/CPU, and RDS saturation.

### Sentry

Create separate Sentry projects for React and FastAPI, then store `SENTRY_DSN` as a backend secret and `VITE_SENTRY_DSN` as a Vercel Production variable. Add the official SDKs:

```bash
# frontend/
npm install @sentry/react

# backend virtual environment / production requirements
pip install "sentry-sdk[fastapi]"
```

Initialize the frontend once near the entry point (`main.tsx`):

```ts
import * as Sentry from '@sentry/react';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({ dsn: sentryDsn, environment: import.meta.env.MODE, tracesSampleRate: 0.1 });
}
```

Initialize FastAPI before serving requests (for example, in `app/main.py`):

```python
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

if dsn := os.getenv("SENTRY_DSN"):
    sentry_sdk.init(dsn=dsn, integrations=[FastApiIntegration()], traces_sample_rate=0.1)
```

Tune sampling and data scrubbing to your privacy policy. Do not send uploaded content, auth tokens, or artisan contact details as event payloads. Add `VITE_SENTRY_DSN` typing to `frontend/src/vite-env.d.ts` if enabling the frontend snippet.

## 8. Go-Live Gates for This Repository

Complete these before production data is accepted:

1. Add Alembic migrations and remove `Base.metadata.create_all()` from application import/startup. That current call silently creates/updates tables at process boot and is not a safe production migration strategy. Run migrations as a controlled release step with backward-compatible expand/contract changes.
2. Provision production Secrets Manager values for `DATABASE_URL` and a cryptographically random `JWT_SECRET`; the settings module currently has development defaults, so deployment must always inject real secret values.
3. Confirm EFS permissions, backups, and restore procedure. The included task definition expects EFS; the GitHub variables for file system and access point are mandatory.
4. Replace example hostnames in `frontend/vercel.json`, DNS, and the app CORS variable. Confirm Vercel's effective frontend build variable and the API's exact CORS origin.
5. Test sign-up/login, image/audio upload, asynchronous processing, product detail, and restart/redeployment persistence in a staging environment. The AI providers in this repository are deterministic mocks; production model integration requires separate provider implementation and secrets.
6. Configure a Redis-backed limiter or edge/WAF rate rules. The existing default SlowAPI limiter is local to each worker and ECS replica.
7. Verify backups and recovery: RDS point-in-time restore, EFS backup restore, ECS previous task-definition rollback, and Vercel deployment rollback.

## 9. Release Sequence

1. Merge into `main` only after the `verify` job passes.
2. GitHub deploys the backend image and waits for ECS service stability, while the frontend deploy job publishes the Vercel production build.
3. Check the GitHub deployment job results, ECS service events, ALB target health, CloudWatch logs, Vercel deployment, and Sentry for errors.
4. Smoke-test `https://api.example.com/healthz`, frontend login, authenticated API requests, uploads, and database writes. Roll back the ECS task definition and/or promote the previous Vercel deployment if checks fail.