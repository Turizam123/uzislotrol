// ======= SHARED UTILS + STORE =======
function uid(){
  // simple unique id
  return "m_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(s){
  return String(s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function fmtTime(ms){
  try {
    const d = new Date(ms);
    return d.toLocaleString("bg-BG", { hour:"2-digit", minute:"2-digit", day:"2-digit", month:"2-digit" });
  } catch { return ""; }
}

function toast(msg, type="ok"){
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add("show"));
  setTimeout(()=>{
    t.classList.remove("show");
    setTimeout(()=>t.remove(), 250);
  }, 2200);
}

const AppStore = {
  _read(){
    const key = window.APP_CONFIG.STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if(!raw) return [];
    try {
      const data = JSON.parse(raw);
      if(Array.isArray(data)) return data;
      return [];
    } catch { return []; }
  },
  _write(list){
    const key = window.APP_CONFIG.STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(list));
  },

  getAll(){ return this._read(); },

  add({name, text}){
    const list = this._read();
    const msg = {
      id: uid(),
      name: String(name || "").trim().slice(0, 24),
      text: String(text || "").trim().slice(0, 200),
      createdAt: Date.now(),
      approved: false,
      shown: false
    };
    list.push(msg);
    this._write(list);
    return msg;
  },

  update(id, patch){
    const list = this._read();
    const idx = list.findIndex(x=>x.id===id);
    if(idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    this._write(list);
    return list[idx];
  },

  remove(id){
    const list = this._read().filter(x=>x.id!==id);
    this._write(list);
  },

  clearAll(){
    this._write([]);
  },

  resetShown(){
    const list = this._read().map(x => ({...x, shown:false}));
    this._write(list);
  },

  // TikTok link
  getTikTokLink(){
    return localStorage.getItem(window.APP_CONFIG.TIKTOK_KEY) || "";
  },
  setTikTokLink(link){
    localStorage.setItem(window.APP_CONFIG.TIKTOK_KEY, String(link||"").trim());
  }
};
