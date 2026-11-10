# KalaSathi

AI Business Manager & Living Heritage Marketplace for Artisans.

## Architecture & Repository Layout

This repository contains:
1. **Frontend (`frontend/`)**: React 18, Vite, Tailwind CSS, Lucide icons, multi-language context (Hindi/English).
2. **Unified Node.js / Express Server (`server/`)**: Express, TypeScript, Zod validation, JWT authentication, and commercial endpoints (Marketplace, Orders, B2B RFQs, Analytics, Admin). This is the default runtime used by the root `Dockerfile` and `docker-compose.yml`.
3. **Python FastAPI Backend (`backend/`)**: FastAPI, SQLAlchemy, Pydantic, and modular image/audio processing pipelines with unit tests.

```text
.
├── .github/workflows/       # CI verification & optional cloud deployment workflows
├── server/                  # Production-ready Node.js / Express TypeScript API
│   ├── src/
│   │   ├── config/          # Environment schema (Zod)
│   │   ├── db/              # In-memory and SQL-ready store & seed data
│   │   ├── middleware/      # JWT auth & RBAC guards
│   │   └── routes/          # /api/auth, /api/products, /api/orders, /api/opportunities, /api/admin
├── frontend/                # Vite/React application
│   ├── src/                 # Pages (Marketplace, Studio, Orders, Analytics, Admin), components, context
│   └── package.json
├── backend/                 # FastAPI Python backend
│   ├── app/                 # Services, AI mocks, routes, and models
│   └── tests/               # Pytest test suite
├── Dockerfile               # Production multi-stage Docker build
├── docker-compose.yml       # Containerized fullstack setup
├── package.json             # Root orchestration scripts
└── DEPLOYMENT.md            # Cloud deployment guide
```

Keep frontend-only images/fonts in `frontend/public/`. Put genuinely reusable source code in a future `packages/` directory only when both apps consume it; do not share runtime code between browser and Python packages by copying files. Uploads, databases, credentials, build output, and virtual environments are local/runtime data and must not be committed.

## Safe File Moves

The current repository already has the frontend and backend in their conventional directories, so no move is needed. If files are found at the repository root later, move tracked files with Git so the rename is recorded:

```bash
git mv app backend/app
git mv tests backend/tests
git mv src frontend/src
git status --short
git diff --cached --summary
```

Only run the commands for paths that actually exist; do not move the current `backend/app` or `frontend/src` again. Git records a rename by content similarity, so history remains discoverable with `git log --follow -- path/to/file` after commit. For untracked files, use `mkdir -p` plus `mv`, then `git add` the destination.

## Environment Files

Each application owns its own environment:

- Copy `backend/.env.example` to `backend/.env` for FastAPI settings.
- Copy `frontend/.env.example` to `frontend/.env.local` for Vite settings. Only `VITE_`-prefixed values are exposed to browser code; never put secrets in frontend env files.
- Keep actual `.env` files untracked. Commit only the sanitized templates. Production values belong in the hosting provider's secret/environment manager.

The local frontend uses `/api`; Vite proxies `/api` and `/static` to `http://localhost:8000`. For independently hosted production services, set `VITE_API_BASE_URL` to the API origin plus `/api`, such as `https://api.example.com/api`.

## Local Development

Prerequisites: Node.js 20+, npm, and Python 3.11+.

Install the root process runner, then install app dependencies. The setup script creates and uses `backend/.venv` automatically. From PowerShell:

```powershell
npm install
npm run setup
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
npm run dev
```

From Bash:

```bash
npm install
npm run setup
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm run dev
```

The root `dev` script starts FastAPI on port 8000 and Vite on port 3000; stopping either process stops both. The API docs are at `http://localhost:8000/docs`.

Root commands:

| Command | Action |
|---|---|
| `npm run setup` | Install frontend dependencies and backend requirements into the active Python environment |
| `npm run dev` | Start both development servers |
| `npm run dev:frontend` | Start only Vite |
| `npm run dev:backend` | Start only FastAPI |
| `npm run build` | Build the frontend and byte-compile backend Python modules |
| `npm test` | Run backend pytest and the frontend TypeScript check |

The root runner always invokes `backend/.venv`, so no shell activation is needed after setup. The frontend currently has no unit-test framework; its test command performs a TypeScript check. Vite dependencies are locked in `frontend/package-lock.json`; the root `package-lock.json` locks the orchestration tooling.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for container builds, CI/CD, hosting, DNS/TLS, database and upload persistence, observability, and production security requirements.
