# 🌍 Odyssey FSD (Full Stack Travel Planning Platform)

Odyssey FSD is an AI-powered, full-stack travel itinerary generator and trip management platform. It allows users to create customized travel plans, visualize routes with interactive maps, chat with an AI assistant for recommendations, manage trip budgets, export itineraries to PDF, and sync schedules with Google Calendar.
Actually this repository is my Full Stack Development project.
It is a travelling management platform.
it helps for travellers.
And user for the travellers.

<p align="center">
  <strong>An AI-powered, full-stack travel itinerary generator and trip management platform.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/AI-Gemini%2FOpenAI-8E44AD?style=flat-square" alt="AI" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=black" alt="Vite" />
</p>

---

⚡Core Concept & Workflow
Trip Creation & AI Generation: Users input trip details (destination, dates, budget, preferences) via TripForm.jsx. The request hits itineraryAIService.js, which dynamically generates a personalized itinerary.

Interactive Visualization & Mapping: MapView.jsx communicates with geocodingService.js to place location markers and calculate routes for daily activities.

AI Travel Assistant: ChatPanel.jsx lets users refine their plans in real-time by chatting with the AI travel connector.

Budget & Exports: BudgetSummary.jsx calculates expenses, while pdfService.js allows users to export full itineraries offline and calendarService.js syncs trip events to calendar applications.

<dl>
  <dt><strong>🧠 AI-Driven Planning</strong></dt>
  <dd>Enter your destination, dates, budget, and travel preferences. The backend AI engine processes your input to generate optimized multi-day itineraries tailored to your style.</dd>
  <br/>
  <dt><strong>🗺️ Interactive Mapping & Routing</strong></dt>
  <dd>Daily activities and destinations are auto-geocoded and mapped visually, allowing you to inspect locations and step-by-step route navigation.</dd>
  <br/>
  <dt><strong>💬 Real-Time AI Travel Assistant</strong></dt>
  <dd>An integrated chat interface lets you tweak, refine, or request local recommendations dynamically without starting over.</dd>
  <br/>
  <dt><strong>💰 Budgeting & Export Integration</strong></dt>
  <dd>Features expense tracking, Google Calendar sync for schedule management, and print-ready PDF export options for offline travel access.</dd>
</dl>


✨ Features
🧠 AI-Driven Itinerary Generation: Fast, personalized multi-day trip itineraries tailored to user preferences.

🗺️ Interactive Map Navigation: Geocoding and location plotting for seamless navigation between destinations.

💬 Interactive AI Chat: Fine-tune itinerary details dynamically through an in-app chat widget.

💰 Budget Tracker: Keep track of estimated costs across accommodation, travel, food, and activities.

📅 Calendar Sync: Directly sync generated itineraries to Google Calendar.

📄 PDF Export: Generate downloadable, print-friendly PDF itineraries.



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



Based on the files and README in the odyssey_FSD repository, it primarily uses JavaScript (along with HTML and CSS for the web interface), as indicated by:

Frontend & UI files: .jsx (App.jsx, TripForm.jsx, MapView.jsx, ChatPanel.jsx, BudgetSummary.jsx, HomePage.jsx, TripPage.jsx, Header.jsx, ItinerarySkeleton.jsx, TravelConnector.jsx, main.jsx), .css, and index.html.


Backend & service files: .js (api.js, calendarService.js, database.js, errorHandler.js, geocodeController.js, geocodingService.js, healthRoutes.js, itineraryAIService.js, migrations.js, pdfService.js, schemas.js, tripController.js, tripRoutes.js, tripService.js, vite.config.js, and index.js variants).



Key Capabilities at a Glance
🧠 AI Itinerary Engine: Rapid multi-day itinerary generation tuned to budgets and user interests.

🗺️ Interactive Map Route Visualization: Visual route calculation and pin placement for daily activities.

💬 Conversational Travel Assistant: In-app AI chat for quick plan adjustments and local insights.

💰 Integrated Budget Tracking: Clear breakdown of estimated costs (stay, travel, food, events).

📅 Google Calendar Sync: One-click integration to sync itineraries directly with personal schedules.

📄 Offline PDF Export: Easily export clean, printable PDF documents for offline travel.

| Capability | Description |

| **🧠 AI Itinerary Engine** | Rapid multi-day itinerary generation tuned to budgets and user interests. |
| **🗺️ Map Route Visualization** | Visual route calculation and pin placement for daily activities. |
| **💬 Conversational Assistant** | In-app AI chat for quick plan adjustments and local insights. |
| **💰 Budget Tracking** | Clear breakdown of estimated costs (stay, travel, food, events). |
| **📅 Google Calendar Sync** | One-click integration to sync itineraries directly with personal schedules. |
| **📄 Offline PDF Export** | Easily export clean, printable PDF documents for offline travel. |

How to Install Node.js & JavaScript Runtime
To run and develop the JavaScript codebase locally, install Node.js (which includes npm, the Node package manager):

1. Download Node.js: Get the current Long-Term Support (LTS) release from the official Node.js website, or install it via your OS package manager / version manager (nvm on macOS/Linux, nvm-windows or winget on Windows).
