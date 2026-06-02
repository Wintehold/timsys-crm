import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Clipboard,
  Contact,
  Eye,
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
  Target,
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
type HunterTransaction = "Vente" | "Location";
type HunterCriteria = {
  type: string;
  transaction: HunterTransaction;
  city: string;
  district: string;
  bedrooms: string;
  budgetMin: string;
  budgetMax: string;
  surfaceMin: string;
  surfaceMax: string;
};
type HunterResult = {
  id: string;
  source: "Avito" | "Mubawab" | "Yakeey interne";
  score: number;
  title: string;
  price: number;
  transaction: HunterTransaction;
  city: string;
  district: string;
  propertyType: string;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  sourceUrl: string;
  shortDescription: string;
  reasons: string[];
  blockers: string[];
  duplicateNotice?: string;
};
type GeneratedAd = {
  channel: "Avito" | "Mubawab" | "Marketplace" | "Instagram";
  title: string;
  text: string;
};

type CrmContext = {
  currentUser: User | null;
  users: User[];
  clients: Client[];
  requests: ClientRequest[];
  propertyCards: PropertyCard[];
  auditLogs: AuditLog[];
  generatedAds: Record<string, GeneratedAd[]>;
  passwordBook: Record<string, string>;
  theme: Theme;
  setCurrentUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;
  setClients: (clients: Client[]) => void;
  setRequests: (requests: ClientRequest[]) => void;
  setPropertyCards: (cards: PropertyCard[]) => void;
  setGeneratedAds: (ads: Record<string, GeneratedAd[]>) => void;
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
  const [generatedAds, setGeneratedAds] = useState<Record<string, GeneratedAd[]>>({});
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
    generatedAds,
    passwordBook,
    theme,
    setCurrentUser,
    setUsers,
    setClients,
    setRequests,
    setPropertyCards,
    setGeneratedAds,
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
        <Route path="/ai-writer/:id" element={<AiWriterPage context={context} />} />
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
  const topScored = requests.flatMap((request) => [...internalMatches(context, request), ...externalMatches(request)]).slice(0, 3);
  const generatedAdsCount = Object.values(context.generatedAds).reduce((total, ads) => total + ads.length, 0);

  return (
    <Page title="Dashboard metier" eyebrow="TIM CRM Beta 1" action={<QuickActions />}>
      <section className="metric-grid">
        <Metric title="Clients actifs" value={clients.filter((client) => client.status !== "cloture").length} icon={<Users size={20} />} />
        <Metric title="Demandes ouvertes" value={requests.filter((request) => request.status !== "cloturee").length} icon={<FilePlus2 size={20} />} />
        <Metric title="Vision Cards actives" value={cards.length} icon={<Building2 size={20} />} />
        <Metric title="Resultats Hunter" value={matchCount + externalCount} icon={<Target size={20} />} />
        <Metric title="Annonces IA" value={generatedAdsCount} icon={<Sparkles size={20} />} />
        <Metric title="Demandes urgentes" value={requests.filter((request) => ["elevee", "immediate"].includes(request.urgency)).length} icon={<Shield size={20} />} />
        <Metric title="Imports recents" value={cards.filter((card) => card.source === "Yakeey").length} icon={<UploadCloud size={20} />} />
        <Metric title="Conseillers actifs" value={context.users.filter((user) => user.role === "CONSEILLER" && user.isActive).length} icon={<Users size={20} />} />
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
      <section className="panel">
        <h2>Top biens scores</h2>
        <div className="hunter-results compact-results">
          {topScored.length ? topScored.map((match) => <HunterResultCard key={`${match.property.id}-${match.score}`} result={matchToHunterResult(match)} />) : <p className="muted">Aucun bien score pour le moment.</p>}
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
      <Link className="secondary-button" to="/smart-hunter"><Wand2 size={18} /><span>Lancer la chasse</span></Link>
      <Link className="secondary-button" to="/vision-cards"><Sparkles size={18} /><span>Redacteur IA</span></Link>
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
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PropertyCard | null>(null);
  const [created, setCreated] = useState<PropertyCard | null>(null);
  const analyze = (event: FormEvent) => {
    event.preventDefault();
    setCreated(null);
    setError("");
    if (!url.trim()) return setError("Lien Yakeey obligatoire.");
    if (!/yakeey/i.test(url)) return setError("Le lien doit contenir yakeey.");
    const ownerAdvisorId = context.currentUser!.role === "CONSEILLER" ? context.currentUser!.id : visibleUsers(context).find((user) => user.role === "CONSEILLER")?.id ?? context.currentUser!.id;
    setPreview(analyzeYakeeyLink(url, ownerAdvisorId));
  };
  const updatePreview = (patch: Partial<PropertyCard>) => {
    if (preview) setPreview({ ...preview, ...patch });
  };
  const createCard = () => {
    if (!preview) return;
    if (!preview.title || !preview.city || !preview.propertyType || Number.isNaN(preview.price) || Number.isNaN(preview.surface)) {
      setError("Titre, ville, type, prix numerique et surface numerique sont obligatoires.");
      return;
    }
    const card = { ...preview, id: crypto.randomUUID(), importedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    context.setPropertyCards([card, ...context.propertyCards]);
    context.logAction("import_vision_card", "property_card", card.id, { sourceUrl: card.sourceUrl });
    setCreated(card);
    setPreview(null);
    setUrl("");
  };
  return (
    <Page title="Importer un bien" eyebrow="Vision Card Yakeey">
      <form className="form-panel single" onSubmit={analyze}>
        <TextInput label="Lien Yakeey" type="url" value={url} onChange={setUrl} required />
        <button className="primary-button" type="submit"><Search size={18} /><span>Analyser</span></button>
      </form>
      {error && <p className="error">{error}</p>}
      {preview && (
        <section className="panel">
          <h2>Preview Yakeey</h2>
          <div className="form-panel">
            <TextInput label="Titre" value={preview.title} onChange={(title) => updatePreview({ title })} required />
            <TextInput label="Prix" type="number" value={String(preview.price)} onChange={(price) => updatePreview({ price: Number(price) })} required />
            <TextInput label="Ville" value={preview.city} onChange={(city) => updatePreview({ city })} required />
            <TextInput label="Quartier" value={preview.district} onChange={(district) => updatePreview({ district })} />
            <TextInput label="Type" value={preview.propertyType} onChange={(propertyType) => updatePreview({ propertyType })} required />
            <TextInput label="Surface" type="number" value={String(preview.surface)} onChange={(surface) => updatePreview({ surface: Number(surface) })} required />
            <TextInput label="Chambres" type="number" value={String(preview.bedrooms)} onChange={(bedrooms) => updatePreview({ bedrooms: Number(bedrooms) })} />
            <TextInput label="Salles de bain" type="number" value={String(preview.bathrooms)} onChange={(bathrooms) => updatePreview({ bathrooms: Number(bathrooms) })} />
            <label className="wide">Description courte<textarea value={preview.shortDescription} onChange={(event) => updatePreview({ shortDescription: event.target.value })} /></label>
            <button className="primary-button" type="button" onClick={createCard}><UploadCloud size={18} /><span>Creer la Vision Card</span></button>
          </div>
        </section>
      )}
      {created && <section className="panel"><h2>Vision Card creee</h2><PropertyCardView card={created} context={context} mutable /></section>}
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
  const [criteria, setCriteria] = useState<HunterCriteria>({
    type: "Appartement",
    transaction: "Vente",
    city: "Casablanca",
    district: "Gauthier",
    bedrooms: "2",
    budgetMin: "1200000",
    budgetMax: "1900000",
    surfaceMin: "80",
    surfaceMax: "130"
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<HunterResult[]>([]);

  const launch = (event: FormEvent) => {
    event.preventDefault();
    const found = runHunterSearch(criteria, context.propertyCards);
    setResults(found);
    setHasSearched(true);
    context.logAction("hunter_search", "hunter_result", undefined, { district: criteria.district, results: found.length });
  };

  return (
    <Page title="Smart Property Hunter" eyebrow="Avito, Mubawab, Yakeey">
      <section className="hunter-launch panel">
        <div>
          <span className="mini-eyebrow">Lancer la chasse</span>
          <h2>Avito, Mubawab, Yakeey avec score, budget/surface numeriques et deduplication</h2>
        </div>
        <form className="hunter-form" onSubmit={launch}>
          <SelectField label="Type" value={criteria.type} values={["Appartement", "Villa", "Maison", "Terrain", "Bureau", "Local commercial"]} onChange={(type) => setCriteria({ ...criteria, type })} />
          <SelectField label="Transaction" value={criteria.transaction} values={["Vente", "Location"]} onChange={(transaction) => setCriteria({ ...criteria, transaction: transaction as HunterTransaction })} />
          <SelectField label="Quartier" value={criteria.district} values={["Gauthier", "Racine", "Maarif", "Bourgogne", "Agdal", "Hay Riad", "Bouskoura"]} onChange={(district) => setCriteria({ ...criteria, district })} />
          <TextInput label="Chambres" value={criteria.bedrooms} onChange={(bedrooms) => setCriteria({ ...criteria, bedrooms })} />
          <TextInput label="Budget min" type="number" value={criteria.budgetMin} onChange={(budgetMin) => setCriteria({ ...criteria, budgetMin })} />
          <TextInput label="Budget max" type="number" value={criteria.budgetMax} onChange={(budgetMax) => setCriteria({ ...criteria, budgetMax })} />
          <TextInput label="Surface min" type="number" value={criteria.surfaceMin} onChange={(surfaceMin) => setCriteria({ ...criteria, surfaceMin })} />
          <TextInput label="Surface max" type="number" value={criteria.surfaceMax} onChange={(surfaceMax) => setCriteria({ ...criteria, surfaceMax })} />
          <button className="primary-button hunter-submit" type="submit"><Target size={18} /><span>Lancer la chasse</span></button>
        </form>
      </section>
      {!hasSearched ? (
        <EmptyState title="Aucun resultat" text="Lancez une recherche pour alimenter les fiches." />
      ) : (
        <section className="hunter-results">
          {results.length ? results.map((result) => <HunterResultCard key={result.id} result={result} />) : <EmptyState title="Aucun resultat qualifie" text="Les biens sous 50/100 sont masques." />}
        </section>
      )}
    </Page>
  );
}

function AiWriterPage({ context }: { context: CrmContext }) {
  const { id } = useParams();
  const card = visibleVisionCards(context).find((item) => item.id === id);
  const [ads, setAds] = useState<GeneratedAd[]>(() => (id ? context.generatedAds[id] ?? [] : []));

  if (!card) return <Navigate to="/vision-cards" replace />;

  const regenerate = () => {
    const next = generateAds(card);
    setAds(next);
    context.setGeneratedAds({ ...context.generatedAds, [card.id]: next });
    context.logAction("generate_ai_ads", "property_card", card.id, { versions: next.length });
  };

  const copyText = (text: string) => {
    void navigator.clipboard?.writeText(text);
  };

  return (
    <Page title="Redacteur IA" eyebrow={card.title} action={<button className="primary-button" onClick={regenerate}><Sparkles size={18} /><span>Regenerer</span></button>}>
      <section className="summary-band">
        <div><span>Bien</span><strong>{card.propertyType} - {card.district}</strong></div>
        <div><span>Prix</span><strong>{money(card.price)}</strong></div>
        <div><span>Format</span><strong>Avito / Mubawab / Marketplace / Instagram</strong></div>
      </section>
      {!ads.length ? (
        <EmptyState title="Aucune annonce generee" text="Lancez la generation pour produire les 4 versions." />
      ) : (
        <section className="ad-grid">
          {ads.map((ad) => (
            <article className="ad-card" key={ad.channel}>
              <Badge>{ad.channel}</Badge>
              <h3>{ad.title}</h3>
              <p>{ad.text}</p>
              <div className="button-row">
                <button className="secondary-button" onClick={() => copyText(`${ad.title}\n\n${ad.text}`)}><Clipboard size={16} /><span>Copier</span></button>
                <button className="secondary-button" onClick={regenerate}><Sparkles size={16} /><span>Regenerer</span></button>
              </div>
            </article>
          ))}
        </section>
      )}
    </Page>
  );
}

function HunterResultCard({ result }: { result: HunterResult }) {
  return (
    <article className="hunter-card">
      <div className="hunter-card-top">
        <Badge>{result.source}</Badge>
        <div className="score">{result.score}</div>
      </div>
      <h3>{result.title}</h3>
      <p>{result.shortDescription}</p>
      <dl>
        <div><dt>Prix</dt><dd>{money(result.price)}</dd></div>
        <div><dt>Transaction</dt><dd>{result.transaction}</dd></div>
        <div><dt>Quartier</dt><dd>{result.district}</dd></div>
        <div><dt>Type</dt><dd>{result.propertyType}</dd></div>
        <div><dt>Surface</dt><dd>{result.surface} m2</dd></div>
        <div><dt>Chambres</dt><dd>{result.bedrooms}</dd></div>
      </dl>
      <p className="muted">{result.reasons.join(", ")}.</p>
      {result.duplicateNotice && <p className="notice">{result.duplicateNotice}</p>}
      <a className="secondary-button" href={result.sourceUrl} target="_blank" rel="noreferrer"><Eye size={16} /><span>Lien source</span></a>
    </article>
  );
}

function AssignmentCard({ advisor, advisors, context }: { advisor: User; advisors: User[]; context: CrmContext }) {
  const [targetId, setTargetId] = useState(advisors.find((item) => item.id !== advisor.id)?.id ?? "");
  const clientsCount = context.clients.filter((client) => client.assignedAdvisorId === advisor.id).length;
  const requestsCount = context.requests.filter((request) => request.advisorId === advisor.id).length;
  const reassign = () => {
    if (!targetId) return;
    context.setClients(context.clients.map((client) => client.assignedAdvisorId === advisor.id ? { ...client, assignedAdvisorId: targetId, updatedAt: new Date().toISOString() } : client));
    context.setRequests(context.requests.map((request) => request.advisorId === advisor.id ? { ...request, advisorId: targetId, updatedAt: new Date().toISOString() } : request));
    context.logAction("reassign_advisor", "app_user", advisor.id, { toAdvisorId: targetId, clientsMoved: clientsCount, requestsMoved: requestsCount });
  };

  return (
    <article className="entity-card">
      <div className="avatar-line"><span className="avatar">{initials(advisor.name)}</span><div><h3>{advisor.name}</h3><p>@{advisor.username}</p></div></div>
      <dl><div><dt>Clients</dt><dd>{clientsCount}</dd></div><div><dt>Demandes</dt><dd>{requestsCount}</dd></div></dl>
      <label>Reassigner vers<select value={targetId} onChange={(event) => setTargetId(event.target.value)}>{advisors.filter((item) => item.id !== advisor.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button className="secondary-button" onClick={reassign}>Reassigner clients/demandes</button>
    </article>
  );
}

function AdminPage({ context }: { context: CrmContext }) {
  if (context.currentUser?.role === "CONSEILLER") return <AccessDenied />;
  const [form, setForm] = useState({ username: "", name: "", role: "CONSEILLER", password: "12345678" });
  const [tab, setTab] = useState("Utilisateurs");
  const actor = context.currentUser!;
  const users = visibleUsers(context);
  const advisors = users.filter((user) => user.role === "CONSEILLER");

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
    <Page title="Administration" eyebrow="Utilisateurs, affectations, activite, securite">
      <div className="tabs">
        {["Utilisateurs", "Affectations", "Activite", "Securite"].map((item) => (
          <button key={item} className={tab === item ? "tab active" : "tab"} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {tab === "Utilisateurs" && (
        <>
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
                <dl>
                  <div><dt>Clients assignes</dt><dd>{context.clients.filter((client) => client.assignedAdvisorId === user.id).length}</dd></div>
                  <div><dt>Demandes</dt><dd>{context.requests.filter((request) => request.advisorId === user.id).length}</dd></div>
                </dl>
                <div className="button-row">
                  <button className="secondary-button" onClick={() => patchUser(user, { isActive: !user.isActive })}>{user.isActive ? "Desactiver" : "Activer"}</button>
                  <button className="secondary-button" onClick={() => patchUser(user, { mustChangePassword: true })}>Forcer changement</button>
                  <button className="secondary-button" onClick={() => context.setPasswordBook({ ...context.passwordBook, [user.username]: "12345678" })}>Reset 12345678</button>
                  {(actor.role === "LUCIFER" || user.role === "CONSEILLER") && user.id !== actor.id && <button className="ghost-danger" onClick={() => context.setUsers(context.users.filter((item) => item.id !== user.id))}>Supprimer</button>}
                </div>
              </article>
            ))}
          </section>
        </>
      )}
      {tab === "Affectations" && (
        <section className="card-grid">
          {advisors.map((advisor) => <AssignmentCard key={advisor.id} advisor={advisor} context={context} advisors={advisors} />)}
        </section>
      )}
      {tab === "Activite" && <AuditPanel logs={visibleAuditLogs(context).slice(0, 12)} context={context} />}
      {tab === "Securite" && (
        <section className="panel">
          <h2>Panneau systeme</h2>
          <div className="insight-grid">
            <Insight title="Role courant" items={[actor.role]} />
            <Insight title="Lucifer visible" items={[actor.role === "LUCIFER" ? "Oui, acces total." : "Non, comptes LUCIFER masques."]} />
            <Insight title="Comptes actifs" items={[String(users.filter((user) => user.isActive).length)]} />
          </div>
        </section>
      )}
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
      <div className="inline-badges"><Badge>{card.status}</Badge><Badge>{advisorName(context, card.ownerAdvisorId)}</Badge></div>
      <footer><span>{card.source}</span><a href={card.sourceUrl} target="_blank" rel="noreferrer">Voir detail</a></footer>
      <div className="button-row">
        <Link className="secondary-button" to={`/ai-writer/${card.id}`}><Sparkles size={16} /><span>Rediger annonces IA</span></Link>
        {canMutate && <button className="secondary-button" onClick={() => updateStatus("ignore")}>Ignorer</button>}
        {canMutate && <button className="ghost-danger" onClick={() => updateStatus("expire")}>Expirer</button>}
      </div>
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

function runHunterSearch(criteria: HunterCriteria, cards: PropertyCard[]) {
  const generated = [
    mockHunterResult("Avito", criteria, 0.92, "Annonce Avito realiste avec ascenseur, parking et proximite commerces."),
    mockHunterResult("Mubawab", criteria, 0.96, "Residence standing, finitions premium, concierge, parking et balcon."),
    mockHunterResult("Avito", criteria, 1.04, "Bien propre, lumineux, proche axes principaux, disponible rapidement."),
    mockHunterResult("Mubawab", criteria, 0.98, "Annonce proche d'un autre portail, conservee seulement si meilleur score.")
  ];
  const internal = cards.filter((card) => card.status === "actif").map(cardToHunterResult);
  const scored = [...generated, ...internal].map((item) => scoreHunter(criteria, item)).filter((item) => item.score >= 50);
  return deduplicateHunter(scored).sort((a, b) => b.score - a.score);
}

function mockHunterResult(source: "Avito" | "Mubawab", criteria: HunterCriteria, priceFactor: number, description: string): HunterResult {
  const basePrice = Number(criteria.budgetMax || (criteria.transaction === "Location" ? 14000 : 1800000));
  const surface = Number(criteria.surfaceMin || 85) + (source === "Mubawab" ? 18 : 9);
  return {
    id: `${source}-${criteria.district}-${priceFactor}`,
    source,
    score: 1,
    title: `${criteria.type} ${criteria.district} ${source === "Mubawab" ? "premium" : "lumineux"}`,
    price: Math.round(basePrice * priceFactor),
    transaction: criteria.transaction,
    city: criteria.city,
    district: criteria.district,
    propertyType: criteria.type,
    surface,
    bedrooms: Number(criteria.bedrooms || 2),
    bathrooms: 2,
    sourceUrl: source === "Avito" ? "https://avito.example/tim-crm-beta-1" : "https://mubawab.example/tim-crm-beta-1",
    shortDescription: description,
    reasons: [],
    blockers: []
  };
}

function cardToHunterResult(card: PropertyCard): HunterResult {
  return {
    id: card.id,
    source: "Yakeey interne",
    score: 1,
    title: card.title,
    price: card.price,
    transaction: card.price < 50000 ? "Location" : "Vente",
    city: card.city,
    district: card.district,
    propertyType: card.propertyType,
    surface: card.surface,
    bedrooms: card.bedrooms,
    bathrooms: card.bathrooms,
    sourceUrl: card.sourceUrl,
    shortDescription: card.shortDescription,
    reasons: [],
    blockers: []
  };
}

function scoreHunter(criteria: HunterCriteria, result: HunterResult): HunterResult {
  let score = 0;
  const reasons: string[] = [];
  const blockers: string[] = [];
  const budgetMin = Number(criteria.budgetMin || 0);
  const budgetMax = Number(criteria.budgetMax || Number.MAX_SAFE_INTEGER);
  if (result.price >= budgetMin && result.price <= budgetMax) {
    score += 25;
    reasons.push("Budget compatible");
  } else if (Math.abs(result.price - budgetMax) <= budgetMax * 0.12) {
    score += 12;
    reasons.push("Budget proche");
  } else {
    blockers.push("Budget hors cible");
  }
  if (same(criteria.district, result.district)) {
    score += 25;
    reasons.push("Quartier demande");
  } else if (same(criteria.city, result.city)) {
    score += 12;
    reasons.push("Ville compatible");
  }
  if (same(criteria.type, result.propertyType)) score += pushReason(reasons, 15, "Type de bien exact");
  else blockers.push("Type different");
  if (result.surface >= Number(criteria.surfaceMin || 0) && result.surface <= Number(criteria.surfaceMax || Number.MAX_SAFE_INTEGER)) score += pushReason(reasons, 10, "Surface suffisante");
  else blockers.push("Surface hors cible");
  if (result.bedrooms >= Number(criteria.bedrooms || 0)) score += pushReason(reasons, 10, `${result.bedrooms} chambres trouvees`);
  else blockers.push("Chambres insuffisantes");
  if (result.transaction === criteria.transaction) score += pushReason(reasons, 10, "Transaction compatible");
  else blockers.push("Transaction differente");
  if (result.shortDescription.length > 40) score += pushReason(reasons, 5, "Description coherente");
  return { ...result, score: Math.max(1, Math.min(100, score)), reasons, blockers };
}

function deduplicateHunter(results: HunterResult[]) {
  const kept: HunterResult[] = [];
  for (const result of results) {
    const duplicateIndex = kept.findIndex((item) => probableDuplicate(item, result));
    if (duplicateIndex === -1) {
      kept.push(result);
    } else if (result.score > kept[duplicateIndex].score) {
      kept[duplicateIndex] = { ...result, duplicateNotice: "Doublon detecte - meilleure source conservee" };
    } else {
      kept[duplicateIndex] = { ...kept[duplicateIndex], duplicateNotice: "Doublon detecte - meilleure source conservee" };
    }
  }
  return kept;
}

function probableDuplicate(a: HunterResult, b: HunterResult) {
  const sameDistrict = same(a.district, b.district);
  const closePrice = Math.abs(a.price - b.price) <= Math.max(a.price, b.price) * 0.05;
  const closeSurface = Math.abs(a.surface - b.surface) <= 5;
  const sameBedrooms = a.bedrooms === b.bedrooms;
  const titleOverlap = normalizeWords(a.title).filter((word) => normalizeWords(b.title).includes(word)).length >= 2;
  return [sameDistrict, closePrice, closeSurface, sameBedrooms, titleOverlap].filter(Boolean).length >= 4;
}

function analyzeYakeeyLink(url: string, ownerAdvisorId: string): PropertyCard {
  const normalized = url.toLowerCase();
  const sample = normalized.includes("agdal")
    ? { title: "Appartement standing Agdal", price: 13200, city: "Rabat", district: "Agdal", propertyType: "Appartement", surface: 96, bedrooms: 2, bathrooms: 2, shortDescription: "Standing, ascenseur, balcon et parking." }
    : normalized.includes("racine")
      ? { title: "Appartement terrasse Racine", price: 1850000, city: "Casablanca", district: "Racine", propertyType: "Appartement", surface: 105, bedrooms: 2, bathrooms: 2, shortDescription: "Terrasse, residence premium et quartier recherche." }
      : { title: "Appartement lumineux Gauthier", price: 1680000, city: "Casablanca", district: "Gauthier", propertyType: "Appartement", surface: 101, bedrooms: 2, bathrooms: 2, shortDescription: "Lumineux, proche tram, commerces et parking." };
  const stamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ...sample,
    source: "Yakeey",
    sourceUrl: url,
    ownerAdvisorId,
    status: "actif",
    elevator: true,
    parking: true,
    terrace: sample.shortDescription.toLowerCase().includes("terrasse") || sample.shortDescription.toLowerCase().includes("balcon"),
    furnished: false,
    importedAt: stamp,
    updatedAt: stamp
  };
}

function generateAds(card: PropertyCard): GeneratedAd[] {
  const location = `${card.district}, ${card.city}`;
  const specs = `${card.surface} m2, ${card.bedrooms} chambres, ${card.bathrooms} salles de bain`;
  return [
    {
      channel: "Avito",
      title: `${card.propertyType} lumineux a ${card.district}`,
      text: `Decouvrez ce ${card.propertyType.toLowerCase()} de ${specs} situe a ${location}. ${card.shortDescription} Contactez votre conseiller pour organiser une visite.`
    },
    {
      channel: "Mubawab",
      title: `${card.propertyType} premium a ${location}`,
      text: `TIM CRM vous presente un bien selectionne pour son emplacement et son potentiel. Surface: ${card.surface} m2. Chambres: ${card.bedrooms}. Salles de bain: ${card.bathrooms}. Points forts: ${card.shortDescription}`
    },
    {
      channel: "Marketplace",
      title: `${card.propertyType} disponible a ${card.district}`,
      text: `Bien disponible a ${card.district}: ${specs}. ${card.shortDescription} Contact rapide pour infos et visite.`
    },
    {
      channel: "Instagram",
      title: `Nouvelle pepite a ${card.district}`,
      text: `${card.propertyType} a ${card.district}. ${specs}. ${card.shortDescription} Visite sur rendez-vous avec TIM CRM. ✨ #immobilier #timcrm #casablanca`
    }
  ];
}

function matchToHunterResult(match: MatchResult): HunterResult {
  return {
    ...cardToHunterResult(match.property),
    source: match.property.source === "Yakeey" ? "Yakeey interne" : match.property.source,
    score: match.score,
    reasons: match.reasons,
    blockers: match.blockers
  };
}

function pushReason(reasons: string[], points: number, label: string) {
  reasons.push(label);
  return points;
}

function same(a: string, b: string) {
  return normalizeText(a) === normalizeText(b);
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function normalizeWords(value: string) {
  return normalizeText(value).split(/\W+/).filter((word) => word.length > 3);
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
