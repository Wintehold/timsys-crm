import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Contact,
  FilePlus2,
  Home,
  KeyRound,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Sun,
  UploadCloud,
  UserPlus,
  Users,
  Wand2
} from "lucide-react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  AuditLog,
  Client,
  ClientRequest,
  MatchResult,
  PropertyCard,
  Role,
  User,
  visibleMatch
} from "@timcrm/shared";
import {
  auditLogs as seedAuditLogs,
  clients as seedClients,
  externalProperties,
  initialPasswords,
  propertyCards as seedPropertyCards,
  requests as seedRequests,
  users as seedUsers
} from "./data/mockData";
import { money, shortDate } from "./lib/format";

type Theme = "light" | "dark";

type CrmContext = {
  currentUser: User | null;
  users: User[];
  clients: Client[];
  requests: ClientRequest[];
  propertyCards: PropertyCard[];
  auditLogs: AuditLog[];
  passwordBook: Record<string, string>;
  theme: Theme;
  setCurrentUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;
  setClients: (clients: Client[]) => void;
  setRequests: (requests: ClientRequest[]) => void;
  setPropertyCards: (cards: PropertyCard[]) => void;
  setPasswordBook: (book: Record<string, string>) => void;
  setTheme: (theme: Theme) => void;
  logAction: (action: string, entityType: string, entityId?: string, metadata?: AuditLog["metadata"]) => void;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [requests, setRequests] = useState<ClientRequest[]>(seedRequests);
  const [propertyCards, setPropertyCards] = useState<PropertyCard[]>(seedPropertyCards);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seedAuditLogs);
  const [passwordBook, setPasswordBook] = useState<Record<string, string>>(initialPasswords);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("tim-crm-theme") as Theme) || "dark");

  useEffect(() => {
    localStorage.setItem("tim-crm-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const context: CrmContext = {
    currentUser,
    users,
    clients,
    requests,
    propertyCards,
    auditLogs,
    passwordBook,
    theme,
    setCurrentUser,
    setUsers,
    setClients,
    setRequests,
    setPropertyCards,
    setPasswordBook,
    setTheme,
    logAction: (action, entityType, entityId, metadata = {}) => {
      const actorUserId = currentUser?.id ?? "system";
      setAuditLogs((items) => [
        {
          id: crypto.randomUUID(),
          actorUserId,
          action,
          entityType,
          entityId,
          metadata,
          createdAt: new Date().toISOString()
        },
        ...items
      ]);
    }
  };

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage context={context} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (currentUser.mustChangePassword) {
    return (
      <Routes>
        <Route path="/change-password" element={<ChangePasswordPage context={context} forced />} />
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    );
  }

  return (
    <Shell context={context}>
      <Routes>
        <Route path="/" element={<Dashboard context={context} />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/change-password" element={<ChangePasswordPage context={context} />} />
        <Route path="/clients" element={<ClientsPage context={context} />} />
        <Route path="/clients/new" element={<ClientFormPage context={context} />} />
        <Route path="/clients/:id" element={<ClientDetailPage context={context} />} />
        <Route path="/requests" element={<RequestsPage context={context} />} />
        <Route path="/requests/new" element={<RequestFormPage context={context} />} />
        <Route path="/requests/:id" element={<RequestDetailPage context={context} />} />
        <Route path="/import-yakeey" element={<ImportYakeeyPage context={context} />} />
        <Route path="/vision-cards" element={<VisionCardsPage context={context} />} />
        <Route path="/smart-hunter" element={<SmartHunterPage context={context} />} />
        <Route path="/admin" element={<AdminPage context={context} />} />
        <Route path="/audit-logs" element={<AuditLogsPage context={context} />} />
        <Route path="/settings" element={<SettingsPage context={context} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

function Shell({ context, children }: { context: CrmContext; children: ReactNode }) {
  const currentUser = context.currentUser!;
  const navItems = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/clients", label: "Clients", icon: Contact },
    { to: "/requests", label: "Demandes", icon: FilePlus2 },
    { to: "/import-yakeey", label: "Import Yakeey", icon: UploadCloud },
    { to: "/vision-cards", label: "Vision Cards", icon: Building2 },
    { to: "/smart-hunter", label: "Hunter V3", icon: Sparkles },
    ...(currentUser.role !== "CONSEILLER" ? [{ to: "/admin", label: "Administration", icon: Shield }] : []),
    ...(currentUser.role === "LUCIFER" ? [{ to: "/audit-logs", label: "Audit logs", icon: BarChart3 }] : []),
    { to: "/settings", label: "Theme", icon: Settings }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div>
            <strong>TIM CRM</strong>
            <span>Powered By Morningstar Technologies</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => context.setTheme(context.theme === "dark" ? "light" : "dark")} title="Changer de theme">
            {context.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span>{context.theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
          </button>
          <div className="user-pill">
            <span>{initials(currentUser.name)}</span>
            <div>
              <strong>{currentUser.name}</strong>
              <small>{currentUser.role}</small>
            </div>
          </div>
          <button className="ghost-button" onClick={() => context.setCurrentUser(null)} title="Logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

function LoginPage({ context }: { context: CrmContext }) {
  const [username, setUsername] = useState("Hicham");
  const [password, setPassword] = useState("12345678");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const user = context.users.find((item) => item.username.toLowerCase() === username.toLowerCase());
    if (!user || !user.isActive || context.passwordBook[user.username] !== password) {
      setError("Nom d'utilisateur ou mot de passe invalide.");
      return;
    }
    context.setCurrentUser(user);
    context.logAction("login", "app_user", user.id, { username: user.username });
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="brand-mark large">T</div>
          <h1>TIM CRM</h1>
          <p>Powered By Morningstar Technologies</p>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Nom d'utilisateur
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            Mot de passe
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
          </label>
          <div className="demo-users">
            <span>luci / GOT2026GOT</span>
            <span>Hicham / 12345678</span>
            <span>Alie / 12345678</span>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="primary-button" type="submit">
            <Shield size={18} />
            <span>Login</span>
          </button>
        </form>
      </section>
    </main>
  );
}

function ChangePasswordPage({ context, forced }: { context: CrmContext; forced?: boolean }) {
  const navigate = useNavigate();
  const user = context.currentUser!;
  const [oldPassword, setOldPassword] = useState(context.passwordBook[user.username] ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (context.passwordBook[user.username] !== oldPassword) return setError("Ancien mot de passe incorrect.");
    if (newPassword.length < 8) return setError("Minimum 8 caracteres.");
    if (newPassword !== confirmPassword) return setError("La confirmation ne correspond pas.");
    if (newPassword === oldPassword) return setError("Le nouveau mot de passe doit etre different.");

    const updated = { ...user, mustChangePassword: false, updatedAt: new Date().toISOString() };
    context.setUsers(context.users.map((item) => (item.id === user.id ? updated : item)));
    context.setPasswordBook({ ...context.passwordBook, [user.username]: newPassword });
    context.setCurrentUser(updated);
    context.logAction("change_password", "app_user", user.id, { forced: Boolean(forced) });
    navigate("/");
  };

  return (
    <main className="login-page compact">
      <section className="login-panel">
        <div className="login-brand">
          <KeyRound size={34} />
          <h1>Changer le mot de passe</h1>
          <p>{forced ? "Changement obligatoire a la premiere connexion." : "Securite du compte"}</p>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <TextInput label="Ancien mot de passe" type="password" value={oldPassword} onChange={setOldPassword} required />
          <TextInput label="Nouveau mot de passe" type="password" value={newPassword} onChange={setNewPassword} required />
          <TextInput label="Confirmation" type="password" value={confirmPassword} onChange={setConfirmPassword} required />
          {error && <p className="error">{error}</p>}
          <button className="primary-button" type="submit">
            <CheckCircle2 size={18} />
            <span>Valider</span>
          </button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ context }: { context: CrmContext }) {
  const requests = visibleRequests(context);
  const clients = visibleClients(context);
  const cards = visibleVisionCards(context).filter((card) => card.status === "actif");
  const matchCount = requests.reduce((total, request) => total + internalMatches(context, request).length, 0);
  const externalCount = requests.reduce((total, request) => total + externalMatches(request).length, 0);

  return (
    <Page title="Dashboard metier" eyebrow="TIM CRM Preview 2" action={<QuickActions />}>
      <section className="metric-grid">
        <Metric title="Clients actifs" value={clients.filter((client) => client.status !== "cloture").length} icon={<Users size={20} />} />
        <Metric title="Demandes ouvertes" value={requests.filter((request) => request.status !== "cloturee").length} icon={<FilePlus2 size={20} />} />
        <Metric title="Vision Cards actives" value={cards.length} icon={<Building2 size={20} />} />
        <Metric title="Matches internes" value={matchCount} icon={<BarChart3 size={20} />} />
        <Metric title="Matches externes" value={externalCount} icon={<Sparkles size={20} />} />
        <Metric title="Urgences" value={requests.filter((request) => ["elevee", "immediate"].includes(request.urgency)).length} icon={<Shield size={20} />} />
        <Metric title="Imports recents" value={cards.filter((card) => card.source === "Yakeey").length} icon={<UploadCloud size={20} />} />
      </section>
      <section className="split-layout">
        <div className="panel">
          <h2>Top demandes a traiter</h2>
          <div className="stack">{requests.slice(0, 5).map((request) => <RequestRow key={request.id} context={context} request={request} />)}</div>
        </div>
        <div className="panel champagne">
          <h2>Derniere activite</h2>
          <div className="activity-list">
            {visibleAuditLogs(context).slice(0, 6).map((entry) => (
              <div key={entry.id}>
                <strong>{entry.action.replaceAll("_", " ")}</strong>
                <span>{shortDate(entry.createdAt)} par {advisorName(context, entry.actorUserId)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Page>
  );
}

function QuickActions() {
  return (
    <div className="action-row">
      <Link className="primary-button" to="/clients/new"><Plus size={18} /><span>Nouveau client</span></Link>
      <Link className="secondary-button" to="/requests/new"><FilePlus2 size={18} /><span>Nouvelle demande</span></Link>
      <Link className="secondary-button" to="/import-yakeey"><UploadCloud size={18} /><span>Importer Yakeey</span></Link>
      <Link className="secondary-button" to="/smart-hunter"><Wand2 size={18} /><span>Hunter V3</span></Link>
    </div>
  );
}

function ClientsPage({ context }: { context: CrmContext }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const clients = visibleClients(context).filter((client) => {
    const text = `${client.firstName} ${client.lastName} ${client.primaryPhone}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (!status || client.status === status);
  });

  return (
    <Page title="Clients" eyebrow="Contacts clients" action={<Link className="primary-button" to="/clients/new"><Plus size={18} /><span>Nouveau client</span></Link>}>
      <section className="filter-bar">
        <SearchBox value={query} onChange={setQuery} placeholder="Rechercher un client" />
        <SelectFilter label="Statut" value={status} values={["nouveau", "actif", "en recherche", "en negociation", "cloture"]} onChange={setStatus} />
      </section>
      <section className="card-grid">
        {clients.map((client) => (
          <Link className="entity-card" key={client.id} to={`/clients/${client.id}`}>
            <Badge>{client.status}</Badge>
            <div>
              <h3>{client.firstName} {client.lastName}</h3>
              <p>{client.primaryPhone}</p>
            </div>
            <dl>
              <div><dt>Budget</dt><dd>{client.estimatedBudget ? money(client.estimatedBudget) : "Non renseigne"}</dd></div>
              <div><dt>Conseiller</dt><dd>{advisorName(context, client.assignedAdvisorId)}</dd></div>
            </dl>
            {client.notes && <p className="muted">{client.notes}</p>}
          </Link>
        ))}
      </section>
    </Page>
  );
}

function ClientFormPage({ context }: { context: CrmContext }) {
  const navigate = useNavigate();
  const advisorOptions = context.currentUser?.role === "CONSEILLER" ? [context.currentUser] : visibleUsers(context).filter((user) => user.role === "CONSEILLER");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    primaryPhone: "",
    secondaryPhone: "",
    email: "",
    source: "",
    estimatedBudget: "",
    notes: "",
    status: "nouveau",
    assignedAdvisorId: advisorOptions[0]?.id ?? context.currentUser!.id
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const stamp = new Date().toISOString();
    const client: Client = {
      id: crypto.randomUUID(),
      firstName: form.firstName,
      lastName: form.lastName,
      primaryPhone: form.primaryPhone,
      secondaryPhone: form.secondaryPhone || undefined,
      email: form.email || undefined,
      source: form.source || undefined,
      estimatedBudget: form.estimatedBudget ? Number(form.estimatedBudget) : undefined,
      notes: form.notes,
      assignedAdvisorId: form.assignedAdvisorId,
      status: form.status as Client["status"],
      createdAt: stamp,
      updatedAt: stamp
    };
    context.setClients([client, ...context.clients]);
    context.logAction("creation_client", "client", client.id, { name: `${client.firstName} ${client.lastName}` });
    navigate(`/clients/${client.id}`);
  };

  return (
    <Page title="Nouveau client" eyebrow="Contacts">
      <form className="form-panel" onSubmit={submit}>
        <TextInput label="Prenom" value={form.firstName} onChange={(firstName) => setForm({ ...form, firstName })} required />
        <TextInput label="Nom" value={form.lastName} onChange={(lastName) => setForm({ ...form, lastName })} required />
        <TextInput label="Telephone principal" value={form.primaryPhone} onChange={(primaryPhone) => setForm({ ...form, primaryPhone })} required />
        <TextInput label="Telephone secondaire" value={form.secondaryPhone} onChange={(secondaryPhone) => setForm({ ...form, secondaryPhone })} />
        <TextInput label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <TextInput label="Source" value={form.source} onChange={(source) => setForm({ ...form, source })} />
        <TextInput label="Budget estime" type="number" value={form.estimatedBudget} onChange={(estimatedBudget) => setForm({ ...form, estimatedBudget })} />
        <SelectField label="Statut client" value={form.status} values={["nouveau", "actif", "en recherche", "en negociation", "cloture"]} onChange={(status) => setForm({ ...form, status })} />
        <label>
          Conseiller assigne
          <select value={form.assignedAdvisorId} onChange={(event) => setForm({ ...form, assignedAdvisorId: event.target.value })}>
            {advisorOptions.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </label>
        <label className="wide">Notes internes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <button className="primary-button" type="submit"><Plus size={18} /><span>Creer client</span></button>
      </form>
    </Page>
  );
}

function ClientDetailPage({ context }: { context: CrmContext }) {
  const { id } = useParams();
  const client = visibleClients(context).find((item) => item.id === id);
  if (!client) return <Navigate to="/clients" replace />;
  const logs = visibleAuditLogs(context).filter((entry) => entry.entityId === client.id);
  const clientRequests = visibleRequests(context).filter((request) => request.clientId === client.id);

  return (
    <Page title={`${client.firstName} ${client.lastName}`} eyebrow="Fiche client">
      <section className="summary-band">
        <div><span>Telephone</span><strong>{client.primaryPhone}</strong></div>
        <div><span>Statut</span><strong>{client.status}</strong></div>
        <div><span>Conseiller</span><strong>{advisorName(context, client.assignedAdvisorId)}</strong></div>
      </section>
      <section className="split-layout">
        <div className="panel">
          <h2>Demandes liees</h2>
          <div className="stack">{clientRequests.map((request) => <RequestRow key={request.id} context={context} request={request} />)}</div>
        </div>
        <AuditPanel logs={logs} context={context} />
      </section>
    </Page>
  );
}

function RequestsPage({ context }: { context: CrmContext }) {
  const requests = visibleRequests(context);
  return (
    <Page title="Demandes" eyebrow="Besoins immobiliers" action={<Link className="primary-button" to="/requests/new"><Plus size={18} /><span>Nouvelle demande</span></Link>}>
      <section className="stack">{requests.map((request) => <RequestRow key={request.id} context={context} request={request} />)}</section>
    </Page>
  );
}

function RequestFormPage({ context }: { context: CrmContext }) {
  const navigate = useNavigate();
  const clientOptions = visibleClients(context);
  const [form, setForm] = useState({
    clientId: clientOptions[0]?.id ?? "",
    transactionType: "achat",
    city: "Casablanca",
    districts: "Maarif, Racine",
    budgetMin: "1200000",
    budgetMax: "2000000",
    propertyType: "Appartement",
    minSurface: "80",
    minBedrooms: "2",
    minBathrooms: "1",
    preferredFloor: "",
    elevator: true,
    parking: true,
    terrace: false,
    furnished: false,
    urgency: "normale",
    notes: ""
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const client = context.clients.find((item) => item.id === form.clientId);
    const stamp = new Date().toISOString();
    const request: ClientRequest = {
      id: crypto.randomUUID(),
      clientId: form.clientId,
      advisorId: context.currentUser!.role === "CONSEILLER" ? context.currentUser!.id : client?.assignedAdvisorId ?? context.currentUser!.id,
      transactionType: form.transactionType as ClientRequest["transactionType"],
      city: form.city,
      districts: form.districts.split(",").map((item) => item.trim()).filter(Boolean),
      budgetMin: Number(form.budgetMin),
      budgetMax: Number(form.budgetMax),
      propertyType: form.propertyType,
      minSurface: Number(form.minSurface),
      minBedrooms: Number(form.minBedrooms),
      minBathrooms: Number(form.minBathrooms),
      preferredFloor: form.preferredFloor || undefined,
      elevator: form.elevator,
      parking: form.parking,
      terrace: form.terrace,
      furnished: form.furnished,
      urgency: form.urgency as ClientRequest["urgency"],
      status: "ouverte",
      notes: form.notes,
      createdAt: stamp,
      updatedAt: stamp
    };
    context.setRequests([request, ...context.requests]);
    context.logAction("creation_demande", "request", request.id, { clientId: request.clientId, urgency: request.urgency });
    navigate(`/requests/${request.id}`);
  };

  if (!clientOptions.length) {
    return <Page title="Nouvelle demande" eyebrow="Besoins"><EmptyState title="Aucun client disponible" text="Creer un client avant d'ouvrir une demande." /></Page>;
  }

  return (
    <Page title="Nouvelle demande" eyebrow="Besoins immobiliers">
      <form className="form-panel" onSubmit={submit}>
        <label>Client<select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>{clientOptions.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}</select></label>
        <SelectField label="Transaction" value={form.transactionType} values={["achat", "location"]} onChange={(transactionType) => setForm({ ...form, transactionType })} />
        <TextInput label="Ville" value={form.city} onChange={(city) => setForm({ ...form, city })} required />
        <TextInput label="Quartiers souhaites" value={form.districts} onChange={(districts) => setForm({ ...form, districts })} required />
        <TextInput label="Budget min" type="number" value={form.budgetMin} onChange={(budgetMin) => setForm({ ...form, budgetMin })} required />
        <TextInput label="Budget max" type="number" value={form.budgetMax} onChange={(budgetMax) => setForm({ ...form, budgetMax })} required />
        <TextInput label="Type de bien" value={form.propertyType} onChange={(propertyType) => setForm({ ...form, propertyType })} required />
        <TextInput label="Surface min" type="number" value={form.minSurface} onChange={(minSurface) => setForm({ ...form, minSurface })} required />
        <TextInput label="Chambres min" type="number" value={form.minBedrooms} onChange={(minBedrooms) => setForm({ ...form, minBedrooms })} required />
        <TextInput label="Salles de bain min" type="number" value={form.minBathrooms} onChange={(minBathrooms) => setForm({ ...form, minBathrooms })} required />
        <TextInput label="Etage souhaite" value={form.preferredFloor} onChange={(preferredFloor) => setForm({ ...form, preferredFloor })} />
        <SelectField label="Urgence" value={form.urgency} values={["faible", "normale", "elevee", "immediate"]} onChange={(urgency) => setForm({ ...form, urgency })} />
        <Checkbox label="Ascenseur" checked={form.elevator} onChange={(elevator) => setForm({ ...form, elevator })} />
        <Checkbox label="Parking" checked={form.parking} onChange={(parking) => setForm({ ...form, parking })} />
        <Checkbox label="Terrasse/balcon" checked={form.terrace} onChange={(terrace) => setForm({ ...form, terrace })} />
        <Checkbox label="Meuble" checked={form.furnished} onChange={(furnished) => setForm({ ...form, furnished })} />
        <label className="wide">Notes libres<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <button className="primary-button" type="submit"><Plus size={18} /><span>Creer demande</span></button>
      </form>
    </Page>
  );
}

function RequestDetailPage({ context }: { context: CrmContext }) {
  const { id } = useParams();
  const request = visibleRequests(context).find((item) => item.id === id);
  if (!request) return <Navigate to="/requests" replace />;

  return (
    <Page title="Detail demande" eyebrow={request.status}>
      <section className="summary-band">
        <div><span>Client</span><strong>{clientName(context, request.clientId)}</strong></div>
        <div><span>Budget</span><strong>{money(request.budgetMin)} - {money(request.budgetMax)}</strong></div>
        <div><span>Besoin</span><strong>{request.propertyType}, {request.minSurface} m2, {request.minBedrooms} ch.</strong></div>
      </section>
      <MatchSection title="Section 1 - Biens internes" matches={internalMatches(context, request)} context={context} />
      <MatchSection title="Section 2 - Avito / Mubawab" matches={externalMatches(request)} context={context} external />
      <AuditPanel logs={visibleAuditLogs(context).filter((entry) => entry.entityId === request.id)} context={context} />
    </Page>
  );
}

function ImportYakeeyPage({ context }: { context: CrmContext }) {
  const [url, setUrl] = useState("");
  const [created, setCreated] = useState<PropertyCard | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const ownerAdvisorId = context.currentUser!.role === "CONSEILLER" ? context.currentUser!.id : visibleUsers(context).find((user) => user.role === "CONSEILLER")?.id ?? context.currentUser!.id;
    const card = mockYakeeyCard(url, ownerAdvisorId);
    context.setPropertyCards([card, ...context.propertyCards]);
    context.logAction("import_vision_card", "property_card", card.id, { sourceUrl: url });
    setCreated(card);
    setUrl("");
  };
  return (
    <Page title="Importer un bien" eyebrow="Vision Card Yakeey">
      <form className="form-panel single" onSubmit={submit}>
        <TextInput label="Lien Yakeey" type="url" value={url} onChange={setUrl} required />
        <button className="primary-button" type="submit"><UploadCloud size={18} /><span>Generer Vision Card</span></button>
      </form>
      {created && <section className="panel"><h2>Vision Card creee</h2><PropertyCardView card={created} context={context} /></section>}
    </Page>
  );
}

function VisionCardsPage({ context }: { context: CrmContext }) {
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [advisor, setAdvisor] = useState("");
  const allVisible = visibleVisionCards(context);
  const cards = allVisible.filter((card) => (!city || card.city === city) && (!type || card.propertyType === type) && (!advisor || card.ownerAdvisorId === advisor));
  return (
    <Page title="Vision Cards" eyebrow="Biens internes">
      <section className="filter-bar">
        <SelectFilter label="Ville" value={city} values={[...new Set(allVisible.map((card) => card.city))]} onChange={setCity} />
        <SelectFilter label="Type" value={type} values={[...new Set(allVisible.map((card) => card.propertyType))]} onChange={setType} />
        <SelectFilter label="Conseiller" value={advisor} values={[...new Set(allVisible.map((card) => card.ownerAdvisorId))]} labelFor={(value) => advisorName(context, value)} onChange={setAdvisor} />
      </section>
      <section className="card-grid">{cards.map((card) => <PropertyCardView key={card.id} card={card} context={context} mutable />)}</section>
    </Page>
  );
}

function SmartHunterPage({ context }: { context: CrmContext }) {
  const requests = visibleRequests(context);
  const [selectedId, setSelectedId] = useState(requests[0]?.id ?? "");
  const request = requests.find((item) => item.id === selectedId) ?? requests[0];
  const internal = useMemo(() => (request ? internalMatches(context, request).slice(0, 3) : []), [context.propertyCards, request]);
  const external = useMemo(() => (request ? externalMatches(request).slice(0, 3) : []), [request]);
  const blockers = [...internal, ...external].flatMap((match) => match.blockers).slice(0, 5);

  return (
    <Page title="Smart Property Hunter V3" eyebrow="Analyse deterministe">
      {!request ? (
        <EmptyState title="Aucune demande disponible" text="Creer une demande pour activer le resume et le top 3." />
      ) : (
        <>
          <section className="filter-bar">
            <label>Demande<select value={request.id} onChange={(event) => setSelectedId(event.target.value)}>{requests.map((item) => <option key={item.id} value={item.id}>{clientName(context, item.clientId)} - {item.city}</option>)}</select></label>
          </section>
          <section className="panel champagne">
            <h2>Resume intelligent</h2>
            <p>{clientName(context, request.clientId)} cherche un {request.propertyType.toLowerCase()} en {request.transactionType} a {request.city}, idealement {request.districts.join(", ")}, avec budget {money(request.budgetMin)} a {money(request.budgetMax)}.</p>
            <div className="insight-grid">
              <Insight title="Criteres bloquants" items={blockers.length ? blockers : ["Aucun bloquant majeur dans le top"]} />
              <Insight title="Opportunites a relancer" items={[...internal, ...external].filter((match) => match.score >= 70).map((match) => match.property.title).slice(0, 3)} />
              <Insight title="Recommandation conseiller" items={[internal[0]?.score >= 75 ? "Coordonner le conseiller source et appeler le client." : "Elargir les quartiers et surveiller les sources externes."]} />
            </div>
          </section>
          <MatchSection title="Top 3 biens internes" matches={internal} context={context} />
          <MatchSection title="Top 3 biens externes" matches={external} context={context} external />
        </>
      )}
    </Page>
  );
}

function AdminPage({ context }: { context: CrmContext }) {
  if (context.currentUser?.role === "CONSEILLER") return <AccessDenied />;
  const [form, setForm] = useState({ username: "", name: "", role: "CONSEILLER", password: "12345678" });
  const actor = context.currentUser!;
  const users = visibleUsers(context);

  const createUser = (event: FormEvent) => {
    event.preventDefault();
    const stamp = new Date().toISOString();
    const role = (actor.role === "ADMIN" ? "CONSEILLER" : form.role) as Role;
    const user: User = {
      id: crypto.randomUUID(),
      username: form.username,
      name: form.name || form.username,
      role,
      mustChangePassword: true,
      isActive: true,
      visibleToAdmin: role !== "LUCIFER",
      createdAt: stamp,
      updatedAt: stamp
    };
    context.setUsers([user, ...context.users]);
    context.setPasswordBook({ ...context.passwordBook, [user.username]: form.password });
    context.logAction("action_admin_utilisateur", "app_user", user.id, { action: "create", role });
    setForm({ username: "", name: "", role: "CONSEILLER", password: "12345678" });
  };

  const patchUser = (target: User, patch: Partial<User>) => {
    const updated = { ...target, ...patch, updatedAt: new Date().toISOString() };
    context.setUsers(context.users.map((item) => (item.id === target.id ? updated : item)));
    context.logAction("action_admin_utilisateur", "app_user", target.id, { action: "update" });
  };

  return (
    <Page title="Administration utilisateurs" eyebrow="Roles et securite">
      <form className="form-panel compact-form" onSubmit={createUser}>
        <TextInput label="Username" value={form.username} onChange={(username) => setForm({ ...form, username })} required />
        <TextInput label="Nom affiche" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        {actor.role === "LUCIFER" && <SelectField label="Role" value={form.role} values={["LUCIFER", "ADMIN", "CONSEILLER"]} onChange={(role) => setForm({ ...form, role })} />}
        <TextInput label="Mot de passe temporaire" value={form.password} onChange={(password) => setForm({ ...form, password })} required />
        <button className="primary-button" type="submit"><UserPlus size={18} /><span>Creer compte</span></button>
      </form>
      <section className="card-grid">
        {users.map((user) => (
          <article className="entity-card" key={user.id}>
            <div className="avatar-line"><span className="avatar">{initials(user.name)}</span><div><h3>{user.name}</h3><p>@{user.username}</p></div></div>
            <div className="inline-badges"><Badge>{user.role}</Badge><Badge>{user.isActive ? "actif" : "desactive"}</Badge>{user.mustChangePassword && <Badge>mot de passe requis</Badge>}</div>
            <div className="button-row">
              <button className="secondary-button" onClick={() => patchUser(user, { isActive: !user.isActive })}>{user.isActive ? "Desactiver" : "Activer"}</button>
              <button className="secondary-button" onClick={() => patchUser(user, { mustChangePassword: true })}>Forcer changement</button>
              <button className="secondary-button" onClick={() => context.setPasswordBook({ ...context.passwordBook, [user.username]: "12345678" })}>Reset 12345678</button>
              {user.role === "CONSEILLER" && <button className="ghost-danger" onClick={() => context.setUsers(context.users.filter((item) => item.id !== user.id))}>Supprimer</button>}
            </div>
          </article>
        ))}
      </section>
    </Page>
  );
}

function AuditLogsPage({ context }: { context: CrmContext }) {
  if (context.currentUser?.role !== "LUCIFER") return <AccessDenied />;
  return (
    <Page title="Audit logs" eyebrow="Historique LUCIFER">
      <section className="panel">
        <div className="audit-table">
          {context.auditLogs.map((entry) => (
            <div key={entry.id}>
              <span>{shortDate(entry.createdAt)}</span>
              <strong>{entry.action.replaceAll("_", " ")}</strong>
              <span>{entry.entityType}</span>
              <span>{advisorName(context, entry.actorUserId)}</span>
            </div>
          ))}
        </div>
      </section>
    </Page>
  );
}

function SettingsPage({ context }: { context: CrmContext }) {
  return (
    <Page title="Parametres" eyebrow="Theme clair/sombre">
      <section className="panel settings-panel">
        <button className={context.theme === "dark" ? "theme-choice active" : "theme-choice"} onClick={() => context.setTheme("dark")}><Moon size={22} /><span>Sombre</span></button>
        <button className={context.theme === "light" ? "theme-choice active" : "theme-choice"} onClick={() => context.setTheme("light")}><Sun size={22} /><span>Clair</span></button>
      </section>
    </Page>
  );
}

function Page({ title, eyebrow, action, children }: { title: string; eyebrow: string; action?: ReactNode; children: ReactNode }) {
  return <div className="page"><header className="page-header"><div><span>{eyebrow}</span><h1>{title}</h1></div>{action}</header>{children}</div>;
}

function Metric({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return <article className="metric-card"><div className="metric-icon">{icon}</div><span>{title}</span><strong>{value}</strong></article>;
}

function RequestRow({ context, request }: { context: CrmContext; request: ClientRequest }) {
  return (
    <Link className="request-row" to={`/requests/${request.id}`}>
      <div><h3>{clientName(context, request.clientId)}</h3><p>{request.transactionType} - {request.city} - {request.propertyType}</p></div>
      <span>{money(request.budgetMin)}+</span>
      <span>{request.urgency}</span>
      <small>{shortDate(request.createdAt)}</small>
    </Link>
  );
}

function MatchSection({ title, matches, context, external }: { title: string; matches: MatchResult[]; context: CrmContext; external?: boolean }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="match-list">
        {matches.length ? matches.map((match) => (
          <article className="match-card" key={match.property.id}>
            <div className="score">{match.score}</div>
            <div><h3>{match.property.title}</h3><p>{match.property.city}, {match.property.district} - {match.property.surface} m2 - {match.property.bedrooms} ch. - {match.property.bathrooms} sdb</p><p className="muted">{match.reasons.join(" | ")}</p></div>
            <div className="match-meta"><strong>{money(match.property.price)}</strong><span>{external ? match.property.source : advisorName(context, match.property.ownerAdvisorId)}</span><a href={match.property.sourceUrl} target="_blank" rel="noreferrer">lien source</a></div>
          </article>
        )) : <p className="muted">Aucun bien avec un score superieur ou egal a 50.</p>}
      </div>
    </section>
  );
}

function PropertyCardView({ card, context, mutable }: { card: PropertyCard; context: CrmContext; mutable?: boolean }) {
  const canMutate = mutable && (context.currentUser?.role !== "CONSEILLER" || card.ownerAdvisorId === context.currentUser.id);
  const updateStatus = (status: PropertyCard["status"]) => {
    context.setPropertyCards(context.propertyCards.map((item) => (item.id === card.id ? { ...item, status, updatedAt: new Date().toISOString() } : item)));
    context.logAction("changement_statut_card", "property_card", card.id, { status });
  };
  return (
    <article className="property-card">
      <div className="property-topline"><span>{card.source}</span><strong>{money(card.price)}</strong></div>
      <h3>{card.title}</h3>
      <p>{card.city}/{card.district} - {card.propertyType}</p>
      <dl><div><dt>Surface</dt><dd>{card.surface} m2</dd></div><div><dt>Chambres</dt><dd>{card.bedrooms}</dd></div><div><dt>SDB</dt><dd>{card.bathrooms}</dd></div></dl>
      <p className="muted">{card.shortDescription}</p>
      <footer><span>{advisorName(context, card.ownerAdvisorId)}</span><a href={card.sourceUrl} target="_blank" rel="noreferrer">source</a></footer>
      {canMutate && <div className="button-row"><button className="secondary-button" onClick={() => updateStatus("ignore")}>Ignorer</button><button className="ghost-danger" onClick={() => updateStatus("expire")}>Expirer</button></div>}
    </article>
  );
}

function AuditPanel({ logs, context }: { logs: AuditLog[]; context: CrmContext }) {
  return <section className="panel"><h2>Historique</h2><div className="activity-list">{logs.length ? logs.map((entry) => <div key={entry.id}><strong>{entry.action.replaceAll("_", " ")}</strong><span>{shortDate(entry.createdAt)} par {advisorName(context, entry.actorUserId)}</span></div>) : <p className="muted">Aucune action tracee.</p>}</div></section>;
}

function Insight({ title, items }: { title: string; items: string[] }) {
  return <div className="insight"><strong>{title}</strong>{items.length ? items.map((item) => <span key={item}>{item}</span>) : <span>Aucune opportunite prioritaire.</span>}</div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><h2>{title}</h2><p>{text}</p></div>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="search-box"><Search size={18} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function TextInput({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return <label>{label}<input value={value} onChange={(event) => onChange(event.target.value)} required={required} type={type} /></label>;
}

function SelectField({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{values.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
}

function SelectFilter({ label, value, values, onChange, labelFor = (item) => item }: { label: string; value: string; values: string[]; onChange: (value: string) => void; labelFor?: (value: string) => string }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Tous</option>{values.map((item) => <option key={item} value={item}>{labelFor(item)}</option>)}</select></label>;
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="check-row"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>;
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="role-badge">{children}</span>;
}

function AccessDenied() {
  return <Page title="Acces refuse" eyebrow="Securite"><EmptyState title="Role insuffisant" text="Cette page est reservee aux roles autorises." /></Page>;
}

function visibleClients(context: CrmContext) {
  if (context.currentUser?.role === "CONSEILLER") return context.clients.filter((client) => client.assignedAdvisorId === context.currentUser?.id);
  return context.clients;
}

function visibleRequests(context: CrmContext) {
  if (context.currentUser?.role === "CONSEILLER") return context.requests.filter((request) => request.advisorId === context.currentUser?.id);
  return context.requests;
}

function visibleVisionCards(context: CrmContext) {
  if (context.currentUser?.role === "CONSEILLER") return context.propertyCards.filter((card) => card.ownerAdvisorId === context.currentUser?.id);
  return context.propertyCards;
}

function visibleUsers(context: CrmContext) {
  if (context.currentUser?.role === "LUCIFER") return context.users;
  return context.users.filter((user) => user.role !== "LUCIFER");
}

function visibleAuditLogs(context: CrmContext) {
  if (context.currentUser?.role === "LUCIFER") return context.auditLogs;
  return context.auditLogs.filter((entry) => context.users.find((user) => user.id === entry.actorUserId)?.role !== "LUCIFER");
}

function internalMatches(context: CrmContext, request: ClientRequest) {
  return context.propertyCards
    .filter((card) => card.status === "actif" && card.ownerAdvisorId !== request.advisorId)
    .map((card) => visibleMatch(request, card))
    .filter(isMatch)
    .sort((a, b) => b.score - a.score);
}

function externalMatches(request: ClientRequest) {
  return externalProperties.map((card) => visibleMatch(request, card)).filter(isMatch).sort((a, b) => b.score - a.score);
}

function isMatch(value: MatchResult | null): value is MatchResult {
  return Boolean(value);
}

function advisorName(context: CrmContext, id: string) {
  return context.users.find((user) => user.id === id)?.name ?? "Source externe";
}

function clientName(context: CrmContext, id: string) {
  const client = context.clients.find((item) => item.id === id);
  return client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function mockYakeeyCard(url: string, ownerAdvisorId: string): PropertyCard {
  const samples = [
    { title: "Appartement lumineux Gauthier", price: 1680000, city: "Casablanca", district: "Gauthier", propertyType: "Appartement", surface: 101, bedrooms: 2, bathrooms: 2, shortDescription: "Lumineux, proche tram, commerces et parking.", elevator: true, parking: true, terrace: false, furnished: false },
    { title: "Appartement moderne Agdal", price: 13200, city: "Rabat", district: "Agdal", propertyType: "Appartement", surface: 96, bedrooms: 2, bathrooms: 2, shortDescription: "Standing, ascenseur, balcon et parking.", elevator: true, parking: true, terrace: true, furnished: false },
    { title: "Villa calme Bouskoura", price: 4400000, city: "Casablanca", district: "Bouskoura", propertyType: "Villa", surface: 285, bedrooms: 4, bathrooms: 3, shortDescription: "Villa familiale avec jardin et quartier calme.", elevator: false, parking: true, terrace: true, furnished: false }
  ];
  const sample = samples[Math.floor(Math.random() * samples.length)];
  const stamp = new Date().toISOString();
  return { id: crypto.randomUUID(), ...sample, source: "Yakeey", sourceUrl: url, ownerAdvisorId, status: "actif", importedAt: stamp, updatedAt: stamp };
}
