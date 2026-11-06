# 🌍 Odyssey FSD (Full Stack Travel Planning Platform)

Odyssey FSD is an AI-powered, full-stack travel itinerary generator and trip management platform. It allows users to create customized travel plans, visualize routes with interactive maps, chat with an AI assistant for recommendations, manage trip budgets, export itineraries to PDF, and sync schedules with Google Calendar.

---

## 🎨 System Architecture & Diagrammatic Concept

### High-Level Architecture Flow

```text
  ┌────────────────────────────────────────────────────────┐
  │                   Frontend (React + Vite)              │
  │  [HomePage] ──► [TripForm] ──► [TripPage]              │
  │                                   ├── [MapView]        │
  │                                   ├── [ChatPanel]      │
  │                                   └── [BudgetSummary]  │
  └───────────────────────────┬────────────────────────────┘
                              │ REST API Requests
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │                    Backend (Node.js/Express)           │
  │  [tripRoutes] ──► [tripController] ──► [database.js]   │
  │  [geocodeRoutes] ──► [geocodingService]                │
  └─────────────┬───────────────────────────┬──────────────┘
                │                           │
                ▼                           ▼
  ┌──────────────────────────┐  ┌──────────────────────────┐
  │    External Services     │  │   Third-Party Integrations│
  │  • itineraryAIService    │  │  • Map/Geocoding API     │
  │  • calendarService       │  │  • Google Calendar API   │
  │  • pdfService            │  │                          │
  └──────────────────────────┘  └──────────────────────────┘
