import http from "http";
import express from "express";
import { WebSocketServer } from "ws";
import crypto from "crypto";
import url from "url";

const ADMIN_KEY = process.env.ADMIN_KEY || "CHANGE_ME_ADMIN_KEY";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// История
const MAX_APPROVED = 80;
const MAX_PENDING = 200;
const approved = []; // видими за всички
const pending = [];  // чакащи одобрение

function broadcastAll(payload) {
  const msg = JSON.stringify(payload);
  for (const c of wss.clients) {
    if (c.readyState === 1) c.send(msg);
  }
}

function broadcastAdmins(payload) {
  const msg = JSON.stringify(payload);
  for (const c of wss.clients) {
    if (c.readyState === 1 && c.isAdmin) c.send(msg);
  }
}

wss.on("connection", (ws, req) => {
  const parsed = url.parse(req.url, true);
  const key = parsed.query?.key || "";
  ws.isAdmin = key === ADMIN_KEY;

  // пращаме история според ролята
  ws.send(JSON.stringify({ type: "history_approved", items: approved }));

  if (ws.isAdmin) {
    ws.send(JSON.stringify({ type: "history_pending", items: pending }));
  }
});

// Подай поздрав (влиза в pending)
app.post("/api/greet", (req, res) => {
  const name = String(req.body?.name ?? "").trim().slice(0, 40);
  const text = String(req.body?.text ?? "").trim().slice(0, 200);

  if (!text) return res.status(400).json({ ok: false, error: "Empty" });

  const item = {
    id: crypto.randomUUID(),
    name: name || "Анонимен",
    text,
    ts: Date.now(),
    status: "pending"
  };

  pending.unshift(item);
  pending.length = Math.min(pending.length, MAX_PENDING);

  // уведомяваме само админите
  broadcastAdmins({ type: "pending_new", item });

  res.json({ ok: true });
});

// Вземи pending (админ)
app.get("/api/pending", (req, res) => {
  if (req.query?.key !== ADMIN_KEY) return res.status(401).json({ ok: false });
  res.json({ ok: true, items: pending });
});

// Одобри (админ)
app.post("/api/approve", (req, res) => {
  if (req.query?.key !== ADMIN_KEY) return res.status(401).json({ ok: false });

  const id = String(req.body?.id || "");
  const idx = pending.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ ok: false });

  const [item] = pending.splice(idx, 1);
  item.status = "approved";

  approved.unshift(item);
  approved.length = Math.min(approved.length, MAX_APPROVED);

  // пращаме на всички (за стената + overlay)
  broadcastAll({ type: "approved_new", item });
  // и обновление за админ листата
  broadcastAdmins({ type: "pending_removed", id });

  res.json({ ok: true });
});

// Отхвърли (админ)
app.post("/api/reject", (req, res) => {
  if (req.query?.key !== ADMIN_KEY) return res.status(401).json({ ok: false });

  const id = String(req.body?.id || "");
  const idx = pending.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ ok: false });

  pending.splice(idx, 1);
  broadcastAdmins({ type: "pending_removed", id });

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("✅ http://localhost:" + PORT));
