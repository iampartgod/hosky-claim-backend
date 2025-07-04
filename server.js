import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = new Database('./claims.db', { verbose: console.log });

// Check a claim code
app.post('/check-claim', (req, res) => {
  try {
    const { claimId } = req.body;
    if (!claimId) return res.status(400).json({ success: false, message: 'No claimId provided' });

    const stmt = db.prepare('SELECT used, message FROM claim_codes WHERE code = ?');
    const row = stmt.get(claimId);

    if (!row) {
      return res.json({ success: false, message: 'Invalid claim code' });
    }

    if (row.used) {
      return res.json({ success: false, message: 'Claim code already used' });
    }

    // Mark as used
    const update = db.prepare('UPDATE claim_codes SET used = 1 WHERE code = ?');
    update.run(claimId);

    return res.json({ success: true, message: row.message });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Save Discord username for a claim
app.post('/submit-discord', (req, res) => {
  try {
    const { claimId, discord } = req.body;
    if (!claimId || !discord) return res.status(400).json({ success: false, message: 'Missing claimId or discord' });

    // Save discord username linked to claimId, ignoring duplicates (optional: implement logic to update if needed)
    const insert = db.prepare('INSERT INTO discord_submissions (claim_code, discord_username) VALUES (?, ?)');
    insert.run(claimId, discord);

    return res.json({ success: true, message: 'Discord username saved' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
