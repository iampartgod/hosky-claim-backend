const Database = require("better-sqlite3");
const db = new Database("./claims.db");

try {
  const info = db.prepare("UPDATE claim_codes SET used = 0").run();
  console.log(`Reset complete. Rows affected: ${info.changes}`);
} catch (error) {
  console.error("Error resetting codes:", error);
}
