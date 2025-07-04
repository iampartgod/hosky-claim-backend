// save as server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory store for demo (replace with real DB in production)
const winners = {
  DEEZNUTS: "🌰 Congrats! You won 6,900,420 HOSKY!",
  WEN10K: "🚀 10K soon? You just earned 4,200,000 HOSKY!",
  CERFCERF: "🐸 CERF vibes! You got 6,000,000 HOSKY!",
  HOSKY: "🐶 Big Doge Energy! You hit 5,000,000 HOSKY!",
  BUSYBUSY: "💼 Hustle pays. 5,000,000 HOSKY for you!",
  IAMPARTGOD: "💯 AW U FOUND MA CODE! RUGGED! 10,000,000 HOSKY FOR U IDJIOT"
};

const usedClaims = new Set();

app.post('/check-claim', (req, res) => {
  const claimId = (req.body.claimId || '').toUpperCase().trim();

  if (!claimId || claimId.length < 4) {
    return res.status(400).json({ success: false, message: 'Invalid claim ID' });
  }

  if (usedClaims.has(claimId)) {
    return res.json({ success: false, message: 'This claim ID has already been used.' });
  }

  if (winners[claimId]) {
    usedClaims.add(claimId);
    return res.json({ success: true, message: winners[claimId] });
  } else {
    return res.json({ success: false, message: 'Invalid claim ID. No prize here.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});