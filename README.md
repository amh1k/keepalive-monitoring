# 🛡️ Keepalive - Advanced Uptime & SSL Monitoring

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg)](https://www.prisma.io/)

**Keepalive** is a high-performance, self-hosted monitoring solution designed for developers who need reliable uptime tracking and automated SSL certificate management. Built with a modern distributed architecture, it ensures your services are always reachable.

---

## 📸 Overview & UI

```carousel
## 📸 Overview & UI

<table>
  <tr>
    <td><img src="./docs/images/dashboard.png" alt="Dashboard" width="100%"/></td>
    <td><img src="./docs/images/monitors.png" alt="Monitors" width="100%"/></td>

  </tr>
  <tr>
    <td align="center">Dashboard</td>
    <td align="center">SSL Monitoring</td>
  </tr>
</table>
```

---

## ✨ Key Features

- **🚀 Real-time Uptime Monitoring**: Sub-second precision with configurable ping intervals and failure thresholds.
- **🔒 Automated SSL Tracking**: Automatically fetches and validates SSL certificates. Includes proactive alerts for expiring certificates (within 30 days).
- **📉 Latency Anomaly Detection**: Uses statistical analysis (Z-score) to detect and alert on unusual latency spikes even when the service is "UP".
- **🔔 Multi-Channel Notifications**: Get notified instantly via Discord, Slack, Email, or custom Webhooks.
- **📊 Performance Analytics**: Visualizes average latency and response time trends.
- **🔗 Distributed Architecture**: Background workers powered by BullMQ and Redis for high scalability.

---

## 🏗️ Technical Architecture

Keepalive utilizes a modern, event-driven architecture to ensure reliability even under load.

### 🧩 Components:

- **Frontend**: React 19 (Vite), TanStack Query (v5), CSS Modules.
- **API Engine**: Node.js Express server with Zod for robust validation.
- **Persistence**: PostgreSQL managed via Prisma ORM.
- **Queue System**: BullMQ / Redis for processing periodic monitor checks and notification dispatches.

---

## 🛠️ Getting Started

### Prerequisites:

- **Node.js**: v20 or higher
- **Docker**: For running Postgres and Redis
- **npm / yarn**: Package manager

### 1. Clone & Install

```bash
git clone https://github.com/your-username/keepalive.git
cd keepalive
npm install
cd monitoring-frontend && npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/keepalive"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="your_secret_here"
```

### 3. Spin up Infrastructure

```bash
docker-compose up -d
npx prisma migrate dev
```

### 4. Run the Application

Start the backend and workers:

```bash
# In the root directory
npm run dev (or npx tsx src/index.ts)
```

Start the frontend:

```bash
# In monitoring-frontend directory
npm run dev
```

---

## 📖 Usage Guide

1.  **Authentication**: Register a new account or log in.
2.  **Add a Monitor**: Input your service URL, set a check interval (e.g., 60s), and a failure threshold.
3.  **Configure Alerts**: Go to Settings and add a Discord or Slack Webhook to receive instant downtime notifications.
4.  **Analyze Uptime**: View detailed latency and uptime percentages on the Dashboard.

---

## 📂 Project Structure

```text
├── src/
│   ├── workers/      # BullMQ workers for pings & notifications
│   ├── controllers/  # API request handlers
│   ├── services/     # Business logic layer
│   └── lib/          # Database & shared utilities
├── prisma/           # Database schema & migrations
└── monitoring-frontend/
    ├── src/pages/    # Main application views
    ├── src/api/      # Axios client & API definitions
    └── src/context/  # Global Auth state
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
