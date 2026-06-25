# Keepalive

Keepalive is a self-hosted uptime monitor for HTTP services. It runs scheduled
checks in background workers, records response times and outages, inspects TLS
certificates, and presents the results in a React dashboard.

![Keepalive dashboard](./docs/images/dashboard.png)

## What it does

- Runs HTTP checks on a configurable schedule
- Marks a monitor as down after a configurable number of consecutive failures
- Opens incidents when a service goes down and resolves them when it recovers
- Records response time, status code, and check history
- Detects unusual latency using a rolling z-score
- Reads certificate validity, issuer, and expiration for HTTPS targets
- Sends down and recovery alerts to Discord webhooks
- Uses access and refresh tokens stored in HTTP-only cookies

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="./docs/images/dashboard.png" alt="Dashboard with uptime statistics and latency history" width="100%">
      <p align="center"><sub>Dashboard</sub></p>
    </td>
    <td width="50%">
      <img src="./docs/images/monitors.png" alt="Monitor list with status and certificate information" width="100%">
      <p align="center"><sub>Monitors</sub></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="./docs/images/settings.png" alt="Notification channel settings" width="100%">
      <p align="center"><sub>Notification settings</sub></p>
    </td>
    <td width="50%">
      <img src="./docs/images/login.png" alt="Keepalive login page" width="100%">
      <p align="center"><sub>Authentication</sub></p>
    </td>
  </tr>
</table>

## Architecture

```text
React client
    |
    | HTTP
    v
Express API --------> PostgreSQL
    |
    | schedules jobs
    v
Redis / BullMQ
    |
    +--> monitor worker ------> target services
    |
    +--> notification worker -> Discord
```

The API and both workers currently start in the same Node.js process. BullMQ
keeps check execution outside the request path and makes it possible to split
the workers into separate processes later.

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, TanStack Query, Recharts |
| API | Express 5, TypeScript, Zod |
| Database | PostgreSQL 15, Prisma |
| Jobs | BullMQ, Redis |
| Authentication | JWT access and refresh tokens |
| Tests | Vitest, Supertest |

## Local setup

### Requirements

- Node.js 20 or newer
- npm
- Docker with Docker Compose

### 1. Clone and install

```bash
git clone https://github.com/amh1k/keepalive-monitoring.git
cd keepalive-monitoring

npm install
npm --prefix monitoring-frontend install
```

### 2. Configure the environment

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5433/keepalive?schema=public"

REDIS_HOST="localhost"
REDIS_PORT=6379

ACCESS_TOKEN_SECRET="replace_with_a_random_secret"
REFRESH_TOKEN_SECRET="replace_with_a_different_random_secret"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

Generate each token secret with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Do not commit `.env`. It is already excluded by `.gitignore`.

### 3. Start PostgreSQL and Redis

```bash
docker compose up -d
```

PostgreSQL is exposed on `localhost:5433` because port `5432` is commonly used
by local PostgreSQL installations. Redis is exposed on `localhost:6379`.
Database files are stored in a named Docker volume.

### 4. Prepare the database

```bash
npx prisma migrate dev
npx prisma generate
```

`prisma migrate dev` applies the migrations in `prisma/migrations` to the local
database. `prisma generate` creates the typed Prisma client used by the API.

### 5. Start the application

Run the backend and frontend in separate terminals.

Backend:

```bash
npx tsx watch src/index.ts
```

Frontend:

```bash
npm --prefix monitoring-frontend run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs on
[http://localhost:3000](http://localhost:3000), and its health endpoint is
[http://localhost:3000/health](http://localhost:3000/health).

There is no seeded account. Create one from the registration page.

## Everyday development

Once dependencies and migrations are installed, the usual startup sequence is:

```bash
docker compose up -d
```

Then start the backend and frontend:

```bash
npx tsx watch src/index.ts
```

```bash
npm --prefix monitoring-frontend run dev
```

When you pull a branch that contains new migrations, run:

```bash
npx prisma migrate dev
npx prisma generate
```

To stop the infrastructure:

```bash
docker compose down
```

This leaves the PostgreSQL volume intact. Use `docker compose down -v` only
when you intentionally want to delete the local database.

## How monitoring works

Creating a monitor adds a repeatable BullMQ job. On each run, the monitor worker:

1. Sends an HTTP request to the configured URL.
2. Records the response status, latency, and error details.
3. Checks the TLS certificate when the URL uses HTTPS.
4. Compares successful response times with the recent latency baseline.
5. Updates the monitor state and consecutive failure count.
6. Opens or resolves an incident when the state changes.
7. Queues a notification for relevant events.

A target is treated as available when it returns a status from `200` through
`399`. Monitor intervals can be set from 30 seconds to one hour in the
dashboard.

### Latency anomaly detection

The anomaly detector uses up to ten recent successful, non-anomalous checks as
its baseline. Once at least three baseline samples exist, it calculates:

```text
z = (current latency - mean latency) / standard deviation
```

A result greater than `3` is stored as an anomaly. Previous anomalies are
excluded from the baseline so a spike does not distort later comparisons.

### TLS certificate checks

HTTPS monitors store:

- Certificate status
- Expiration date
- Issuer
- Time of the latest certificate check

Certificates expiring within 30 days are marked as `EXPIRING_SOON`.

## Project layout

```text
.
├── src/
│   ├── controllers/       HTTP request handlers
│   ├── lib/               Prisma, Redis, HTTP, and TLS clients
│   ├── middleware/        Authentication and validation middleware
│   ├── queues/            BullMQ queue definitions
│   ├── routes/            API routes
│   ├── services/          Monitoring and anomaly logic
│   └── workers/           Monitor and notification processors
├── monitoring-frontend/   React application
├── prisma/
│   ├── migrations/        Database migration history
│   └── schema.prisma      Database schema
├── tests/                 Unit, integration, and end-to-end tests
├── docker-compose.yaml    Local PostgreSQL and Redis services
└── prisma.config.ts       Prisma CLI configuration
```

## Tests

Run the unit test suite:

```bash
npm run test:unit
```

Run integration tests:

```bash
npm run test:integration
```

Run Vitest in watch mode:

```bash
npm test
```

Integration tests use `.env.test` and expect their test database to be
available. Do not point `.env.test` at a database containing data you need.

## Current limitations

- Discord is the only notification transport implemented by the worker.
  Slack, email, and generic webhook options are visible in the interface but
  do not yet deliver messages.
- The API and workers share one process in development.
- Monitor requests currently use `GET`, even though the data model includes a
  method field.
