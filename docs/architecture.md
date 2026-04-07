# BudgetMasters — System Architecture

This document describes the high-level architecture of BudgetMasters: how the
frontend, backend, and database fit together, how a typical request flows through
the system, and the rationale behind the key design decisions.

---

## Overview

```
Browser (HTML/CSS/JS + D3.js)
        |
        |  HTTP/REST  (JSON)
        v
Express Server  (Node.js)
        |
        |-- Routes  (/api/auth, /api/expenses, /api/budgets, /api/analytics)
        |-- Middleware  (auth check, error handler, request logger)
        |
        v
Mongoose ODM
        |
        v
MongoDB  (Atlas or local)
```

The application follows a classic **MVC** structure adapted for a REST API backend:

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| View | HTML + CSS + D3.js (static) | Renders data; sends fetch() calls to the API |
| Controller | Express route handlers | Parse requests, call services, return JSON |
| Model | Mongoose schemas | Define data shape, enforce constraints, handle persistence |

---

## Directory Structure

```
budget-masters/
├── src/
│   ├── server.js          # Express app setup: middleware stack, route mounting
│   ├── routes/
│   │   ├── auth.js        # POST /api/register, POST /api/login
│   │   ├── expenses.js    # CRUD for expense documents
│   │   ├── budgets.js     # CRUD for budget documents
│   │   └── analytics.js   # Aggregation endpoints: trends, category breakdown
│   ├── models/
│   │   ├── User.js        # { username, passwordHash, createdAt }
│   │   ├── Expense.js     # { userId, amount, category, date, note }
│   │   └── Budget.js      # { userId, category, limit, month }
│   └── middleware/
│       ├── auth.js        # Session/token check; attaches req.userId
│       └── errorHandler.js
├── public/
│   ├── index.html         # Login / registration page
│   ├── dashboard.html     # Main app shell
│   └── js/
│       ├── auth.js        # Login/register fetch calls
│       ├── expenses.js    # Expense table + add/delete UI
│       ├── budgets.js     # Budget form + progress bars
│       ├── charts.js      # D3.js bar/pie/line chart components
│       └── leaderboard.js # Savings-rate ranking fetch + render
├── package.json
└── seedDatabase.js        # Development seed script
```

---

## Request Lifecycle

A typical authenticated request (e.g. fetching this month's expenses):

```
1. Browser             GET /api/expenses?month=2026-04
2. Express router      matches expenses.js → GET /
3. auth middleware     reads session cookie → looks up userId in session store
4. Route handler       Expense.find({ userId, month }) via Mongoose
5. MongoDB             query execution + index scan on (userId, date)
6. Route handler       res.json(expenses) → 200 OK
7. Browser             D3.js chart re-renders with new data
```

---

## Authentication

BudgetMasters uses **session-based authentication** (no JWT):

- On login, Express creates a server-side session (express-session + MongoDB store).
- A signed session cookie is returned to the browser.
- Every API request passes through `middleware/auth.js`, which validates the
  session and attaches `req.userId`.
- Passwords are hashed with **bcrypt** before storage; plaintext is never persisted.

This keeps the implementation simple for a single-server deployment.  For
horizontal scaling, replace the in-process session store with a shared Redis
instance.

---

## Database Design

MongoDB was chosen for its schema flexibility during early prototyping.  Three
collections are used:

### users
```json
{
  "_id": ObjectId,
  "username": "harsh",
  "passwordHash": "$2b$10$...",
  "createdAt": ISODate
}
```
Index: `{ username: 1 }` (unique)

### expenses
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "amount": 42.50,
  "category": "Food",
  "date": ISODate,
  "note": "Lunch"
}
```
Index: `{ userId: 1, date: -1 }`

### budgets
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "category": "Food",
  "limit": 400,
  "month": "2026-04"
}
```
Index: `{ userId: 1, month: 1, category: 1 }` (unique)

---

## Analytics Pipeline

The `/api/analytics` endpoints use MongoDB aggregation pipelines rather than
loading all documents into Node.js memory:

```js
// Monthly spending per category
Expense.aggregate([
  { $match: { userId, date: { $gte: start, $lt: end } } },
  { $group: { _id: '$category', total: { $sum: '$amount' } } },
  { $sort: { total: -1 } }
])
```

This keeps network transfer small and offloads computation to the database tier.

---

## Frontend Architecture

The frontend is intentionally kept as **vanilla JS + D3.js** (no React/Vue) to
minimise build tooling complexity and keep the project self-contained.

Each page has a corresponding JS module:
- Modules call `fetch()` against the REST API.
- D3.js chart components accept plain data arrays and own their own SVG lifecycle.
- There is no client-side router; navigation between pages is plain HTML links.

---

## Known Limitations & Future Work

| Area | Current State | Improvement |
|------|---------------|-------------|
| Auth | Session cookies | Add OAuth / social login |
| Scaling | Single Node process | Cluster mode or containerise behind a load balancer |
| Testing | Manual | Add Jest unit tests + Supertest integration tests |
| Frontend | Vanilla JS | Migrate to React for richer interactivity |
| Caching | None | Add Redis for frequent analytics queries |
