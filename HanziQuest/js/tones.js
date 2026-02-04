(() => {
  const { $$, toast, loadProfile, saveProfile, addXP, burstConfetti, openModal } = window.HQ;

  const elWord = $$("#toneWord");
  const elHint = $$("#toneHint");
  const elRound = $$("#toneRound");
  const elScore = $$("#toneScore");
  const elChoices = $$("#toneChoices");
  const btnNext = $$("#btnToneNext");
  const btnSpeak = $$("#btnSpeak");
  const btnExplain = $$("#btnExplain");
  const prog = $$("#toneProg");

  const TOTAL = 10;

  const bank = [
    {hanzi:"妈", pinyin:"mā", base:"ma", tone:1, gloss:"мама", scene:"семья"},
    {hanzi:"麻", pinyin:"má", base:"ma", tone:2, gloss:"конопля/онемение", scene:"еда: 麻辣"},
    {hanzi:"马", pinyin:"mǎ", base:"ma", tone:3, gloss:"лошадь", scene:"история/спорт"},
    {hanzi:"骂", pinyin:"mà", base:"ma", tone:4, gloss:"ругать", scene:"эмоции"},
    {hanzi:"外", pinyin:"wài", base:"wai", tone:4, gloss:"вне/снаружи", scene:"外卖 (доставка)"},
    {hanzi:"买", pinyin:"mǎi", base:"mai", tone:3, gloss:"покупать", scene:"маркетплейсы"},
    {hanzi:"高", pinyin:"gāo", base:"gao", tone:1, gloss:"высокий", scene:"高铁"},
    {hanzi:"铁", pinyin:"tiě", base:"tie", tone:3, gloss:"железо", scene:"高铁 (HSR)"},
    {hanzi:"扫", pinyin:"sǎo", base:"sao", tone:3, gloss:"сканировать/подметать", scene:"扫码"},
    {hanzi:"码", pinyin:"mǎ", base:"ma", tone:3, gloss:"код", scene:"二维码"},
    {hanzi:"直", pinyin:"zhí", base:"zhi", tone:2, gloss:"прямой/сразу", scene:"直播"},
    {hanzi:"快", pinyin:"kuài", base:"kuai", tone:4, gloss:"быстро", scene:"快递"}
  ];

  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = (Math.random()*(i+1))|0;
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  const questions = shuffle(bank).slice(0, TOTAL);

  let i = 0;
  let score = 0;
  let locked = false;

  const toneInfo = {
    1:{name:"1-й тон", hint:"ровно высоко", contour:"────"},
    2:{name:"2-й тон", hint:"вверх (как вопрос)", contour:"╱╱╱"},
    3:{name:"3-й тон", hint:"вниз‑вверх (модель)", contour:"╲╱"},
    4:{name:"4-й тон", hint:"резко вниз (как приказ)", contour:"╲╲╲"},
  };

  function updateUI(){
    const q = questions[i];
    if(!q) return;

    locked = false;
    btnNext.disabled = true;
    elChoices.innerHTML = "";
    elRound.textContent = `${i+1} / ${TOTAL}`;
    elScore.textContent = `${score}`;

    const pct = Math.round((i/TOTAL)*100);
    prog.style.width = pct + "%";

    elWord.innerHTML = `<span style="font-size:40px;font-weight:900">${q.hanzi}</span>
      <span style="font-size:22px;font-weight:800;margin-left:10px">${q.base}</span>`;
    elHint.textContent = `Сцена: ${q.scene}. Какой тон у слога “${q.base}”?`;

    for(let t=1;t<=4;t++){
      const opt = document.createElement("div");
      opt.className = "choice";
      opt.dataset.tone = String(t);
      opt.innerHTML = `
        <b>${toneInfo[t].name}</b>
        <div style="color: var(--muted); margin-top:4px; display:flex; gap:10px; align-items:center; flex-wrap:wrap">
          <span>${toneInfo[t].hint}</span>
          <span class="kbd">${toneInfo[t].contour}</span>
        </div>
      `;
      opt.addEventListener("click", () => pick(t));
      elChoices.appendChild(opt);
    }
  }

  function speak(text){
    try{
      const p = loadProfile();
      if(p?.settings?.sound === false){
        toast("Звук выключен", "Включи звук в профиле, если нужно.", "🔇");
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices() || [];
      const zh = voices.find(v => (v.lang||"").toLowerCase().startsWith("zh"));
      if(zh) u.voice = zh;
      u.rate = 0.95;
      u.pitch = 1.05;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }catch(e){
      toast("Не получилось озвучить", "В этом браузере синтез речи недоступен.", "🧠");
    }
  }

  function pick(t){
    if(locked) return;
    locked = true;

    const q = questions[i];
    const nodes = Array.from(elChoices.children);
    nodes.forEach(n => n.style.pointerEvents="none");

    const correct = (t === q.tone);

    nodes.forEach(n => {
      const tt = parseInt(n.dataset.tone,10);
      if(tt === q.tone) n.classList.add("correct");
      if(tt === t && tt !== q.tone) n.classList.add("wrong");
    });

    if(correct){
      score++;
      toast("Точно!", `${q.pinyin} — ${q.gloss}`, "✅", 1600);
      speak(q.pinyin);
    }else{
      toast("Почти", `Правильно: ${toneInfo[q.tone].name} → ${q.pinyin} (${q.gloss})`, "🧩", 2400);
      speak(q.pinyin);
    }

    btnNext.disabled = false;
  }

  btnSpeak?.addEventListener("click", () => {
    const q = questions[i];
    speak(q.pinyin);
  });

  btnExplain?.addEventListener("click", () => {
    openModal("Как звучит каждый тон", `
      <p><b>1-й</b> — держим ровно высоко: <span class="kbd">────</span>.</p>
      <p><b>2-й</b> — уходим вверх: <span class="kbd">╱╱╱</span>.</p>
      <p><b>3-й</b> — модель вниз‑вверх: <span class="kbd">╲╱</span> (в речи часто сокращается).</p>
      <p><b>4-й</b> — резкий спад: <span class="kbd">╲╲╲</span>.</p>
      <hr class="sep">
      <p style="margin:0">Совет: сначала медленно, потом добавляй ритм. Это не про «талант», а про повторение.</p>
    `);
  });

  btnNext?.addEventListener("click", () => {
    i++;
    if(i >= TOTAL){
      finish();
    } else {
      updateUI();
    }
  });

  function finish(){
    prog.style.width = "100%";
    elWord.innerHTML = `<span style="font-size:40px;font-weight:900">Финиш 🎉</span>`;
    elHint.textContent = `Счёт: ${score} / ${TOTAL}.`;

    elChoices.innerHTML = "";
    btnNext.disabled = true;
    btnSpeak.disabled = true;

    const pct = score / TOTAL;
    let p = loadProfile();
    p = addXP(p, score * 8 + (pct>=0.8 ? 40 : 0));
    // progressive completion: move towards 1
    p.completed.tones = Math.max(p.completed.tones || 0, Math.min(1, (p.completed.tones||0) + 0.35 + pct*0.25));
    saveProfile(p);

    burstConfetti();
    toast("XP получен!", `+${score*8 + (pct>=0.8 ? 40 : 0)} XP.`, "🟢", 2400);

    const next = (p.completed.hanzi || 0) < 1 ? "lesson-hanzi.html" : "culture.html";
    const wrap = $$("#toneEnd");
    wrap.innerHTML = `
      <div class="cta-row">
        <a class="btn" href="${next}">Дальше →</a>
        <a class="btn ghost" href="lessons.html">К списку уроков</a>
      </div>
      <p class="help">Хочешь сделать тоны «автоматическими»? Вернись сюда завтра и пройди ещё раз. Секрет — повторение.</p>
    `;
  }

  // init
  updateUI();
})();
