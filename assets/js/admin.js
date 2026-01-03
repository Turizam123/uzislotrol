(function(){
  const pinEl = document.getElementById('pin');
  const loginBtn = document.getElementById('loginBtn');
  const adminArea = document.getElementById('adminArea');
  const listEl = document.getElementById('list');

  const tiktokInput = document.getElementById('tiktokLink');
  const saveTiktok = document.getElementById('saveTiktok');
  const copyOverlay = document.getElementById('copyOverlay');

  const resetShownBtn = document.getElementById('resetShown');
  const clearAllBtn = document.getElementById('clearAll');

  let authed = false;
  let activeTab = "pending";

  function isAuthed(){
    return authed === true;
  }

  function login(){
    const ok = (pinEl.value || "").trim() === window.APP_CONFIG.ADMIN_PIN;
    if(!ok) return toast("Грешен PIN ❌", "warn");
    authed = true;
    adminArea.classList.remove('hidden');
    toast("Успешен вход ✅");
    tiktokInput.value = AppStore.getTikTokLink() || "";
    render();
  }

  loginBtn.addEventListener('click', login);
  pinEl.addEventListener('keydown', (e)=>{ if(e.key==="Enter") login(); });

  saveTiktok.addEventListener('click', ()=>{
    if(!isAuthed()) return;
    AppStore.setTikTokLink(tiktokInput.value);
    toast("Запазено ✅");
  });

  copyOverlay.addEventListener('click', async ()=>{
    if(!isAuthed()) return;
    const url = new URL('overlay.html', location.href).toString();
    try { await navigator.clipboard.writeText(url); toast("Overlay URL копиран ✅"); }
    catch { toast("Не успях да копирам.", "warn"); }
  });

  resetShownBtn.addEventListener('click', ()=>{
    if(!isAuthed()) return;
    AppStore.resetShown();
    toast("Готово ✅");
    render();
  });

  clearAllBtn.addEventListener('click', ()=>{
    if(!isAuthed()) return;
    if(!confirm("Сигурен ли си, че искаш да изтриеш всички поздрави?")) return;
    AppStore.clearAll();
    toast("Изтрито ✅");
    render();
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(!isAuthed()) return;
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      render();
    });
  });

  function itemActions(m){
    const wrap = document.createElement('div');
    wrap.className = 'actions';

    if(!m.approved){
      const approve = document.createElement('button');
      approve.className = 'btn tiny';
      approve.textContent = 'Одобри';
      approve.onclick = ()=>{
        AppStore.update(m.id, {approved:true});
        toast("Одобрено ✅");
        render();
      };

      const reject = document.createElement('button');
      reject.className = 'btn tiny ghost danger';
      reject.textContent = 'Отхвърли';
      reject.onclick = ()=>{
        AppStore.remove(m.id);
        toast("Отхвърлено 🗑️", "warn");
        render();
      };

      wrap.appendChild(approve);
      wrap.appendChild(reject);
    } else {
      const unapprove = document.createElement('button');
      unapprove.className = 'btn tiny ghost';
      unapprove.textContent = 'Върни в чакащи';
      unapprove.onclick = ()=>{
        AppStore.update(m.id, {approved:false, shown:false});
        toast("Върнато ✅");
        render();
      };

      const markUnshown = document.createElement('button');
      markUnshown.className = 'btn tiny ghost';
      markUnshown.textContent = 'Не е показан';
      markUnshown.onclick = ()=>{
        AppStore.update(m.id, {shown:false});
        toast("Готово ✅");
        render();
      };

      const del = document.createElement('button');
      del.className = 'btn tiny ghost danger';
      del.textContent = 'Изтрий';
      del.onclick = ()=>{
        AppStore.remove(m.id);
        toast("Изтрито 🗑️", "warn");
        render();
      };

      wrap.appendChild(unapprove);
      wrap.appendChild(markUnshown);
      wrap.appendChild(del);
    }

    // Edit button
    const edit = document.createElement('button');
    edit.className = 'btn tiny ghost';
    edit.textContent = 'Редакция';
    edit.onclick = ()=>{
      const newName = prompt("Име:", m.name);
      if(newName === null) return;
      const newText = prompt("Поздрав:", m.text);
      if(newText === null) return;
      AppStore.update(m.id, {
        name: String(newName).trim().slice(0,24),
        text: String(newText).trim().slice(0,200)
      });
      toast("Запазено ✅");
      render();
    };
    wrap.appendChild(edit);

    return wrap;
  }

  function filterByTab(data){
    if(activeTab === "pending") return data.filter(x=>!x.approved).sort((a,b)=>b.createdAt-a.createdAt);
    if(activeTab === "approved") return data.filter(x=>x.approved && !x.shown).sort((a,b)=>a.createdAt-b.createdAt);
    if(activeTab === "shown") return data.filter(x=>x.approved && x.shown).sort((a,b)=>b.createdAt-a.createdAt);
    return data;
  }

  function render(){
    if(!isAuthed()) return;

    const data = AppStore.getAll();
    const list = filterByTab(data);

    listEl.innerHTML = "";
    if(!list.length){
      listEl.innerHTML = `<div class="empty">Няма елементи тук.</div>`;
      return;
    }

    list.forEach(m=>{
      const row = document.createElement('div');
      row.className = 'msgRow bigRow';
      row.innerHTML = `
        <div class="msgName">${escapeHtml(m.name)}</div>
        <div class="msgText">${escapeHtml(m.text)}</div>
        <div class="msgMeta">${fmtTime(m.createdAt)} • ${m.approved ? (m.shown ? "Показан" : "Одобрен") : "Чака"} </div>
      `;
      row.appendChild(itemActions(m));
      listEl.appendChild(row);
    });
  }

  // live refresh
  setInterval(()=>{ if(isAuthed()) render(); }, 900);
})();
