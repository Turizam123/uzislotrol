(function(){
  const card = document.getElementById('card');
  const msgEl = document.getElementById('msg');
  const fromEl = document.getElementById('from');
  const audio = document.getElementById('notify');

  let busy = false;
  let lastShownAt = 0;

  async function playSound(){
    try {
      audio.currentTime = 0;
      await audio.play();
    } catch {
      // OBS понякога блокира autoplay докато не позволиш аудио — OK.
    }
  }

  function getNext(){
    const data = AppStore.getAll();
    // най-стария одобрен непоказан
    return data
      .filter(x=>x.approved && !x.shown)
      .sort((a,b)=>a.createdAt-b.createdAt)[0] || null;
  }

  function markShown(id){
    AppStore.update(id, {shown:true});
  }

  function show(m){
    busy = true;
    lastShownAt = Date.now();

    msgEl.textContent = m.text;
    fromEl.textContent = "— " + (m.name || "Анонимен");

    card.classList.add('show');
    playSound();

    setTimeout(()=>{
      card.classList.remove('show');
      setTimeout(()=>{
        busy = false;
      }, window.APP_CONFIG.OVERLAY.MIN_GAP_MS);
    }, window.APP_CONFIG.OVERLAY.SHOW_MS);
  }

  function loop(){
    const now = Date.now();
    if(busy) return;

    // малка пауза между поздрави
    if(now - lastShownAt < window.APP_CONFIG.OVERLAY.MIN_GAP_MS) return;

    const next = getNext();
    if(!next) return;

    // маркираме като показан веднага (за да не се дублира)
    markShown(next.id);
    show(next);
  }

  setInterval(loop, window.APP_CONFIG.OVERLAY.POLL_MS);
})();
