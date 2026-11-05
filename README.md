# Odyssey — AI Travel Itinerary Planner

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange.svg)](https://openai.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Node:sqlite-lightgrey.svg)](https://nodejs.org/api/sqlite.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An intelligent, full-stack travel planner that transforms destination, duration, budget, and interests into a structured, day-by-day itinerary with realistic travel logistics, conversational chat refinement, interactive map view, printable PDF export, and standard calendar (.ics) sync.

---

## 1. Problem

Planning an international or multi-day trip is traditionally fragmented, time-consuming, and exhausting:
* **Information Fragmentation**: Travelers juggle dozens of browser tabs cross-referencing blogs, review platforms, transit schedules, and maps.
* **Unrealistic Travel Logistics**: Generic travel itineraries routinely schedule distant attractions across a single day without accounting for transit times, distance, or traveler fatigue.
* **Rigid One-Shot Outputs**: Traditional AI prompts output static markdown walls of text. If a traveler wants to make Day 2 less packed, add more street food, or swap an expensive dinner, they must regenerate the entire plan from scratch and lose prior customizations.
* **Lack of Actionable Export Formats**: Generic itinerary generators produce unstructured chat messages that cannot be readily exported to calendars or printed for travel.

---

## 2. Solution

**Odyssey** bridges the gap between conversational generative AI and actionable travel logistics:
1. **Curated Input Experience**: Captures destination, duration (1–30 days), budget tier (Budget, Mid-range, Luxury), and multi-select interests.
2. **Canonical Structured Generation**: Leverages OpenAI GPT-4o-mini structured JSON outputs with strict schema validation, chronological ordering, and estimated costs.
3. **Realistic Travel Transit Logistics**: Calculates transport modes (walk, subway, bus, taxi, train) and transit durations between consecutive stops.
4. **State-Preserving Conversational Refinement**: Enables travelers to modify specific days or activities through natural-language chat while strictly preserving everything else.
5. **Interactive Itinerary Schedule**: Clear Day 1, Day 2, Day 3 tabs, timeline flow connectors, and category-based spend breakdowns.
6. **Bidirectional Map View**: Leaflet OpenStreetMap view with day-colored markers and click-to-highlight synchronization.
7. **Production Exports**: One-click downloadable print-ready A4 PDF documents and RFC 5545 standard `.ics` calendar files.

---

## 3. Key Differentiator

> **Odyssey is NOT merely a one-shot AI chatbot.**

Most AI travel tools act as stateless text prompts that discard context and regenerate everything upon the slightest adjustment. 

**Odyssey maintains a persistent, structured itinerary state in SQLite.** When a user submits a refinement request (e.g., *"Make day 2 less packed and add more food spots"*):
* The backend feeds the **complete current itinerary JSON**, recent conversation history, and constraints into the model.
* The model is strictly instructed to modify **only** what was requested and preserve all unchanged activities, times, locations, and travel logistics.
* The result is validated against the canonical schema and persisted as a new version in SQLite (`v1 → v2 → v3`).
* Refreshing the browser or returning days later preserves the exact refined state directly from the database.

---

## 4. Features

### Must-Have Features (Core)
* **Trip Input Experience**: Responsive form with input validation for destination, 1–30 days duration, budget tier, and multi-select interests.
* **AI Itinerary Generation**: Structured JSON generation via OpenAI GPT-4o-mini with automatic fallback mock mode when no API key is provided.
* **Structured Itinerary Display**: Chronologically sequenced activities showing times, duration, estimated costs, category badges, locations, descriptions, and notes.
* **Travel Logistics**: Realistic transit transitions between activities (walking, subway, train, bus, taxi) with durations and distances.
* **Conversational Chat Refinement**: Side-panel chat interface that edits the active itinerary state iteratively.
* **PDF Export**: Print-ready, styled A4 PDF generated via headless Chromium (Puppeteer) reflecting the current itinerary version.
* **ICS Calendar Export**: Standard RFC 5545 `.ics` calendar file with start/end times, durations, and locations importable into Google Calendar, Apple Calendar, and Outlook.

### Stretch Features (Implemented)
* **Budget Visualization**: Category spend distribution (food, sightseeing, culture, relaxation, shopping), daily averages, and progress bar breakdown.
* **Interactive Map View**: OpenStreetMap + Leaflet integration with day-coded colored pins, activity popups, and bidirectional highlighting between schedule cards and map pins.

---

## 5. System Architecture

```mermaid
graph TB
    subgraph Client ["Frontend Client (React 18 + Vite — Port 5173)"]
        UI[App Shell & Header] --> Form[TripForm Component]
        UI --> Itinerary[Itinerary Schedule & Timeline]
        UI --> MapComp[Leaflet MapView Component]
        UI --> Chat[Conversational ChatPanel]
        UI --> Budget[Budget Breakdown]
        APIClient[API Service Layer (/api/*)]
    end

    subgraph Server ["Backend Server (Node.js + Express — Port 3001)"]
        Routes[API Routes] --> Controllers[Controllers]
        Controllers --> TripSvc[Trip Service]
        Controllers --> AISvc[Itinerary AI Service]
        Controllers --> PDFSvc[Puppeteer PDF Service]
        Controllers --> CalSvc[ICS Calendar Service]
        Controllers --> GeoSvc[Nominatim Geocoding Service]
        TripSvc --> DB[(SQLite Database)]
        GeoSvc --> GeoCache[(SQLite Geocode Cache)]
        AISvc --> OpenAI[OpenAI API (GPT-4o-mini)]
    end

    subgraph Shared ["Shared Package (@travel-planner/shared)"]
        Models[Data Models]
        Validation[Schema Validators]
        Enums[Enums & Constants]
    end

    Form --> APIClient
    Itinerary --> APIClient
    Chat --> APIClient
    APIClient -->|Vite Proxy HTTP| Routes
    Controllers -.-> Models
    APIClient -.-> Models
```
### Workspace Organization
* `@travel-planner/client` (`client/`): React 18 SPA with Vite, CSS variables, monochrome design system, and Leaflet mapping.
* `@travel-planner/server` (`server/`): Express REST API, SQLite persistence via `node:sqlite`, Puppeteer PDF rendering, and ICS generation.
* `@travel-planner/shared` (`shared/`): Canonical JSON schemas, validation rules, chronological sorting, and cost reconciliation logic.

---

## 6. AI Architecture & Prompt Engineering

### 1. Canonical Schema Enforcement
OpenAI completions are called with `response_format: { type: "json_object" }`. Every output must strictly conform to:

```json
{
  "destination": "Tokyo, Japan",
  "budget": "mid-range",
  "interests": ["Food", "History"],
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "id": "act-d1-1",
          "time": "09:30",
          "title": "Senso-ji Temple & Asakusa District",
          "category": "sightseeing",
          "location": "Senso-ji, Asakusa, Tokyo",
          "durationMinutes": 120,
          "estimatedCost": 20,
          "description": "Explore Tokyo's oldest Buddhist temple and stroll Nakamise-dori.",
          "travelFromPrevious": {
            "distanceKm": 0,
            "travelTimeMinutes": 0,
            "transportMode": "start"
          },
          "notes": "Arrive early to avoid crowd congestion."
        }
      ]
    }
  ],
  "totalEstimatedCost": 120
}
```

### 2. Validation & Safety Pipeline
Before any AI output is persisted or returned:
* **Schema Validation (`validateItinerarySchema`)**: Ensures all required fields, valid categories, valid transport modes, and positive numbers exist.
* **Chronological Ordering (`sortActivitiesChronologically`)**: Sorts activities sequentially by start time (`HH:MM`).
* **Cost Reconciliation (`reconcileItineraryCosts`)**: Recalculates `totalEstimatedCost` to ensure mathematical consistency.
* **Zero-Config Fallback**: If no OpenAI API key is set, the service automatically runs in development fallback mode using high-fidelity mock data.

---

## 7. Technology Stack

* **Frontend**: React 18, Vite 6, React Router 6, React Leaflet / Leaflet, Vanilla CSS (tokens, monochrome design, responsive grid & flexbox).
* **Backend**: Node.js 18+, Express 4, node:sqlite (native Node SQLite with WAL mode), Puppeteer, ics, morgan, cors, helmet.
* **AI Integration**: OpenAI API (`gpt-4o-mini`) with structured JSON outputs.
* **Mapping & Geocoding**: Leaflet + OpenStreetMap + Nominatim API with persistent SQLite cache.

---

## 8. Setup & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 1. Clone & Install
```bash
git clone <repository-url>
cd G_Gravity
npm install
```

### 2. Configure Environment (Optional)
Copy the template in the `server` directory:

```bash
# On Windows (cmd/PowerShell):
copy server\.env.example server\.env

# On macOS/Linux:
cp server/.env.example server/.env
```

Optionally set your OpenAI API key in `server/.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
```
*(If no API key is provided, Odyssey automatically runs in zero-config development fallback mode).*

### 3. Start Development Servers
```bash
npm run dev
```

* **Frontend UI**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:3001/api](http://localhost:3001/api)
* **Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

*(Optional) Run servers in separate terminals:*
```bash
# Terminal 1 — Backend Express Server
npm run dev:server

# Terminal 2 — Frontend Vite Dev Server
npm run dev:client
```

---

## 9. Environment Variables

Configured in `server/.env` (copied from `server/.env.example`):

| Variable | Default | Required? | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | None | No* | OpenAI API key (server-side only, never sent to client). |
| `PORT` | `3001` | No | Port for Express server. |
| `OPENAI_MODEL` | `gpt-4o-mini` | No | OpenAI model ID. |
| `MOCK_AI_GENERATION` | `false` | No | Set `true` to force mock generation. |
| `DATABASE_PATH` | `./data/travel_planner.db` | No | SQLite database file location. |
| `NODE_ENV` | `development` | No | Node environment mode. |

*\*The application runs completely without an API key using development fallback mode.*

---

## 10. API Endpoints

