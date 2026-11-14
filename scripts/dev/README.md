# KalaSaathi Local Development & Verification Scripts

This directory contains development and integration verification helper scripts for KalaSaathi.

## Scripts Overview

### 1. `start-env.ps1`
Starts isolated Docker containers for PostgreSQL 17 and Redis 7 (or the full Docker Compose stack).
- **Credentials & Security**: Generates ephemeral credentials if `$env:DB_PASSWORD` or `$env:JWT_SECRET` are not set in the shell session. Never hardcodes secrets into source files.
- **Health Checks**: Polls container health checks before returning.
- **Usage**:
  ```powershell
  # Start PostgreSQL and Redis:
  .\scripts\dev\start-env.ps1

  # Start with API container:
  .\scripts\dev\start-env.ps1 -WithApi
  ```

### 2. `stop-env.ps1`
Gracefully stops containers and cleans up all temporary test artifacts, logs (`*.log`), and sample images.
- **Usage**:
  ```powershell
  .\scripts\dev\stop-env.ps1

  # To also remove persistent volumes:
  .\scripts\dev\stop-env.ps1 -RemoveVolumes
  ```

### 3. `run-e2e-verification.ps1`
Phase E integration and end-to-end verification suite testing the complete API workflow:
- **Preflight Check**: Verifies prerequisite ports (5432, 6379, 8080) and compiled application binaries.
- **Step 1 — Authentication**: Registers an artisan account, logs in, and verifies the JWT token and role via `/api/auth/me`.
- **Step 2 — Product Lifecycle**: Creates a draft product, updates catalogue metadata, recalculates fair-trade pricing, and updates the product status to `READY`.
- **Step 3 — Public Catalog**: Validates unauthenticated marketplace listing and product detail retrieval.
- **Step 4 — S3-Unavailable Handling**: Validates image upload with valid magic bytes; ensures HTTP `503 SERVICE_UNAVAILABLE` is returned gracefully when S3 storage is unset. Also verifies MIME type rejection with `400 INVALID_MEDIA`.
- **Step 5 — Sandbox Order Checkout**: Executes checkout (`POST /api/orders`) and verifies the server-calculated total and `KS-*` order ID.
- **Step 6 — Payment Simulation**: Confirms the order via `/api/orders/{id}/payment/sandbox-confirm` and verifies status transitions to `PAID`.
- **Step 7 — Order Tracking**: Validates delivery status tracking via `/api/orders/track/{id}`.
- **Step 8 — Cleanup**: Deletes the created test product and verifies deletion with HTTP `404 NOT_FOUND`.
- **Summary**: Displays a formatted summary table and exits with code `0` only when all steps pass.
- **Usage**:
  ```powershell
  .\scripts\dev\run-e2e-verification.ps1 -BaseUrl "http://localhost:8080"
  ```
