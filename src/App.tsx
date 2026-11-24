import { useMemo, useState, type FormEvent } from "react";
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
  Sparkles,
  Sprout,
  Timer,
  TriangleAlert,
  Users,
  Warehouse,
  X,
} from "lucide-react";

type Role = "Bodega y logística" | "Gerencia";
type State = "Vigente" | "Próximo a vencer" | "Vencido";
type Lot = {
  id: string;
  coffee: string;
  origin: string;
  roast: string;
  expiry: string;
  kg: string;
  state: State;
};
type EventItem = {
  who: string;
  detail: string;
  time: string;
  warning?: boolean;
};
const samples: Lot[] = [
  {
    id: "CP-2026-084",
    coffee: "Geisha lavado",
    origin: "Huila · Pitalito",
    roast: "12 oct, 2026",
    expiry: "12 abr, 2027",
    kg: "24 kg",
    state: "Vigente",
  },
  {
    id: "CP-2026-083",
    coffee: "Caturra honey",
    origin: "Nariño · Buesaco",
    roast: "8 jun, 2026",
    expiry: "8 dic, 2026",
    kg: "18 kg",
    state: "Próximo a vencer",
  },
  {
    id: "CP-2026-079",
    coffee: "Bourbon rosado",
    origin: "Cauca · Popayán",
    roast: "26 abr, 2026",
    expiry: "26 oct, 2026",
    kg: "12 kg",
    state: "Vencido",
  },
  {
    id: "CP-2026-076",
    coffee: "Castillo natural",
    origin: "Valle · Sevilla",
    roast: "19 abr, 2026",
    expiry: "19 oct, 2026",
    kg: "32 kg",
    state: "Vencido",
  },
  {
    id: "CP-2026-072",
    coffee: "Typica anaeróbico",
    origin: "Tolima · Planadas",
    roast: "11 abr, 2026",
    expiry: "11 oct, 2026",
    kg: "16 kg",
    state: "Vencido",
  },
];
const roleList: Role[] = ["Bodega y logística", "Gerencia"];

export default function App() {
  const [role, setRole] = useState<Role>("Gerencia"),
    [entered, setEntered] = useState(false),
    [user, setUser] = useState(""),
    [pass, setPass] = useState(""),
    [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [attempts, setAttempts] = useState(0),
    [locked, setLocked] = useState(false);
  const [lots, setLots] = useState(samples),
    [nav, setNav] = useState("Resumen"),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("Todos"),
    [modal, setModal] = useState(false),
    [toast, setToast] = useState("");
  const [events, setEvents] = useState<EventItem[]>([
    {
      who: "María Fernanda Ríos",
      detail: "Registró el lote CP-2026-084",
      time: "Hoy, 9:42 a. m.",
    },
    {
      who: "Andrés Velasco",
      detail: "Consultó reporte de vencimientos",
      time: "Hoy, 8:16 a. m.",
    },
    {
      who: "Intento de acceso",
      detail: "Ingreso fallido · demostración",
      time: "Ayer, 4:28 p. m.",
      warning: true,
    },
  ]);
  const filtered = useMemo(
    () =>
      lots.filter(
        (l) =>
          `${l.id} ${l.coffee} ${l.origin}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (filter === "Todos" || l.state === filter),
      ),
    [lots, search, filter],
  );
  const counts = {
    current: lots.filter((l) => l.state === "Vigente").length,
    soon: lots.filter((l) => l.state === "Próximo a vencer").length,
    expired: lots.filter((l) => l.state === "Vencido").length,
  };
  function note(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }
  function login(e: FormEvent) {
    e.preventDefault();
    if (!user.trim() || !pass) {
      setError("Completa tu usuario y contraseña para continuar.");
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setPass("");
    setEvents((v) =>
      [
        {
          who: user,
          detail: "Intento fallido · demostración",
          time: "Ahora",
          warning: true,
        },
        ...v,
      ].slice(0, 5),
    );
    if (next >= 3) {
      setLocked(true);
      setError("Bloqueo temporal simulado. Recarga la página para reiniciar.");
    } else
      setError(
        "No se pudo validar el acceso. Usa el acceso de demostración por perfil.",
      );
  }
  function demo(r: Role) {
    if (locked) return;
    setRole(r);
    setEntered(true);
    setError("");
    setNav("Resumen");
    setEvents((v) =>
      [
        {
          who: user || "Usuario de demostración",
          detail: `Inició sesión como ${r} · demo`,
          time: "Ahora",
        },
        ...v,
      ].slice(0, 5),
    );
  }
  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget),
      id = String(d.get("id")).trim(),
      coffee = String(d.get("coffee")).trim(),
      origin = String(d.get("origin")).trim(),
      roast = String(d.get("roast")),
      expiry = String(d.get("expiry")),
      kg = String(d.get("kg")).trim(),
      rd = new Date(`${roast}T12:00:00`),
      ed = new Date(`${expiry}T12:00:00`);
    if (ed <= rd) {
      note("El vencimiento debe ser posterior al tueste.");
      return;
    }
    const fmt = (x: Date) =>
      x.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    setLots((v) => [
      {
        id,
        coffee,
        origin,
        roast: fmt(rd),
        expiry: fmt(ed),
        kg,
        state: ed < new Date() ? "Vencido" : "Vigente",
      },
      ...v,
    ]);
    setEvents((v) =>
      [
        {
          who: user || "Usuario demo",
          detail: `Registró ${id} · demostración`,
          time: "Ahora",
        },
        ...v,
      ].slice(0, 5),
    );
    setModal(false);
    note("Lote agregado a esta sesión de demostración.");
  }
  if (!entered)
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
                    disabled={locked}
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
                    disabled={locked}
                  />
                  <button
                    type="button"
                    className="eye"
                    onClick={() => setShow(!show)}
                    aria-label="Mostrar u ocultar contraseña"
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
              <button className="primary wide" disabled={locked}>
                Ingresar <ArrowRight size={16} />
              </button>
            </form>
            <div className="demo">
              <div className="demo-heading">
                <strong>Acceso de demostración</strong>
                <span>PROTOTIPO</span>
              </div>
              <p>Elige un perfil para explorar la interfaz.</p>
              <div className="role-cards">
                {roleList.map((r) => (
                  <button
                    className={role === r ? "selected" : ""}
                    key={r}
                    onClick={() => setRole(r)}
                  >
                    <span>
                      {r === "Gerencia" ? (
                        <Users size={16} />
                      ) : (
                        <Warehouse size={16} />
                      )}
                    </span>
                    <b>
                      {r}
                      <small>
                        {r === "Gerencia"
                          ? "Consulta y reportes"
                          : "Registro de lotes"}
                      </small>
                    </b>
                    <i />
                  </button>
                ))}
              </div>
              <button
                className="demo-go"
                disabled={locked}
                onClick={() => demo(role)}
              >
                Explorar como {role} <ArrowRight size={15} />
              </button>
            </div>
            <div className="static-note">
              <ShieldCheck size={15} />
              Demostración estática: no verifica credenciales ni protege datos.
            </div>
          </div>
          <footer className="login-footer">
            © 2026 Cafés del Pacífico S.A.S.{" "}
            <span>
              <LockKeyhole size={12} /> Acceso de demostración
            </span>
          </footer>
        </main>
      </div>
    );
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
            {[
              "Resumen",
              "Lotes",
              ...(role === "Gerencia" ? ["Reportes"] : []),
              "Actividad",
            ].map((item) => (
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
              <p>Consulta la guía rápida del aplicativo.</p>
              <button onClick={() => note("Guía rápida · demostración")}>
                Ver guía →
              </button>
            </div>
            <div className="signed-user">
              <span>{role === "Gerencia" ? "AV" : "MR"}</span>
              <b>
                {role === "Gerencia" ? "Andrés Velasco" : "María F. Ríos"}
                <small>{role}</small>
              </b>
              <button
                aria-label="Cerrar sesión"
                onClick={() => {
                  setEntered(false);
                  setPass("");
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>
        <main className="main">
          <header className="topbar">
            Aplicativo <i>/</i> <b>{nav}</b>
            <span>
              Lunes, 23 de noviembre{" "}
              <button onClick={() => note("No tienes nuevas notificaciones.")}>
                <Bell size={17} />
              </button>
              <span className="avatar">
                {role === "Gerencia" ? "AV" : "MR"}
              </span>
            </span>
          </header>
          <div className="content">
            <div className="heading">
              <div>
                <small>● CONTROL DE VENCIMIENTOS</small>
                <h1>
                  {nav === "Resumen"
                    ? `Buenos días, ${role === "Gerencia" ? "Andrés" : "María"} 👋`
                    : nav}
                </h1>
                <p>
                  {nav === "Resumen"
                    ? "Aquí tienes el estado de tus lotes de café."
                    : nav === "Actividad"
                      ? "Actividad reciente de acceso · datos de demostración."
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
              <Sparkles size={16} />
              <span>
                <b>Modo demostración estático</b>
                <small>
                  Accesos y cambios son locales a esta sesión; no hay
                  autenticación ni almacenamiento reales.
                </small>
              </span>
              <button onClick={(e) => e.currentTarget.parentElement?.remove()}>
                <X size={15} />
              </button>
            </div>
            {nav === "Actividad" ? (
              <section className="panel activity-full">
                <div className="panel-head">
                  <span>
                    <h2>Registro de actividad</h2>
                    <p>Eventos ilustrativos, no persistentes.</p>
                  </span>
                  <em>DATOS DE MUESTRA</em>
                </div>
                {events.map((v, i) => (
                  <div className="event" key={i}>
                    <i className={v.warning ? "warn" : ""} />
                    <b>
                      {v.who}
                      <small>{role}</small>
                    </b>
                    <span>{v.detail}</span>
                    <time>{v.time}</time>
                  </div>
                ))}
              </section>
            ) : (
              <>
                <div className="stats">
                  {[
                    [
                      lots.length,
                      "Lotes registrados",
                      "En el inventario de ejemplo",
                      <Coffee />,
                      "sample",
                    ],
                    [
                      counts.current,
                      "Lotes vigentes",
                      "Dentro de su periodo de consumo",
                      <Leaf />,
                      "good",
                    ],
                    [
                      counts.soon,
                      "Próximos a vencer",
                      "Requieren seguimiento",
                      <Timer />,
                      "soon",
                    ],
                    [
                      counts.expired,
                      "Lotes vencidos",
                      "Fuera de fecha de vencimiento",
                      <TriangleAlert />,
                      "bad",
                    ],
                  ].map(([num, title, sub, icon, kind]) => (
                    <article className="stat" key={String(title)}>
                      <span className={`stat-icon ${kind}`}>{icon}</span>
                      <strong>{String(num).padStart(2, "0")}</strong>
                      <b>{title}</b>
                      <small>{sub}</small>
                    </article>
                  ))}
                </div>
                <div className="columns">
                  <section className="panel lot-panel">
                    <div className="panel-head">
                      <span>
                        <h2>
                          {nav === "Reportes"
                            ? "Reporte de vencimientos"
                            : "Lotes de café"}
                        </h2>
                        <p>Seguimiento de fechas de tueste y vencimiento</p>
                      </span>
                      <button
                        className="link"
                        onClick={() => {
                          setNav("Lotes");
                          setSearch("");
                        }}
                      >
                        Ver todos <ArrowRight size={14} />
                      </button>
                    </div>
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
                        <select
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                        >
                          <option>Todos</option>
                          <option>Vigente</option>
                          <option>Próximo a vencer</option>
                          <option>Vencido</option>
                        </select>
                      </label>
                    </div>
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
                          {filtered.map((l) => (
                            <tr key={l.id}>
                              <td>
                                <b>
                                  {l.coffee}
                                  <small>
                                    {l.id} · {l.origin}
                                  </small>
                                </b>
                              </td>
                              <td>{l.roast}</td>
                              <td>{l.expiry}</td>
                              <td>{l.kg}</td>
                              <td>
                                <span
                                  className={`badge ${l.state === "Vigente" ? "green" : l.state === "Vencido" ? "red" : "amber"}`}
                                >
                                  {l.state}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!filtered.length && (
                        <p className="empty">No hay lotes que coincidan.</p>
                      )}
                    </div>
                    <div className="table-foot">
                      Mostrando {filtered.length} de {lots.length} lotes · Datos
                      de ejemplo
                    </div>
                  </section>
                  <aside className="right-col">
                    <section className="panel pulse">
                      <small>
                        <Sprout size={15} /> PULSO DEL INVENTARIO
                      </small>
                      <h3>Tu café, en buen estado.</h3>
                      <p>
                        Revisa los lotes próximos a vencer y mantén cada origen
                        en su punto.
                      </p>
                      <div className="progress-caption">
                        Lotes vigentes{" "}
                        <b>
                          {lots.length
                            ? Math.round((counts.current / lots.length) * 100)
                            : 0}
                          %
                        </b>
                      </div>
                      <div className="progress">
                        <i
                          style={{
                            width: `${lots.length ? (counts.current / lots.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <small>
                        {counts.current} vigentes <span>·</span>{" "}
                        {counts.expired} vencidos
                      </small>
                    </section>
                    <section className="panel recent">
                      <div className="panel-head">
                        <span>
                          <h2>Actividad reciente</h2>
                          <p>Eventos de ejemplo · sesión local</p>
                        </span>
                        <button onClick={() => setNav("Actividad")}>↗</button>
                      </div>
                      {events.slice(0, 3).map((v, i) => (
                        <div className="recent-event" key={i}>
                          <i className={v.warning ? "warn" : ""} />
                          <span>
                            <b>{v.who}</b>
                            <small>{v.detail}</small>
                            <time>{v.time}</time>
                          </span>
                        </div>
                      ))}
                      <button
                        className="link"
                        onClick={() => setNav("Actividad")}
                      >
                        Ver toda la actividad →
                      </button>
                    </section>
                  </aside>
                </div>
              </>
            )}
            <footer className="foot">
              © 2026 Cafés del Pacífico S.A.S.
              <span>
                <LockKeyhole size={12} /> Prototipo estático · sin autenticación
                real
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
              <button onClick={() => setModal(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={add}>
              <label>
                ID del lote
                <input name="id" placeholder="CP-2026-085" required />
              </label>
              <label>
                Nombre del café
                <input name="coffee" placeholder="Geisha lavado" required />
              </label>
              <label>
                Origen
                <input name="origin" placeholder="Huila · Pitalito" required />
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
                <input name="kg" placeholder="24 kg" required />
              </label>
              <small className="demo-hint">
                <Sparkles size={13} /> Se añadirá solo a esta sesión.
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
  return <span className="help-icon">?</span>;
}


