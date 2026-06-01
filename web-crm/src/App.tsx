import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Contact,
  FilePlus2,
  Home,
  LogOut,
  Plus,
  Search,
  Shield,
  Sparkles,
  UploadCloud,
  Users,
  Wand2
} from "lucide-react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  Client,
  ClientRequest,
  PropertyCard,
  Role,
  User,
  visibleMatch
} from "@timcrm/shared";
import {
  clients as seedClients,
  externalProperties,
  propertyCards as seedPropertyCards,
  requests as seedRequests,
  users as seedUsers
} from "./data/mockData";
import { money, shortDate } from "./lib/format";

const password = "preview123";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [requests, setRequests] = useState<ClientRequest[]>(seedRequests);
  const [propertyCards, setPropertyCards] = useState<PropertyCard[]>(seedPropertyCards);

  const context: CrmContext = {
    currentUser,
    users: seedUsers,
    clients,
    requests,
    propertyCards,
    setCurrentUser,
    addClient: (client) => setClients((items) => [client, ...items]),
    addRequest: (request) => setRequests((items) => [request, ...items]),
    addPropertyCard: (card) => setPropertyCards((items) => [card, ...items])
  };

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage context={context} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Shell currentUser={currentUser} logout={() => setCurrentUser(null)}>
      <Routes>
        <Route path="/" element={<Dashboard context={context} />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/clients" element={<ClientsPage context={context} />} />
        <Route path="/clients/new" element={<NewClientPage context={context} />} />
        <Route path="/requests" element={<RequestsPage context={context} />} />
        <Route path="/requests/new" element={<NewRequestPage context={context} />} />
        <Route path="/requests/:id" element={<RequestDetailPage context={context} />} />
        <Route path="/import-yakeey" element={<ImportYakeeyPage context={context} />} />
        <Route path="/vision-cards" element={<VisionCardsPage context={context} />} />
        <Route path="/admin" element={<AdminPage context={context} />} />
        <Route path="/smart-hunter" element={<SmartHunterPage context={context} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

type CrmContext = {
  currentUser: User | null;
  users: User[];
  clients: Client[];
  requests: ClientRequest[];
  propertyCards: PropertyCard[];
  setCurrentUser: (user: User) => void;
  addClient: (client: Client) => void;
  addRequest: (request: ClientRequest) => void;
  addPropertyCard: (card: PropertyCard) => void;
};

function Shell({
  currentUser,
  logout,
  children
}: {
  currentUser: User;
  logout: () => void;
  children: ReactNode;
}) {
  const navItems = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/clients", label: "Clients", icon: Contact },
    { to: "/requests", label: "Demandes", icon: FilePlus2 },
    { to: "/import-yakeey", label: "Import Yakeey", icon: UploadCloud },
    { to: "/vision-cards", label: "Vision Cards", icon: Building2 },
    { to: "/smart-hunter", label: "Hunter V3", icon: Sparkles },
    ...(currentUser.role !== "CONSEILLER"
      ? [{ to: "/admin", label: "Administration", icon: Shield }]
      : [])
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div>
            <strong>TIMsys</strong>
            <span>By Morningstar Technologies</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-pill">
            <span>{initials(currentUser.name)}</span>
            <div>
              <strong>{currentUser.name}</strong>
              <small>{currentUser.role}</small>
            </div>
          </div>
          <button className="ghost-button" onClick={logout} title="Logout">
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
  const [email, setEmail] = useState("admin@tim.local");
  const [pass, setPass] = useState(password);
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const user = context.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!user || pass !== password) {
      setError("Identifiants invalides pour la Preview 1.");
      return;
    }
    context.setCurrentUser(user);
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="brand-mark large">T</div>
          <h1>TIMsys</h1>
          <p>By Morningstar Technologies</p>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Email
            <select value={email} onChange={(event) => setEmail(event.target.value)}>
              {context.users.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.email} - {user.role}
                </option>
              ))}
            </select>
          </label>
          <label>
            Password
            <input value={pass} onChange={(event) => setPass(event.target.value)} type="password" />
          </label>
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

function Dashboard({ context }: { context: CrmContext }) {
  const clients = visibleClients(context);
  const requests = visibleRequests(context);
  const cards = visibleVisionCards(context);
  const internalMatchCount = requests.reduce(
    (total, request) =>
      total +
      context.propertyCards
        .filter((card) => card.ownerAdvisorId !== request.advisorId)
        .map((card) => visibleMatch(request, card))
        .filter(Boolean).length,
    0
  );

  return (
    <Page title="Dashboard" eyebrow="TIMsys Preview 1" action={<QuickActions />}>
      <section className="metric-grid">
        <Metric title="Clients" value={clients.length} icon={<Users size={20} />} />
        <Metric title="Demandes" value={requests.length} icon={<FilePlus2 size={20} />} />
        <Metric title="Vision Cards" value={cards.length} icon={<Building2 size={20} />} />
        <Metric title="Matchs internes" value={internalMatchCount} icon={<BarChart3 size={20} />} />
      </section>
      <section className="split-layout">
        <div className="panel">
          <h2>Demandes recentes</h2>
          <div className="stack">
            {requests.slice(0, 4).map((request) => (
              <RequestRow key={request.id} context={context} request={request} />
            ))}
          </div>
        </div>
        <div className="panel champagne">
          <h2>Smart Property Hunter V3</h2>
          <p>
            Base technique prete: resume automatique, top 3 compatibles et explication humaine du
            matching. L'IA pourra etre branchee dans une phase suivante.
          </p>
          <Link className="primary-button" to="/smart-hunter">
            <Wand2 size={18} />
            <span>Ouvrir Hunter V3</span>
          </Link>
        </div>
      </section>
    </Page>
  );
}

function QuickActions() {
  return (
    <div className="action-row">
      <Link className="primary-button" to="/requests/new">
        <Plus size={18} />
        <span>Nouvelle demande</span>
      </Link>
      <Link className="secondary-button" to="/import-yakeey">
        <UploadCloud size={18} />
        <span>Importer lien Yakeey</span>
      </Link>
    </div>
  );
}

function ClientsPage({ context }: { context: CrmContext }) {
  const [query, setQuery] = useState("");
  const clients = visibleClients(context).filter((client) =>
    `${client.firstName} ${client.lastName} ${client.primaryPhone}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <Page
      title="Clients"
      eyebrow="Contacts clients"
      action={
        <Link className="primary-button" to="/clients/new">
          <Plus size={18} />
          <span>Nouveau client</span>
        </Link>
      }
    >
      <SearchBox value={query} onChange={setQuery} placeholder="Rechercher un client" />
      <section className="card-grid">
        {clients.map((client) => (
          <article className="entity-card" key={client.id}>
            <div>
              <h3>
                {client.firstName} {client.lastName}
              </h3>
              <p>{client.primaryPhone}</p>
            </div>
            <dl>
              <div>
                <dt>Email</dt>
                <dd>{client.email ?? "Non renseigne"}</dd>
              </div>
              <div>
                <dt>Conseiller</dt>
                <dd>{advisorName(context, client.assignedAdvisorId)}</dd>
              </div>
            </dl>
            {client.notes && <p className="muted">{client.notes}</p>}
          </article>
        ))}
      </section>
    </Page>
  );
}

function NewClientPage({ context }: { context: CrmContext }) {
  const navigate = useNavigate();
  const advisorOptions = context.currentUser?.role === "CONSEILLER" ? [context.currentUser] : visibleUsers(context);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    primaryPhone: "",
    secondaryPhone: "",
    email: "",
    notes: "",
    assignedAdvisorId: advisorOptions.find((user) => user.role === "CONSEILLER")?.id ?? context.currentUser!.id
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    context.addClient({
      id: crypto.randomUUID(),
      ...form
    });
    navigate("/clients");
  };

  return (
    <Page title="Nouveau client" eyebrow="Contacts">
      <form className="form-panel" onSubmit={submit}>
        <TextInput label="Prenom" value={form.firstName} onChange={(firstName) => setForm({ ...form, firstName })} required />
        <TextInput label="Nom" value={form.lastName} onChange={(lastName) => setForm({ ...form, lastName })} required />
        <TextInput label="Telephone principal" value={form.primaryPhone} onChange={(primaryPhone) => setForm({ ...form, primaryPhone })} required />
        <TextInput label="Telephone secondaire" value={form.secondaryPhone} onChange={(secondaryPhone) => setForm({ ...form, secondaryPhone })} />
        <TextInput label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <label>
          Conseiller assigne
          <select
            value={form.assignedAdvisorId}
            onChange={(event) => setForm({ ...form, assignedAdvisorId: event.target.value })}
          >
            {advisorOptions
              .filter((user) => user.role === "CONSEILLER")
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
          </select>
        </label>
        <label className="wide">
          Notes
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </label>
        <button className="primary-button" type="submit">
          <Plus size={18} />
          <span>Creer client</span>
        </button>
      </form>
    </Page>
  );
}

function RequestsPage({ context }: { context: CrmContext }) {
  const requests = visibleRequests(context);

  return (
    <Page
      title="Demandes"
      eyebrow="Besoins immobiliers"
      action={
        <Link className="primary-button" to="/requests/new">
          <Plus size={18} />
          <span>Nouvelle demande</span>
        </Link>
      }
    >
      <section className="stack">
        {requests.map((request) => (
          <RequestRow key={request.id} context={context} request={request} />
        ))}
      </section>
    </Page>
  );
}

function NewRequestPage({ context }: { context: CrmContext }) {
  const navigate = useNavigate();
  const clientOptions = visibleClients(context);
  const advisorId = context.currentUser!.role === "CONSEILLER" ? context.currentUser!.id : clientOptions[0]?.assignedAdvisorId ?? context.currentUser!.id;
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
    notes: ""
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const client = context.clients.find((item) => item.id === form.clientId);
    const request: ClientRequest = {
      id: crypto.randomUUID(),
      clientId: form.clientId,
      advisorId: context.currentUser!.role === "CONSEILLER" ? context.currentUser!.id : client?.assignedAdvisorId ?? advisorId,
      transactionType: form.transactionType as "achat" | "location",
      city: form.city,
      districts: form.districts.split(",").map((item) => item.trim()).filter(Boolean),
      budgetMin: Number(form.budgetMin),
      budgetMax: Number(form.budgetMax),
      propertyType: form.propertyType,
      minSurface: Number(form.minSurface),
      minBedrooms: Number(form.minBedrooms),
      minBathrooms: Number(form.minBathrooms),
      notes: form.notes,
      createdAt: new Date().toISOString()
    };
    context.addRequest(request);
    navigate(`/requests/${request.id}`);
  };

  if (!clientOptions.length) {
    return (
      <Page title="Nouvelle demande" eyebrow="Besoins immobiliers">
        <div className="empty-state">
          <h2>Aucun client disponible</h2>
          <p>Creer un client avant d'ouvrir une demande.</p>
          <Link className="primary-button" to="/clients/new">
            <Plus size={18} />
            <span>Nouveau client</span>
          </Link>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Nouvelle demande" eyebrow="Besoins immobiliers">
      <form className="form-panel" onSubmit={submit}>
        <label>
          Client lie
          <select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
            {clientOptions.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Transaction
          <select value={form.transactionType} onChange={(event) => setForm({ ...form, transactionType: event.target.value })}>
            <option value="achat">Achat</option>
            <option value="location">Location</option>
          </select>
        </label>
        <TextInput label="Ville" value={form.city} onChange={(city) => setForm({ ...form, city })} required />
        <TextInput label="Quartiers souhaites" value={form.districts} onChange={(districts) => setForm({ ...form, districts })} required />
        <TextInput label="Budget minimum" type="number" value={form.budgetMin} onChange={(budgetMin) => setForm({ ...form, budgetMin })} required />
        <TextInput label="Budget maximum" type="number" value={form.budgetMax} onChange={(budgetMax) => setForm({ ...form, budgetMax })} required />
        <TextInput label="Type de bien" value={form.propertyType} onChange={(propertyType) => setForm({ ...form, propertyType })} required />
        <TextInput label="Surface minimum" type="number" value={form.minSurface} onChange={(minSurface) => setForm({ ...form, minSurface })} required />
        <TextInput label="Chambres min." type="number" value={form.minBedrooms} onChange={(minBedrooms) => setForm({ ...form, minBedrooms })} required />
        <TextInput label="Salles de bain min." type="number" value={form.minBathrooms} onChange={(minBathrooms) => setForm({ ...form, minBathrooms })} required />
        <label className="wide">
          Notes libres
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </label>
        <button className="primary-button" type="submit">
          <Plus size={18} />
          <span>Creer demande</span>
        </button>
      </form>
    </Page>
  );
}

function RequestDetailPage({ context }: { context: CrmContext }) {
  const { id } = useParams();
  const request = visibleRequests(context).find((item) => item.id === id);

  if (!request) {
    return <Navigate to="/requests" replace />;
  }

  const internalMatches = context.propertyCards
    .filter((card) => card.ownerAdvisorId !== request.advisorId)
    .map((card) => visibleMatch(request, card))
    .filter(isMatch)
    .sort((a, b) => b.score - a.score);

  const externalMatches = externalProperties
    .map((card) => visibleMatch(request, card))
    .filter(isMatch)
    .sort((a, b) => b.score - a.score);

  return (
    <Page title="Detail demande" eyebrow={request.city}>
      <section className="summary-band">
        <div>
          <span>Client</span>
          <strong>{clientName(context, request.clientId)}</strong>
        </div>
        <div>
          <span>Budget</span>
          <strong>
            {money(request.budgetMin)} - {money(request.budgetMax)}
          </strong>
        </div>
        <div>
          <span>Besoin</span>
          <strong>
            {request.propertyType}, {request.minSurface} m2, {request.minBedrooms} ch.
          </strong>
        </div>
      </section>
      <MatchSection title="Section 1 - Biens internes" matches={internalMatches} context={context} />
      <MatchSection title="Section 2 - Biens externes" matches={externalMatches} context={context} external />
    </Page>
  );
}

function ImportYakeeyPage({ context }: { context: CrmContext }) {
  const [url, setUrl] = useState("");
  const [created, setCreated] = useState<PropertyCard | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;
    const ownerAdvisorId =
      context.currentUser!.role === "CONSEILLER"
        ? context.currentUser!.id
        : context.users.find((user) => user.role === "CONSEILLER")!.id;
    const card = mockYakeeyCard(url, ownerAdvisorId);
    context.addPropertyCard(card);
    setCreated(card);
    setUrl("");
  };

  return (
    <Page title="Importer un bien" eyebrow="Yakeey mock">
      <form className="form-panel single" onSubmit={submit}>
        <label>
          Lien Yakeey
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://yakeey.ma/..."
            type="url"
            required
          />
        </label>
        <button className="primary-button" type="submit">
          <UploadCloud size={18} />
          <span>Generer Vision Card</span>
        </button>
      </form>
      {created && (
        <section className="panel">
          <h2>Vision Card creee</h2>
          <PropertyCardView card={created} context={context} />
        </section>
      )}
    </Page>
  );
}

function VisionCardsPage({ context }: { context: CrmContext }) {
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [advisor, setAdvisor] = useState("");
  const cards = visibleVisionCards(context).filter(
    (card) =>
      (!city || card.city === city) &&
      (!type || card.propertyType === type) &&
      (!advisor || card.ownerAdvisorId === advisor)
  );
  const allVisible = visibleVisionCards(context);

  return (
    <Page title="Vision Cards" eyebrow="Biens internes">
      <section className="filter-bar">
        <SelectFilter label="Ville" value={city} values={[...new Set(allVisible.map((card) => card.city))]} onChange={setCity} />
        <SelectFilter label="Type" value={type} values={[...new Set(allVisible.map((card) => card.propertyType))]} onChange={setType} />
        <SelectFilter
          label="Conseiller"
          value={advisor}
          values={[...new Set(allVisible.map((card) => card.ownerAdvisorId))]}
          labelFor={(value) => advisorName(context, value)}
          onChange={setAdvisor}
        />
      </section>
      <section className="card-grid">
        {cards.map((card) => (
          <PropertyCardView key={card.id} card={card} context={context} />
        ))}
      </section>
    </Page>
  );
}

function AdminPage({ context }: { context: CrmContext }) {
  if (context.currentUser?.role === "CONSEILLER") {
    return <AccessDenied />;
  }

  const users = visibleUsers(context);

  return (
    <Page title="Administration utilisateurs" eyebrow="Roles et visibilite">
      <section className="card-grid">
        {users.map((user) => (
          <article className="entity-card" key={user.id}>
            <div className="avatar-line">
              <span className="avatar">{initials(user.name)}</span>
              <div>
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
            </div>
            <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
          </article>
        ))}
      </section>
    </Page>
  );
}

function SmartHunterPage({ context }: { context: CrmContext }) {
  const requests = visibleRequests(context);
  const [selectedId, setSelectedId] = useState(requests[0]?.id ?? "");
  const request = requests.find((item) => item.id === selectedId) ?? requests[0];

  const topMatches = useMemo(() => {
    if (!request) return [];
    return [...context.propertyCards.filter((card) => card.ownerAdvisorId !== request.advisorId), ...externalProperties]
      .map((card) => visibleMatch(request, card))
      .filter(isMatch)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [context.propertyCards, request]);

  return (
    <Page title="Smart Property Hunter V3" eyebrow="Base technique IA">
      {!request ? (
        <div className="empty-state">
          <h2>Aucune demande disponible</h2>
          <p>Creer une demande pour activer le resume et le top 3.</p>
        </div>
      ) : (
        <>
          <section className="filter-bar">
            <label>
              Demande
              <select value={request.id} onChange={(event) => setSelectedId(event.target.value)}>
                {requests.map((item) => (
                  <option key={item.id} value={item.id}>
                    {clientName(context, item.clientId)} - {item.city}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="panel champagne">
            <h2>Resume automatique</h2>
            <p>
              {clientName(context, request.clientId)} cherche un {request.propertyType.toLowerCase()} en{" "}
              {request.transactionType} a {request.city}, idealement dans {request.districts.join(", ")},
              avec un budget de {money(request.budgetMin)} a {money(request.budgetMax)}.
            </p>
          </section>
          <MatchSection title="Top 3 compatibles" matches={topMatches} context={context} external />
        </>
      )}
    </Page>
  );
}

function Page({
  title,
  eyebrow,
  action,
  children
}: {
  title: string;
  eyebrow: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span>{eyebrow}</span>
          <h1>{title}</h1>
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function RequestRow({ context, request }: { context: CrmContext; request: ClientRequest }) {
  const matches = context.propertyCards
    .filter((card) => card.ownerAdvisorId !== request.advisorId)
    .map((card) => visibleMatch(request, card))
    .filter(Boolean).length;

  return (
    <Link className="request-row" to={`/requests/${request.id}`}>
      <div>
        <h3>{clientName(context, request.clientId)}</h3>
        <p>
          {request.transactionType} - {request.city} - {request.propertyType}
        </p>
      </div>
      <span>{money(request.budgetMin)}+</span>
      <span>{matches} matchs</span>
      <small>{shortDate(request.createdAt)}</small>
    </Link>
  );
}

function MatchSection({
  title,
  matches,
  context,
  external
}: {
  title: string;
  matches: Array<{ score: number; reasons: string[]; property: PropertyCard }>;
  context: CrmContext;
  external?: boolean;
}) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="match-list">
        {matches.length ? (
          matches.map((match) => (
            <article className="match-card" key={match.property.id}>
              <div className="score">{match.score}</div>
              <div>
                <h3>{match.property.title}</h3>
                <p>
                  {match.property.city}, {match.property.district} - {match.property.surface} m2 -{" "}
                  {match.property.bedrooms} ch. - {match.property.bathrooms} sdb
                </p>
                <p className="muted">{match.reasons.join(" · ")}</p>
              </div>
              <div className="match-meta">
                <strong>{money(match.property.price)}</strong>
                <span>{external ? match.property.source : advisorName(context, match.property.ownerAdvisorId)}</span>
                <a href={match.property.sourceUrl} target="_blank" rel="noreferrer">
                  lien source
                </a>
              </div>
            </article>
          ))
        ) : (
          <p className="muted">Aucun bien avec un score superieur ou egal a 50.</p>
        )}
      </div>
    </section>
  );
}

function PropertyCardView({ card, context }: { card: PropertyCard; context: CrmContext }) {
  return (
    <article className="property-card">
      <div className="property-topline">
        <span>{card.source}</span>
        <strong>{money(card.price)}</strong>
      </div>
      <h3>{card.title}</h3>
      <p>
        {card.city}/{card.district} - {card.propertyType}
      </p>
      <dl>
        <div>
          <dt>Surface</dt>
          <dd>{card.surface} m2</dd>
        </div>
        <div>
          <dt>Chambres</dt>
          <dd>{card.bedrooms}</dd>
        </div>
        <div>
          <dt>SDB</dt>
          <dd>{card.bathrooms}</dd>
        </div>
      </dl>
      <p className="muted">{card.shortDescription}</p>
      <footer>
        <span>{advisorName(context, card.ownerAdvisorId)}</span>
        <a href={card.sourceUrl} target="_blank" rel="noreferrer">
          source
        </a>
      </footer>
    </article>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-box">
      <Search size={18} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} required={required} type={type} />
    </label>
  );
}

function SelectFilter({
  label,
  value,
  values,
  onChange,
  labelFor = (item) => item
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
  labelFor?: (value: string) => string;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Tous</option>
        {values.map((item) => (
          <option key={item} value={item}>
            {labelFor(item)}
          </option>
        ))}
      </select>
    </label>
  );
}

function AccessDenied() {
  return (
    <Page title="Acces refuse" eyebrow="Securite">
      <div className="empty-state">
        <h2>Role insuffisant</h2>
        <p>Cette page est reservee a ADMIN et LUCIFER.</p>
      </div>
    </Page>
  );
}

function visibleClients(context: CrmContext) {
  if (context.currentUser?.role === "CONSEILLER") {
    return context.clients.filter((client) => client.assignedAdvisorId === context.currentUser?.id);
  }
  return context.clients;
}

function visibleRequests(context: CrmContext) {
  if (context.currentUser?.role === "CONSEILLER") {
    return context.requests.filter((request) => request.advisorId === context.currentUser?.id);
  }
  return context.requests;
}

function visibleVisionCards(context: CrmContext) {
  if (context.currentUser?.role === "CONSEILLER") {
    return context.propertyCards.filter((card) => card.ownerAdvisorId === context.currentUser?.id);
  }
  return context.propertyCards;
}

function visibleUsers(context: CrmContext) {
  if (context.currentUser?.role === "LUCIFER") return context.users;
  return context.users.filter((user) => user.visibleToAdmin);
}

function advisorName(context: CrmContext, id: string) {
  return context.users.find((user) => user.id === id)?.name ?? "Source externe";
}

function clientName(context: CrmContext, id: string) {
  const client = context.clients.find((item) => item.id === id);
  return client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isMatch(
  value: ReturnType<typeof visibleMatch<PropertyCard>>
): value is { score: number; reasons: string[]; property: PropertyCard } {
  return Boolean(value);
}

function mockYakeeyCard(url: string, ownerAdvisorId: string): PropertyCard {
  const samples = [
    {
      title: "Appartement lumineux Gauthier",
      price: 1680000,
      city: "Casablanca",
      district: "Gauthier",
      propertyType: "Appartement",
      surface: 101,
      bedrooms: 2,
      bathrooms: 2,
      shortDescription: "Lumineux, proche tram, commerces et parking."
    },
    {
      title: "Appartement moderne Agdal",
      price: 13200,
      city: "Rabat",
      district: "Agdal",
      propertyType: "Appartement",
      surface: 96,
      bedrooms: 2,
      bathrooms: 2,
      shortDescription: "Standing, ascenseur, balcon et parking."
    },
    {
      title: "Villa calme Bouskoura",
      price: 4400000,
      city: "Casablanca",
      district: "Bouskoura",
      propertyType: "Villa",
      surface: 285,
      bedrooms: 4,
      bathrooms: 3,
      shortDescription: "Villa familiale avec jardin et quartier calme."
    }
  ];
  const sample = samples[Math.floor(Math.random() * samples.length)];
  return {
    id: crypto.randomUUID(),
    ...sample,
    source: "Yakeey",
    sourceUrl: url,
    ownerAdvisorId,
    importedAt: new Date().toISOString()
  };
}
