const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

let claimCodes = {};

try {
  if (process.env.CLAIM_CODES) {
    claimCodes = JSON.parse(process.env.CLAIM_CODES);
    console.log('✅ CLAIM_CODES loaded successfully');
  } else {
    console.warn('⚠️ CLAIM_CODES environment variable is missing.');
  }
} catch (err) {
  console.error('❌ Failed to parse CLAIM_CODES from env:', err);
}

const claimsLogFile = 'claims.log';

function logClaim(code, discord) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - CODE: ${code} - DISCORD: ${discord || 'N/A'}\n`;
  fs.appendFile(claimsLogFile, logEntry, (err) => {
    if (err) {
      console.error('Failed to log claim:', err);
    }
  });
}

app.post('/claim', async (req, res) => {
  const { code, discord } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Claim ID not recognized.');
  }

  const normalizedCode = code.trim().toUpperCase();
  const rewardMessage = claimCodes[normalizedCode];

  if (!rewardMessage) {
    return res.status(404).send('Claim ID not recognized.');
  }

  logClaim(normalizedCode, discord);

  res.send(rewardMessage);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});