const list = document.getElementById("list");
const form = document.getElementById("form");
const statusEl = document.getElementById("status");

const wsProto = location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${wsProto}://${location.host}`);

function esc(s) {
  return s.replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#039;"
  }[m]));
}

function render(item, top = true) {
  const el = document.createElement("div");
  el.className = "item";
  el.innerHTML = `
    <div class="meta">
      <b>${esc(item.name)}</b>
      <span>${new Date(item.ts).toLocaleTimeString("bg-BG")}</span>
    </div>
    <div class="text">${esc(item.text)}</div>
  `;
  top ? list.prepend(el) : list.append(el);
}

ws.onmessage = e => {
  const msg = JSON.parse(e.data);
  if (msg.type === "history") {
    list.innerHTML = "";
    msg.items.forEach(i => render(i, false));
  }
  if (msg.type === "new") {
    render(msg.item, true);
  }
};

ws.onopen = () => statusEl.textContent = "🟢 Свързан";
ws.onclose = () => statusEl.textContent = "🔴 Прекъсната връзка";

form.onsubmit = async e => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const text = document.getElementById("text").value;

  const r = await fetch("/api/greet", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ name, text })
  });

  if (r.ok) document.getElementById("text").value = "";
};
