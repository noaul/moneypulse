# MoneyPulse Task Plan

## Goal
Build MoneyPulse, a single-user asset and recurring cost management app for phone cards, VPS, domains, and subscriptions, with authentication, multi-currency cost tracking, email reminders, Docker packaging, and GitHub delivery.

## Scope
- Full-stack app using React + Vite + TypeScript + TailwindCSS.
- Backend using Node.js + Express + TypeScript + SQLite.
- Single user with initial setup, login/logout, password change, and HttpOnly cookie JWT.
- Assets: phones, VPS, domains, subscriptions.
- Expenses: actual payment history linked to assets.
- Currencies: CNY, USD, GBP, EUR.
- Email reminders: daily summary for due/renewal items.
- UI: Geist Minimalist, dark-first, high-density tables, mono data typography.
- Delivery: push to https://github.com/noaul/moneypulse, then run local Docker verification.

## Non-Goals
- Multi-user permissions.
- Automatic exchange rates.
- Payment provider integration.
- WHOIS or cloud provider API sync.
- Two-factor authentication.

## Phases
1. [complete] Project scaffold, planning files, package setup, Git ignore rules.
2. [complete] Backend foundation: Express app, SQLite schema, migrations, shared utilities.
3. [complete] Authentication: setup, login, logout, me, password change.
4. [complete] Asset CRUD: phones, VPS, domains, subscriptions.
5. [complete] Expenses, dashboard summary, expiring item aggregation.
6. [complete] Settings, email testing, reminder scan and reminder logs.
7. [in_progress] Frontend foundation: routing, auth flow, app shell, theme.
8. [pending] Frontend pages: dashboard, asset lists, expenses, settings.
9. [pending] Verification: tests, build, commit, push.
10. [pending] Docker packaging and local Docker verification after push.

## UI Acceptance Criteria
- Dark mode is the default visual target.
- Data values such as IP addresses, dates, money, phone numbers, and due-day counts use monospace typography.
- Tables use compact row spacing and border-based separation.
- Drawer is used for create/edit forms.
- Dashboard uses restrained metric cards and charts without marketing-style hero sections.
- Status colors: active emerald, paused amber, expired rose, cancelled zinc, archived violet.

## Delivery Notes
- Do not commit `.env`, SQLite databases, `data/`, `node_modules/`, `dist/`, or coverage output.
- Do not force-push.
- Run verification before claiming completion.
