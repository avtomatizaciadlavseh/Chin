(() => {
  const { $$, $$$, toast, loadProfile, saveProfile, updateStreak } = window.HQ;

  const form = $$("#regForm");
  const nameInput = $$("#username");
  const picks = $$$(".avatar-pick");
  const preview = $$("#avatarPreview");
  const startBtn = $$("#btnStart");

  const avatarMeta = {
    neko: { title:"Neko", desc:"кот‑коуч: нежно, но требовательно" },
    kitsune: { title:"Kitsune", desc:"лиса‑стратег: любит челленджи" },
    panda: { title:"Panda", desc:"панда‑дзен: стабильно и спокойно" },
    usagi: { title:"Usagi", desc:"кролик‑спринтер: быстрые победы" }
  };

  let selected = "neko";

  function renderPreview(){
    if(!preview) return;
    preview.innerHTML = `
      <div class="kpi">
        <div class="dot"></div>
        <div>
          <b>${avatarMeta[selected].title}</b><br>
          <span>${avatarMeta[selected].desc}</span>
        </div>
      </div>
      <div style="height:12px"></div>
      <img src="assets/avatars/${selected}.svg" alt="preview" style="width:140px;height:140px;border-radius:34px;border:1px solid rgba(34,48,74,.8)">
    `;
  }

  function select(id){
    selected = id;
    picks.forEach(p => p.classList.toggle("selected", p.dataset.avatar === id));
    renderPreview();
  }

  picks.forEach(p => {
    p.addEventListener("click", () => select(p.dataset.avatar));
  });

  select(selected);

  function sanitizeName(s){
    return (s || "").trim().replace(/\s+/g," ");
  }

  function validName(s){
    const n = sanitizeName(s);
    return n.length >= 2 && n.length <= 20;
  }

  nameInput?.addEventListener("input", () => {
    const ok = validName(nameInput.value);
    startBtn.disabled = !ok;
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = sanitizeName(nameInput.value);
    if(!validName(username)){
      toast("Нужно имя", "От 2 до 20 символов, без лишних пробелов.", "🧩");
      return;
    }

    let p = loadProfile() || {
      username:"",
      avatarId:"neko",
      xp:0,
      streak:0,
      lastActive:null,
      completed:{tones:0, hanzi:0, culture:0},
      achievements:[],
      settings:{reduceMotion:false, sound:true}
    };

    p.username = username;
    p.avatarId = selected;
    p = updateStreak(p);
    saveProfile(p);

    toast("Готово!", `Добро пожаловать, ${username}. Твой коуч уже рядом.`, "🐾");

    const intent = sessionStorage.getItem("hq_intent");
    sessionStorage.removeItem("hq_intent");

    setTimeout(() => {
      location.href = intent ? intent : "dashboard.html";
    }, 650);
  });

})();
