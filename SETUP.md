# Setup & Development Guide

Practical setup/run/test instructions for the codebase. See [`README.md`](./README.md) for the full project pitch, architecture, and demo script, [`PROJECT_IDEA.md`](./PROJECT_IDEA.md) for the original pitch, and [`ACTION_PLAN.md`](./ACTION_PLAN.md) for the build plan.

## Structure

```
server/   Node/Express backend — REST API, MCP tool server, Gemini fallback middleware, MongoDB models
client/   React (Vite) + Tailwind frontend — chat dispatcher, pipeline view, map HUD, live terminal
```

## Backend — `server/`

### Setup

```bash
cd server
npm install
cp .env.example .env   # fill in MongoDB URI and Gemini API keys
```

### Run

```bash
npm run dev      # starts on http://localhost:5000
npm run seed      # populates demo inventory + a sample shipment
```

### Test

```bash
npm test          # Jest + Supertest — 42 tests covering auth, LLM fallback,
                   # routing, MCP tools, dispatch pipeline, self-healing loop, and HTTP routes
```

### Key modules

- `services/llmService.js` — Gemini client wrapper with automatic fallback to a secondary model/key on 429 quota errors or timeouts.
- `services/routingService.js` — Dijkstra-based shortest path over a mocked logistics network (stand-in for Google Maps Directions API).
- `mcp/tools.js` / `mcp/server.js` — MCP-style tool definitions (`get_godown_stock`, `calculate_shortest_path`, `dispatch_carrier`, `logistics_debugger`) and invocation surface.
- `services/dispatchService.js` — parses a natural-language order and runs the Godown → Packaging → Routing → Dispatch pipeline.
- `services/healingService.js` — the self-healing feedback loop: diagnoses a simulated disruption, asks the Gemini agent to narrate a recovery plan, recalculates a bypass route, and persists the fix.
- `services/authService.js` / `routes/auth.js` / `routes/authMiddleware.js` — single-access-code login. Stateless signed tokens (no server-side session storage), so it works correctly across independent Vercel serverless invocations. All `/api/*` routes except `/api/health` and `/api/auth/login` require a valid token.
- `routes/logs.js` — Server-Sent Events stream of live pipeline/healing log entries for the terminal panel. The token is passed as a `?token=` query param here since `EventSource` can't set custom headers.

Without a configured `MONGODB_URI`, the backend falls back to an in-memory store so the API and tests still run end-to-end.

## Frontend — `client/`

### Setup & run

```bash
cd client
npm install
npm run dev       # http://localhost:5173, proxies /api to http://localhost:5000
```

### Test

```bash
npm test          # Vitest + React Testing Library — 14 tests across all components
```

### Key components

- `LoginScreen` — single-access-code login gate (no username). Shown until a valid token is stored.
- `ChatDispatcher` — text-based conversational order input (e.g. "Ship 200 units from Godown A to Port 1").
- `PipelineView` — animated Godown → Packaging → Routing → Dispatch step tracker.
- `MapHUD` — SVG node-graph map showing the active route and any injected roadblock.
- `TerminalLog` — live-streamed self-healing/pipeline log panel (via SSE).
- `DisruptionButton` — "Simulate Disruption" trigger that calls `/api/disrupt` and kicks off the self-healing loop.

## Deployment

- **Frontend → Netlify**: `netlify.toml` builds `client/` and proxies `/api/*` to the Vercel backend.
- **Backend → Vercel**: the project's **Root Directory must be set to `server/`** in the Vercel dashboard (Project Settings → General). `server/api/[[...slug]].js` uses Vercel's optional-catch-all filename convention, so it's auto-detected as a single serverless function handling every `/api/*` request — no `vercel.json` needed. Set these as Vercel environment variables: `MONGODB_URI`, `GEMINI_API_KEY_PRIMARY`, `GEMINI_API_KEY_FALLBACK`, `GEMINI_MODEL_PRIMARY`, `GEMINI_MODEL_FALLBACK`, `CORS_ORIGIN` (your Netlify URL), `APP_ACCESS_CODE`, `AUTH_TOKEN_SECRET`.

  If Root Directory is left at the repo root instead, Vercel won't find `server/package.json` to install dependencies, and won't auto-detect the `api/` folder since it's nested under `server/` rather than at the project root — this is what causes it to fall back to serving raw source files instead of running the API.

### Known limitation

`/api/logs/stream` uses Server-Sent Events, which require a long-lived connection. Vercel's serverless functions are request/response and don't support this well — for a production deployment, move log streaming to a WebSocket-capable host (e.g. a small persistent Node service) or poll a `/api/logs/recent` endpoint instead. For local development and live demos run against `server/index.js` directly, SSE works as implemented.

## Scope Notes

- Google Maps routing and vehicle telemetry are **simulated/mocked** (`services/routingService.js`) — no live Maps API key or billing required for the demo. Swap in a real Directions API call there for production use.
- Gemini fallback logic and MongoDB schemas are real, not mocked.
