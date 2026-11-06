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

Core Concept & Workflow
Trip Creation & AI Generation: Users input trip details (destination, dates, budget, preferences) via TripForm.jsx. The request hits itineraryAIService.js, which dynamically generates a personalized itinerary.

Interactive Visualization & Mapping: MapView.jsx communicates with geocodingService.js to place location markers and calculate routes for daily activities.

AI Travel Assistant: ChatPanel.jsx lets users refine their plans in real-time by chatting with the AI travel connector.

Budget & Exports: BudgetSummary.jsx calculates expenses, while pdfService.js allows users to export full itineraries offline and calendarService.js syncs trip events to calendar applications.
