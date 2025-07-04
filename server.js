const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('claims.db');

app.use(cors());
app.use(bodyParser.json());

app.post('/check-claim', (req, res) => {
  const claimId = (req.body.claimId || '').toUpperCase();

  if (!claimId) {
    return res.json({ success: false, message: 'Invalid claim code.' });
  }

  // Look up the claim code in DB
  const row = db.prepare('SELECT used, message FROM claim_codes WHERE code = ?').get(claimId);

  if (!row) {
    return res.json({ success: false, message: 'Claim code not found.' });
  }

  if (row.used) {
    return res.json({ success: false, message: 'Claim code already used.' });
  }

  // Mark the claim as used
  db.prepare('UPDATE claim_codes SET used = 1 WHERE code = ?').run(claimId);

  // Return success with the exact message stored
  res.json({ success: true, message: row.message });
});

// Your other routes here...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
