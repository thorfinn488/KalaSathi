# KalaSathi

AI Business Manager for Artisans. This repository is a small monorepo containing a Vite/React frontend and a FastAPI backend.

## Repository Layout

```text
.
├── .github/workflows/       # CI and deployment workflows
├── backend/                 # FastAPI application, tests, scripts, and Python dependencies
│   ├── app/                 # API, services, models, repositories, storage
│   ├── tests/
│   ├── .env.example         # Backend-only settings template
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # Vite/React application and Node dependencies
│   ├── public/              # Frontend static assets
│   ├── src/
│   ├── .env.example         # Frontend-only Vite settings template
│   └── package.json
├── infra/                   # Deployment definitions, including ECS task definition
├── DEPLOYMENT.md            # Production deployment and operations guide
├── package.json             # Root development orchestration scripts
└── .gitignore               # Shared ignore rules for both applications
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
