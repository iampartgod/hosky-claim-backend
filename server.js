const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = new Database('claims.db');

// Read admin credentials from environment variables or fallback defaults
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'changeme';

// Basic Auth middleware for /admin routes
app.use('/admin', basicAuth({
  users: { [adminUser]: adminPass },
  challenge: true,
  unauthorizedResponse: (req) => 'Unauthorized'
}));

// Endpoint to submit Discord username
app.post('/submit-discord', (req, res) => {
  const { claimId, discord } = req.body;
  if (!claimId || !discord) {
    return res.status(400).json({ success: false, message: "Missing claimId or discord username." });
  }
  try {
    const result = db.prepare("UPDATE claim_codes SET discord = ? WHERE code = ?").run(discord, claimId.toUpperCase());
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Claim ID not found." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Admin dashboard to view codes + Discord usernames
app.get('/admin/dashboard', (req, res) => {
  try {
    const rows = db.prepare('SELECT code, discord FROM claim_codes WHERE discord IS NOT NULL').all();
    let html = `
      <h1>HOSKY Claim Discord Dashboard</h1>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr><th>Claim Code</th><th>Discord Username</th></tr>
    `;

    for (const row of rows) {
      html += `<tr><td>${row.code}</td><td>${row.discord}</td></tr>`;
    }
    html += '</table>';
    res.send(html);
  } catch (err) {
    res.status(500).send('Server error loading dashboard.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
