const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "./env.env" }); // Use env.env instead of .env

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load claim codes from env
let claimCodes = {};
try {
  claimCodes = JSON.parse(process.env.CLAIM_CODES);
} catch (err) {
  console.error("❌ Failed to parse CLAIM_CODES from env.env:", err);
}

// Endpoint to check claim ID
app.post("/check-claim", (req, res) => {
  const { claimId } = req.body;
  if (!claimId) {
    return res.status(400).json({ success: false, message: "Missing claimId." });
  }

  const code = claimId.toUpperCase();

  if (claimCodes[code]) {
    return res.json({ success: true, message: claimCodes[code] });
  } else {
    return res.json({ success: false, message: "Claim ID not recognized." });
  }
});

// Endpoint to mock save Discord username
app.post("/submit-discord", (req, res) => {
  const { claimId, discord } = req.body;

  if (!claimId || !discord) {
    return res.status(400).json({ success: false, message: "Missing claimId or discord username." });
  }

  console.log(`✅ Discord username "${discord}" submitted for claim ID "${claimId}"`);
  return res.json({ success: true, message: "Discord username saved (mocked)." });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
