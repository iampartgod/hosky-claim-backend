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

// Load Google Sheets credentials
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // path to your downloaded JSON key
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;  // Make sure this is set in your env variables
const SHEET_NAME = "Winners"; // name of the sheet/tab in your Google Sheet

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

// Endpoint to receive Discord username and save to Google Sheet
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
