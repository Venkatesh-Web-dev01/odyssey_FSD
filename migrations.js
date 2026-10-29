/**
 * Database migrations for the Travel Itinerary Planner.
 *
 * Creates the core tables: trips, itineraries, chat_messages.
 * Itinerary data is stored as versioned JSON to support
 * atomic updates from AI generation and chat refinement.
 */

/**
 * Runs all migrations against the provided database instance.
 * Uses IF NOT EXISTS for idempotent execution.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function runMigrations(db) {
  db.exec(`
    -- ─── Trips ───────────────────────────────────────────
    -- Core trip metadata entered by the user.
    CREATE TABLE IF NOT EXISTS trips (
      id            TEXT PRIMARY KEY,
      destination   TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      budget        REAL NOT NULL DEFAULT 0,
      interests     TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
      status        TEXT NOT NULL DEFAULT 'draft',
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );

    -- ─── Itineraries ─────────────────────────────────────
    -- Versioned itinerary snapshots. Each AI generation or
    -- chat refinement creates a new row with an incremented
    -- version number. The full day-by-day structure is stored
    -- as a JSON blob in itinerary_data.
    CREATE TABLE IF NOT EXISTS itineraries (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id        TEXT NOT NULL,
      itinerary_data TEXT NOT NULL DEFAULT '{}',  -- JSON: { days: [...] }
      version        INTEGER NOT NULL DEFAULT 1,
      created_at     TEXT NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    -- ─── Chat Messages ───────────────────────────────────
    -- Conversation history for iterative refinement.
    -- Stores both user messages and AI responses to maintain
    -- context across refinement rounds.
    CREATE TABLE IF NOT EXISTS chat_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id    TEXT NOT NULL,
      role       TEXT NOT NULL,  -- 'user' | 'assistant' | 'system'
      content    TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    -- ─── Geocode Cache ───────────────────────────────────
    -- Caches geocoding results from Nominatim to avoid
    -- redundant API calls and respect rate limits.
    CREATE TABLE IF NOT EXISTS geocode_cache (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      location_key TEXT NOT NULL UNIQUE,
      lat          REAL NOT NULL,
      lng          REAL NOT NULL,
      display_name TEXT,
      created_at   TEXT NOT NULL
    );

    -- ─── Indexes ─────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id
      ON itineraries(trip_id);
    CREATE INDEX IF NOT EXISTS idx_itineraries_version
      ON itineraries(trip_id, version DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_trip_id
      ON chat_messages(trip_id);
    CREATE INDEX IF NOT EXISTS idx_geocode_cache_key
      ON geocode_cache(location_key);
  `);
}
