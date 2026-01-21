import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new Database('./data/settings.db');

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Helper to parse settings row
const parseRow = (row) => ({
  id: row.id,
  data: JSON.parse(row.data),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM settings');
    const { total } = countStmt.get();

    // Get paginated results
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
                 totalPages: Math.ceil(total / limit)
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
    // Check if exists
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

    // Always return 204, even if nothing was deleted (idempotent)
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete settings' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});