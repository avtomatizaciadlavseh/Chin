(() => {
  const { $$, $$$, loadProfile, saveProfile, toast, openModal } = window.HQ;

  const nameEl = $$("#pfName");
  const xpEl = $$("#pfXP");
  const streakEl = $$("#pfStreak");
  const avImg = $$("#pfAvatarImg");
  const avGrid = $$("#pfAvatarGrid");
  const chkSound = $$("#pfSound");
  const chkMotion = $$("#pfMotion");
  const btnSave = $$("#btnPfSave");
  const btnReset = $$("#btnPfReset");
  const achWrap = $$("#achWrap");

  let p = loadProfile();
  if(!p) return;

  const avatars = [
    {id:"neko", title:"Neko"},
    {id:"kitsune", title:"Kitsune"},
    {id:"panda", title:"Panda"},
    {id:"usagi", title:"Usagi"},
  ];

  let selected = p.avatarId || "neko";

  function achievements(profile){
    const out = [];
    const c = profile.completed || {};
    if((profile.xp||0) >= 100) out.push({t:"100 XP", d:"первый разогрев"});
    if((profile.streak||0) >= 3) out.push({t:"Серия 3 дня", d:"ритм найден"});
    if((c.tones||0) >= 0.9) out.push({t:"Тоны", d:"почти мастер"});
    if((c.hanzi||0) >= 0.9) out.push({t:"Иероглифы", d:"компоненты освоены"});
    if((c.culture||0) >= 0.9) out.push({t:"Квест", d:"реальность прочувствована"});
    if(out.length === 0) out.push({t:"Старт", d:"просто начни. 10 минут — уже победа."});
    return out;
  }

  function render(){
    nameEl.textContent = p.username;
    xpEl.textContent = String(p.xp || 0);
    streakEl.textContent = String(p.streak || 0);
    avImg.src = `assets/avatars/${selected}.svg`;

    chkSound.checked = p.settings?.sound !== false;
    chkMotion.checked = !!p.settings?.reduceMotion;

    avGrid.innerHTML = avatars.map(a => `
      <div class="avatar-pick ${a.id===selected?"selected":""}" data-avatar="${a.id}">
        <img src="assets/avatars/${a.id}.svg" alt="${a.title}">
        <b>${a.title}</b>
        <span>${a.id===selected ? "выбран" : "нажми чтобы выбрать"}</span>
      </div>
    `).join("");

    Array.from(avGrid.querySelectorAll(".avatar-pick")).forEach(el => {
      el.addEventListener("click", () => {
        selected = el.dataset.avatar;
        render();
      });
    });

    const a = achievements(p);
    achWrap.innerHTML = a.map(x => `
      <div class="kpi">
        <div class="dot"></div>
        <div>
          <b>${x.t}</b><br>
          <span>${x.d}</span>
        </div>
      </div>
    `).join("");
  }

  btnSave?.addEventListener("click", () => {
    p.avatarId = selected;
    p.settings = p.settings || {};
    p.settings.sound = chkSound.checked;
    p.settings.reduceMotion = chkMotion.checked;
    saveProfile(p);
    toast("Сохранено", "Настройки применены.", "💾");
  });

  btnReset?.addEventListener("click", () => {
    openModal("Сброс прогресса", `
      <p>Это удалит XP, прогресс уроков и серию. Профиль и аватар останутся.</p>
      <div class="cta-row">
        <button class="btn danger" id="doReset" type="button">Сбросить</button>
        <button class="btn ghost" id="cancelReset" type="button">Отмена</button>
      </div>
    `);

    setTimeout(() => {
      const doReset = document.getElementById("doReset");
      const cancel = document.getElementById("cancelReset");
      cancel?.addEventListener("click", () => window.HQ.closeModal());
      doReset?.addEventListener("click", () => {
        p.xp = 0;
        p.streak = 0;
        p.completed = {tones:0, hanzi:0, culture:0};
        saveProfile(p);
        window.HQ.closeModal();
        toast("Готово", "Прогресс сброшен. Можно начать заново.", "🧼", 2200);
        render();
      });
    }, 0);
  });

  render();
})();
