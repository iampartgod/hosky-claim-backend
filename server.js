require('dotenv').config();
const express = require('express');
const basicAuth = require('express-basic-auth');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 3000;

const db = new Database('./claims.db', { verbose: console.log });

app.use(cors());
app.use(express.json());

// Basic auth middleware for /admin/dashboard
app.use('/admin/dashboard', basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true,
  unauthorizedResponse: 'Unauthorized',
}));

// Your existing API endpoints

app.post('/check-claim', (req, res) => {
  const { claimId } = req.body;
  if (!claimId) {
    return res.json({ success: false, message: "No claimId provided" });
  }
  const stmt = db.prepare('SELECT * FROM claim_codes WHERE code = ? AND used = 0');
  const row = stmt.get(claimId.toUpperCase());

  if (row) {
    // Mark as used
    const update = db.prepare('UPDATE claim_codes SET used = 1 WHERE code = ?');
    update.run(claimId.toUpperCase());
    return res.json({ success: true, message: row.message });
  } else {
    return res.json({ success: false, message: "Invalid or used Claim ID" });
  }
});

app.post('/submit-discord', (req, res) => {
  const { claimId, discord } = req.body;
  if (!claimId || !discord) {
    return res.json({ success: false, message: "Missing claimId or discord username" });
  }

  try {
    // Insert or update discord username linked to claimId
    const insert = db.prepare(`
      INSERT INTO discord_users (claim_code, discord_username) 
      VALUES (?, ?) 
      ON CONFLICT(claim_code) DO UPDATE SET discord_username = excluded.discord_username
    `);
    insert.run(claimId.toUpperCase(), discord);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Database error" });
  }
});

app.get('/claims-left', (req, res) => {
  const stmt = db.prepare('SELECT COUNT(*) AS count FROM claim_codes WHERE used = 0');
  const row = stmt.get();
  res.json({ count: row.count });
});

// Admin dashboard page
app.get('/admin/dashboard', (req, res) => {
  try {
    // Get all claimed codes and linked discord usernames
    const rows = db.prepare(`
      SELECT c.code, c.message, d.discord_username 
      FROM claim_codes c
      LEFT JOIN discord_users d ON c.code = d.claim_code
      WHERE c.used = 1
      ORDER BY c.code ASC
    `).all();

    // Simple HTML table of claimed codes + discord usernames
    let html = `
      <html>
        <head>
          <title>Admin Dashboard - HOSKY Claims</title>
          <style>
            body { font-family: monospace; padding: 2rem; background: #000044; color: white; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #00aaff; padding: 8px; text-align: left; }
            th { background-color: #004488; }
          </style>
        </head>
        <body>
          <h1>Claimed Codes Dashboard</h1>
          <table>
            <thead>
              <tr><th>Claim Code</th><th>Message</th><th>Discord Username</th></tr>
            </thead>
            <tbody>
    `;

    for (const row of rows) {
      html += `<tr>
        <td>${row.code}</td>
        <td>${row.message}</td>
        <td>${row.discord_username || '-'}</td>
      </tr>`;
    }

    html += `
            </tbody>
          </table>
        </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error'
