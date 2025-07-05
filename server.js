const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config({ path: './env.env' }); // Use your custom env filename

const app = express();
app.use(cors());
app.use(bodyParser.json());

let claimCodes = {};

// Load CLAIM_CODES from environment variable
try {
  if (process.env.CLAIM_CODES) {
    claimCodes = JSON.parse(process.env.CLAIM_CODES);
    console.log('✅ Claim codes loaded successfully from env.');
  } else {
    console.warn('⚠️ CLAIM_CODES not found in environment variables.');
  }
} catch (err) {
  console.error('❌ Failed to parse CLAIM_CODES from env:', err.message);
}

const usedCodes = new Set();

app.post('/claim', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'No code provided.' });

  const codeUpper = code.toUpperCase();

  if (usedCodes.has(codeUpper)) {
    return res.status(400).json({ success: false, message: 'Code has already been claimed.' });
  }

  if (claimCodes[codeUpper]) {
    usedCodes.add(codeUpper);
    const [message, amount] = claimCodes[codeUpper];
    return res.json({ success: true, message, amount });
  } else {
    return res.status(404).json({ success: false, message: 'Claim ID not recognized.' });
  }
});

// Fallback route
app.get('/', (req, res) => {
  res.send('🚀 HOSKY Claim API is running!');
});

// Start the server
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});