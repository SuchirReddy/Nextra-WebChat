# Nextra - Production Realtime Webchat Platform

Full-stack realtime chat platform built with:

- Next.js 15 App Router + React 19 + TypeScript
- Tailwind CSS + shadcn-style component system + Framer Motion
- Clerk authentication (Google/GitHub OAuth + email/password)
- Neon PostgreSQL + Drizzle ORM
- Separate Socket.IO realtime service
- UploadThing media/file uploads
- Zustand + TanStack Query state/data layer
- Vercel (web) + Render (socket) deployment architecture

## Architecture

- `apps/web`: frontend + API routes + Clerk + Drizzle
- `apps/socket`: standalone Socket.IO server (authenticated websocket service)
- Database schema is normalized with relations and indexes for chat scale
- REST API handles persistence, search, moderation, profile updates
- Socket service handles realtime fanout, presence, typing, read updates

## Project Structure

```
apps/
  web/
    app/
    components/
    hooks/
    lib/
    server/
    services/
    store/
    types/
    utils/
    drizzle/
    public/
  socket/
drizzle/
scripts/
```

## Features Implemented

### Authentication

- Clerk middleware route protection
- Clerk session persistence
- Sign up/sign in pages
- OAuth-ready architecture (Google/GitHub configured in Clerk dashboard)
- User sync from Clerk -> Postgres `users` table

### Realtime Chat

- 1:1 chats and group chats
- Socket auth with signed JWT from web API
- Realtime new messages, typing events, presence events
- Room join/leave per chat
- Reconnection enabled
- Optimistic message append on client

### Messaging

- Text messages
- File/image attachments via UploadThing
- Drag/drop + file picker uploads
- Message edit/delete APIs
- Reactions APIs
- Read receipt API + realtime event channel
- Message virtualization with `react-virtuoso`

### Groups

- Create groups
- Add/remove members
- Admin-only member management checks
- Group metadata model (name/avatar/description)

### Search

- Debounced search UI
- Search users/chats/messages endpoints
- Indexed query patterns

### Notifications

- Notification table + unread counters
- Browser notifications for incoming messages
- Toast-based socket and mutation feedback

### Admin

- Admin dashboard page
- Admin metrics endpoint
- Ban/unban endpoint
- Admin message delete endpoint
- Recent report visibility

### Security and Reliability

- Zod validation for input payloads
- API route auth guard + middleware protection
- In-memory rate limiting for REST endpoints
- Input sanitization for message/profile text
- Environment variable validation

## Database

Schema file:

- `apps/web/drizzle/schema.ts`

Migration:

- `apps/web/drizzle/migrations/0000_init.sql`

Seed script:

- `apps/web/scripts/seed.ts`

Required tables included:

- `users`
- `chats`
- `groups`
- `group_members`
- `chat_members`
- `messages`
- `attachments`
- `reactions`
- `message_reads`
- `typing_status`
- `notifications`
- `friendships`
- `blocked_users`
- `reports`

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Run migration:

```bash
pnpm db:migrate
```

4. Seed sample data:

```bash
pnpm db:seed
```

5. Start both apps:

```bash
pnpm dev
```

- Web app: `http://localhost:3000`
- Socket server: `http://localhost:4001`

## Clerk Configuration

In Clerk dashboard:

1. Enable Email/Password auth.
2. Enable Google OAuth and GitHub OAuth providers.
3. Set redirect URLs for dev/prod domains.
4. Add publishable/secret keys to environment.

## UploadThing Configuration

1. Create UploadThing app.
2. Add `UPLOADTHING_TOKEN` and `UPLOADTHING_SECRET`.
3. Route handler is mounted at `/api/uploadthing`.

## Deployment

## Web (Vercel)

1. Create Vercel project from repository root.
2. Set root directory to `apps/web`.
3. Configure all web env vars from `.env.example`.
4. Build command: `pnpm build`.

## Socket (Render)

1. Use `render.yaml` blueprint or create a Node web service.
2. Root directory: `apps/socket`.
3. Add env vars: `DATABASE_URL`, `SOCKET_JWT_SECRET`, `CORS_ORIGIN`, `PORT`.
4. Health check endpoint: `/health`.

## Neon

1. Provision PostgreSQL database.
2. Set `DATABASE_URL` in both deployments.
3. Run migration against production DB before release.

## Production Best Practices

- Replace in-memory rate limit with Redis for multi-instance deployments.
- Add Socket.IO Redis adapter for horizontal realtime scale.
- Move notification fanout to queue/event bus for large workloads.
- Add audit logs for admin moderation events.
- Enable Sentry + structured logs + metrics dashboards.
- Add integration tests for auth, socket events, and moderation flows.

