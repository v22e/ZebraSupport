# ZebraSupport

ZebraSupport is a full-stack B2B AI-powered customer support ticket platform.

Tagline: **"Strip away the chaos. Automate your support."**

## Stack

- Frontend: React (Vite) + Tailwind CSS + Recharts + lucide-react
- Backend: Node.js + Express REST API
- Database: PostgreSQL
- Cache/Queue: Redis + BullMQ worker for async AI auto-replies
- AI: Google Gemini (`gemini-1.5-flash`) via `@google/generative-ai`
- Auth: JWT (access + refresh tokens in httpOnly cookies)
- Containerization: Docker + docker-compose

## Modes

- `DEMO_MODE=true`:
  - All admin data is scoped to demo org (`DEMO_ORG_ID`)
  - Persistent demo banner shown in UI
  - Register/login still works, users land in demo org context
  - Ticket deletion is blocked
- `DEMO_MODE=false`:
  - Normal live multi-tenant mode
  - New orgs start with empty tickets/analytics state

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

### AI Chat

- `POST /api/ai/chat` — Send a message to the AI assistant (requires authentication)

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "How do I create a ticket?" },
    { "role": "model", "content": "You can create a ticket by..." },
    { "role": "user", "content": "What about bulk import?" }
  ]
}
```

**Response:**
```json
{
  "reply": "Bulk import is not currently supported, but you can..."
}
```

The `messages` array is the full conversation history. Each entry has a `role` of `"user"` or `"model"` and a `content` string. The backend forwards the history to Google Gemini (`gemini-1.5-flash`) and streams a contextual reply. The endpoint requires a valid session cookie — unauthenticated requests return `401`.

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

### Users / Settings

- `GET /api/users`
- `POST /api/users/invite` (stub)
- `PATCH /api/users/:id/role`
- `PATCH /api/users/:id/deactivate`

## Roles

- `owner`: full access
- `admin`: manage users, analytics, ticket operations
- `agent`: view/reply only to assigned tickets

## Demo Credentials

- Owner: `admin@zebrasupport.io` / `Password123!`
- Admin: `ops.admin@zebrasupport.io` / `Password123!`
- Agent: `agent@zebrasupport.io` / `Password123!`

## Seed Data

- 1 demo organisation (`ZebraSupport Demo Org`)
- 3 demo users (owner/admin/agent)
- 20+ realistic demo tickets with varied status/priority/timestamps
- FAQ topics with canned AI auto-replies

## AI Features

ZebraSupport has two distinct AI integrations, both powered by Google Gemini.

### 1. AI Auto-Reply (ticket triage)

When a new ticket is submitted, a BullMQ background job:
1. Classifies the ticket into a topic (e.g. "Billing Query", "Password Reset", "Account Access")
2. Generates a context-aware reply using Gemini
3. Saves the reply to the ticket and updates its status to `Auto-Replied`

This happens automatically — no admin action required. Admins can still read the AI reply on the ticket detail page and add a manual reply on top.

### 2. AI Chat Widget (admin assistant)

A floating chat bubble is available on every admin page (bottom-right corner). Click it to open a panel and ask the ZebraSupport assistant anything about the platform.

**How it works:**
- Full conversation history is sent to Gemini on every message, so the assistant maintains context across the chat session
- The session resets when you navigate away or refresh
- The widget is only shown to authenticated admin/owner users — it is not visible on public pages

**To use it:**
1. Log in as an org owner or admin at `/login`
2. Look for the black circle button in the bottom-right corner of any admin page
3. Click it to open the chat panel
4. Type your question and press Enter or click the send button

**Example questions to try:**
- "How do I invite a new user?"
- "What does the Escalated status mean?"
- "How do I read the analytics page?"
- "What is the difference between Standard and Pro plans?"

### Configuration

Set your Gemini API key in `.env`:

```
GEMINI_API_KEY=your-key-here
```

Get a free key at [aistudio.google.com](https://aistudio.google.com). Without this key the chat widget will return an error and auto-replies will fail silently.

## Local Setup

1. Clone repo
2. Optional: copy env template to override defaults

```bash
cp .env.example .env
```

3. Start all services

```bash
docker-compose up --build
```

## FAQ

**Q: How do I get started locally?**
Clone the repo, optionally copy `.env.example` to `.env`, then run `docker-compose up --build`. The app will be available at `http://localhost:3000`.

**Q: Can users self-register?**
Yes — `POST /api/auth/register` is open. In demo mode, all registered users are placed into the demo org context automatically.

**Q: What is demo mode?**
Set `DEMO_MODE=true` in your env to lock all admin data to a single demo org. A persistent banner is shown in the UI, and ticket deletion is blocked. Useful for showcasing the product without risking data loss.

**Q: Is the AI auto-reply using a real LLM?**
Yes. Ticket auto-replies and the admin chat widget both use Google Gemini (`gemini-1.5-flash`). You need a `GEMINI_API_KEY` in your `.env`. Without it, auto-replies will fail silently and the chat widget will return an error message.

**Q: Where are JWT tokens stored?**
In `httpOnly` cookies (access + refresh tokens), not `localStorage`, to mitigate XSS token theft.

**Q: Why does the backend wait before starting?**
Docker health checks ensure Postgres and Redis are fully ready before the backend initialises, preventing connection errors on cold starts.

**Q: Can I run the stack without Docker?**
The stack is designed for Docker. Running services manually is possible but requires you to configure Postgres, Redis, and all environment variables yourself to match `.env.example`.

**Q: What roles exist and what can they do?**
- `owner` — full access to the org
- `admin` — manage users, view analytics, perform ticket operations
- `agent` — view and reply to assigned tickets only

## Notes

- All ticket/analytics/user data access is org-scoped server-side.
- In demo mode, org context is forced to `DEMO_ORG_ID` for all authenticated users.
- Both AI features (auto-reply and chat widget) require a valid `GEMINI_API_KEY`.