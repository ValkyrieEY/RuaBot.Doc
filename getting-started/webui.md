# Web UI

[中文](webui_CN.md)

This page explains how the Web UI is built, served, and developed in the current repository.

## Current frontend stack

The active frontend stack is:

- React 18
- TypeScript
- Vite
- Zustand for state management
- React Router for routing
- i18next for localization

Source references:
- `/webui/package.json`
- `/webui/vite.config.ts`

This matters because some older prose in the repo still talks about Next.js. The code does not agree.

## Source and build locations

Frontend source lives in:

- `/webui`

Production build output goes to:

- `/src/ui/static`

That output directory is configured in `/webui/vite.config.ts` via:

```ts
build: {
  outDir: '../src/ui/static',
  emptyOutDir: true,
}
```

## Development server

The Vite development server runs on port `3000` and proxies `/api` requests to `http://localhost:8000`.

From `/webui/vite.config.ts`:

```ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

Start it with:

```bash
cd webui
npm install
npm run dev
```

## Production serving

In production, FastAPI serves the built static files.

Relevant behavior in `/src/ui/api.py`:

- non-API routes are handled by a catch-all route
- if a static file exists, FastAPI returns it directly
- otherwise, it serves `index.html` for SPA routing
- if `web_ui.enabled = false`, Web UI access returns `403`
- if build output is missing, a fallback HTML page explains what to do

## Login flow

Authentication is handled by backend API endpoints such as:

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`

The backend uses bearer tokens and in-memory sessions via `/src/security/auth.py`.

The Web UI therefore depends on both:

- the frontend build being present
- backend auth endpoints functioning correctly

## Real-time updates

The backend exposes a WebSocket endpoint:

- `/ws/messages`

`/src/ui/api.py` includes a `WebSocketManager` that subscribes to event bus events like:

- `onebot.message`
- `onebot.notice`
- `onebot.request`

and pushes them to connected WebSocket clients.

## Typical Web UI problems

### Problem: the page says WebUI is not built

Check whether these exist:

- `/src/ui/static/index.html`
- `/src/ui/static/assets/`

If not, rebuild from `/webui`:

```bash
npm install
npm run build
```

### Problem: page access returns 403

Check:

```toml
[web_ui]
enabled = true
```

### Problem: frontend source changes do not show up in production

Source changes in `/webui` do not automatically appear in `/src/ui/static`.

You must rebuild:

```bash
cd webui
npm run build
```

## Useful related docs

- [First Run](first-run.md)
- [Frontend Structure](../contributor-guide/frontend-structure.md)
- [Realtime and Logs](../user-guide/realtime-and-logs.md)
