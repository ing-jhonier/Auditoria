PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY,
 username TEXT NOT NULL UNIQUE COLLATE NOCASE,
 display_name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('Bodega y logística','Gerencia')),
 password_algorithm TEXT NOT NULL CHECK(password_algorithm='sha256'),
 password_salt TEXT NOT NULL DEFAULT '', -- vacio intencional: SHA-256 directo sin sal
 password_hash TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 created_at TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS lots (
 id TEXT PRIMARY KEY,
 coffee TEXT NOT NULL,
 origin TEXT NOT NULL,
 roast_date TEXT NOT NULL,
 expiry_date TEXT NOT NULL,
 quantity TEXT NOT NULL,
 created_by INTEGER NOT NULL REFERENCES users(id),
 created_at TEXT NOT NULL,
 CHECK(expiry_date > roast_date)
) STRICT;
CREATE TABLE IF NOT EXISTS login_throttles (
 login_key TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL DEFAULT 0,
 blocked_until TEXT,
 updated_at TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS audit_events (
 id INTEGER PRIMARY KEY,
 user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 actor TEXT NOT NULL,
 role TEXT,
 event_type TEXT NOT NULL,
 outcome TEXT NOT NULL CHECK(outcome IN ('success','failure')),
 detail TEXT NOT NULL,
 created_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_lots_expiry ON lots(expiry_date);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at DESC);
