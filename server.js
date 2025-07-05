// server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Load env variables
require('dotenv').config({ path: './env.env' });
console.log('🔍 Raw CLAIM_CODES env var:', process.env.CLAIM_CODES && process.env.CLAIM_CODES.slice(0, 100) + '…');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// === STARTUP CHECK FOR CLAIM_CODES ===
if (!process.env.CLAIM_CODES) {
  console.error('❌ CLAIM_CODES not found in environment variables. Please set CLAIM_CODES before starting.');
  process.exit(1);
}

let claimCodes = {};
try {
  claimCodes = JSON.parse(process.env.CLAIM_CODES);
  console.log('✅ Loaded CLAIM_CODES successfully.');
} catch (err) {
  console.error('❌ Failed to parse CLAIM_CODES JSON:', err.message);
  process.exit(1);
}
// === END STARTUP CHECK ===

// File path for submissions storage
const submissionsFile = path.join(__dirname, 'submissions.json');

// Helper function to save submission data to JSON file
function saveSubmission(code, discord) {
  let submissions = [];

  try {
    if (fs.existsSync(submissionsFile)) {
      const data = fs.readFileSync(submissionsFile, 'utf8');
      submissions = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading submissions.json:', err);
  }

  submissions.push({
    code,
    discord,
    timestamp: new Date().toISOString(),
  });

  try {
    fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing submissions.json:', err);
  }
}

// Keep track of used codes in memory
const usedCodes = new Set();

// Claim endpoint
app.post('/claim', (req, res) => {
  const { code, discord } = req.body;
  if (!code || !discord) {
    return res.status(400).json({ success: false, message: 'Please provide both code and Discord handle.' });
  }

  const normalized = code.trim().toUpperCase();
  if (usedCodes.has(normalized)) {
    return res.status(400).json({ success: false, message: 'This code has already been claimed.' });
  }

  const reward = claimCodes[normalized];
  if (!reward) {
    return res.status(404).json({ success: false, message: 'Claim ID not recognized.' });
  }

  usedCodes.add(normalized);
  console.log(`✅ Code ${normalized} claimed by ${discord}`);

  saveSubmission(normalized, discord); // Save to submissions.json

  return res.json({ success: true, message: reward });
});

// Health check / root
app.get('/', (req, res) => {
  res.send('🚀 HOSKY Claim API is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
