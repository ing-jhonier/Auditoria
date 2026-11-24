import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { db, databasePath } from "./db/index.js";
import { createPasswordHash, verifyPassword } from "./passwords.js";

const HOST = process.env.API_HOST || "127.0.0.1";
const PORT = Number(process.env.API_PORT || 3000);
const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:5173";
const SESSION_HOURS = 8;
const MAX_ATTEMPTS = 5;
const BLOCK_MINUTES = 15;
const dummy = createPasswordHash(randomBytes(32).toString("hex"));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const nowIso = () => new Date().toISOString();
const hashToken = (value) => createHash("sha256").update(value).digest("hex");
const statements = {
  user: db.prepare(
    "SELECT id,username,display_name,role,password_salt,password_hash,active FROM users WHERE username=? COLLATE NOCASE",
  ),
  throttle: db.prepare(
    "SELECT attempts,blocked_until FROM login_throttles WHERE login_key=?",
  ),
  bumpThrottle: db.prepare(
    `INSERT INTO login_throttles(login_key,attempts,blocked_until,updated_at) VALUES(?,1,NULL,?) ON CONFLICT(login_key) DO UPDATE SET attempts=login_throttles.attempts+1,blocked_until=CASE WHEN login_throttles.attempts+1>=? THEN ? ELSE login_throttles.blocked_until END,updated_at=excluded.updated_at`,
  ),
  clearThrottle: db.prepare("DELETE FROM login_throttles WHERE login_key=?"),
  session: db.prepare(
    `SELECT s.expires_at,u.id,u.username,u.display_name,u.role,u.active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?`,
  ),
  audit: db.prepare(
    "INSERT INTO audit_events(user_id,actor,role,event_type,outcome,detail,created_at) VALUES(?,?,?,?,?,?,?)",
  ),
};

function json(res, status, data, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    ...headers,
  });
  res.end(JSON.stringify(data));
}
function fail(res, status, message) {
  json(res, status, { error: message });
}
function audit({
  userId = null,
  actor = "Desconocido",
  role = null,
  event,
  outcome,
  detail,
}) {
  statements.audit.run(userId, actor, role, event, outcome, detail, nowIso());
}
function requestCookie(req, name) {
  const prefix = `${name}=`;
  return (
    (req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix))
      ?.slice(prefix.length) || ""
  );
}
function currentUser(req) {
  const token = requestCookie(req, "sid");
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const tokenHash = hashToken(token);
  const row = statements.session.get(tokenHash);
  if (!row) return null;
  if (row.expires_at <= nowIso() || !row.active) {
    db.prepare("DELETE FROM sessions WHERE token_hash=?").run(tokenHash);
    return null;
  }
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    tokenHash,
  };
}
function requireUser(req, res) {
  const user = currentUser(req);
  if (!user) {
    fail(res, 401, "Inicia sesión para continuar.");
    return null;
  }
  return user;
}
function requireRole(user, allowed, res) {
  if (!allowed.includes(user.role)) {
    fail(res, 403, "No tienes permiso para realizar esta acción.");
    return false;
  }
  return true;
}
function checkOrigin(req) {
  if (req.headers.origin !== APP_ORIGIN)
    throw new HttpError(403, "Solicitud de origen no permitido.");
}
async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 32768)
      throw new HttpError(413, "La solicitud es demasiado grande.");
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "El cuerpo de la solicitud no es JSON válido.");
  }
}
function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name ?? user.displayName,
    role: user.role,
  };
}
function dateInBogota() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}
function lotRow(row) {
  const today = dateInBogota();
  const days = Math.floor(
    (Date.parse(`${row.expiry_date}T00:00:00Z`) -
      Date.parse(`${today}T00:00:00Z`)) /
      86400000,
  );
  return {
    id: row.id,
    coffee: row.coffee,
    origin: row.origin,
    roastDate: row.roast_date,
    expiryDate: row.expiry_date,
    quantity: row.quantity,
    state: days < 0 ? "Vencido" : days <= 30 ? "Próximo a vencer" : "Vigente",
  };
}
function cookie(token, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `sid=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}
function validDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}

async function handle(req, res) {
  const { pathname } = new URL(req.url || "/", "http://localhost");
  if (req.method === "GET" && pathname === "/api/health")
    return json(res, 200, { status: "ok" });
  if (req.method === "GET" && pathname === "/api/auth/session") {
    const user = currentUser(req);
    return json(res, 200, { user: user ? publicUser(user) : null });
  }
  if (req.method === "POST" && pathname === "/api/auth/login") {
    checkOrigin(req);
    const body = await readJson(req);
    const username =
      typeof body.username === "string"
        ? body.username.trim().slice(0, 254)
        : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password || password.length > 1024)
      return fail(res, 400, "Completa usuario y contraseña.");
    const loginKey = hashToken(username.toLocaleLowerCase("es-CO"));
    const throttle = statements.throttle.get(loginKey);
    if (throttle?.blocked_until && throttle.blocked_until > nowIso()) {
      audit({
        actor: username,
        event: "login",
        outcome: "failure",
        detail: "Intento durante bloqueo temporal",
      });
      return fail(
        res,
        429,
        "Acceso temporalmente bloqueado. Intenta más tarde.",
      );
    }
    if (throttle?.blocked_until && throttle.blocked_until <= nowIso())
      statements.clearThrottle.run(loginKey);
    const user = statements.user.get(username);
    const valid = user
      ? await verifyPassword(password, user.password_salt, user.password_hash)
      : await verifyPassword(password, dummy.salt, dummy.hash);
    if (!user || !user.active || !valid) {
      const blockedUntil = new Date(
        Date.now() + BLOCK_MINUTES * 60000,
      ).toISOString();
      statements.bumpThrottle.run(
        loginKey,
        nowIso(),
        MAX_ATTEMPTS,
        blockedUntil,
      );
      audit({
        userId: user?.id ?? null,
        actor: username,
        role: user?.role ?? null,
        event: "login",
        outcome: "failure",
        detail: "Credenciales rechazadas",
      });
      return fail(res, 401, "Usuario o contraseña incorrectos.");
    }
    statements.clearThrottle.run(loginKey);
    const token = randomBytes(32).toString("base64url");
    const created = nowIso();
    const expires = new Date(
      Date.now() + SESSION_HOURS * 3600000,
    ).toISOString();
    db.prepare(
      "INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)",
    ).run(hashToken(token), user.id, created, expires);
    audit({
      userId: user.id,
      actor: user.username,
      role: user.role,
      event: "login",
      outcome: "success",
      detail: "Inicio de sesión",
    });
    return json(
      res,
      200,
      { user: publicUser(user) },
      { "Set-Cookie": cookie(token, SESSION_HOURS * 3600) },
    );
  }
  if (req.method === "POST" && pathname === "/api/auth/logout") {
    checkOrigin(req);
    const user = currentUser(req);
    if (user) {
      audit({
        userId: user.id,
        actor: user.username,
        role: user.role,
        event: "logout",
        outcome: "success",
        detail: "Cierre de sesión",
      });
      db.prepare("DELETE FROM sessions WHERE token_hash=?").run(user.tokenHash);
    }
    return json(res, 200, { ok: true }, { "Set-Cookie": cookie("", 0) });
  }
  if (req.method === "GET" && pathname === "/api/lots") {
    const user = requireUser(req, res);
    if (!user) return;
    const rows = db
      .prepare(
        "SELECT id,coffee,origin,roast_date,expiry_date,quantity FROM lots ORDER BY expiry_date ASC",
      )
      .all();
    return json(res, 200, { lots: rows.map(lotRow) });
  }
  if (req.method === "POST" && pathname === "/api/lots") {
    checkOrigin(req);
    const user = requireUser(req, res);
    if (!user) return;
    if (!requireRole(user, ["Bodega y logística"], res)) return;
    const b = await readJson(req);
    const fields = ["id", "coffee", "origin", "quantity"];
    if (
      fields.some((f) => typeof b[f] !== "string" || !b[f].trim()) ||
      !validDate(b.roastDate) ||
      !validDate(b.expiryDate) ||
      b.expiryDate <= b.roastDate
    )
      return fail(res, 400, "Revisa los campos y las fechas del lote.");
    const values = [
      b.id.trim(),
      b.coffee.trim(),
      b.origin.trim(),
      b.roastDate,
      b.expiryDate,
      b.quantity.trim(),
    ];
    if (
      values[0].length > 40 ||
      values[1].length > 120 ||
      values[2].length > 160 ||
      values[5].length > 40
    )
      return fail(res, 400, "Uno o más campos exceden el tamaño permitido.");
    try {
      db.prepare(
        "INSERT INTO lots(id,coffee,origin,roast_date,expiry_date,quantity,created_by,created_at) VALUES(?,?,?,?,?,?,?,?)",
      ).run(...values, user.id, nowIso());
    } catch (error) {
      if (
        error.errcode === 1555 ||
        error.errcode === 2067 ||
        error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" ||
        error.code === "SQLITE_CONSTRAINT_UNIQUE"
      )
        return fail(res, 409, "Ya existe un lote con ese identificador.");
      throw error;
    }
    audit({
      userId: user.id,
      actor: user.displayName,
      role: user.role,
      event: "lot.create",
      outcome: "success",
      detail: `Registro de lote ${values[0]}`,
    });
    return json(res, 201, {
      lot: lotRow({
        id: values[0],
        coffee: values[1],
        origin: values[2],
        roast_date: values[3],
        expiry_date: values[4],
        quantity: values[5],
      }),
    });
  }
  if (req.method === "GET" && pathname === "/api/reports/expiry") {
    const user = requireUser(req, res);
    if (!user) return;
    if (!requireRole(user, ["Gerencia"], res)) return;
    const allLots = db
      .prepare(
        "SELECT id,coffee,origin,roast_date,expiry_date,quantity FROM lots",
      )
      .all()
      .map(lotRow);
    return json(res, 200, {
      total: allLots.length,
      current: allLots.filter((lot) => lot.state === "Vigente").length,
      soon: allLots.filter((lot) => lot.state === "Próximo a vencer").length,
      expired: allLots.filter((lot) => lot.state === "Vencido").length,
      generatedAt: nowIso(),
    });
  }
  if (req.method === "GET" && pathname === "/api/activity") {
    const user = requireUser(req, res);
    if (!user) return;
    if (!requireRole(user, ["Gerencia"], res)) return;
    const events = db
      .prepare(
        "SELECT actor,role,event_type,outcome,detail,created_at FROM audit_events ORDER BY id DESC LIMIT 100",
      )
      .all();
    return json(res, 200, {
      events: events.map((e) => ({
        who: e.actor,
        role: e.role,
        type: e.event_type,
        outcome: e.outcome,
        detail: e.detail,
        time: new Date(e.created_at).toLocaleString("es-CO", {
          timeZone: "America/Bogota",
        }),
      })),
    });
  }
  if (pathname.startsWith("/api/"))
    return fail(res, 404, "Recurso no encontrado.");
  if (process.env.NODE_ENV === "production" && req.method === "GET")
    return serveStatic(pathname, res);
  return fail(res, 404, "Recurso no encontrado.");
}

function serveStatic(pathname, res) {
  const root = resolve("dist");
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return fail(res, 400, "Ruta inválida.");
  }
  let file = resolve(root, `.${decoded}`);
  if (file !== root && !file.startsWith(`${root}${sep}`))
    return fail(res, 403, "Acceso denegado.");
  try {
    if (!statSync(file).isFile()) file = resolve(root, "index.html");
  } catch {
    file = resolve(root, "index.html");
  }
  try {
    const body = readFileSync(file);
    const types = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".ico": "image/x-icon",
    };
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(body);
  } catch {
    fail(res, 404, "Recurso no encontrado.");
  }
}

const server = createServer((req, res) => {
  handle(req, res).catch((error) => {
    if (res.headersSent) return res.destroy();
    if (error instanceof HttpError)
      return fail(res, error.status, error.message);
    console.error("Error interno de API:", error.message);
    return fail(res, 500, "Ocurrió un error interno.");
  });
});
server.listen(PORT, HOST, () =>
  console.log(
    `API escuchando en http://${HOST}:${PORT} (SQLite: ${databasePath})`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
