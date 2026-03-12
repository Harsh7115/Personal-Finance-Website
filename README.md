# BudgetMasters

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=flat&logo=d3.js&logoColor=white)

A full-stack personal finance web app. Users track expenses, manage budgets, visualize spending with interactive D3.js charts, and compete on a savings leaderboard.

## Features

- **Simple Auth** — username-based quick access
- **Budget Management** — create and manage budgets with custom categories
- **Expense Tracking** — log and filter transactions by category/date
- **Visual Analytics** — interactive D3.js charts for spending trends and breakdowns
- **Savings Leaderboard** — compare savings rates with other users
- **Responsive Design** — works on desktop and mobile
- **Help Center** — built-in docs and FAQs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript, D3.js |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Config | dotenv |

## Project Structure

```
Personal-Finance-Website/
└── budget-masters/
    ├── server.js          # Express app entry point
    ├── routes/            # API route handlers
    ├── models/            # Mongoose schemas (User, Budget, Expense)
    ├── public/            # Static frontend (HTML/CSS/JS)
    │   ├── index.html
    │   ├── dashboard.html
    │   └── js/            # D3.js chart logic + fetch calls
    └── .env.example       # Environment variable template
```

## Getting Started

```bash
git clone https://github.com/Harsh7115/Personal-Finance-Website.git
cd Personal-Finance-Website/budget-masters
npm install

# Create your .env file
cp .env.example .env
# Set MONGO_URI and PORT in .env

npm start
# → http://localhost:3000
```

**Requirements:** Node.js 16+, MongoDB (local or Atlas)

<!-- Last reviewed: March 2026 -->
