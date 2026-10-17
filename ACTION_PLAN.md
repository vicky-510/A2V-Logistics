# AutoRoute AI — Action Plan

Conversational, self-healing logistics management app for a prompt-engineering hackathon.

## Tech Stack
- **Frontend:** React.js (Vite) + Tailwind CSS + Lucide icons, animated SVG/canvas components → Netlify
- **Backend:** Node.js + Express (REST API + MCP server endpoints + simulated Google Maps routing) → Vercel
- **Database:** MongoDB Atlas (inventory, shipments, telemetry, self-healing logs)
- **AI & Chat:** Google Gemini API (with fallback), conversational chat interface (text-based)

## 1. Project Scaffolding
- `/client` — React + Vite + Tailwind (Netlify)
- `/server` — Node/Express with `/db`, `/services`, `/mcp`, `/routes`, `/utils` subfolders
- Root-level `netlify.toml`, `vercel.json`, `.env.example` for both apps

## 2. Backend Core
- MongoDB Atlas connection + schemas: `Inventory`, `Shipment`, `TelemetryEvent`, `HealingLog`
- **LLM fallback middleware** (`services/llmService.js`): wraps Gemini calls, catches 429/quota/timeout errors, transparently retries against a secondary model/API key, logs the fallback event to the terminal without breaking the session
- **MCP server module** exposing 4 tools:
  - `get_godown_stock`
  - `calculate_shortest_path`
  - `dispatch_carrier`
  - `logistics_debugger`
- REST routes: `/api/dispatch`, `/api/disrupt`, `/api/shipments`, `/api/logs` (SSE/WebSocket for live terminal log streaming)
- Disruption simulation endpoint triggers the agentic self-healing loop → writes to `HealingLog` → emits live events to the frontend

## 3. Frontend
- Dark-mode command-center shell (Tailwind, Lucide icons)
- Conversational chat dispatcher component (text-based natural language input + agent response thread)
- End-to-end pipeline view: Godown (inventory check) → Packaging → Shortest Path Routing → Dispatch
- Interactive Map HUD: SVG/node graph showing vehicle locations, bottlenecks, and live rerouting animation
- Live terminal/log panel streaming self-healing events in real time
- "Simulate Disruption" button (roadblock / vehicle breakdown) wired to backend

## 4. Integration & Polish
- Wire frontend to backend (env-based API URLs for local vs. deployed)
- Seed script for demo data (godowns, inventory, in-transit shipments)
- README with setup, run, and deploy instructions

## 5. Deployment Config
- `netlify.toml` — client build + proxy/redirects to Vercel API
- `vercel.json` — serverless function entry point for the Express app
- CORS + environment variable setup for both targets

## Notes / Scope Decisions
- Real Gemini integration with genuine fallback logic; real MongoDB schemas.
- Google Maps routing and vehicle telemetry are **simulated/mocked** (clearly commented in code) since live Maps API billing requires the user's own key and explicit consent.
- Git remote set to `https://github.com/abi131205/A2V-Logistics.git`; no push will happen until explicitly confirmed.

## Status
- [x] Git initialized, remote added
- [x] Directory structure created
- [x] `server/package.json`, `server/.env.example`
- [x] `server/db/connection.js`, `server/db/models.js`
- [x] `services/llmService.js` (Gemini fallback middleware) + tests
- [x] MCP tool modules (`mcp/tools.js`, `mcp/server.js`) + tests
- [x] REST routes + SSE log streaming (`routes/*.js`, `app.js`, `index.js`) + tests
- [x] Frontend scaffold (Vite + Tailwind)
- [x] Chat dispatcher, pipeline view, map HUD, terminal panel, disruption button + tests
- [x] Seed script (`server/utils/seed.js`)
- [x] Deployment configs (`netlify.toml`, `vercel.json`)
- [x] README

Backend: 34 Jest tests passing. Frontend: 12 Vitest tests passing. Production build verified (`vite build`).
