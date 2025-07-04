const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Database = require("better-sqlite3");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new Database("./claims.db");

// Initialize the table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS claim_codes (
    code TEXT PRIMARY KEY,
    used INTEGER DEFAULT 0,
    message TEXT
  )
`).run();

app.post("/check-claim", (req, res) => {
  const { claimId } = req.body;
  if (!claimId || typeof claimId !== "string") {
    return res.status(400).json({ success: false, message: "Invalid request." });
  }

  const code = claimId.toUpperCase();

  try {
    const row = db.prepare("SELECT * FROM claim_codes WHERE code = ?").get(code);

    if (!row) {
      return res.json({ success: false, message: "Invalid Scratcher ID Idjiot." });
    }

    if (row.used) {
      return res.json({ success: false, message: "Sorry IDJIOT! This Claim ID has already been used." });
    }

    // Mark as used
    db.prepare("UPDATE claim_codes SET used = 1 WHERE code = ?").run(code);

    return res.json({
      success: true,
      message: row.message || "🎉 You have claimed your HOSKY reward!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
