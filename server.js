const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const { google } = require("googleapis");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Open or create the database
const db = new sqlite3.Database("./claims.db");

// Create the claim_codes table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS claim_codes (
  code TEXT PRIMARY KEY,
  used INTEGER DEFAULT 0,
  winnings TEXT
)`, (err) => {
  if (err) {
    console.error("Error creating claim_codes table:", err.message);
  } else {
    console.log("✅ claim_codes table is ready");
    
    // Insert sample data if table is empty
    db.get("SELECT COUNT(*) AS count FROM claim_codes", (err, row) => {
      if (err) {
        console.error("Error counting claim_codes rows:", err.message);
      } else if (row.count === 0) {
        const stmt = db.prepare("INSERT INTO claim_codes (code, used, winnings) VALUES (?, ?, ?)");
        stmt.run("IAMPARTGOD", 0, "10 HOSKY");
        stmt.run("ABC123", 0, "5 HOSKY");
        stmt.finalize();
        console.log("✅ Sample claim codes inserted");
      }
    });
  }
});

// Google Sheets auth setup
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // your service account JSON file path
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;  // from your .env file
const SHEET_NAME = "Winners";  // your sheet/tab name

async function appendToSheet(claimId, discordUsername) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:B`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[claimId, discordUsername]],
    },
  });
}

// API endpoint to check claim codes
app.post("/check-claim", (req, res) => {
  const claimId = req.body.claimId?.toUpperCase();

  if (!claimId) {
    return res.status(400).json({ success: false, message: "No claim ID provided" });
  }

  db.get("SELECT used, winnings FROM claim_codes WHERE code = ?", [claimId], (err, row) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (!row) {
      return res.json({ success: false, message: "Invalid claim code." });
    }

    if (row.used) {
      return res.json({ success: false, message: "This claim code has already been used." });
    }

    return res.json({ success: true, message: `Congrats! You won ${row.winnings}` });
  });
});

// API endpoint to submit Discord username and mark claim used
app.post("/submit-discord", async (req, res) => {
  const { claimId, discord } = req.body;

  if (!claimId || !discord) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  // Mark code as used
  db.run("UPDATE claim_codes SET used = 1 WHERE code = ?", [claimId], async (err) => {
    if (err) {
      console.error("DB update error:", err);
      return res.status(500).json({ success: false, message: "Failed to update claim status" });
    }

    try {
      await appendToSheet(claimId, discord);
      res.json({ success: true, message: "Saved to Google Sheet" });
    } catch (err) {
      console.error("Google Sheets Error:", err);
      res.status(500).json({ success: false, message: "Failed to log to sheet" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
