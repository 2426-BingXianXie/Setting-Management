/**
 * app.js - Express Application Setup
 *
 * Separated from index.js to allow testing without starting the server.
 * Exports the Express app instance for use in tests.
 */

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Middleware Configuration
app.use(cors());
app.use(express.json());

// Database Initialization
// Use test database if in test environment
const dbPath = process.env.NODE_ENV === 'test'
               ? ':memory:'
               : './data/settings.db';

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Helper Functions
const parseRow = (row) => ({
  id: row.id,
  data: JSON.parse(row.data),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Export for testing - allows clearing database between tests
export const clearDatabase = () => {
  db.exec('DELETE FROM settings');
};

// API Endpoints
// CREATE - POST /settings
app.post('/settings', (req, res) => {
  try {
    const id = uuidv4();
    const data = JSON.stringify(req.body);
    const now = new Date().toISOString();

    const stmt = db.prepare(
        'INSERT INTO settings (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, data, now, now);

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

// READ ALL - GET /settings (with pagination)
app.get('/settings', (req, res) => {
  try {
    // Parse pagination parameters with defaults
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 5;

    // Ensure page and limit are at least 1
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;

    const offset = (page - 1) * limit;

    const countStmt = db.prepare('SELECT COUNT(*) as total FROM settings');
    const { total } = countStmt.get();

    const stmt = db.prepare(
        'SELECT * FROM settings ORDER BY created_at DESC LIMIT ? OFFSET ?'
    );
    const rows = stmt.all(limit, offset);

    res.json({
               data: rows.map(parseRow),
               pagination: {
                 page,
                 limit,
                 total,
                 totalPages: Math.ceil(total / limit) || 1
               }
             });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// READ ONE - GET /settings/:id
app.get('/settings/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM settings WHERE id = ?');
    const row = stmt.get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json(parseRow(row));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// UPDATE - PUT /settings/:id
app.put('/settings/:id', (req, res) => {
  try {
    const checkStmt = db.prepare('SELECT id FROM settings WHERE id = ?');
    const existing = checkStmt.get(req.params.id);

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

// DELETE - DELETE /settings/:id (idempotent)
app.delete('/settings/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM settings WHERE id = ?');
    stmt.run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete settings' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;