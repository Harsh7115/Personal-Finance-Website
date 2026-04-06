# Deployment Guide

This document explains how to deploy **BudgetMasters** (Personal-Finance-Website) to a
production environment. It covers local development, Docker-based deployment, and a
cloud deployment to a VPS (e.g., DigitalOcean, AWS EC2, Render).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Local Development Setup](#local-development-setup)
4. [Production Build](#production-build)
5. [Docker Deployment](#docker-deployment)
6. [Deploying to a VPS (Ubuntu)](#deploying-to-a-vps-ubuntu)
7. [Deploying to Render](#deploying-to-render)
8. [MongoDB Atlas Setup](#mongodb-atlas-setup)
9. [Reverse Proxy with Nginx](#reverse-proxy-with-nginx)
10. [SSL / HTTPS with Certbot](#ssl--https-with-certbot)
11. [Health Checks & Monitoring](#health-checks--monitoring)

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18 LTS or 20 LTS | Use `nvm` to manage versions |
| npm | 9+ | Comes with Node |
| MongoDB | 6.0+ | Local or Atlas cluster |
| Git | any | For cloning the repo |

---

## Environment Variables

Create a `.env` file in the `budget-masters/` directory (never commit this file):

```dotenv
# Server
PORT=3000
NODE_ENV=production

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/budgetmasters?retryWrites=true&w=majority

# Session / Auth
SESSION_SECRET=change_this_to_a_long_random_string_in_production

# Optional: logging level (debug | info | warn | error)
LOG_LEVEL=info
```

> **Security:** Generate `SESSION_SECRET` with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Local Development Setup

```bash
git clone https://github.com/Harsh7115/Personal-Finance-Website.git
cd Personal-Finance-Website/budget-masters

npm install

# Copy the example env file and fill in your values
cp .env.example .env
# Edit .env with your MongoDB URI and session secret

npm run dev        # starts with nodemon (auto-reload)
# App available at http://localhost:3000
```

---

## Production Build

The app is a server-rendered Node/Express application — there is no separate build step for
the backend. Static assets (CSS, JS, D3 charts) are served directly by Express.

```bash
cd budget-masters
npm install --omit=dev    # install production deps only
NODE_ENV=production node server.js
```

---

## Docker Deployment

### Dockerfile (place in `budget-masters/`)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
```

### docker-compose.yml (repo root)

```yaml
version: "3.9"

services:
  app:
    build: ./budget-masters
    ports:
      - "3000:3000"
    env_file:
      - ./budget-masters/.env
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

```bash
docker compose up -d        # start in background
docker compose logs -f app  # tail logs
docker compose down         # stop
```

---

## Deploying to a VPS (Ubuntu)

### 1. Provision the server

- Minimum: 1 vCPU, 1 GB RAM (t3.micro / s-1vcpu-1gb)
- Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 2. Install Node.js via nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 3. Clone and configure

```bash
git clone https://github.com/Harsh7115/Personal-Finance-Website.git
cd Personal-Finance-Website/budget-masters
npm ci --omit=dev
cp .env.example .env     # then edit .env
```

### 4. Run with PM2 (process manager)

```bash
npm install -g pm2
pm2 start server.js --name budgetmasters --env production
pm2 save
pm2 startup    # follow the printed command to auto-start on reboot
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs budgetmasters
pm2 restart budgetmasters
pm2 stop budgetmasters
```

---

## Deploying to Render

1. Push your code to GitHub (already done).
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect the `Harsh7115/Personal-Finance-Website` repo.
4. Settings:
   - **Root directory:** `budget-masters`
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Environment:** Node
5. Add environment variables in the Render dashboard (same as your `.env`).
6. Click **Deploy**.

Render provides a free managed TLS certificate automatically.

---

## MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user with **readWrite** privileges on the `budgetmasters` database.
3. Whitelist your server's IP (or `0.0.0.0/0` for any IP — less secure).
4. Copy the connection string (SRV format) into `MONGO_URI` in your `.env`.

---

## Reverse Proxy with Nginx

Install Nginx and create a site config:

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/budgetmasters
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/budgetmasters /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## SSL / HTTPS with Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Certbot will automatically update your Nginx config and set up renewal
```

Certbot auto-renews certificates via a systemd timer. Verify with:

```bash
sudo certbot renew --dry-run
```

---

## Health Checks & Monitoring

The app exposes a lightweight health endpoint:

```
GET /health
→ 200 OK  { "status": "ok", "uptime": 12345, "mongo": "connected" }
```

Use this with an uptime monitor (e.g., UptimeRobot, Render's built-in checks) to get
alerted when the service goes down.

For structured logging in production, set `LOG_LEVEL=info` and pipe output to a log
aggregator:

```bash
pm2 logs budgetmasters --lines 100
# or forward to Papertrail / Logtail via pm2 log plugins
```
