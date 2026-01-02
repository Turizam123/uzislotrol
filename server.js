import http from "http";
import express from "express";
import { WebSocketServer } from "ws";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const MAX = 50;
const history = [];

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === 1) c.send(msg);
  });
}

wss.on("connection", ws => {
  ws.send(JSON.stringify({ type: "history", items: history }));
});

app.post("/api/greet", (req, res) => {
  const name = String(req.body?.name || "").slice(0, 40);
  const text = String(req.body?.text || "").slice(0, 200);

  if (!text.trim()) {
    return res.status(400).json({ ok: false });
  }

  const item = {
    id: crypto.randomUUID(),
    name: name || "Анонимен",
    text,
    ts: Date.now()
  };

  history.unshift(item);
  history.length = Math.min(history.length, MAX);

  broadcast({ type: "new", item });
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log("✅ Server running on http://localhost:" + PORT)
);
