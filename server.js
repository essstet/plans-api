const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database('plans.db');

// Создаём таблицу если нет
db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    manager_id TEXT NOT NULL,
    manager_name TEXT NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    plan_amount REAL NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(client_id, manager_id, month, year)
  )
`);

// GET — получить планы по client_id
app.get('/plans', (req, res) => {
  const { client_id, year, month } = req.query;
  if (!client_id) return res.status(400).json({ error: 'client_id required' });
  
  let query = 'SELECT * FROM plans WHERE client_id = ?';
  const params = [client_id];
  
  if (year) { query += ' AND year = ?'; params.push(year); }
  if (month) { query += ' AND month = ?'; params.push(month); }
  
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// POST — сохранить план
app.post('/plans', (req, res) => {
  const { client_id, manager_id, manager_name, month, year, plan_amount } = req.body;
  
  if (!client_id || !manager_id || !month || !year || plan_amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const stmt = db.prepare(`
    INSERT INTO plans (client_id, manager_id, manager_name, month, year, plan_amount, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(client_id, manager_id, month, year)
    DO UPDATE SET plan_amount = excluded.plan_amount, updated_at = datetime('now')
  `);
  
  stmt.run(client_id, manager_id, manager_name, month, year, plan_amount);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Plans API running on port ${PORT}`));