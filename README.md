# 🛡️ Keepalive — Uptime & SSL Monitoring

<p align="center">
  <img src="./docs/images/dashboard.png" alt="Keepalive Dashboard" width="100%"/>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white" alt="Node.js"/></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-v19-61DAFB?logo=react&logoColor=black" alt="React"/></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white" alt="Prisma"/></a>
  <a href="https://redis.io/"><img src="https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis&logoColor=white" alt="Redis"/></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL"/></a>
</p>

<p align="center">
  <strong>Keepalive</strong> is a high-performance, self-hosted uptime monitoring platform built for developers. It tracks your services in real time, validates SSL certificates, detects latency anomalies using statistical analysis, and fires instant alerts via Discord, Slack, or custom webhooks — all from a clean, dark-themed dashboard.
</p>

---

## 📸 Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="./docs/images/dashboard.png" alt="Dashboard — latency chart, uptime stats, anomaly detection" width="100%"/>
      <p align="center"><sub>Dashboard — real-time stats, latency chart with anomaly markers, uptime bars</sub></p>
    </td>
    <td width="50%">
      <img src="./docs/images/monitors.png" alt="Monitors — SSL status, latency, failure tracking" width="100%"/>
      <p align="center"><sub>Monitors — per-service SSL validity, expiry date, avg latency, fail count</sub></p>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <img src="./docs/images/settings.png" alt="Settings — Discord and Slack webhook configuration" width="50%"/>
      <p align="center"><sub>Settings — configure Discord, Slack, Email, or custom webhook notification channels</sub></p>
    </td>
  </tr>
</table>

---

## ✨ Features

| Feature                            | Description                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| 🚀 **Real-time Uptime Monitoring** | Configurable ping intervals (30s–1h) with failure thresholds before alerting                    |
| 🔒 **SSL Certificate Tracking**    | Automatically validates certs and alerts 30 days before expiry                                  |
| 📉 **Latency Anomaly Detection**   | Z-score statistical analysis flags spikes even when the service is technically "UP"             |
| 🔔 **Multi-Channel Alerts**        | Instant notifications via Discord, Slack, Email, or custom webhooks on down and recovery events |
| 📊 **Performance Analytics**       | 5-minute bucketed latency trends with anomaly markers on the chart                              |
| 🔗 **Distributed Architecture**    | BullMQ + Redis queue system for scalable, non-blocking check processing                         |
| 🛡️ **Incident Tracking**           | Automatic incident creation and resolution with downtime duration                               |
| 🔐 **Secure Auth**                 | JWT access + refresh token rotation with httpOnly cookies                                       |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React Frontend │────▶│  Express API      │────▶│   PostgreSQL    │
│   (Vite + RQ)   │     │  (Node.js)        │     │   (Prisma ORM)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                          │
                                ▼                          │
                        ┌──────────────┐                  │
                        │  BullMQ      │◀─────────────────┘
                        │  Queue       │
                        └──────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
           ┌──────────────┐       ┌──────────────────┐
           │Monitor Worker│       │Notification Worker│
           │(HTTP checks) │       │(Discord/Slack/   │
           │(SSL checks)  │       │ Email/Webhook)   │
           │(Anomaly det.)│       └──────────────────┘
           └──────────────┘
```

### Tech Stack

| Layer      | Technology                                               |
| ---------- | -------------------------------------------------------- |
| Frontend   | React 19, Vite, TanStack Query v5, Recharts, CSS Modules |
| Backend    | Node.js, Express, TypeScript                             |
| Database   | PostgreSQL 15 via Prisma ORM                             |
| Queue      | BullMQ + Redis                                           |
| Auth       | JWT (access + refresh), httpOnly cookies                 |
| Validation | Zod                                                      |

---

## 🛠️ Getting Started

### Prerequisites

- Node.js v20+
- Docker + Docker Compose
- npm

### 1. Clone & Install

```bash
git clone https://github.com/your-username/keepalive.git
cd keepalive

# Install backend dependencies
npm install

# Install frontend dependencies
cd monitoring-frontend && npm install && cd ..
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/keepalive"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# JWT Secrets — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
ACCESS_TOKEN_SECRET="your_access_token_secret_here"
REFRESH_TOKEN_SECRET="your_refresh_token_secret_here"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

# App
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### 3. Start Infrastructure

```bash
docker-compose up -d
```

### 4. Run Migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Start the Application

```bash
# Terminal 1 — Backend API + Workers
npm run dev

# Terminal 2 — Frontend
cd monitoring-frontend && npm run dev
```

Visit `http://localhost:5173` to access the dashboard.

---

## 📖 Usage

### Adding a Monitor

1. Log in or register an account
2. Navigate to **Monitors** → click **+ Add Monitor**
3. Enter a name, URL, check interval, and failure threshold
4. The worker begins pinging your URL immediately

### Configuring Alerts

1. Navigate to **Settings**
2. Select a channel type (Discord, Slack, Email, or Webhook)
3. Paste your webhook URL and click **Add Channel**
4. All active channels receive alerts simultaneously when a monitor goes down or recovers

### Reading the Dashboard

- **Stat cards** — total monitors, up/down counts, notification channels, and anomaly count (last 24h)
- **Latency chart** — 5-minute averaged response times; red dots indicate statistical anomalies (z-score > 3σ)
- **Uptime bars** — per-monitor uptime percentage across all recorded checks
- **Recent Alerts** — last 5 failed checks
- **Latency Anomalies** — last 5 anomalous checks in the past 24 hours

---

## 📂 Project Structure

```
keepalive/
├── src/
│   ├── controllers/        # HTTP request handlers
│   │   ├── user.controller.ts
│   │   ├── monitor.controller.ts
│   │   ├── stats.controller.ts
│   │   └── notification.controller.ts
│   ├── services/           # Business logic
│   │   ├── monitor.service.ts
│   │   └── anomaly.service.ts     # Z-score latency analysis
│   ├── workers/            # BullMQ background processors
│   │   ├── monitor.worker.ts      # HTTP + SSL checks
│   │   └── notification.worker.ts # Alert dispatch
│   ├── queues/             # Queue definitions
│   ├── routes/             # Express route declarations
│   ├── middleware/         # JWT auth middleware
│   └── lib/                # Prisma, Redis, HTTP client, SSL checker
├── prisma/
│   └── schema.prisma       # DB schema
├── monitoring-frontend/
│   └── src/
│       ├── pages/          # Dashboard, Monitors, Settings, Auth
│       ├── components/     # StatCard, LatencyChart, UptimeBar, etc.
│       ├── api/            # Axios client + API definitions
│       └── context/        # Auth context + session management
└── docker-compose.yml
```

---

## 🔬 How Anomaly Detection Works

Keepalive uses **Z-score statistical analysis** to detect latency spikes:

1. For each completed check, the last 20 successful latency readings are retrieved
2. The mean (μ) and standard deviation (σ) are calculated
3. The Z-score of the current reading is computed: `z = (latency - μ) / σ`
4. If `z > 3` (3 standard deviations above normal), the check is flagged as an anomaly
5. An alert is queued and the data point is marked red on the latency chart

This means Keepalive catches degraded performance **before** a service actually goes down.

---

## 🔒 SSL Monitoring

For any `https://` monitor, Keepalive automatically:

- Fetches the SSL certificate on every check
- Records validity status (`VALID`, `INVALID`, `EXPIRING_SOON`)
- Stores the expiration date and issuer
- Fires a warning alert when the cert expires within **30 days**

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.

---

## 🙏 Acknowledgements

- [BullMQ](https://docs.bullmq.io/) — Redis-based queue system
- [Prisma](https://www.prisma.io/) — Next-generation ORM
- [Recharts](https://recharts.org/) — Composable charting library
- [TanStack Query](https://tanstack.com/query) — Powerful data synchronization
