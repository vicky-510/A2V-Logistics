# AutoRoute AI

A conversational, self-healing logistics management web application that automates the end-to-end supply chain — Godown → Packaging → Transit → Shipping — using an autonomous agentic feedback loop and a Model Context Protocol (MCP) server architecture.

## Concept

Logistics coordinators today juggle inventory checks, packaging protocols, route planning, and dispatch across disconnected tools, and when something goes wrong mid-transit (a roadblock, a vehicle breakdown), fixing it is a manual, reactive scramble.

AutoRoute AI reimagines this as a conversational command center: a dispatcher types a natural-language order in a chat interface ("Ship 200 units from Godown A to Port 3"), and an AI agent plans the entire pipeline — checking stock, calculating the shortest route, and dispatching a carrier — while continuously watching for disruptions. When a disruption is simulated or detected, the system doesn't just alert a human: it autonomously diagnoses the failure, calculates a bypass route, updates the database, and heals the pipeline in real time, narrating every step through a live terminal log.

## Why It Stands Out

- **Conversational dispatch** — a chat-based interface turns natural language in, structured logistics action out, with the agent's reasoning and tool calls visible as part of the conversation.
- **MCP server architecture** — backend logic is exposed as explicit, composable tools (`get_godown_stock`, `calculate_shortest_path`, `dispatch_carrier`, `logistics_debugger`), making the agent's reasoning inspectable and extensible rather than a black box.
- **Multi-model quota fallback** — the Gemini integration gracefully survives rate limits/timeouts by transparently switching to a secondary model or key, so a demo (or production system) never breaks mid-session.
- **The self-healing feedback loop (the signature feature)** — a "Simulate Disruption" button injects a roadblock or breakdown; the agent diagnoses it via its own debugger tool, reroutes, persists the fix, and shows the whole recovery happening live.
- **Command-center aesthetic** — dark-mode UI, animated pipeline view, and an interactive map HUD showing vehicles, bottlenecks, and rerouting in motion — built to feel like mission control, not a form.

## Target Audience / Use Case

Supply chain and logistics operators (warehouses, freight dispatch, 3PL providers) who need faster, more resilient coordination between inventory, packaging, and transit — and a hackathon judging panel looking for a technically deep, visually compelling demo of autonomous agentic recovery.
