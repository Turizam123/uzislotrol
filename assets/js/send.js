(function(){
  const nameEl = document.getElementById('name');
  const textEl = document.getElementById('text');
  const countEl = document.getElementById('count');

  const modal = document.getElementById('modal');
  const pvName = document.getElementById('pvName');
  const pvText = document.getElementById('pvText');

  function updateCount(){
    countEl.textContent = String(textEl.value.length);
  }
  textEl.addEventListener('input', updateCount);
  updateCount();

  // TikTok link display
  const tiktokEl = document.getElementById('tiktokLinkText');
  const copyBtn = document.getElementById('copyTiktok');
  function updateTikTok(){
    tiktokEl.textContent = AppStore.getTikTokLink() || '—';
  }
  copyBtn.addEventListener('click', async ()=>{
    const link = AppStore.getTikTokLink();
    if(!link) return toast("Няма зададен линк.", "warn");
    try { await navigator.clipboard.writeText(link); toast("Копирано ✅"); }
    catch { toast("Не успях да копирам.", "warn"); }
  });
  updateTikTok();
  setInterval(updateTikTok, 1200);

  document.getElementById('previewBtn').addEventListener('click', ()=>{
    pvName.textContent = nameEl.value.trim() || "Анонимен";
    pvText.textContent = textEl.value.trim() || "—";
    modal.classList.add('open');
  });
  document.getElementById('closeModal').addEventListener('click', ()=>modal.classList.remove('open'));
  modal.querySelector('.modalBack').addEventListener('click', ()=>modal.classList.remove('open'));

  document.getElementById('sendForm').addEventListener('submit', (e)=>{
    e.preventDefault();

    const name = nameEl.value.trim();
    const text = textEl.value.trim();

    if(name.length < 2) return toast("Името е твърде кратко.", "warn");
    if(text.length < 2) return toast("Поздравът е твърде кратък.", "warn");

    AppStore.add({name, text});
    toast("Изпратено ✅ (чака одобрение)");

    nameEl.value = "";
    textEl.value = "";
    updateCount();
  });
})();
