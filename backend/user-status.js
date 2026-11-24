import { db } from "./db/index.js";
const action = process.argv[2];
const username = process.argv[3]?.trim();
if (!["disable", "enable"].includes(action) || !username) {
  console.error("Uso: npm run user:status -- <disable|enable> <usuario>");
  process.exitCode = 1;
} else {
  const active = action === "enable" ? 1 : 0;
  const result = db
    .prepare("UPDATE users SET active=? WHERE username=? COLLATE NOCASE")
    .run(active, username);
  if (result.changes === 0) {
    console.error("No existe una cuenta con ese usuario.");
    process.exitCode = 1;
  } else {
    if (!active)
      db.prepare(
        "DELETE FROM sessions WHERE user_id=(SELECT id FROM users WHERE username=? COLLATE NOCASE)",
      ).run(username);
    console.log(
      `Cuenta ${username}: ${active ? "habilitada" : "deshabilitada"}.`,
    );
  }
}
db.close();
