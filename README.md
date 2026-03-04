# ZebraSupport

ZebraSupport is a full-stack B2B AI-powered customer support ticket platform.

Tagline: **"Strip away the chaos. Automate your support."**

## Stack

- Frontend: React (Vite) + Tailwind CSS + Recharts
- Backend: Node.js + Express REST API
- Database: PostgreSQL
- Cache/Queue: Redis + BullMQ worker for async AI auto-replies
- Auth: JWT (access + refresh tokens in httpOnly cookies)
- Containerization: Docker + docker-compose

## Services (docker-compose)

- `frontend` on `http://localhost:3000`
- `backend` on `http://localhost:5000`
- `postgres` on `localhost:5432`
- `redis` on `localhost:6379`

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Tickets

- `GET /api/tickets`
- `GET /api/tickets/:id`
- `POST /api/tickets`
- `PATCH /api/tickets/:id`
- `DELETE /api/tickets/:id`

### Analytics

- `GET /api/analytics/summary`
- `GET /api/analytics/volume`
- `GET /api/analytics/health-score`

## Demo Credentials

- Email: `admin@zebrasupport.io`
- Password: `Password123!`

## Seed Data

The DB init script seeds:

- 1 demo admin user
- 20+ realistic tickets
- mixed statuses: `Open`, `Auto-Replied`, `Escalated`, `Closed`
- mixed priorities: `Low`, `Medium`, `High`
- AI FAQ topics and canned auto-replies

## Local Setup

1. Clone repo
2. Optional: copy env template if you want to override defaults

```bash
cp .env.example .env
```

3. Start all services

```bash
docker-compose up --build
```

## Project Structure

```text
.
+-- backend/
¦   +-- src/
¦   ¦   +-- config/
¦   ¦   +-- controllers/
¦   ¦   +-- middleware/
¦   ¦   +-- routes/
¦   ¦   +-- services/
¦   ¦   +-- utils/
¦   ¦   +-- validators/
+-- frontend/
¦   +-- src/
¦       +-- api/
¦       +-- components/
¦       +-- context/
¦       +-- layouts/
¦       +-- pages/
+-- docker/
¦   +-- postgres/init.sql
+-- docker-compose.yml
+-- .env.example
```

## Notes

- Auth uses cookie-based JWT access and refresh tokens.
- Protected admin routes are enforced in frontend and backend.
- Ticket creation performs keyword-based FAQ classification and enqueues async AI auto-reply jobs in Redis.
- The AI layer is a mocked/stubbed FAQ responder (no external LLM dependency).
