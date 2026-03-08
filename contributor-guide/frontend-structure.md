# Frontend Structure

[中文](frontend-structure_CN.md)

This page documents the frontend structure that actually exists in the repository.

## Stack summary

The active frontend uses:

- React 18
- TypeScript
- Vite
- Zustand
- React Router
- i18next

Source references:
- `/webui/package.json`
- `/webui/vite.config.ts`

## Entry points

The main frontend entry points are:

- `/webui/src/main.tsx`
- `/webui/src/App.tsx`

## Common structure called out by project instructions

Important frontend areas include:

- `/webui/src/store/` for Zustand stores
- `/webui/src/utils/api.ts` for API access
- `/webui/src/pages/` for pages/routes
- `/webui/src/i18n/` for localization
- `/webui/src/hooks/useWebSocket.ts` for realtime updates

## Dev server and API integration

From `/webui/vite.config.ts`:

- dev server port: `3000`
- `/api` proxy target: `http://localhost:8000`
- alias `@` -> `./src`

This setup allows the frontend dev server to work against the backend without manual CORS gymnastics.

## Build output and serving

Production build output is written to:

- `/src/ui/static`

FastAPI serves those files through `/src/ui/api.py`.

If the build output is absent, the backend falls back to a helpful HTML page instead of pretending everything is fine.

## Contributor reminder

When working on frontend changes for production behavior:

1. change source in `/webui`
2. rebuild with `npm run build`
3. verify output exists in `/src/ui/static`

Without step 2, production behavior will remain impressively unchanged.

## Related docs

- [Web UI](../getting-started/webui.md)
- [API Surface Overview](../reference/api-surface-overview.md)
- [Testing](testing.md)
