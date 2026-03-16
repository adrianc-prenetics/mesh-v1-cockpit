# THE MESH V1 Cockpit

**Visual command center for Adrian + Kev + Claude decision kernel.**

## What's Here

- **Message Stream**: Discord → Northflank kernel → real-time display
- **Decision Queue**: Active/pending decisions with consolidation windows
- **Heartbeat Gauge**: Kernel latency, channel health, sync status
- **State API**: Zustand store + REST routes for messaging, decisions, heartbeat sync

## Tech

- Next.js 15 + React 19
- Zustand (state management)
- Tailwind CSS (dark terminal UI)
- TypeScript
- WebSocket → Northflank kernel

## Deploy to Vercel

```bash
git push origin main
# Vercel auto-deploys on push
```

## API Endpoints

- `POST /api/message` — ingest Discord/heartbeat messages
- `GET /api/decisions` — fetch active decision queue
- `POST /api/decision` — create/update decision
- `GET /api/heartbeat` — kernel sync

## Dev

```bash
npm install
npm run dev # http://localhost:3000
```

---

Built by Kev + Adrian + Claude. Let's go.
