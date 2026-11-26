# Expense Manager

A TypeScript and Express web app for recording, editing, and filtering income and expenses. It uses EJS for server-rendered views and MongoDB to store accounts and transactions.

[Deployment on Render](https://webontwikkeling-project-24-25-1.onrender.com)

## Run locally

1. Install the dependencies with `npm ci`.
2. Copy `.env.example` to `.env`.
3. Set `MONGO_URI` to a running MongoDB instance and set `JWT_SECRET` to a long random value. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
4. Run `npm start` and open http://localhost:3000. Use `npm run dev` to restart automatically on changes.

The application uses the `expensesApp` database. Set the same environment variables in Render before deploying.
