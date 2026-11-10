# 🌍 Odyssey FSD (Full Stack Travel Planning Platform)

Odyssey FSD is an AI-powered, full-stack travel itinerary generator and trip management platform. It allows users to create customized travel plans, visualize routes with interactive maps, chat with an AI assistant for recommendations, manage trip budgets, export itineraries to PDF, and sync schedules with Google Calendar.


Markdown
# 🌍 Odyssey FSD (Full Stack Travel Planning Platform)

<p align="center">
  <strong>An AI-powered, full-stack travel itinerary generator and trip management platform.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/AI-Gemini%2FOpenAI-8E44AD?style=flat-square" alt="AI" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
</p>

---



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

    ## 🤖 Advanced AI Architecture & Data Flow

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER (React + Vite)                          │
│                                                                                        │
│   [ User Action ] ──► [ TripForm.jsx / ChatPanel.jsx ]                                 │
│                                │                                                       │
│                                ▼ (REST / JSON Payload)                                 │
└────────────────────────────────┬───────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              API & BACKEND LAYER (Node.js / Express)                   │
│                                                                                        │
│   [ tripRoutes.js ] ──► [ tripController.js ] ──► [ Input Validator / Sanitizer ]     │
│                                                             │                          │
└─────────────────────────────────────────────────────────────┼──────────────────────────┘
                                                              │
                    ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
                    │                                                                                   │
                    ▼                                                                                   ▼
┌───────────────────────────────────────┐                               ┌───────────────────────────────────────┐
│        AI INFERENCE ORCHESTRATION     │                               │      GEOSPATIAL & ROUTE ENGINE        │
│                                       │                               │                                       │
│  ┌─────────────────────────────────┐  │                               │  ┌─────────────────────────────────┐  │
│  │    itineraryAIService.js        │  │                               │  │      geocodingService.js        │  │
│  └────────────────┬────────────────┘  │                               │  └────────────────┬────────────────┘  │
│                   │                   │                               │                   │                   │
│   • Prompt Engineering & Context      │                               │   • Forward / Reverse Geocoding       │
│   • Schema-Enforced JSON Output       │                               │   • Multi-stop Distance & Routing     │
│   • Fallback & Retry Strategy         │                               │   • Spatial Coordinate Caching        │
│                   │                   │                               │                   │                   │
│                   ▼                   │                               │                   ▼                   │
│       ┌───────────────────────┐       │                               │       ┌───────────────────────┐       │
│       │   LLM API (AI Model)  │       │                               │       │  Maps & Geocode API   │       │
│       └───────────────────────┘       │                               │       └───────────────────────┘       │
└───────────────────┬───────────────────┘                               └───────────────────┬───────────────────┘
                    │                                                                       │
                    └─────────────────────────────────────────┬─────────────────────────────┘
                                                              │
                                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          DATA CONVERGENCE & PERSISTENCE LAYER                          │
│                                                                                        │
│                  ┌───────────────────────────────────────────────────────┐             │
│                  │  database.js (PostgreSQL / MongoDB Persistence)       │             │
│                  └──────────────────────────┬────────────────────────────┘             │
│                                             │                                          │
│                    ┌────────────────────────┴────────────────────────┐                 │
│                    │                                                 │                 │
│                    ▼                                                 ▼                 │
│     ┌─────────────────────────────┐                   ┌─────────────────────────────┐  │
│     │      pdfService.js          │                   │    calendarService.js      │  │
│     │  (Exportable Document Data) │                   │  (Google Calendar Sync API) │  │
│     └─────────────────────────────┘                   └─────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘

💡 Core Vision & Workflow
AI-Driven Planning: Users enter destination, dates, budget, and travel preferences. The backend AI engine processes the input to generate optimized multi-day itineraries tailored to individual travel styles.

Interactive Mapping & Routing: Daily activities and destinations are auto-geocoded and mapped visually, allowing users to inspect locations and route navigation step-by-step.

Real-Time AI Travel Assistant: An integrated chat interface allows users to tweak, refine, or ask for local recommendations dynamically without re-generating the entire trip from scratch.

Budgeting & Export Integration: Features integrated expense tracking, Google Calendar synchronization for schedule management, and print-ready PDF export options for offline access on the road.

Key Capabilities at a Glance
🧠 AI Itinerary Engine: Rapid multi-day itinerary generation tuned to budgets and user interests.

🗺️ Interactive Map Route Visualization: Visual route calculation and pin placement for daily activities.

💬 Conversational Travel Assistant: In-app AI chat for quick plan adjustments and local insights.

💰 Integrated Budget Tracking: Clear breakdown of estimated costs (stay, travel, food, events).

📅 Google Calendar Sync: One-click integration to sync itineraries directly with personal schedules.

📄 Offline PDF Export: Easily export clean, printable PDF documents for offline travel.
