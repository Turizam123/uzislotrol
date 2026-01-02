const list = document.getElementById("list");
const form = document.getElementById("form");
const statusEl = document.getElementById("status");

const ttInput = document.getElementById("tiktokLink");
const btnApply = document.getElementById("applyLink");
const ttFrame = document.getElementById("ttFrame");
const vidBadge = document.getElementById("vidBadge");

function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function render(item, top=true){
  const el = document.createElement("div");
  el.className = "item";
  const t = new Date(item.ts).toLocaleTimeString("bg-BG", {hour:"2-digit", minute:"2-digit"});
  el.innerHTML = `
    <div class="meta">
      <span class="name">${esc(item.name)}</span>
      <span>${t}</span>
    </div>
    <div class="text">${esc(item.text)}</div>
  `;
  top ? list.prepend(el) : list.append(el);
}

/** -------- TikTok link -> Video ID -------- */
function extractVideoId(link){
  // търсим /video/123... или item_id=123...
  const s = String(link || "");
  const m1 = s.match(/\/video\/(\d+)/);
  if (m1) return m1[1];
  const m2 = s.match(/[?&]item_id=(\d+)/);
  if (m2) return m2[1];
  // понякога share линкове са кратки; тогава трябва разширяване (не го правим тук)
  return null;
}

function setPlayer(videoId){
  if (!videoId) return;
  const src = `https://www.tiktok.com/player/v1/${videoId}?controls=1&description=1`;
  ttFrame.src = src;
  vidBadge.textContent = `VIDEO_ID: ${videoId}`;
  localStorage.setItem("tt_video_id", videoId);
}

btnApply.addEventListener("click", () => {
  const id = extractVideoId(ttInput.value);
  if (!id){
    alert("Не намерих VIDEO ID в линка.\nОтвори видеото в браузър и копирай линка с /video/XXXXXXXXX");
    return;
  }
  setPlayer(id);
});

// зареждаме запомнения ID
const savedId = localStorage.getItem("tt_video_id");
if (savedId) setPlayer(savedId);
else {
  // ако няма — оставяме празно, да пейстнеш линк
  vidBadge.textContent = "VIDEO_ID: (постави линк)";
}

/** -------- QR към формата -------- */
const qrTarget = `${location.origin}${location.pathname}#send`;
document.getElementById("qrLink").textContent = qrTarget;
new QRCode(document.getElementById("qr"), { text: qrTarget, width: 140, height: 140 });

// ако имаме #send — скрол към формата
if (location.hash === "#send") form.scrollIntoView({ behavior:"smooth", block:"center" });

/** -------- WebSocket (само одобрени) -------- */
const wsProto = location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${wsProto}://${location.host}`);

ws.addEventListener("open", () => statusEl.textContent = "🟢 Свързан");
ws.addEventListener("close", () => statusEl.textContent = "🔴 Връзката прекъсна (refresh)");

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);

  if (msg.type === "history_approved") {
    list.innerHTML = "";
    msg.items.forEach(it => render(it, false));
  }

  if (msg.type === "approved_new") {
    render(msg.item, true);
  }
});

/** -------- Submit -> pending -------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const text = document.getElementById("text").value.trim();
  if (!text) return;

  const btn = form.querySelector("button");
  btn.disabled = true;
  statusEl.textContent = "⏳ Изпращане за одобрение…";

  try{
    const r = await fetch("/api/greet", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ name, text })
    });
    if (!r.ok) throw new Error("Send failed");
    document.getElementById("text").value = "";
    statusEl.textContent = "✅ Изпратено! Чака одобрение.";
  }catch{
    statusEl.textContent = "❌ Грешка при изпращане.";
  }finally{
    btn.disabled = false;
  }
});
