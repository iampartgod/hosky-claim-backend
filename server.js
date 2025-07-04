const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = new Database('claims.db');

// Submit Discord username (still used)
app.post('/submit-discord', (req, res) => {
  const { code, discord } = req.body;

  if (!code || !discord) {
    return res.status(400).json({ success: false, message: "Missing code or Discord name." });
  }

  try {
    const result = db.prepare("UPDATE claim_codes SET discord = ? WHERE code = ?").run(discord, code.toUpperCase());
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Claim ID not found." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Optional: health check
app.get('/', (req, res) => {
  res.send('HOSKY Claim Backend is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
