import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Coffee,
  Eye,
  EyeOff,
  FileText,
  Filter,
  KeyRound,
  Leaf,
  LockKeyhole,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Sprout,
  Timer,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";

type Role = "Bodega y logística" | "Gerencia";
type LotState = "Vigente" | "Próximo a vencer" | "Vencido";
type User = { id: number; username: string; displayName: string; role: Role };
type Lot = {
  id: string;
  coffee: string;
  origin: string;
  roastDate: string;
  expiryDate: string;
  quantity: string;
  state: LotState;
};
type Activity = {
  who: string;
  role: Role | null;
  detail: string;
  time: string;
  warning: boolean;
  outcome: "success" | "failure";
  type: string;
};
type ApiFailure = Error & { status?: number };

// Credencial sintetica visible unicamente en el bundle de desarrollo del laboratorio.
const AUDIT_LAB_CREDENTIAL = (import.meta as ImportMeta & { env: { DEV: boolean } }).env.DEV
  ? { username: "auditoria.lab", password: "cafe123" }
  : null;

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: "same-origin",
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el backend local. Confirma que ambos servicios estén iniciados.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw Object.assign(
      new Error(data.error || "No se pudo completar la solicitud."),
      { status: response.status },
    ) as ApiFailure;
  return data as T;
}
const dateLabel = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const todayLabel = () =>
  new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Bogota",
  });

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lots, setLots] = useState<Lot[]>([]);
  const [events, setEvents] = useState<Activity[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [report, setReport] = useState<{
    total: number;
    current: number;
    soon: number;
    expired: number;
  } | null>(null);
  const [nav, setNav] = useState("Resumen");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const role = currentUser?.role ?? "Gerencia";
  const isGerencia = role === "Gerencia";

  useEffect(() => {
    api<{ user: User | null }>("/auth/session")
      .then(({ user: active }) => setCurrentUser(active))
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setLots([]);
      setEvents([]);
      return;
    }
    let cancelled = false;
    setDataLoading(true);
    Promise.all([
      api<{ lots: Lot[] }>("/lots"),
      currentUser.role === "Gerencia"
        ? api<{ events: Activity[] }>("/activity")
        : Promise.resolve({ events: [] as Activity[] }),
    ])
      .then(([lotData, eventData]) => {
        if (cancelled) return;
        setLots(lotData.lots);
        setEvents(
          eventData.events.map((event) => ({
            ...event,
            warning: event.outcome === "failure",
          })),
        );
      })
      .catch((cause: Error) => {
        if (!cancelled) note(cause.message);
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "Gerencia" || nav !== "Reportes")
      return;
    api<{ total: number; current: number; soon: number; expired: number }>(
      "/reports/expiry",
    )
      .then(setReport)
      .catch((cause: Error) => note(cause.message));
  }, [currentUser, nav]);

  const filtered = useMemo(
    () =>
      lots.filter(
        (lot) =>
          `${lot.id} ${lot.coffee} ${lot.origin}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (filter === "Todos" || lot.state === filter),
      ),
    [lots, search, filter],
  );
  const counts = {
    current: lots.filter((lot) => lot.state === "Vigente").length,
    soon: lots.filter((lot) => lot.state === "Próximo a vencer").length,
    expired: lots.filter((lot) => lot.state === "Vencido").length,
  };
  const summary =
    nav === "Reportes" && report ? report : { ...counts, total: lots.length };
  const priorityLots = lots.filter((lot) => lot.state !== "Vigente");
  const visibleLots = nav === "Resumen" ? priorityLots.slice(0, 5) : nav === "Reportes" ? lots : filtered;
  function note(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user.trim() || !pass) {
      setError("Completa tu usuario y contraseña para continuar.");
      return;
    }
    setError("");
    if (
      AUDIT_LAB_CREDENTIAL &&
      user.trim().toLowerCase() === AUDIT_LAB_CREDENTIAL.username &&
      pass !== AUDIT_LAB_CREDENTIAL.password
    ) {
      setError("Usuario o contrase\u00f1a incorrectos.");
      setPass("");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api<{ user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: user.trim(), password: pass }),
      });
      setCurrentUser(result.user);
      setPass("");
      setNav("Resumen");
    } catch (cause) {
      const failure = cause as ApiFailure;
      setError(failure.status === 429 ? failure.message : failure.message);
      setPass("");
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST", body: "{}" });
      setCurrentUser(null);
      setProfileMenuOpen(false);
      setPass("");
      setUser("");
      setNav("Resumen");
      setError("");
    } catch (cause) {
      note((cause as Error).message);
    }
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      id: String(form.get("id")).trim(),
      coffee: String(form.get("coffee")).trim(),
      origin: String(form.get("origin")).trim(),
      roastDate: String(form.get("roast")),
      expiryDate: String(form.get("expiry")),
      quantity: String(form.get("kg")).trim(),
    };
    try {
      await api("/lots", { method: "POST", body: JSON.stringify(payload) });
      const result = await api<{ lots: Lot[] }>("/lots");
      setLots(result.lots);
      setModal(false);
      note("Lote guardado en la base de datos local.");
    } catch (cause) {
      note((cause as Error).message);
    }
  }

  if (!authReady)
    return (
      <div className="auth-loading">
        <Coffee size={22} />
        <span>Conectando con Cafés del Pacífico…</span>
      </div>
    );
  if (!currentUser)
    return (
      <div className="login">
        <section className="hero">
          <div className="grain" />
          <Brand />
          <span className="origin-label">
            ● CAFÉ DE ORIGEN · VALLE DEL CAUCA
          </span>
          <div className="hero-copy">
            <small>DESDE EL PACÍFICO, CON ORIGEN</small>
            <h1>
              Cada lote
              <br />
              cuenta una <em>historia.</em>
            </h1>
            <p>
              Del origen a tu taza, cuidamos cada detalle para que la frescura
              siempre se sienta.
            </p>
            <div className="landscape">
              <i />
              <b />
              <span>HUILA · PITALITO</span>
            </div>
          </div>
          <footer>
            CAFICULTURA CON PROPÓSITO <span>03°25′ N · 76°31′ O</span>
          </footer>
        </section>
        <main className="login-main">
          <div className="login-card">
            <div className="key-icon">
              <KeyRound size={19} />
            </div>
            <div className="center">
              <small>BIENVENIDO DE NUEVO</small>
              <h2>Ingresa a tu espacio</h2>
              <p>Accede al control de lotes y vencimientos.</p>
            </div>
            <form onSubmit={login}>
              <label>
                Usuario o correo
                <div className="field">
                  <Users size={16} />
                  <input
                    autoComplete="username"
                    placeholder="nombre@cafesdelpacifico.co"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </label>
              <label className="password-label">
                Contraseña
                <div className="field">
                  <LockKeyhole size={16} />
                  <input
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="eye"
                    onClick={() => setShow(!show)}
                    aria-label={
                      show ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              {error && (
                <div className="error" role="alert">
                  <TriangleAlert size={15} />
                  {error}
                </div>
              )}
              <button className="primary wide" disabled={submitting}>
                {submitting ? (
                  "Validando…"
                ) : (
                  <>
                    Ingresar <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
            <div className="demo">
              <div className="demo-heading">
                <strong>Acceso para el personal</strong>
                <span>CUENTA INDIVIDUAL</span>
              </div>
              <p>
                Las cuentas son creadas por el operador local del aplicativo.
              </p>
              <div className="account-note">
                <ShieldCheck size={16} /> Acceso para las cuentas creadas por el
                operador local.
              </div>
            </div>
            <div className="static-note">
              <LockKeyhole size={15} /> La sesión se administra en el backend
              local.
            </div>
          </div>
          <footer className="login-footer">
            © 2026 Cafés del Pacífico S.A.S.{" "}
            <span>
              <LockKeyhole size={12} /> Acceso controlado
            </span>
          </footer>
        </main>
      </div>
    );

  const navItems = [
    "Resumen",
    "Lotes",
    ...(isGerencia ? ["Reportes", "Actividad"] : []),
  ];
  return (
    <>
      <div className="shell">
        <aside className="sidebar">
          <Brand />
          <small className="side-label">ESPACIO DE TRABAJO</small>
          <div className="workspace">
            <span>CP</span>
            <b>
              Operaciones<small>Cafés del Pacífico</small>
            </b>
            <ChevronDown size={14} />
          </div>
          <small className="side-label">MENÚ PRINCIPAL</small>
          <nav>
            {navItems.map((item) => (
              <button
                className={nav === item ? "on" : ""}
                key={item}
                onClick={() => setNav(item)}
              >
                {item === "Resumen" ? (
                  <Coffee />
                ) : item === "Lotes" ? (
                  <Sprout />
                ) : item === "Reportes" ? (
                  <FileText />
                ) : (
                  <Timer />
                )}
                {item}
                {item === "Lotes" && <i>{lots.length}</i>}
              </button>
            ))}
          </nav>
          <div className="side-bottom">
            <div className="help">
              <CircleHelpIcon />
              <b>¿Necesitas ayuda?</b>
              <p>Consulta al operador del aplicativo.</p>
              <button
                onClick={() =>
                  note("Contacta al operador local para recibir soporte.")
                }
              >
                Ver ayuda →
              </button>
            </div>
            <div className="signed-user">
              <span>
                {currentUser.displayName
                  .split(/\s+/)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <b>
                {currentUser.displayName}
                <small>{role}</small>
              </b>
              <button type="button" className="logout-button" title="Cerrar sesión" aria-label="Cerrar sesión" onClick={logout}>
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </aside>
        <main className="main">
          <header className="topbar">
            Aplicativo <i>/</i> <b>{nav}</b>
            <span>
              {todayLabel()}{" "}
              <button
                aria-label="Notificaciones"
                onClick={() => note("No tienes nuevas notificaciones.")}
              >
                <Bell size={17} />
              </button>
              <div className="profile-control">
                <button
                  type="button"
                  className="avatar profile-trigger"
                  aria-label="Abrir men? de cuenta"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  title="Abrir men? de cuenta"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                >
                  {currentUser.displayName
                    .split(/\s+/)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </button>
                {profileMenuOpen && (
                  <div className="profile-menu" role="menu">
                    <div className="profile-menu-user">
                      <b>{currentUser.displayName}</b>
                      <small>{role}</small>
                    </div>
                    <button type="button" role="menuitem" onClick={logout}>
                      <LogOut size={15} />
                      <span>{"Cerrar sesi" + String.fromCharCode(243) + "n"}</span>
                    </button>
                  </div>
                )}
              </div>
            </span>
          </header>
          <div className="content">
            <div className="heading">
              <div>
                <small>● CONTROL DE VENCIMIENTOS</small>
                <h1>
                  {nav === "Resumen"
                    ? `Buenos días, ${currentUser.displayName.split(" ")[0]} 👋`
                    : nav}
                </h1>
                <p>
                  {nav === "Resumen"
                    ? "Aquí tienes el estado de tus lotes de café."
                    : nav === "Actividad"
                      ? "Actividad de acceso registrada por el servidor."
                      : nav === "Reportes"
                        ? "Resumen para consulta de gerencia."
                        : "Registro y seguimiento de lotes."}
                </p>
              </div>
              <div>
                <span className="role-chip">
                  <ShieldCheck size={14} />
                  {role}
                </span>
                {role === "Bodega y logística" && (
                  <button className="primary" onClick={() => setModal(true)}>
                    <Plus size={16} /> Registrar lote
                  </button>
                )}
              </div>
            </div>
            <div className="banner">
              <ShieldCheck size={16} />
              <span>
                <b>Conectado a la base de datos local</b>
                <small>
                  Sesión y operaciones validadas por el backend · SQLite.
                </small>
              </span>
            </div>
            {nav === "Actividad" ? (
              <section className="panel activity-full">
                <div className="panel-head">
                  <span>
                    <h2>Registro de actividad</h2>
                    <p>Eventos persistidos por el servidor.</p>
                  </span>
                  <em>BITÁCORA</em>
                </div>
                {events.map((item, index) => (
                  <div className="event" key={`${item.time}-${index}`}>
                    <i className={item.warning ? "warn" : ""} />
                    <b>
                      {item.who}
                      <small>{item.role || "Sin rol asociado"}</small>
                    </b>
                    <span>{item.detail}</span>
                    <time>{item.time}</time>
                  </div>
                ))}
                {!events.length && (
                  <p className="empty">Aún no hay eventos registrados.</p>
                )}
              </section>
            ) : (
              <>
                {nav !== "Lotes" && (
                  <div className="stats">
                    {[
                      [summary.total, "Lotes registrados", "En la base de datos local", <Coffee />, "sample"],
                      [summary.current, "Lotes vigentes", "Vencen en más de 30 días", <Leaf />, "good"],
                      [summary.soon, "Próximos a vencer", "Vencen dentro de 30 días", <Timer />, "soon"],
                      [summary.expired, "Lotes vencidos", "La fecha de vencimiento pasó", <TriangleAlert />, "bad"],
                    ].map(([num, title, sub, icon, kind]) => (
                      <article className="stat" key={String(title)}>
                        <span className={"stat-icon " + kind}>{icon}</span>
                        <strong>{String(num).padStart(2, "0")}</strong>
                        <b>{title}</b>
                        <small>{sub}</small>
                      </article>
                    ))}
                  </div>
                )}
                {nav === "Reportes" && (
                  <section className="panel report-breakdown">
                    <div className="panel-head">
                      <span>
                        <h2>Distribución de vencimientos</h2>
                        <p>Proporción de lotes por estado, calculada sobre el inventario actual.</p>
                      </span>
                      <em>{summary.total} LOTES</em>
                    </div>
                    <div className="report-bars">
                      {[
                        ["Vigentes", summary.current, "green"],
                        ["Próximos a vencer", summary.soon, "amber"],
                        ["Vencidos", summary.expired, "red"],
                      ].map(([label, value, tone]) => {
                        const percentage = summary.total ? Math.round((Number(value) / summary.total) * 100) : 0;
                        return (
                          <div className="report-bar-row" key={String(label)}>
                            <span>{label}</span>
                            <div className={"report-track " + tone}>
                              <i style={{ width: String(percentage) + "%" }} />
                            </div>
                            <b>{value} <small>{percentage}%</small></b>
                          </div>
                        );
                      })}
                    </div>
                    <p className="report-note">
                      {summary.soon + summary.expired
                        ? (summary.soon + summary.expired) + " lotes necesitan seguimiento por fecha."
                        : "No hay lotes que requieran seguimiento por vencimiento."}
                    </p>
                  </section>
                )}
                <div className={"columns " + (nav === "Resumen" ? "" : "single")}>
                  <section className="panel lot-panel">
                    <div className="panel-head">
                      <span>
                        <h2>
                          {nav === "Resumen"
                            ? "Prioridad de vencimientos"
                            : nav === "Reportes"
                              ? "Detalle completo del reporte"
                              : "Inventario de lotes"}
                        </h2>
                        <p>
                          {nav === "Resumen"
                            ? "Lotes vencidos o próximos a vencer, hasta cinco prioritarios."
                            : nav === "Reportes"
                              ? "Consulta las fechas y estados que componen el análisis."
                              : "Busca, filtra y revisa todos los lotes registrados."}
                        </p>
                      </span>
                      {nav !== "Lotes" && (
                        <button
                          className="link"
                          onClick={() => {
                            setNav("Lotes");
                            setSearch("");
                            setFilter("Todos");
                          }}
                        >
                          Ir al inventario <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                    {nav === "Lotes" && (
                      <div className="tools">
                        <label>
                          <Search size={15} />
                          <input
                            placeholder="Buscar lote, café u origen..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </label>
                        <label>
                          <Filter size={14} />
                          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option>Todos</option>
                            <option>Vigente</option>
                            <option>Próximo a vencer</option>
                            <option>Vencido</option>
                          </select>
                        </label>
                      </div>
                    )}
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>LOTE / CAFÉ</th>
                            <th>FECHA DE TUESTE</th>
                            <th>VENCIMIENTO</th>
                            <th>CANTIDAD</th>
                            <th>ESTADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleLots.map((lot) => (
                            <tr key={lot.id}>
                              <td>
                                <b>
                                  {lot.coffee}
                                  <small>{lot.id} · {lot.origin}</small>
                                </b>
                              </td>
                              <td>{dateLabel(lot.roastDate)}</td>
                              <td>{dateLabel(lot.expiryDate)}</td>
                              <td>{lot.quantity}</td>
                              <td>
                                <span className={"badge " + (lot.state === "Vigente" ? "green" : lot.state === "Vencido" ? "red" : "amber")}>
                                  {lot.state}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!visibleLots.length && (
                        <p className="empty">
                          {dataLoading
                            ? "Cargando lotes..."
                            : nav === "Resumen"
                              ? "No hay lotes vencidos ni próximos a vencer."
                              : nav === "Reportes"
                                ? "Aún no hay lotes para incluir en el reporte."
                                : "No hay lotes que coincidan con la búsqueda."}
                        </p>
                      )}
                    </div>
                    <div className="table-foot">
                      {nav === "Resumen"
                        ? "Mostrando " + visibleLots.length + " lotes prioritarios de " + lots.length
                        : nav === "Reportes"
                          ? visibleLots.length + " lotes incluidos en el detalle del reporte"
                          : filtered.length + " de " + lots.length + " lotes · Datos de SQLite"}
                    </div>
                  </section>
                  {nav === "Resumen" && (
                    <aside className="right-col">
                      <section className="panel pulse">
                        <small><Sprout size={15} /> PULSO DEL INVENTARIO</small>
                        <h3>
                          {lots.length
                            ? counts.expired + counts.soon === 0
                              ? "Inventario bajo control."
                              : "Hay lotes que requieren atención."
                            : "Aún no hay lotes registrados."}
                        </h3>
                        <p>Revisa los vencimientos y mantén cada origen bajo seguimiento.</p>
                        <div className="progress-caption">
                          <span>Vigentes</span>
                          <b>{lots.length ? Math.round((counts.current / lots.length) * 100) : 0}%</b>
                        </div>
                        <div className="progress">
                          <i style={{ width: String(lots.length ? (counts.current / lots.length) * 100 : 0) + "%" }} />
                        </div>
                        <small>{counts.current} vigentes <span>·</span> {counts.soon} próximos <span>·</span> {counts.expired} vencidos</small>
                      </section>
                      <section className="panel recent">
                        <div className="panel-head">
                          <span>
                            <h2>Actividad reciente</h2>
                            <p>Eventos registrados por el servidor</p>
                          </span>
                          {isGerencia && (
                            <button className="link" onClick={() => setNav("Actividad")}>Ver bitácora ?</button>
                          )}
                        </div>
                        {events.slice(0, 3).map((item, index) => (
                          <div className="recent-event" key={item.time + "-" + index}>
                            <i className={item.warning ? "warn" : ""} />
                            <span><b>{item.who}</b><small>{item.detail}</small><time>{item.time}</time></span>
                          </div>
                        ))}
                        {!events.length && <p className="empty">Sin eventos recientes.</p>}
                      </section>
                    </aside>
                  )}
                </div>
              </>
            )}
            <footer className="foot">
              © 2026 Cafés del Pacífico S.A.S.
              <span>
                <LockKeyhole size={12} /> Sesión protegida por el backend
              </span>
            </footer>
          </div>
        </main>
      </div>
      {modal && (
        <div
          className="backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <section className="modal">
            <div className="modal-head">
              <span>
                <small>REGISTRO DE INVENTARIO</small>
                <h2>Registrar nuevo lote</h2>
                <p>Completa los datos de tu café de origen.</p>
              </span>
              <button aria-label="Cerrar" onClick={() => setModal(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={add}>
              <label>
                ID del lote
                <input
                  name="id"
                  placeholder="CP-2026-085"
                  required
                  maxLength={40}
                />
              </label>
              <label>
                Nombre del café
                <input
                  name="coffee"
                  placeholder="Geisha lavado"
                  required
                  maxLength={120}
                />
              </label>
              <label>
                Origen
                <input
                  name="origin"
                  placeholder="Huila · Pitalito"
                  required
                  maxLength={160}
                />
              </label>
              <div className="two">
                <label>
                  Fecha de tueste
                  <input type="date" name="roast" required />
                </label>
                <label>
                  Fecha de vencimiento
                  <input type="date" name="expiry" required />
                </label>
              </div>
              <label>
                Cantidad
                <input name="kg" placeholder="24 kg" required maxLength={40} />
              </label>
              <small className="demo-hint">
                <ShieldCheck size={13} /> Se guardará en la base SQLite local.
              </small>
              <div className="modal-actions">
                <button type="button" onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button className="primary">
                  <Plus size={15} /> Guardar lote
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </>
  );
}
function Brand() {
  return (
    <div className="brand">
      <span>
        <Coffee size={20} />
      </span>
      <b>
        pac<span>í</span>fico<small>CAFÉS DE ORIGEN</small>
      </b>
    </div>
  );
}
function CircleHelpIcon() {
  return <span className="help-icon">·</span>;
}

