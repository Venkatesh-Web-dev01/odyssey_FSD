import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './migrations.js';

let db = null;

/**
 * Initializes the SQLite database connection and runs migrations.
 * Creates the data directory if it doesn't exist.
 */
export function initializeDatabase() {
  const dbPath = process.env.DATABASE_PATH || './data/travel_planner.db';
  const absolutePath = path.resolve(dbPath);

  // Ensure the directory exists
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new DatabaseSync(absolutePath);

  // Enable WAL mode for better concurrent read performance
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Run table creation migrations
  runMigrations(db);

  return db;
}

/**
 * Returns the active database instance.
 * @returns {Database}
 */
export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}
