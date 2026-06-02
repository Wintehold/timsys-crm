import crypto from "node:crypto";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { generatePropertyAds } from "./services/adWriterService.js";
import { searchHunter } from "./services/hunterService.js";
import { GeneratedAd, HunterCriteria, HunterProperty } from "./services/types.js";
import { analyzeYakeeyUrl } from "./services/yakeeyNormalizer.js";

type Role = "LUCIFER" | "ADMIN" | "CONSEILLER";
type ClientStatus = "nouveau" | "actif" | "en recherche" | "en negociation" | "cloture";
type RequestStatus = "ouverte" | "en analyse" | "biens trouves" | "client contacte" | "cloturee";
type Urgency = "faible" | "normale" | "elevee" | "immediate";
type PropertyCardStatus = "actif" | "ignore" | "expire";
type PropertySource = "Yakeey" | "Avito" | "Mubawab";

type AppUser = {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  role: Role;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  source?: string;
  estimatedBudget?: number;
  notes?: string;
  assignedAdvisorId: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
};

type CRMRequest = {
  id: string;
  clientId: string;
  advisorId: string;
  transactionType: "achat" | "location";
  city: string;
  districts: string[];
  budgetMin: number;
  budgetMax: number;
  propertyType: string;
  minSurface: number;
  minBedrooms: number;
  minBathrooms: number;
  preferredFloor?: string;
  elevator: boolean;
  parking: boolean;
  terrace: boolean;
  furnished: boolean;
  urgency: Urgency;
  status: RequestStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type PropertyCard = {
  id: string;
  title: string;
  price: number;
  city: string;
  district: string;
  propertyType: string;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  shortDescription: string;
  source: PropertySource;
  sourceUrl: string;
  ownerAdvisorId: string;
  status: PropertyCardStatus;
  elevator: boolean;
  parking: boolean;
  terrace: boolean;
  furnished: boolean;
  importedAt: string;
  updatedAt: string;
};

type AuditLog = {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
};

type AuthenticatedRequest = Request & { user?: AppUser };

const app = express();
const port = Number(process.env.PORT ?? 4000);
const tokenSecret = process.env.AUTH_TOKEN_SECRET ?? "tim-crm-preview-2-demo-secret";

app.use(cors());
app.use(express.json());

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const users: AppUser[] = [];
const clients: Client[] = [];
const requests: CRMRequest[] = [];
const propertyCards: PropertyCard[] = [];
const auditLogs: AuditLog[] = [];
const generatedAds: Array<{ id: string; propertyCardId: string; ads: GeneratedAd[]; createdAt: string }> = [];

seedPreview2();

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "TIM CRM backend",
    preview: "2"
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "TIM CRM API",
    preview: "2",
    persistence: "in-memory-preview-seed",
    supabase: process.env.SUPABASE_URL ? "configured" : "not-configured"
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const user = users.find((item) => sameText(item.username, username ?? ""));

  if (!user || !user.isActive || !password || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Identifiants invalides." });
    return;
  }

  log(user.id, "login", "app_user", user.id, { username: user.username });
  res.json({ token: signToken(user.id), user: publicUser(user) });
});

app.post("/api/auth/change-password", requireAuth, (req: AuthenticatedRequest, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body as {
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  const user = req.user!;

  if (!oldPassword || !newPassword || !confirmPassword) {
    res.status(400).json({ error: "Tous les champs sont obligatoires." });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caracteres." });
    return;
  }
  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: "La confirmation ne correspond pas." });
    return;
  }
  if (oldPassword === newPassword) {
    res.status(400).json({ error: "Le nouveau mot de passe doit etre different." });
    return;
  }
  if (!verifyPassword(oldPassword, user.passwordHash)) {
    res.status(401).json({ error: "Ancien mot de passe incorrect." });
    return;
  }

  user.passwordHash = hashPassword(newPassword);
  user.mustChangePassword = false;
  user.updatedAt = now();
  log(user.id, "change_password", "app_user", user.id, { forced: false });
  res.json({ user: publicUser(user) });
});

app.post("/api/auth/logout", requireAuth, (req: AuthenticatedRequest, res) => {
  log(req.user!.id, "logout", "app_user", req.user!.id, {});
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: publicUser(req.user!) });
});

app.get("/api/users", requireAuth, requireRole(["LUCIFER", "ADMIN"]), (req: AuthenticatedRequest, res) => {
  res.json(visibleUsers(req.user!).map(publicUser));
});

app.post("/api/users", requireAuth, requireRole(["LUCIFER", "ADMIN"]), (req: AuthenticatedRequest, res) => {
  const actor = req.user!;
  const body = req.body as Partial<AppUser> & { password?: string };
  const role = body.role ?? "CONSEILLER";

  if (actor.role === "ADMIN" && role !== "CONSEILLER") {
    res.status(403).json({ error: "ADMIN peut creer uniquement des conseillers." });
    return;
  }
  if (!body.username || !/^[A-Za-z0-9_]+$/.test(body.username)) {
    res.status(400).json({ error: "Le username doit etre un seul mot." });
    return;
  }
  if (users.some((user) => sameText(user.username, body.username!))) {
    res.status(409).json({ error: "Username deja utilise." });
    return;
  }

  const stamp = now();
  const user: AppUser = {
    id: id("u"),
    username: body.username,
    name: body.name || body.username,
    passwordHash: hashPassword(body.password || "12345678"),
    role,
    mustChangePassword: true,
    isActive: body.isActive ?? true,
    createdAt: stamp,
    updatedAt: stamp
  };
  users.unshift(user);
  log(actor.id, "create_user", "app_user", user.id, { username: user.username, role: user.role });
  res.status(201).json(publicUser(user));
});

app.patch("/api/users/:id", requireAuth, requireRole(["LUCIFER", "ADMIN"]), (req: AuthenticatedRequest, res) => {
  const actor = req.user!;
  const target = users.find((user) => user.id === req.params.id);
  if (!target || (actor.role === "ADMIN" && target.role === "LUCIFER")) {
    res.status(404).json({ error: "Utilisateur introuvable." });
    return;
  }
  if (actor.role === "ADMIN" && req.body.role && req.body.role !== "CONSEILLER") {
    res.status(403).json({ error: "ADMIN ne peut pas promouvoir des roles." });
    return;
  }

  target.name = req.body.name ?? target.name;
  target.role = req.body.role ?? target.role;
  target.isActive = req.body.isActive ?? target.isActive;
  target.mustChangePassword = req.body.mustChangePassword ?? target.mustChangePassword;
  target.updatedAt = now();
  log(actor.id, "update_user", "app_user", target.id, { username: target.username });
  res.json(publicUser(target));
});

app.delete("/api/users/:id", requireAuth, requireRole(["LUCIFER", "ADMIN"]), (req: AuthenticatedRequest, res) => {
  const actor = req.user!;
  const target = users.find((user) => user.id === req.params.id);
  if (!target || target.id === actor.id || (actor.role === "ADMIN" && target.role !== "CONSEILLER")) {
    res.status(404).json({ error: "Utilisateur introuvable ou non supprimable." });
    return;
  }
  const index = users.findIndex((user) => user.id === target.id);
  users.splice(index, 1);
  log(actor.id, "delete_user", "app_user", target.id, { username: target.username });
  res.json({ ok: true });
});

app.post(
  "/api/users/:id/reset-password",
  requireAuth,
  requireRole(["LUCIFER", "ADMIN"]),
  (req: AuthenticatedRequest, res) => {
    const actor = req.user!;
    const target = users.find((user) => user.id === req.params.id);
    if (!target || (actor.role === "ADMIN" && target.role !== "CONSEILLER")) {
      res.status(404).json({ error: "Utilisateur introuvable." });
      return;
    }
    const password = String(req.body.password || "12345678");
    target.passwordHash = hashPassword(password);
    target.mustChangePassword = true;
    target.updatedAt = now();
    log(actor.id, "reset_password", "app_user", target.id, { username: target.username });
    res.json(publicUser(target));
  }
);

app.post(
  "/api/users/:id/force-password-change",
  requireAuth,
  requireRole(["LUCIFER", "ADMIN"]),
  (req: AuthenticatedRequest, res) => {
    const actor = req.user!;
    const target = users.find((user) => user.id === req.params.id);
    if (!target || (actor.role === "ADMIN" && target.role !== "CONSEILLER")) {
      res.status(404).json({ error: "Utilisateur introuvable." });
      return;
    }
    target.mustChangePassword = true;
    target.updatedAt = now();
    log(actor.id, "force_password_change", "app_user", target.id, { username: target.username });
    res.json(publicUser(target));
  }
);

app.post("/api/users/:id/reassign", requireAuth, requireRole(["LUCIFER", "ADMIN"]), (req: AuthenticatedRequest, res) => {
  const actor = req.user!;
  const fromUser = users.find((user) => user.id === req.params.id);
  const toUser = users.find((user) => user.id === req.body.toAdvisorId && user.role === "CONSEILLER");
  if (!fromUser || !toUser || (actor.role === "ADMIN" && fromUser.role === "LUCIFER")) {
    res.status(404).json({ error: "Affectation impossible." });
    return;
  }
  let clientsMoved = 0;
  let requestsMoved = 0;
  clients.forEach((client) => {
    if (client.assignedAdvisorId === fromUser.id) {
      client.assignedAdvisorId = toUser.id;
      client.updatedAt = now();
      clientsMoved += 1;
    }
  });
  requests.forEach((request) => {
    if (request.advisorId === fromUser.id) {
      request.advisorId = toUser.id;
      request.updatedAt = now();
      requestsMoved += 1;
    }
  });
  log(actor.id, "reassign_advisor", "app_user", fromUser.id, {
    toAdvisorId: toUser.id,
    clientsMoved,
    requestsMoved
  });
  res.json({ clientsMoved, requestsMoved });
});

app.get("/api/clients", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json(visibleClients(req.user!));
});

app.post("/api/clients", requireAuth, (req: AuthenticatedRequest, res) => {
  const actor = req.user!;
  const body = req.body as Partial<Client>;
  if (!body.firstName || !body.lastName || !body.primaryPhone) {
    res.status(400).json({ error: "Nom, prenom et telephone principal sont obligatoires." });
    return;
  }
  const assignedAdvisorId =
    actor.role === "CONSEILLER" ? actor.id : body.assignedAdvisorId || firstAdvisorId();
  const stamp = now();
  const client: Client = {
    id: id("c"),
    firstName: body.firstName,
    lastName: body.lastName,
    primaryPhone: body.primaryPhone,
    secondaryPhone: body.secondaryPhone,
    email: body.email,
    source: body.source,
    estimatedBudget: body.estimatedBudget,
    notes: body.notes,
    assignedAdvisorId,
    status: body.status ?? "nouveau",
    createdAt: stamp,
    updatedAt: stamp
  };
  clients.unshift(client);
  log(actor.id, "create_client", "client", client.id, { name: `${client.firstName} ${client.lastName}` });
  res.status(201).json(client);
});

app.get("/api/clients/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  const client = visibleClients(req.user!).find((item) => item.id === req.params.id);
  if (!client) {
    res.status(404).json({ error: "Client introuvable." });
    return;
  }
  res.json({ client, auditLogs: auditLogsFor("client", client.id, req.user!) });
});

app.patch("/api/clients/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  const client = visibleClients(req.user!).find((item) => item.id === req.params.id);
  if (!client) {
    res.status(404).json({ error: "Client introuvable." });
    return;
  }
  Object.assign(client, req.body, { updatedAt: now() });
  log(req.user!.id, "update_client", "client", client.id, { status: client.status });
  res.json(client);
});

app.get("/api/requests", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json(visibleRequests(req.user!));
});

app.post("/api/requests", requireAuth, (req: AuthenticatedRequest, res) => {
  const actor = req.user!;
  const body = req.body as Partial<CRMRequest>;
  if (!body.clientId || !body.transactionType || !body.city || !body.budgetMin || !body.budgetMax) {
    res.status(400).json({ error: "Demande incomplete." });
    return;
  }
  const client = clients.find((item) => item.id === body.clientId);
  const stamp = now();
  const created: CRMRequest = {
    id: id("r"),
    clientId: body.clientId,
    advisorId: actor.role === "CONSEILLER" ? actor.id : body.advisorId || client?.assignedAdvisorId || firstAdvisorId(),
    transactionType: body.transactionType,
    city: body.city,
    districts: body.districts ?? [],
    budgetMin: Number(body.budgetMin),
    budgetMax: Number(body.budgetMax),
    propertyType: body.propertyType ?? "Appartement",
    minSurface: Number(body.minSurface ?? 0),
    minBedrooms: Number(body.minBedrooms ?? 0),
    minBathrooms: Number(body.minBathrooms ?? 0),
    preferredFloor: body.preferredFloor,
    elevator: Boolean(body.elevator),
    parking: Boolean(body.parking),
    terrace: Boolean(body.terrace),
    furnished: Boolean(body.furnished),
    urgency: body.urgency ?? "normale",
    status: body.status ?? "ouverte",
    notes: body.notes ?? "",
    createdAt: stamp,
    updatedAt: stamp
  };
  requests.unshift(created);
  log(actor.id, "create_request", "request", created.id, { clientId: created.clientId });
  res.status(201).json(created);
});

app.get("/api/requests/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  const item = visibleRequests(req.user!).find((request) => request.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Demande introuvable." });
    return;
  }
  res.json({ request: item, auditLogs: auditLogsFor("request", item.id, req.user!) });
});

app.patch("/api/requests/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  const item = visibleRequests(req.user!).find((request) => request.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Demande introuvable." });
    return;
  }
  Object.assign(item, req.body, { updatedAt: now() });
  log(req.user!.id, "update_request", "request", item.id, { status: item.status });
  res.json(item);
});

app.get("/api/property-cards", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json(visiblePropertyCards(req.user!));
});

app.post("/api/property-cards/analyze-yakeey", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const url = String(req.body.sourceUrl || req.body.url || "");
    const ownerAdvisorId =
      req.user!.role === "CONSEILLER" ? req.user!.id : req.body.ownerAdvisorId || firstAdvisorId();
    const preview = analyzeYakeeyUrl({ sourceUrl: url, ownerAdvisorId });
    res.json(preview);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Analyse Yakeey impossible." });
  }
});

app.post("/api/property-cards/import-yakeey", requireAuth, (req: AuthenticatedRequest, res) => {
  const actor = req.user!;
  const url = String(req.body.sourceUrl || req.body.url || "");
  if (!url) {
    res.status(400).json({ error: "Lien Yakeey obligatoire." });
    return;
  }
  if (!/yakeey/i.test(url)) {
    res.status(400).json({ error: "Le lien doit contenir yakeey." });
    return;
  }
  const ownerAdvisorId = actor.role === "CONSEILLER" ? actor.id : req.body.ownerAdvisorId || firstAdvisorId();
  const preview = { ...analyzeYakeeyUrl({ sourceUrl: url, ownerAdvisorId }), ...req.body };
  if (!preview.title || !preview.city || !preview.propertyType || Number.isNaN(Number(preview.price)) || Number.isNaN(Number(preview.surface))) {
    res.status(400).json({ error: "Titre, ville, type, prix numerique et surface numerique sont obligatoires." });
    return;
  }
  const stamp = now();
  const card: PropertyCard = {
    id: id("p"),
    title: String(preview.title),
    price: Number(preview.price),
    city: String(preview.city),
    district: String(preview.district || "Centre"),
    propertyType: String(preview.propertyType),
    surface: Number(preview.surface),
    bedrooms: Number(preview.bedrooms ?? 0),
    bathrooms: Number(preview.bathrooms ?? 0),
    shortDescription: String(preview.shortDescription || ""),
    source: "Yakeey",
    sourceUrl: url,
    ownerAdvisorId,
    status: "actif",
    elevator: Boolean(req.body.elevator ?? true),
    parking: Boolean(req.body.parking ?? true),
    terrace: Boolean(req.body.terrace ?? false),
    furnished: Boolean(req.body.furnished ?? false),
    importedAt: stamp,
    updatedAt: stamp
  };
  propertyCards.unshift(card);
  log(actor.id, "import_vision_card", "property_card", card.id, { sourceUrl: url });
  res.status(201).json(card);
});

app.get("/api/property-cards/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  const card = visiblePropertyCards(req.user!).find((item) => item.id === req.params.id);
  if (!card) {
    res.status(404).json({ error: "Vision Card introuvable." });
    return;
  }
  res.json(card);
});

app.patch("/api/property-cards/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  const card = visiblePropertyCards(req.user!).find((item) => item.id === req.params.id);
  if (!card) {
    res.status(404).json({ error: "Vision Card introuvable." });
    return;
  }
  Object.assign(card, req.body, { updatedAt: now() });
  log(req.user!.id, "update_property_card", "property_card", card.id, { status: card.status });
  res.json(card);
});

app.post("/api/hunter/search", requireAuth, async (req: AuthenticatedRequest, res) => {
  const criteria = req.body as HunterCriteria;
  if (!criteria.type || !criteria.transaction || !criteria.district) {
    res.status(400).json({ error: "Type, transaction et quartier sont obligatoires." });
    return;
  }
  const internalCards = propertyCards
    .filter((card) => card.status === "actif")
    .map((card) => toHunterProperty(card));
  const results = await searchHunter(criteria, internalCards);
  log(req.user!.id, "hunter_search", "hunter_result", undefined, {
    district: criteria.district,
    results: results.length
  });
  res.json({ results });
});

app.post("/api/matching/request/:requestId", requireAuth, (req: AuthenticatedRequest, res) => {
  const request = visibleRequests(req.user!).find((item) => item.id === req.params.requestId);
  if (!request) {
    res.status(404).json({ error: "Demande introuvable." });
    return;
  }
  res.json(buildMatches(request));
});

app.get("/api/smart-hunter/request/:requestId", requireAuth, (req: AuthenticatedRequest, res) => {
  const request = visibleRequests(req.user!).find((item) => item.id === req.params.requestId);
  if (!request) {
    res.status(404).json({ error: "Demande introuvable." });
    return;
  }
  const matches = buildMatches(request);
  const topInternal = matches.internal.slice(0, 3);
  const topExternal = matches.external.slice(0, 3);
  res.json({
    summary: `${clientName(request.clientId)} cherche un ${request.propertyType.toLowerCase()} en ${request.transactionType} a ${request.city}, budget ${request.budgetMin}-${request.budgetMax}.`,
    topInternal,
    topExternal,
    blockers: [...topInternal, ...topExternal].flatMap((match) => match.blockers).slice(0, 5),
    opportunities: [...topInternal, ...topExternal]
      .filter((match) => match.score >= 70)
      .map((match) => `${match.property.title} a relancer rapidement`),
    recommendation:
      topInternal[0]?.score >= 75
        ? "Prioriser le meilleur bien interne et coordonner le conseiller source."
        : "Elargir les quartiers et surveiller Avito/Mubawab en parallele."
  });
});

app.post("/api/ai-writer/property-card/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  const card = visiblePropertyCards(req.user!).find((item) => item.id === req.params.id);
  if (!card) {
    res.status(404).json({ error: "Vision Card introuvable." });
    return;
  }
  const ads = generatePropertyAds(toHunterProperty(card));
  const generated = { id: id("ad"), propertyCardId: card.id, ads, createdAt: now() };
  generatedAds.unshift(generated);
  log(req.user!.id, "generate_ai_ads", "property_card", card.id, { versions: ads.length });
  res.json(generated);
});

app.get("/api/audit-logs", requireAuth, requireRole(["LUCIFER", "ADMIN"]), (req: AuthenticatedRequest, res) => {
  if (req.user!.role === "LUCIFER") {
    res.json(auditLogs);
    return;
  }
  res.json(auditLogs.filter((logItem) => users.find((user) => user.id === logItem.actorUserId)?.role !== "LUCIFER"));
});

app.listen(port, () => {
  console.log(`TIM CRM backend listening on ${port}`);
});

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const userId = token ? verifyToken(token) : null;
  const user = users.find((item) => item.id === userId && item.isActive);
  if (!user) {
    res.status(401).json({ error: "Authentification requise." });
    return;
  }
  req.user = user;
  next();
}

function requireRole(roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Role insuffisant." });
      return;
    }
    next();
  };
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
}

function signToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({ sub: userId, iat: Date.now() }), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", tokenSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", tokenSecret).update(payload).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }
  return (JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string }).sub ?? null;
}

function publicUser(user: AppUser) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    visibleToAdmin: user.role !== "LUCIFER",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function visibleUsers(actor: AppUser) {
  if (actor.role === "LUCIFER") return users;
  return users.filter((user) => user.role !== "LUCIFER");
}

function visibleClients(actor: AppUser) {
  if (actor.role === "CONSEILLER") {
    return clients.filter((client) => client.assignedAdvisorId === actor.id);
  }
  return clients;
}

function visibleRequests(actor: AppUser) {
  if (actor.role === "CONSEILLER") {
    return requests.filter((request) => request.advisorId === actor.id);
  }
  return requests;
}

function visiblePropertyCards(actor: AppUser) {
  if (actor.role === "CONSEILLER") {
    return propertyCards.filter((card) => card.ownerAdvisorId === actor.id);
  }
  return propertyCards;
}

function toHunterProperty(card: PropertyCard): HunterProperty {
  return {
    id: card.id,
    source: "Yakeey interne",
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
    ownerAdvisorId: card.ownerAdvisorId
  };
}

function buildMatches(request: CRMRequest) {
  const internal = propertyCards
    .filter((card) => card.status === "actif" && card.ownerAdvisorId !== request.advisorId)
    .map((card) => scorePropertyMatch(request, card))
    .filter((match) => match.score >= 50)
    .sort((a, b) => b.score - a.score);
  const external = externalMockProperties()
    .map((card) => scorePropertyMatch(request, card))
    .filter((match) => match.score >= 50)
    .sort((a, b) => b.score - a.score);
  return { internal, external };
}

function scorePropertyMatch(request: CRMRequest, property: PropertyCard) {
  let score = 0;
  const reasons: string[] = [];
  const blockers: string[] = [];
  if (property.price >= request.budgetMin && property.price <= request.budgetMax) {
    score += 25;
    reasons.push("Budget dans la fourchette");
  } else if (Math.min(Math.abs(property.price - request.budgetMin), Math.abs(property.price - request.budgetMax)) <= request.budgetMax * 0.12) {
    score += 12;
    reasons.push("Budget proche de la cible");
  } else {
    blockers.push("Budget hors cible");
  }
  if (sameText(property.city, request.city)) score += reason(reasons, 15, "Ville compatible");
  else blockers.push("Ville differente");
  if (request.districts.some((district) => sameText(district, property.district))) score += reason(reasons, 15, "Quartier demande");
  if (sameText(property.propertyType, request.propertyType)) score += reason(reasons, 15, "Type exact");
  else blockers.push("Type different");
  if (property.surface >= request.minSurface) score += reason(reasons, 10, "Surface suffisante");
  else blockers.push("Surface insuffisante");
  if (property.bedrooms >= request.minBedrooms) score += reason(reasons, 10, "Chambres suffisantes");
  else blockers.push("Chambres insuffisantes");
  if (property.bathrooms >= request.minBathrooms) score += reason(reasons, 5, "Salles de bain suffisantes");
  else blockers.push("Salles de bain insuffisantes");
  if (
    (request.elevator && property.elevator) ||
    (request.parking && property.parking) ||
    (request.terrace && property.terrace) ||
    (request.furnished && property.furnished) ||
    noteOverlap(request.notes, property.shortDescription)
  ) {
    score += reason(reasons, 5, "Options ou notes coherentes");
  }
  return { score: Math.max(1, Math.min(100, score)), reasons, blockers, property };
}

function reason(reasons: string[], points: number, label: string) {
  reasons.push(label);
  return points;
}

function sameText(a: string, b: string) {
  return a.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim() ===
    b.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function noteOverlap(a: string, b: string) {
  const tokens = new Set(a.toLowerCase().split(/\W+/).filter((token) => token.length > 4));
  return b.toLowerCase().split(/\W+/).some((token) => tokens.has(token));
}

function firstAdvisorId() {
  return users.find((user) => user.role === "CONSEILLER")?.id ?? users[0].id;
}

function clientName(clientId: string) {
  const client = clients.find((item) => item.id === clientId);
  return client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
}

function auditLogsFor(entityType: string, entityId: string, actor: AppUser) {
  return auditLogs.filter(
    (entry) =>
      entry.entityType === entityType &&
      entry.entityId === entityId &&
      (actor.role === "LUCIFER" || users.find((user) => user.id === entry.actorUserId)?.role !== "LUCIFER")
  );
}

function log(
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string | undefined,
  metadata: AuditLog["metadata"]
) {
  auditLogs.unshift({ id: id("log"), actorUserId, action, entityType, entityId, metadata, createdAt: now() });
}

function seedPreview2() {
  if (users.length) return;
  const stamp = now();
  users.push(
    makeUser("u-lucifer", "luci", "Lucifer Morningstar", "GOT2026GOT", "LUCIFER", stamp),
    makeUser("u-admin", "Hicham", "Hicham Admin", "12345678", "ADMIN", stamp),
    makeUser("u-alie", "Alie", "Alie Conseiller", "12345678", "CONSEILLER", stamp),
    makeUser("u-sara", "Sara", "Sara Conseillere", "12345678", "CONSEILLER", stamp)
  );
  clients.push(
    {
      id: "c-1",
      firstName: "Meryem",
      lastName: "Alaoui",
      primaryPhone: "+212 6 11 22 33 44",
      email: "meryem@example.com",
      source: "Yakeey",
      estimatedBudget: 1800000,
      notes: "Recherche un appartement lumineux proche tram.",
      assignedAdvisorId: "u-alie",
      status: "en recherche",
      createdAt: stamp,
      updatedAt: stamp
    },
    {
      id: "c-2",
      firstName: "Karim",
      lastName: "Bennis",
      primaryPhone: "+212 6 55 19 88 71",
      secondaryPhone: "+212 5 22 10 20 30",
      source: "Recommandation",
      estimatedBudget: 15000,
      notes: "Investisseur, decision rapide si rendement clair.",
      assignedAdvisorId: "u-sara",
      status: "actif",
      createdAt: stamp,
      updatedAt: stamp
    }
  );
  requests.push(
    {
      id: "r-1",
      clientId: "c-1",
      advisorId: "u-alie",
      transactionType: "achat",
      city: "Casablanca",
      districts: ["Maarif", "Gauthier", "Racine"],
      budgetMin: 1450000,
      budgetMax: 1900000,
      propertyType: "Appartement",
      minSurface: 95,
      minBedrooms: 2,
      minBathrooms: 2,
      elevator: true,
      parking: true,
      terrace: false,
      furnished: false,
      urgency: "elevee",
      status: "ouverte",
      notes: "Lumineux, proche commerces et tram.",
      createdAt: stamp,
      updatedAt: stamp
    },
    {
      id: "r-2",
      clientId: "c-2",
      advisorId: "u-sara",
      transactionType: "location",
      city: "Rabat",
      districts: ["Agdal", "Hay Riad"],
      budgetMin: 9000,
      budgetMax: 15000,
      propertyType: "Appartement",
      minSurface: 80,
      minBedrooms: 2,
      minBathrooms: 1,
      elevator: true,
      parking: true,
      terrace: true,
      furnished: false,
      urgency: "normale",
      status: "en analyse",
      notes: "Standing, ascenseur, parking et balcon.",
      createdAt: stamp,
      updatedAt: stamp
    }
  );
  propertyCards.push(
    makeCard("p-1", "Appartement premium Maarif", 1720000, "Casablanca", "Maarif", "Appartement", 112, 3, 2, "Yakeey", "https://yakeey.example/maarif-112", "u-sara", "Appartement lumineux, proche commerces, tram et parking.", stamp),
    makeCard("p-2", "Villa familiale Californie", 5200000, "Casablanca", "Californie", "Villa", 360, 4, 3, "Yakeey", "https://yakeey.example/californie-villa", "u-alie", "Villa calme avec jardin et grande reception.", stamp),
    makeCard("p-3", "Appartement Agdal standing", 12500, "Rabat", "Agdal", "Appartement", 92, 2, 2, "Yakeey", "https://yakeey.example/agdal-standing", "u-alie", "Residence securisee avec ascenseur, parking et balcon.", stamp)
  );
  log("u-lucifer", "seed_preview_2", "system", "preview-2", { users: users.length });
}

function makeUser(idValue: string, username: string, name: string, password: string, role: Role, stamp: string): AppUser {
  return {
    id: idValue,
    username,
    name,
    passwordHash: hashPassword(password),
    role,
    mustChangePassword: true,
    isActive: true,
    createdAt: stamp,
    updatedAt: stamp
  };
}

function makeCard(
  idValue: string,
  title: string,
  price: number,
  city: string,
  district: string,
  propertyType: string,
  surface: number,
  bedrooms: number,
  bathrooms: number,
  source: PropertySource,
  sourceUrl: string,
  ownerAdvisorId: string,
  shortDescription: string,
  stamp: string
): PropertyCard {
  return {
    id: idValue,
    title,
    price,
    city,
    district,
    propertyType,
    surface,
    bedrooms,
    bathrooms,
    shortDescription,
    source,
    sourceUrl,
    ownerAdvisorId,
    status: "actif",
    elevator: true,
    parking: true,
    terrace: shortDescription.toLowerCase().includes("balcon"),
    furnished: false,
    importedAt: stamp,
    updatedAt: stamp
  };
}

function mockYakeeyCard(url: string, ownerAdvisorId: string): PropertyCard {
  const samples = [
    ["Appartement lumineux Gauthier", 1680000, "Casablanca", "Gauthier", "Appartement", 101, 2, 2, "Lumineux, proche tram, commerces et parking."],
    ["Appartement moderne Agdal", 13200, "Rabat", "Agdal", "Appartement", 96, 2, 2, "Standing, ascenseur, balcon et parking."],
    ["Villa calme Bouskoura", 4400000, "Casablanca", "Bouskoura", "Villa", 285, 4, 3, "Villa familiale avec jardin et quartier calme."]
  ] as const;
  const sample = samples[Math.floor(Math.random() * samples.length)];
  return makeCard(id("p"), sample[0], sample[1], sample[2], sample[3], sample[4], sample[5], sample[6], sample[7], "Yakeey", url, ownerAdvisorId, sample[8], now());
}

function externalMockProperties(): PropertyCard[] {
  const stamp = now();
  return [
    makeCard("e-1", "Avito - Appartement Racine terrasse", 1850000, "Casablanca", "Racine", "Appartement", 105, 2, 2, "Avito", "https://avito.example/racine-terrasse", "external", "Terrasse, proche commerces et excellent ensoleillement.", stamp),
    makeCard("e-2", "Mubawab - Studio Bourgogne", 780000, "Casablanca", "Bourgogne", "Studio", 48, 1, 1, "Mubawab", "https://mubawab.example/bourgogne-studio", "external", "Studio compact proche corniche.", stamp),
    makeCard("e-3", "Mubawab - Appartement Hay Riad", 14000, "Rabat", "Hay Riad", "Appartement", 118, 3, 2, "Mubawab", "https://mubawab.example/hay-riad", "external", "Standing, parking, ascenseur, proche ecoles.", stamp)
  ];
}
