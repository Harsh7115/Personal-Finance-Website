# BudgetMasters

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=flat&logo=d3.js&logoColor=white)](https://d3js.org)

Full-stack personal finance web app — track expenses, manage budgets, visualize spending with D3.js charts, and compete on a savings leaderboard.

## Features

- **Expense Tracking** — log transactions with category, amount, and date; filter by any dimension
- **Budget Management** — set per-category monthly budgets with live progress indicators
- **D3.js Analytics** — bar charts (spending by category), line charts (spending over time), pie charts (budget allocation)
- **Savings Leaderboard** — rank users by savings rate across the platform
- **Help Center** — built-in FAQ and usage docs

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML · CSS · Vanilla JS · D3.js |
| Backend | Node.js · Express |
| Database | MongoDB · Mongoose |
| Config | dotenv |

## Getting Started

**Requirements:** Node.js 16+, MongoDB (local or [Atlas](https://www.mongodb.com/cloud/atlas))

```bash
git clone https://github.com/Harsh7115/Personal-Finance-Website.git
cd Personal-Finance-Website/budget-masters
npm install
cp .env.example .env
```

### Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string (e.g. `mongodb://localhost:27017/budgetmasters`) |
| `PORT` | Server port (default: `3000`) |
| `SESSION_SECRET` | Random string for session signing |

```bash
npm start
# → http://localhost:3000
```

## API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Log in / register user |
| `GET` | `/api/expenses` | List expenses (supports `?category=` and `?from=&to=` filters) |
| `POST` | `/api/expenses` | Add expense |
| `DELETE` | `/api/expenses/:id` | Delete expense |
| `GET` | `/api/budgets` | Get all budgets for current user |
| `POST` | `/api/budgets` | Create or update budget for a category |
| `GET` | `/api/leaderboard` | Fetch top users by savings rate |

## Data Models

```
User         { username, passwordHash, createdAt }
Budget       { userId, category, monthlyLimit, month }
Expense      { userId, amount, category, description, date }
```

## Project Structure

```
budget-masters/
├── server.js            # Express app — middleware, route mounting
├── routes/
│   ├── auth.js          # Login/register
│   ├── expenses.js      # Expense CRUD
│   ├── budgets.js       # Budget management
│   └── leaderboard.js   # Savings rankings
├── models/
│   ├── User.js          # Mongoose user schema
│   ├── Budget.js        # Budget schema
│   └── Expense.js       # Expense schema
└── public/
    ├── index.html       # Login / landing
    ├── dashboard.html   # Main app view
    └── js/
        ├── charts.js    # D3.js bar, line, and pie charts
        ├── expenses.js  # Expense form + fetch calls
        └── budgets.js   # Budget form + progress bars
```

## Charts

All charts are rendered client-side with D3.js v7, bound to live API data:

- **Bar chart** — monthly spending per category, color-coded by budget status
- **Line chart** — daily spending trend over a rolling 30-day window
- **Pie chart** — budget allocation breakdown across categories
