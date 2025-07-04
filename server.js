const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = new Database('claims.db');

// Check if a claim code is valid and unused
app.post('/check-claim', (req, res) => {
  const { claimId } = req.body;

  const stmt = db.prepare("SELECT * FROM claim_codes WHERE code = ? AND used = 0");
  const row = stmt.get(claimId.toUpperCase());

  if (row) {
    // Mark code as used
    db.prepare("UPDATE claim_codes SET used = 1 WHERE code = ?").run(claimId.toUpperCase());
    res.json({ success: true, message: row.message });
  } else {
    res.json({ success: false, message: "Invalid or already used Claim ID." });
  }
});

// Submit Discord username
app.post('/submit-discord', (req, res) => {
  const { code, discord } = req.body;
  db.prepare("UPDATE claim_codes SET discord = ? WHERE code = ?").run(discord, code.toUpperCase());
  res.json({ success: true });
});

app.get('/claims-left', (req, res) => {
  const stmt = db.prepare('SELECT COUNT(*) AS count FROM claim_codes WHERE used = 0');
  const row = stmt.get();
  res.json({ claimsLeft: row.count });
});

// ✅ GET claims-left route
app.get('/claims-left', (req, res) => {
  try {
    const result = db.prepare("SELECT COUNT(*) as remaining FROM claim_codes WHERE used = 0").get();
    res.json({ remaining: result.remaining });
  } catch (err) {
    console.error("Error in /claims-left:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
