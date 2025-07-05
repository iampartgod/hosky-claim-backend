const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./claims.db");

// Load codes and winnings from external file for secrecy
const codesFile = path.join(__dirname, "codes.json");
let codes = {};
async function loadCodes() {
  try {
    const data = await fs.readFile(codesFile, "utf8");
    codes = JSON.parse(data);
    console.log("✅ Codes loaded successfully");
  } catch (err) {
    console.error("❌ Failed to load codes.json:", err);
    process.exit(1); // Stop server if codes are missing
  }
}

// Local file for saving Discord submissions
const submissionsFile = path.join(__dirname, "submissions.json");

// Helper to get code info
function getCodeInfo(code) {
  const upperCode = code.toUpperCase();
  return codes[upperCode] || null;
}

// Endpoint to check claim code
app.post("/check-claim", (req, res) => {
  const { claimId } = req.body;

  if (!claimId || typeof claimId !== "string") {
    return res.status(400).json({ success: false, message: "Invalid claim ID." });
  }

  // You can also add your SQLite db check logic here if you want to cross-check codes

  const codeInfo = getCodeInfo(claimId);

  if (codeInfo) {
    return res.json({ success: true, message: codeInfo.message });
  } else {
    return res.json({ success: false, message: "Claim ID not recognized." });
  }
});

// Endpoint to save Discord username locally
app.post("/submit-discord", async (req, res) => {
  const { claimId, discord } = req.body;

  if (!claimId || !discord) {
    return res.status(400).json({ success: false, message: "Missing claim ID or Discord username." });
  }

  try {
    // Load existing submissions or create empty array
    let submissions = [];
    try {
      const data = await fs.readFile(submissionsFile, "utf8");
      submissions = JSON.parse(data);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }

    // Append new submission with timestamp
    submissions.push({ claimId, discord, timestamp: new Date().toISOString() });

    // Write back to file
    await fs.writeFile(submissionsFile, JSON.stringify(submissions, null, 2), "utf8");

    return res.json({ success: true, message: "Discord username saved locally." });
  } catch (err) {
    console.error("Error saving submission:", err);
    return res.status(500).json({ success: false, message: "Failed to save Discord username." });
  }
});

app.listen(PORT, async () => {
  await loadCodes();
  console.log(`✅ Server running on port ${PORT}`);
});
