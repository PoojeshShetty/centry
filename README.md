# centry

A minimal Sentry-style log capture platform built as a learning project. Supports shipping logs from Node backends and React frontends via an SDK, with a web UI to explore captured logs.

## Packages

| Package | Description |
|---|---|
| `@centry/sdk` | Node SDK — buffers and ships logs over the Sentry envelope wire format |
| `@centry/sdk-react` | Browser/React SDK — auto-instruments errors, fetch, XHR, navigation; exports `ErrorBoundary` and `useLogger` |
| `@centry/backend` | Express API — ingests envelopes, authenticates via DSN/JWT, stores logs in Postgres |
| `@centry/frontend` | React (Vite) — logs explorer UI |
| `@centry/shared` | Shared TypeScript types and envelope parser used across all packages |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) (for Postgres and Redis)

## Setup

**1. Clone and install dependencies**

```bash
git clone https://github.com/your-username/centry.git
cd centry
pnpm install
```

**2. Start infrastructure**

```bash
docker compose up -d
```

This starts Postgres on port `5432` and Redis on port `6379`.

**3. Configure environment**

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=centry

REDIS_URL=redis://localhost:6379

ADMIN_TOKEN=your_secret_admin_token

PORT=3000
```

**4. Build**

```bash
pnpm build
```

## Running in development

**Backend**

```bash
pnpm --filter @centry/backend dev
```

**Frontend**

```bash
pnpm --filter @centry/frontend dev
```

## Using the SDKs

**Node backend**

```ts
import { init } from '@centry/sdk';

init({ dsn: 'your-project-dsn' });
```

**React frontend** — add to `main.tsx`:

```ts
import { init } from '@centry/sdk-react';

init({ dsn: import.meta.env.VITE_CENTRY_DSN });
```

Set `VITE_CENTRY_DSN` in your React app's `.env` to enable log shipping.

## Commands

```bash
pnpm install        # install all workspace deps
pnpm build          # build all packages (tsc --build)
pnpm lint           # eslint across packages
pnpm format         # prettier --write .
```

**Tests run per package:**

```bash
pnpm --filter @centry/backend test
pnpm --filter @centry/frontend test
pnpm --filter @centry/sdk test
pnpm --filter @centry/sdk-react test
```
