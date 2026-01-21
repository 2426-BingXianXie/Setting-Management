/**
 * Settings Management API
 *
 * A RESTful API for managing schemaless JSON configuration objects.
 * Supports CRUD operations with SQLite persistence and pagination.
 *
 * Endpoints:
 *   POST   /settings      - Create a new settings object
 *   GET    /settings      - Get paginated list of all settings
 *   GET    /settings/:id  - Get a specific settings object by ID
 *   PUT    /settings/:id  - Replace a settings object entirely
 *   DELETE /settings/:id  - Delete a settings object (idempotent)
 */

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware Configuration
app.use(cors());        // Enable Cross-Origin Resource Sharing for frontend
app.use(express.json()); // Parse JSON request bodies

// Database Initialization
// Connect to SQLite database (creates file if it doesn't exist)
const db = new Database('./data/settings.db');

// Create settings table if it doesn't exist
// - id: UUID primary key
// - data: JSON string storing the schemaless settings object
// - created_at: Timestamp when the record was created
// - updated_at: Timestamp when the record was last modified
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Helper Functions
/**
 * Transforms a database row into an API response object.
 * Parses the JSON data string back into an object.
 *
 * @param {Object} row - Database row with id, data, created_at, updated_at
 * @returns {Object} Formatted settings object for API response
 */
const parseRow = (row) => ({
  id: row.id,
  data: JSON.parse(row.data),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// API Endpoints
/**
 * CREATE - POST /settings
 *
 * Creates a new settings object with a unique UUID.
 * Accepts any valid JSON as the request body.
 *
 * @body {Object} Any valid JSON object
 * @returns {201} Created settings object with id, data, createdAt, updatedAt
 * @returns {500} Server error if creation fails
 */
app.post('/settings', (req, res) => {
  try {
    const id = uuidv4();
    const data = JSON.stringify(req.body);
    const now = new Date().toISOString();

    const stmt = db.prepare(
        'INSERT INTO settings (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, data, now, now);

    // Return 201 Created with the new object
    res.status(201).json({
                           id,
                           data: req.body,
                           createdAt: now,
                           updatedAt: now
                         });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create settings' });
  }
});

/**
 * READ ALL - GET /settings
 *
 * Returns a paginated list of all settings objects.
 * Ordered by creation date (newest first).
 *
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 * @returns {200} Object containing data array and pagination info
 * @returns {500} Server error if fetch fails
 */
app.get('/settings', (req, res) => {
  try {
    // Parse pagination parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // Calculate offset for SQL query
    const offset = (page - 1) * limit;

    // Get total count for pagination metadata
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM settings');
    const { total } = countStmt.get();

    // Get paginated results, ordered by newest first
    const stmt = db.prepare(
        'SELECT * FROM settings ORDER BY created_at DESC LIMIT ? OFFSET ?'
    );
    const rows = stmt.all(limit, offset);

    // Return data with pagination metadata
    res.json({
               data: rows.map(parseRow),
               pagination: {
                 page,
                 limit,
                 total,
                 totalPages: Math.ceil(total / limit)
               }
             });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * READ ONE - GET /settings/:id
 *
 * Returns a specific settings object by its UUID.
 *
 * @param {string} id - UUID of the settings object
 * @returns {200} The settings object if found
 * @returns {404} Error if settings not found
 * @returns {500} Server error if fetch fails
 */
app.get('/settings/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM settings WHERE id = ?');
    const row = stmt.get(req.params.id);

    // Return 404 if not found
    if (!row) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json(parseRow(row));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * UPDATE - PUT /settings/:id
 *
 * Entirely replaces a settings object with the new payload.
 * Does NOT merge with existing data - full replacement.
 *
 * @param {string} id - UUID of the settings object to update
 * @body {Object} New JSON data to replace the existing data
 * @returns {200} Updated settings object
 * @returns {404} Error if settings not found
 * @returns {500} Server error if update fails
 */
app.put('/settings/:id', (req, res) => {
  try {
    // Check if the record exists
    const checkStmt = db.prepare('SELECT id FROM settings WHERE id = ?');
    const existing = checkStmt.get(req.params.id);

    // Return 404 if not found
    if (!existing) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const data = JSON.stringify(req.body);
    const now = new Date().toISOString();

    const stmt = db.prepare(
        'UPDATE settings SET data = ?, updated_at = ? WHERE id = ?'
    );
    stmt.run(data, now, req.params.id);

    res.json({
               id: req.params.id,
               data: req.body,
               updatedAt: now
             });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * DELETE - DELETE /settings/:id
 *
 * Removes a settings object. This operation is IDEMPOTENT:
 * - Always returns 204 No Content, even if the ID doesn't exist
 * - Calling delete multiple times has the same effect as calling it once
 *
 * @param {string} id - UUID of the settings object to delete
 * @returns {204} No content (success, even if nothing was deleted)
 * @returns {500} Server error if delete fails
 */
app.delete('/settings/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM settings WHERE id = ?');
    stmt.run(req.params.id);

    // Always return 204 for idempotent behavior
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete settings' });
  }
});

/**
 * HEALTH CHECK - GET /health
 *
 * Simple endpoint to verify the API is running.
 * Used by Docker healthcheck.
 *
 * @returns {200} { status: 'ok' }
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});