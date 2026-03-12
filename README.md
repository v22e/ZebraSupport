# ZebraSupport

**Strip away the chaos. Automate your support.**

ZebraSupport is a B2B SaaS AI-powered customer support ticket platform with multi-tenancy, role-based access control, subscription plan management, and a full notifications system.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, Recharts, lucide-react
- Backend: Node.js, Express REST API
- Database: PostgreSQL
- Queue/Cache: Redis + BullMQ (async AI auto-reply worker)
- Auth: JWT access + refresh tokens in httpOnly cookies
- Rate limiting: express-rate-limit + rate-limit-redis (Redis-backed)
- Containers: Docker + docker-compose

## Role Hierarchy

1. `superadmin`
Platform-level only (ZebraSupport internal), access to `/platform/*`.
Can manage all organisations, plans, users, and demo requests.

2. `org_owner`
Top user in an organisation, access to `/admin/*`.
Full org control for users, settings, billing, and data.

3. `org_admin`
Operations manager in an organisation, access to `/admin/*`.
Can manage tickets, analytics, and users with restricted hierarchy.

4. `user`
End user support requester, access to `/dashboard/*`.
Can only submit and track own tickets, manage own profile/preferences.

## Subscription Plans

- Free: 3 users, 50 tickets/month, basic analytics
- Plus: 10 users, 500 tickets/month, full analytics
- Pro: Unlimited users/tickets, full analytics, CSV export

Plan upgrades are handled through sales/demo flow (no self-serve payments).

## Services

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

All services include health checks. Backend waits for Postgres and Redis to be healthy before startup.

## Demo Credentials

- Superadmin (platform):
`superadmin@zebrasupport.io` / `SuperAdmin123!`
Access: `http://localhost:3000/platform/login`

- Org Owner (demo org, Free plan):
`admin@zebrasupport.io` / `Password123!`
Access: `http://localhost:3000/admin/dashboard`

- User (demo org):
`agent@zebrasupport.io` / `Password123!`
`user@zebrasupport.io` / `Password123!`
Access: `http://localhost:3000/dashboard`

## Local Setup

1. Clone repository
2. Copy env file

```bash
cp .env.example .env
```

3. Start stack

```bash
docker-compose up --build
```

4. Open app

- `http://localhost:3000`

## Health Check

```bash
curl http://localhost:5000/health
```

Returns:

- `200` when healthy (`status: "ok"`)
- `503` when degraded (`status: "degraded"`)

Response shape:

```json
{
  "status": "ok",
  "timestamp": "<ISO timestamp>",
  "uptime": 123.45,
  "services": {
    "database": "ok",
    "redis": "ok"
  }
}
```

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
- `DELETE /api/tickets/reset`
- `GET /api/tickets/export` (Pro only)
- `POST /api/tickets/demo/load`
- `DELETE /api/tickets/demo/remove`

### Analytics

- `GET /api/analytics/summary`
- `GET /api/analytics/volume`
- `GET /api/analytics/health-score`

### Users

- `GET /api/users`
- `POST /api/users/invite`
- `PATCH /api/users/:id/role`
- `PATCH /api/users/:id/deactivate`
- `PATCH /api/users/:id/activate`
- `PATCH /api/users/me`
- `PATCH /api/users/me/deactivate`

### Notifications

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`
- `PATCH /api/notifications/preferences`

### Demo Requests

- `POST /api/demo-requests`

### Billing

- `GET /api/billing/current`

### Platform (superadmin only)

- `GET /api/platform/summary`
- `POST /api/platform/organisations`
- `GET /api/platform/organisations`
- `GET /api/platform/organisations/:id`
- `PATCH /api/platform/organisations/:id/plan`
- `PATCH /api/platform/organisations/:id/suspend`
- `PATCH /api/platform/organisations/:id/activate`
- `DELETE /api/platform/organisations/:id`
- `GET /api/platform/demo-requests`
- `PATCH /api/platform/demo-requests/:id/status`

### Health

- `GET /health`

## Rate Limiting

- Login route: 5 requests per IP per 1 minute
- General API routes: 100 requests per IP per 1 minute
- State is stored in Redis for multi-instance consistency

## Project Structure

```text
.
+-- backend/
¦   +-- src/
¦       +-- config/
¦       +-- controllers/
¦       +-- middleware/
¦       +-- routes/
¦       +-- services/
¦       ¦   +-- notificationService.js
¦       +-- utils/
¦       +-- validators/
+-- frontend/
¦   +-- src/
¦       +-- api/
¦       +-- components/
¦       +-- context/
¦       +-- layouts/
¦       +-- pages/
¦           +-- admin/
¦           +-- dashboard/
¦           +-- platform/
+-- docker/
¦   +-- postgres/
¦       +-- init.sql
+-- docker-compose.yml
+-- .env.example
+-- README.md
```

## Notes

- All org-level queries are scoped by `org_id`; superadmin routes bypass org scoping.
- AI auto-reply is a mocked FAQ responder (no external LLM integration).
- Demo tickets are flagged with `is_demo=true` and can be loaded/removed separately.
- Notification preferences are per-user and default to enabled.
- Plan enforcement is server-side; frontend guards are UX-level only.
- Demo org starts on `free` plan to demonstrate limits on fresh builds.
