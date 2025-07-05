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

const db = new sqlite3.Database("./claims.db");

// Load Google Sheets credentials and auth
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // your downloaded JSON key, do NOT commit
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID; // your Google Sheet ID here
const SHEET_NAME = "Winners"; // tab name in your sheet

// Load claim codes and winnings from external JSON (not committed)
const codes = require("./codes.json");

// Function to append claim info to Google Sheet
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

// Endpoint to check claim validity and status
app.post("/check-claim", (req, res) => {
  const { claimId } = req.body;
  if (!claimId) {
    return res.status(400).json({ success: false, message: "Missing claim ID" });
  }
  const codeEntry = codes.find(c => c.code === claimId.toUpperCase());

  if (!codeEntry) {
    return res.json({ success: false, message: "Invalid claim code." });
  }
  if (codeEntry.used) {
    return res.json({ success: false, message: "Code already used." });
  }

  res.json({ success: true, message: codeEntry.winnings });
});

// Endpoint to submit Discord username
app.post("/submit-discord", async (req, res) => {
  const { claimId, discord } = req.body;
  if (!claimId || !discord) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  const codeEntry = codes.find(c => c.code === claimId.toUpperCase());
  if (!codeEntry) {
    return res.status(400).json({ success: false, message: "Invalid claim ID" });
  }
  if (codeEntry.used) {
    return res.status(400).json({ success: false, message: "Code already used" });
  }

  try {
    // Mark code as used
    codeEntry.used = true;

    // Append to Google Sheets
    await appendToSheet(claimId.toUpperCase(), discord);

    res.json({ success: true, message: "Saved to Google Sheet" });
  } catch (err) {
    console.error("Google Sheets Error:", err);
    res.status(500).json({ success: false, message: "Failed to log to sheet" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
