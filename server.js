const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Database = require("better-sqlite3");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new Database("./claims.db");

// Create table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS claim_codes (
    code TEXT PRIMARY KEY,
    used INTEGER DEFAULT 0,
    message TEXT
  )
`).run();

// Example seed data (run once, comment out after seeding)
const seedData = [
  { code: "DEEZNUTS", message: "🌰 Congrats! You won 6,900,420 HOSKY!" },
  { code: "WEN10K", message: "🚀 10K soon? You just earned 4,200,000 HOSKY!" },
  { code: "CERFCERF", message: "🐸 CERF vibes! You got 6,000,000 HOSKY!" },
  { code: "HOSKY", message: "🐶 Big Doge Energy! You hit 5,000,000 HOSKY!" },
  { code: "BUSYBUSY", message: "💼 Hustle pays. 5,000,000 HOSKY for you!" }
];

// Insert seed data if not present (comment this block out after first run)
for (const item of seedData) {
  db.prepare("INSERT OR IGNORE INTO claim_codes (code, message) VALUES (?, ?)").run(item.code, item.message);
}

// POST /check-claim endpoint
app.post("/check-claim", (req, res) => {
  const { claimId } = req.body;
  if (!claimId || typeof claimId !== "string") {
    return res.status(400).json({ success: false, message: "Invalid request." });
  }

  const code = claimId.toUpperCase();

  try {
    const row = db.prepare("SELECT * FROM claim_codes WHERE code = ?").get(code);

    if (!row) {
      return res.json({ success: false, message: "Invalid Claim ID." });
    }

    if (row.used) {
      return res.json({ success: false, message: "This Claim ID has already been used." });
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

// GET /claims-left endpoint
app.get("/claims-left", (req, res) => {
  try {
    const row = db.prepare("SELECT COUNT(*) AS count FROM claim_codes WHERE used = 0").get();
    res.json({ success: true, count: row.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
