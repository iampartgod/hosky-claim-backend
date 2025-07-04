const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Open (or create) SQLite DB file
const db = new Database('claims.db');

// Create table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS claim_codes (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0
  )
`).run();

// Insert initial winning codes (run once)
const insert = db.prepare('INSERT OR IGNORE INTO claim_codes (id, message) VALUES (?, ?)');

// Endpoint to check claim
app.post('/check-claim', (req, res) => {
  const claimId = (req.body.claimId || '').toUpperCase().trim();

  if (!claimId || claimId.length < 4) {
    return res.status(400).json({ success: false, message: 'Invalid claim ID' });
  }

  // Get claim from DB
  const claim = db.prepare('SELECT * FROM claim_codes WHERE id = ?').get(claimId);

  if (!claim) {
    return res.json({ success: false, message: 'Invalid claim ID. No prize here.' });
  }

  if (claim.used) {
    return res.json({ success: false, message: 'This claim ID has already been used.' });
  }

  // Mark claim as used
  db.prepare('UPDATE claim_codes SET used = 1 WHERE id = ?').run(claimId);

  return res.json({ success: true, message: claim.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
