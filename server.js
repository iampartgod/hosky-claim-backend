const express = require('express');
const basicAuth = require('express-basic-auth');
const Database = require('better-sqlite3');
const app = express();

const db = new Database('claims.db');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password';

app.use(express.json());

// Your existing routes here (check-claim, submit-discord, etc.)

// Admin dashboard route with basic auth
app.use('/admin/dashboard', basicAuth({
  users: { [ADMIN_USER]: ADMIN_PASS },
  challenge: true,
  unauthorizedResponse: (req) => 'Unauthorized'
}));

app.get('/admin/dashboard', (req, res) => {
  try {
    const rows = db.prepare('SELECT claim_code, discord_username, used FROM claim_codes').all();

    let html = `
      <html>
      <head>
        <title>HOSKY Admin Dashboard</title>
        <style>
          body { font-family: monospace; background: #111; color: #0ff; padding: 1rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #0ff; padding: 0.5rem; text-align: left; }
          th { background: #004466; }
        </style>
      </head>
      <body>
        <h1>HOSKY Admin Dashboard</h1>
        <table>
          <thead>
            <tr>
              <th>Claim Code</th>
              <th>Discord Username</th>
              <th>Used</th>
            </tr>
          </thead>
          <tbody>
    `;

    rows.forEach(row => {
      html += `
        <tr>
          <td>${row.claim_code}</td>
          <td>${row.discord_username || '-'}</td>
          <td>${row.used ? 'Yes' : 'No'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Start your server here as usual
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
