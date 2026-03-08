# First Run

[中文](first-run_CN.md)

This guide walks through the first realistic startup of XQNEXT.

## Before you start

Make sure you have:

- installed backend dependencies
- reviewed `/config.toml`
- optionally installed frontend dependencies if you need to build the Web UI

If you skipped those, go back to:

- [Installation](installation.md)
- [Configuration](configuration.md)

## Start the application

Recommended command:

```bash
python -m src.main
```

Windows wrapper:

```bash
python run.py
```

Startup begins in `/src/main.py`, which reloads config, sets up logging, creates the FastAPI app, and starts uvicorn.

## What should happen during startup

A healthy startup generally includes:

1. config reload from `config.toml`
2. logger setup
3. FastAPI app creation through `/src/ui/api.py`
4. application lifespan calling `Application.startup()` in `/src/core/app.py`
5. initialization of:
   - event bus
   - storage
   - framework database
   - OneBot adapter
   - plugin runtime
   - optional AI handlers and maintenance tasks

If AI modules are unavailable, startup should continue without AI features.

## What you should see

`/src/main.py` prints a startup banner and shows URLs such as:

- Web UI: `http://host:port/`
- API docs: `http://host:port/docs`

The exact host and port come from config.

## Health check

The simplest check is:

```text
GET /health
```

Expected response, as covered by `/tests/integration/test_api.py`:

```json
{"status": "healthy"}
```

## Log in to the Web UI

Default credentials come from `[web_ui]` in `config.toml` and are used by the auth manager in `/src/security/auth.py`.

Current default values in the checked-in config are:

- username: `admin`
- password: `admin123`

The integration test `/tests/integration/test_api.py` also verifies login with those values.

## Verify core endpoints

After logging in, useful early checks include:

- `/api/auth/me`
- `/api/system/status`
- `/api/system/config`
- `/api/plugins`
- `/api/onebot/status`

These endpoints are defined in `/src/ui/api.py`.

## If the Web UI does not load

Check the following:

1. `web_ui.enabled` is `true` in config
2. `/src/ui/static/index.html` exists
3. `/src/ui/static/assets/` exists

If build output is missing, build the frontend from `/webui`:

```bash
npm install
npm run build
```

## If OneBot does not connect

Check the `[onebot]` section in `/config.toml`, especially:

- `connection_type`
- `http_url`
- `ws_url`
- `access_token`
- reverse WebSocket settings if applicable

The OneBot config is passed into the adapter during `Application.startup()`.

## If plugins do not appear

Remember that plugin state is database-backed.

A plugin directory existing under `/plugins` is not the whole story. Enabled plugin settings are loaded from the framework database through `/src/core/database.py`, then sent to the runtime by `/src/plugins/runtime/connector.py`.

## Next reading

- [Web UI](webui.md)
- [Operations](../user-guide/operations.md)
- [Troubleshooting](../user-guide/troubleshooting.md)
