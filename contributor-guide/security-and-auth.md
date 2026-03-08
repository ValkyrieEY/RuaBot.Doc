# Security and Auth

[中文](security-and-auth_CN.md)

This page summarizes the current authentication, authorization, and audit model.

## Authentication model

Main auth implementation:

- `/src/security/auth.py`

Key source-backed characteristics:

- JWT bearer tokens are used for API authentication
- session state is stored in memory
- the default admin user is created at startup from config
- password hashing uses passlib with bcrypt
- there is explicit compatibility handling for Python 3.13 + bcrypt/passlib behavior

## Default admin account

`AuthManager` initializes a default `admin` user using the configured Web UI password from `config.toml`.

This means:

- the default account is not loaded from a database table
- changing config and restarting changes the startup-generated account credentials
- active running sessions remain in memory until logout/restart

## Token creation and verification

Important functions in `/src/security/auth.py`:

- `create_access_token()`
- `verify_token()`
- `verify_password()`
- `get_password_hash()`

JWT expiration uses `access_token_expire_minutes` from config.

## API auth flow

In `/src/ui/api.py`:

- `HTTPBearer` extracts credentials
- `get_current_user()` verifies the token and session
- permission dependencies enforce required capabilities

Common auth endpoints:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/device-login`

## Authorization model

Permission model implementation:

- `/src/security/permissions.py`

It defines:

- `Permission` enum values
- `Role` objects
- `PermissionManager`

Default roles include:

- `admin`
- `plugin_manager`
- `user`
- `readonly`

Admin effectively has full access through `admin:all`.

## Audit logging

Audit support lives in:

- `/src/security/audit.py`

The API layer uses audit logging for denied access and security-relevant operations.

## Device keys

Device key support lives in:

- `/src/security/device_keys.py`

Related API endpoints in `/src/ui/api.py` allow:

- creating keys
- listing keys
- enabling/disabling keys
- deleting keys
- exchanging a device token for a login session

## Important caveats

- Users and sessions are not a fully persistent user-management subsystem in the current code.
- The auth model is practical for an admin-controlled Web UI, but it is not pretending to be a full enterprise identity platform.
- Permission checks are present, but many operational assumptions still center on trusted administrators.

## Related docs

- [API Surface Overview](../reference/api-surface-overview.md)
- [Operations](../user-guide/operations.md)
- [Testing](testing.md)
