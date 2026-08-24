import { randomBytes } from "crypto";
import express from "express";

const router = express.Router();

type SessionUser = {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isAdmin?: boolean;
};

type TicketRecord = {
  expiresAt: number;
  clientId: string;
  user: SessionUser;
};

const tickets = new Map<string, TicketRecord>();
const TICKET_TTL_MS = 60_000;

function cleanExpiredTickets(): void {
  const now = Date.now();
  for (const [ticket, record] of tickets.entries()) {
    if (record.expiresAt <= now) tickets.delete(ticket);
  }
}

function registeredClients(): Record<string, string> {
  const clients: Record<string, string> = {
    zar: String(process.env.ZAR_APP_URL || "https://zar-ai.onrender.com").replace(/\/$/, ""),
  };

  const raw = String(process.env.ZCOS_SSO_CLIENTS_JSON || "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const [id, value] of Object.entries(parsed)) {
        if (typeof value === "string" && /^https:\/\//i.test(value)) {
          clients[id.toLowerCase()] = value.replace(/\/$/, "");
        }
      }
    } catch {
      console.error("ZCOS_SSO_CLIENTS_JSON is invalid JSON");
    }
  }

  return clients;
}

function sessionUser(req: express.Request): SessionUser | null {
  const user = (req.session as any)?.user;
  if (!user?.id) return null;
  return {
    id: String(user.id),
    username: String(user.username || "ZCOS User"),
    email: user.email ? String(user.email) : undefined,
    firstName: user.firstName ? String(user.firstName) : undefined,
    lastName: user.lastName ? String(user.lastName) : undefined,
    profileImageUrl: user.profileImageUrl ? String(user.profileImageUrl) : undefined,
    isAdmin: Boolean(user.isAdmin),
  };
}

router.get("/authorize", (req, res) => {
  cleanExpiredTickets();
  const user = sessionUser(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });

  const clientId = String(req.query.client || "").trim().toLowerCase();
  const clientBase = registeredClients()[clientId];
  if (!clientBase) return res.status(400).json({ error: "Unknown SSO client" });

  const ticket = randomBytes(32).toString("base64url");
  tickets.set(ticket, {
    expiresAt: Date.now() + TICKET_TTL_MS,
    clientId,
    user,
  });

  res.redirect(302, `${clientBase}/api/sso/zcos/callback?ticket=${encodeURIComponent(ticket)}`);
});

router.post("/exchange", (req, res) => {
  cleanExpiredTickets();
  const ticket = typeof req.body?.ticket === "string" ? req.body.ticket.trim() : "";
  const clientId = typeof req.body?.client === "string" ? req.body.client.trim().toLowerCase() : "";
  if (!ticket || !clientId) return res.status(400).json({ error: "SSO ticket and client are required" });

  const record = tickets.get(ticket);
  tickets.delete(ticket);
  if (!record || record.expiresAt <= Date.now() || record.clientId !== clientId) {
    return res.status(401).json({ error: "SSO ticket is invalid or expired" });
  }

  res.json({ success: true, user: record.user });
});

export default router;
