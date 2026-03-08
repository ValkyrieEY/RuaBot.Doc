# Installation

[中文](installation_CN.md)

This guide covers what you actually need to install and run XQNEXT, based on the current code and scripts in the repository.

## What you are installing

XQNEXT is primarily a Python FastAPI application with an optional frontend build step:

- Backend: Python application started via `python -m src.main` or `python run.py`
- Frontend source: React 18 + TypeScript + Vite in `/webui`
- Production frontend output: built into `/src/ui/static`

Relevant source files:
- `/src/main.py`
- `/run.py`
- `/webui/package.json`
- `/webui/vite.config.ts`
- `/config.toml`

## Requirements

### Backend requirements

At minimum, you need:

- Python 3.11+ recommended
- `pip`
- Network access to your OneBot endpoint if you use OneBot connectivity

The code contains explicit compatibility handling for Windows + Python 3.13 in `/src/main.py`, so that combination is supported intentionally, not accidentally.

### Frontend requirements

If you want to develop or rebuild the Web UI, you also need:

- Node.js
- npm

You do not need Node.js just to run the backend if built assets already exist in `/src/ui/static`.

## Install backend dependencies

From the repository root:

```bash
pip install -r requirements.txt
```

This installs the Python dependencies used by the FastAPI app, plugin runtime, database layer, and optional AI modules.

## Install frontend dependencies

If you want to run the Vite dev server or build the Web UI:

```bash
cd webui
npm install
```

Useful frontend commands from `/webui`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Recommended first installation flow

For most users:

1. Install Python dependencies
2. Review `/config.toml`
3. Start the backend
4. If the packaged Web UI is missing, build it from `/webui`

That is the boring but reliable path. Reliable is underrated.

## Running without building the frontend

If `/src/ui/static/index.html` and `/src/ui/static/assets/` already exist, the backend can serve the Web UI directly.

If they do not exist and `web_ui.enabled = true`, the backend serves a fallback page explaining that the Web UI has not been built yet. This behavior is implemented in `/src/ui/api.py`.

## Start commands

### Preferred backend commands

```bash
python -m src.main
```

On Windows, there is also:

```bash
python run.py
```

Repository convenience scripts mentioned in project instructions:

```bash
start.bat
./start.sh
```

## Docker note

There is a `/docker` directory and compose-based deployment support, but the source-backed runtime model is still the same application stack.

Project instruction reference commands:

```bash
cd docker && docker-compose up -d
cd docker && docker-compose logs -f xqnext
```

If you are new to the project, start locally first. It is easier to debug one machine than several layers of optimism.

## After installation

Continue with:

- [Configuration](configuration.md)
- [First Run](first-run.md)
- [Web UI](webui.md)
- [FAQ](faq.md)
