/* HanziQuest - common app layer (offline static) */
(() => {
  const STORAGE_KEY = "hq_profile_v1";
  const APP_VERSION = "1.0.0";

  const $$ = (sel, root=document) => root.querySelector(sel);
  const $$$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function nowISO(){ return new Date().toISOString(); }
  function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

  function defaultProfile(){
    return {
      version: APP_VERSION,
      username: "",
      avatarId: "neko",
      xp: 0,
      streak: 0,
      lastActive: null,
      completed: {
        tones: 0,  // 0..1
        hanzi: 0,
        culture: 0
      },
      achievements: [],
      settings: {
        reduceMotion: false,
        sound: true
      }
    };
  }

  function loadProfile(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      const p = JSON.parse(raw);
      return { ...defaultProfile(), ...p, completed: { ...defaultProfile().completed, ...(p.completed||{}) }, settings: { ...defaultProfile().settings, ...(p.settings||{}) } };
    }catch(e){
      console.warn("Profile parse error", e);
      return null;
    }
  }

  function saveProfile(profile){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  function clearProfile(){
    localStorage.removeItem(STORAGE_KEY);
  }

  function isLoggedIn(){
    const p = loadProfile();
    return !!(p && p.username && p.username.trim().length > 0);
  }

  function updateStreak(profile){
    const today = new Date();
    const last = profile.lastActive ? new Date(profile.lastActive) : null;
    // streak rules: if last active was yesterday => +1; if today => keep; else reset to 1
    const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const t0 = dayStart(today);
    const l0 = last ? dayStart(last) : null;

    if(!last){
      profile.streak = 1;
    } else if(l0 === t0){
      // same day: keep
    } else {
      const diffDays = Math.round((t0 - l0) / (24*3600*1000));
      if(diffDays === 1) profile.streak = clamp((profile.streak||0) + 1, 1, 999);
      else profile.streak = 1;
    }
    profile.lastActive = nowISO();
    return profile;
  }

  function addXP(profile, amount){
    profile.xp = (profile.xp || 0) + (amount || 0);
    return profile;
  }

  // Toasts
  function ensureToastRoot(){
    let root = $$("#toastRoot");
    if(!root){
      root = document.createElement("div");
      root.id = "toastRoot";
      root.className = "toast-wrap";
      document.body.appendChild(root);
    }
    return root;
  }

  function toast(title, message, emoji="✨", ms=2800){
    const root = ensureToastRoot();
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `
      <div class="emoji">${emoji}</div>
      <div>
        <b>${escapeHtml(title)}</b>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
    root.appendChild(el);
    window.setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(-6px) scale(.98)";
      el.style.transition = "opacity .25s ease, transform .25s ease";
      window.setTimeout(() => el.remove(), 260);
    }, ms);
  }

  // Modal (optional)
  function openModal(title, html){
    let back = $$("#modalBack");
    if(!back){
      back = document.createElement("div");
      back.id = "modalBack";
      back.className = "modal-backdrop";
      back.innerHTML = `
        <div class="modal">
          <div class="head">
            <h3 id="modalTitle"></h3>
            <button class="x" id="modalClose">Закрыть</button>
          </div>
          <div class="content" id="modalBody"></div>
        </div>
      `;
      document.body.appendChild(back);
      back.addEventListener("click", (e) => { if(e.target === back) closeModal(); });
      $$("#modalClose", back).addEventListener("click", closeModal);
    }
    $$("#modalTitle").textContent = title || "Инфо";
    $$("#modalBody").innerHTML = html || "";
    back.style.display = "flex";
  }
  function closeModal(){
    const back = $$("#modalBack");
    if(back) back.style.display = "none";
  }

  // Confetti (tiny)
  function burstConfetti(){
    const canvas = document.createElement("canvas");
    canvas.className = "confetti";
    const ctx = canvas.getContext("2d");
    document.body.appendChild(canvas);
    const dpr = window.devicePixelRatio || 1;

    function resize(){
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#22c55e","#60a5fa","#fb7185","#f59e0b","#a78bfa","#34d399"];
    const parts = Array.from({length: 120}, () => ({
      x: window.innerWidth * 0.5 + (Math.random()-0.5)*20,
      y: window.innerHeight * 0.25 + (Math.random()-0.5)*20,
      vx: (Math.random()-0.5)*8,
      vy: -Math.random()*9 - 3,
      g: 0.22 + Math.random()*0.18,
      r: 2 + Math.random()*4,
      c: colors[(Math.random()*colors.length)|0],
      a: 1
    }));

    let t=0;
    function frame(){
      t++;
      ctx.clearRect(0,0,window.innerWidth, window.innerHeight);
      for(const p of parts){
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.g;
        p.a *= 0.992;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.a));
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if(t < 280) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  function escapeHtml(str){
    return String(str ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  // Nav + Assistant injection
  function buildNav(){
    const nav = document.getElementById("topnav");
    if(!nav) return;

    const p = loadProfile();
    const logged = !!(p && p.username);

    const links = [
      { href:"dashboard.html", label:"Панель", cls:"pill small secondary", auth:true },
      { href:"lessons.html", label:"Уроки", cls:"pill small", auth:true },
      { href:"canvas.html", label:"Тренажёр", cls:"pill small", auth:true },
      { href:"culture.html", label:"Культура", cls:"pill small", auth:true },
      { href:"profile.html", label:"Профиль", cls:"pill small", auth:true },
      { href:"about.html", label:"О проекте", cls:"pill small", auth:false },
    ];

    nav.className = "topnav";
    nav.innerHTML = `
      <div class="nav-inner">
        <a class="brand" href="${logged ? "dashboard.html" : "index.html"}" aria-label="HanziQuest">
          <img src="assets/ui/logo.svg" alt="HanziQuest logo">
        </a>

        <div class="nav-links">
          ${links.filter(x => logged ? true : !x.auth).map(x => `<a class="${x.cls}" href="${x.href}">${x.label}</a>`).join("")}
        </div>

        <div class="nav-right">
          ${logged ? `
            <div class="avatar-chip" title="Твой прогресс">
              <img src="assets/avatars/${p.avatarId}.svg" alt="avatar">
              <div class="meta">
                <b>${escapeHtml(p.username)}</b>
                <span>XP: ${p.xp || 0} · 🔥 ${p.streak || 0}</span>
              </div>
            </div>
            <button class="pill small danger" id="btnLogout" type="button">Выйти</button>
          ` : `
            <a class="pill small accent" href="register.html">Начать</a>
          `}
        </div>
      </div>
    `;

    const btn = document.getElementById("btnLogout");
    if(btn){
      btn.addEventListener("click", () => {
        clearProfile();
        toast("До встречи!", "Профиль сохранён локально можно создать заново.", "👋");
        setTimeout(() => location.href = "index.html", 650);
      });
    }
  }

  function guardAuth(){
    const allow = new Set(["index.html","register.html","about.html"]);
    const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if(allow.has(page)) return;

    if(!isLoggedIn()){
      // remember intended page
      sessionStorage.setItem("hq_intent", page);
      location.href = "register.html";
    }
  }

  function assistantMessageFor(page, profile){
    const c = profile?.completed || {};
    const pct = (x) => Math.round(clamp(x||0,0,1)*100);
    const pick = (...arr) => arr[(Math.random()*arr.length)|0];

    // progress-aware hints
    if(page === "dashboard.html"){
      if((c.tones||0) < 1) return {
        title: "Сегодня прокачаем тоны",
        text: "Выбери урок «Тоны» и сделай 5 быстрых раундов. Это реально меняет всё в произношении.",
        action: {label:"Открыть урок «Тоны»", href:"lesson-tones.html"}
      };
      if((c.hanzi||0) < 1) return {
        title: "Давай в иероглифы",
        text: "Сначала научимся видеть детали: радикалы и компоненты. Это как Lego для смысла.",
        action: {label:"Открыть урок «Иероглифы»", href:"lesson-hanzi.html"}
      };
      return {
        title: "Миссия: современный Китай",
        text: "Сегодня квест про QR-оплату и супер‑приложения. Это не музей, это реальная жизнь.",
        action: {label:"Открыть культурный квест", href:"culture.html"}
      };
    }

    if(page === "canvas.html"){
      return {
        title: "Тренажёр штрихов",
        text: "Выбери знак справа и обведи по подсказкам. Толщину кисти можно менять. Секрет — рисуй уверенно, без «дребезга».",
        action: {label:"Открыть быстрый урок", href:"lesson-hanzi.html"}
      };
    }

    if(page === "lesson-tones.html"){
      return {
        title: pick("Слушай — и повторяй", "Быстрый ритм — лучший ритуал"),
        text: "Если есть голос zh‑CN, нажимай «🔊» — он даст ориентир. Потом проговори сам и выбери тон.",
        action: {label:"Совет по тонам", href:"#", onClick:"tonesTip"}
      };
    }

    if(page === "lesson-hanzi.html"){
      return {
        title: "Думай компонентами",
        text: "Не зубри «картинкой». Сначала найди смысловой радикал и фонетику — так запоминается в разы легче.",
        action: {label:"Открыть тренажёр", href:"canvas.html"}
      };
    }

    if(page === "culture.html"){
      return {
        title: "Китай сегодня",
        text: "Мы учим язык через реальность: супер‑приложения, доставка за 30 минут, высокоскоростные поезда и стрим‑шоппинг.",
        action: {label:"Начать квест", href:"#", onClick:"startCulture"}
      };
    }

    if(page === "lessons.html"){
      return {
        title: "Выбери квест",
        text: `Твоя шкала прогресса: тоны ${pct(c.tones)}%, иероглифы ${pct(c.hanzi)}%, культура ${pct(c.culture)}%.`,
        action: {label:"С чего начать?", href:"#", onClick:"suggestPath"}
      };
    }

    if(page === "profile.html"){
      return {
        title: "Прокачка профиля",
        text: "Поменяй аватар, включи/выключи звук и «reduce motion», а ещё — посмотри свои достижения.",
        action: {label:"Справка", href:"about.html"}
      };
    }

    return {
      title: "Я рядом",
      text: "Если застрянешь — нажми «подсказка». Мы делаем обучение лёгким и честным.",
      action: {label:"К урокам", href:"lessons.html"}
    };
  }

  function buildAssistant(){
    const root = document.getElementById("assistantRoot");
    if(!root) return;

    const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const p = loadProfile();

    if(!p || !p.username){
      root.innerHTML = "";
      return;
    }

    const msg = assistantMessageFor(page, p);

    root.className = "assistant";
    root.innerHTML = `
      <div class="bubble">
        <b>${escapeHtml(msg.title)}</b>
        <p>${escapeHtml(msg.text)}</p>
        <div class="actions">
          ${msg.action ? `<a class="btn small ${msg.action.href==="#" ? "ghost" : ""}" href="${msg.action.href}">${escapeHtml(msg.action.label)}</a>` : ""}
          <button class="btn small ghost" type="button" id="btnHint">Подсказка</button>
        </div>
      </div>
      <div class="pet" title="Твой коуч">
        <img src="assets/avatars/${p.avatarId}.svg" alt="assistant avatar">
      </div>
    `;

    const hintBtn = document.getElementById("btnHint");
    hintBtn?.addEventListener("click", () => {
      openModal("Мини‑подсказка", `
        <p>Хак 1: делай <b>короткие</b> сессии по 3–6 минут, но каждый день.</p>
        <p>Хак 2: в китайском важнее <b>слушать</b>, чем читать. Пользуйся кнопкой 🔊.</p>
        <p>Хак 3: иероглиф — это <b>конструктор</b>. Компоненты экономят память.</p>
      `);
    });

    // optional action hooks
    const a = root.querySelector(".actions a");
    if(a && a.getAttribute("href") === "#"){
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const name = msg.action?.onClick;
        if(name === "tonesTip"){
          openModal("Как держать тоны", `
            <p><b>1-й</b> — ровно высоко. <b>2-й</b> — как вопрос вверх. <b>4-й</b> — как приказ вниз.</p>
            <p><b>3-й</b> в реальной речи часто «съедается». Начни с модели: вниз‑вверх, потом упростим.</p>
            <p>Секрет: <span class="kbd">медленно</span> → <span class="kbd">ритм</span> → <span class="kbd">скорость</span>.</p>
          `);
        }
        if(name === "suggestPath"){
          openModal("Маршрут на 10 минут", `
            <ol class="list">
              <li>Тоны: 5 раундов (2–3 мин)</li>
              <li>Иероглифы: собрать 3 знака (3–4 мин)</li>
              <li>Культурный квест: 1 сцена (3–4 мин)</li>
            </ol>
          `);
        }
        if(name === "startCulture"){
          document.dispatchEvent(new CustomEvent("hqStartCulture"));
          toast("Поехали!", "Выбирай вариант ответа и собирай XP.", "🧧");
        }
      });
    }
  }

  // Public API for page scripts
  window.HQ = {
    STORAGE_KEY,
    loadProfile,
    saveProfile,
    clearProfile,
    isLoggedIn,
    updateStreak,
    addXP,
    toast,
    openModal,
    closeModal,
    burstConfetti,
    escapeHtml,
    $$,
    $$$
  };

  // Boot
  document.addEventListener("DOMContentLoaded", () => {
    guardAuth();
    buildNav();
    buildAssistant();
  });
})();
