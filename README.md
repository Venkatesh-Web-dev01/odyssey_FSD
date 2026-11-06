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

✨ Features
🧠 AI-Driven Itinerary Generation: Fast, personalized multi-day trip itineraries tailored to user preferences.

🗺️ Interactive Map Navigation: Geocoding and location plotting for seamless navigation between destinations.

💬 Interactive AI Chat: Fine-tune itinerary details dynamically through an in-app chat widget.

💰 Budget Tracker: Keep track of estimated costs across accommodation, travel, food, and activities.

📅 Calendar Sync: Directly sync generated itineraries to Google Calendar.

📄 PDF Export: Generate downloadable, print-friendly PDF itineraries.

odyssey_FSD/
├── Frontend Components
│   ├── HomePage.jsx             # Landing & main dashboard
│   ├── TripForm.jsx             # Initial trip query input form
│   ├── TripPage.jsx             # Main itinerary dashboard
│   ├── MapView.jsx / .css       # Map plotting & interactive route views
│   ├── ChatPanel.jsx / .css     # AI chat panel for trip tweaks
│   ├── BudgetSummary.jsx / .css # Financial breakdown of the trip
│   ├── TravelConnector.jsx      # Connector logic for travel data
│   └── ItinerarySkeleton.jsx   # UI loading skeletons
│
├── Backend & Services
│   ├── index.js                 # Server entry point
│   ├── tripRoutes.js            # API routing for trip operations
│   ├── tripController.js        # Controller logic for trip processing
│   ├── itineraryAIService.js    # AI prompt engineering & integration
│   ├── geocodingService.js      # Map coordinate lookup & resolution
│   ├── calendarService.js       # Calendar event generation & sync
│   ├── pdfService.js            # PDF compilation engine
│   └── database.js              # Database connection setup
│
└── Configuration
    ├── vite.config.js           # Vite builder setup
    └── env.example              # Environment variables template

