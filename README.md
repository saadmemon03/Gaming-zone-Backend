# Gaming API

## Project structure

```text
gaming-api/
├── src/                  # API runtime: routes, controllers, models, middleware, DB
├── scripts/
│   └── admin/            # One-off administrative utilities
├── tests/
│   └── integration/      # Tests that call a running API
└── package.json          # Application and utility commands

Frontend/
└── scripts/
    └── maintenance/      # Frontend-only maintenance utilities
```

## Commands

Run the API from `gaming-api/`:

```powershell
npm start
npm run dev
```

Promote an existing account to admin (requires `MONGO_URI` in `.env`):

```powershell
npm run admin:promote -- user@example.com
```

Run integration tests against a dedicated, non-production API and admin account.
Set `API_BASE_URL`, `TEST_ADMIN_EMAIL`, and `TEST_ADMIN_PASSWORD` first; full
instructions are in [tests/README.md](./tests/README.md).

Run the navigation maintenance script from `Frontend/`:

```powershell
npm run maintenance:navigation
```

## Conclusion

The API's production runtime stays under `src/`. Admin utilities are separated
under `scripts/`, integration checks under `tests/`, and frontend maintenance
code remains with the frontend. This keeps one-off tools and tests out of the
application runtime while making their commands and configuration explicit.
