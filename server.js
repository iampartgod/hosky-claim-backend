const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const { google } = require("googleapis");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./claims.db");

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // Your service account JSON file path
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID; // Set this in your environment variables
const SHEET_NAME = "Winners"; // Google Sheet tab name

// Append claimId + discordUsername to Google Sheet
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

// New route to check claim code validity and mark used
app.post("/check-claim", (req, res) => {
  const { claimId } = req.body;
  if (!claimId) {
    return res.status(400).json({ success: false, message: "Missing claimId" });
  }

  db.get("SELECT used, winnings FROM claim_codes WHERE code = ?", [claimId], (err, row) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (!row) {
      return res.json({ success: false, message: "Invalid claim code" });
    }

    if (row.used) {
      return res.json({ success: false, message: "This claim code has already been used" });
    }

    // Mark claim as used
    db.run("UPDATE claim_codes SET used = 1 WHERE code = ?", [claimId], (updateErr) => {
      if (updateErr) {
        console.error("DB update error:", updateErr);
        return res.status(500).json({ success: false, message: "Database update error" });
      }

      // Respond with winnings info
      res.json({ success: true, message: `Congrats! You won ${row.winnings} HOSKY.` });
    });
  });
});

// Endpoint to save Discord username linked to claimId
app.post("/submit-discord", async (req, res) => {
  const { claimId, discord } = req.body;
  if (!claimId || !discord) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  try {
    await appendToSheet(claimId, discord);
    res.json({ success: true, message: "Saved to Google Sheet" });
  } catch (err) {
    console.error("Google Sheets Error:", err);
    res.status(500).json({ success: false, message: "Failed to log to sheet" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
