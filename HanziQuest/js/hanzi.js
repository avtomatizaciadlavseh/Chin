(() => {
  const { $$, toast, loadProfile, saveProfile, addXP, burstConfetti, openModal } = window.HQ;

  const elRound = $$("#hzRound");
  const elScore = $$("#hzScore");
  const elPrompt = $$("#hzPrompt");
  const elStage = $$("#hzStage");
  const elChoices = $$("#hzChoices");
  const btnNext = $$("#btnHzNext");
  const btnExplain = $$("#btnHzExplain");
  const prog = $$("#hzProg");

  const TOTAL = 8;

  const deck = [
    {
      hanzi:"人", pinyin:"rén", meaning:"человек",
      comps:["人 (силуэт)"],
      modern:"人口 rénkǒu — «население» (буквально «люди+рот»)."
    },
    {
      hanzi:"口", pinyin:"kǒu", meaning:"рот",
      comps:["口 (рамка)"],
      modern:"入口 rùkǒu — «вход» (на вывесках метро и торговых центров)."
    },
    {
      hanzi:"好", pinyin:"hǎo", meaning:"хороший/нравится",
      comps:["女 (женщина)", "子 (ребёнок)"],
      modern:"你好 nǐhǎo — «привет». А «好喝 hǎohē» часто пишут на напитках: «вкусно, хорошо пьётся»."
    },
    {
      hanzi:"学", pinyin:"xué", meaning:"учиться",
      comps:["⺍/冖 (крыша/козырёк)", "子 (ребёнок)"],
      modern:"学习 xuéxí — «учиться». На кампусах и в коворкингах это слово повсюду."
    },
    {
      hanzi:"码", pinyin:"mǎ", meaning:"код/метка",
      comps:["石 + 马 (исторически)"],
      modern:"二维码 èrwéimǎ — QR‑код. В повседневной жизни — must‑have."
    },
    {
      hanzi:"外", pinyin:"wài", meaning:"вне/наружу",
      comps:["夕 + 卜 (форма)"],
      modern:"外卖 wàimài — доставка еды. Часто увидишь на пакетах и в приложениях."
    },
  ];

  function shuffle(a){
    const b = a.slice();
    for(let i=b.length-1;i>0;i--){
      const j = (Math.random()*(i+1))|0;
      [b[i],b[j]]=[b[j],b[i]];
    }
    return b;
  }

  const pool = shuffle(deck);
  const questions = [];
  for(let k=0;k<TOTAL;k++){
    const item = pool[k % pool.length];
    questions.push({ type: (k % 2 === 0) ? "meaningToHanzi" : "hanziToMeaning", item });
  }

  let i=0, score=0, locked=false;

  function pct(x){ return Math.round(Math.max(0, Math.min(1, x||0))*100); }

  function buildChoices(q){
    const item = q.item;
    const others = shuffle(deck.filter(x => x.hanzi !== item.hanzi)).slice(0,3);

    if(q.type === "meaningToHanzi"){
      const options = shuffle([item, ...others]).slice(0,4);
      return options.map(o => ({
        correct: o.hanzi === item.hanzi,
        html: `<b style="font-size:28px">${o.hanzi}</b><div style="color: var(--muted); margin-top:4px">${o.pinyin}</div>`
      }));
    } else {
      const options = shuffle([item, ...others]).slice(0,4);
      return options.map(o => ({
        correct: o.hanzi === item.hanzi,
        html: `<b>${o.meaning}</b><div style="color: var(--muted); margin-top:4px">${o.hanzi} · ${o.pinyin}</div>`
      }));
    }
  }

  function render(){
    const q = questions[i];
    if(!q) return;

    locked = false;
    btnNext.disabled = true;

    elRound.textContent = `${i+1} / ${TOTAL}`;
    elScore.textContent = `${score}`;
    prog.style.width = pct(i/TOTAL) + "%";

    const item = q.item;

    elPrompt.textContent = q.type === "meaningToHanzi"
      ? `Какой знак означает: “${item.meaning}”?`
      : `Что означает знак: ${item.hanzi}?`;

    elStage.innerHTML = `
      <div class="kpi">
        <div class="dot" style="background: var(--accent2); box-shadow: 0 0 0 5px rgba(96,165,250,.12)"></div>
        <div>
          <b style="font-size:18px">${item.hanzi} · ${item.pinyin}</b><br>
          <span>${item.modern}</span>
        </div>
      </div>
      <div style="height:12px"></div>
      <div class="p">Компоненты: <span class="kbd">${item.comps.join(" + ")}</span></div>
    `;

    elChoices.innerHTML = "";
    const choices = buildChoices(q);

    choices.forEach(ch => {
      const el = document.createElement("div");
      el.className = "choice";
      el.innerHTML = ch.html;
      el.addEventListener("click", () => pick(el, ch.correct, item));
      elChoices.appendChild(el);
    });
  }

  function pick(clickedEl, correct, item){
    if(locked) return;
    locked = true;

    const nodes = Array.from(elChoices.children);
    nodes.forEach(n => n.style.pointerEvents="none");

    // Reveal correct option (by checking data in HTML)
    nodes.forEach(n => {
      const text = n.textContent || "";
      if(text.includes(item.hanzi) || text.includes(item.meaning)){
        // may tag extra option in rare case, but fine for this deck
        n.classList.add("correct");
      }
    });

    if(correct){
      score++;
      clickedEl.classList.add("correct");
      toast("Верно!", `${item.hanzi} — ${item.meaning}.`, "✅", 1600);
    }else{
      clickedEl.classList.add("wrong");
      toast("Не совсем", `Правильно: ${item.hanzi} — ${item.meaning}.`, "🧠", 2400);
    }

    btnNext.disabled = false;
  }

  btnExplain?.addEventListener("click", () => {
    openModal("Как запоминать иероглифы быстро", `
      <p><b>1)</b> Найди смысловой кусочек (радикал). Он намекает на тему: вода, рука, сердце…</p>
      <p><b>2)</b> Найди фонетическую часть — она может подсказать чтение.</p>
      <p><b>3)</b> Сделай микродействие: 10 секунд <span class="kbd">написать</span> знак в Canvas — память тела очень сильна.</p>
    `);
  });

  btnNext?.addEventListener("click", () => {
    i++;
    if(i >= TOTAL) finish();
    else render();
  });

  function finish(){
    prog.style.width = "100%";
    elPrompt.textContent = "Финиш 🎉";
    elStage.innerHTML = `<p class="p">Счёт: <b>${score}/${TOTAL}</b>. Теперь закрепим рукой в тренажёре.</p>`;
    elChoices.innerHTML = "";
    btnNext.disabled = true;

    const ratio = score/TOTAL;
    let p = loadProfile();
    p = addXP(p, score*10 + (ratio>=0.75 ? 50 : 0));
    p.completed.hanzi = Math.max(p.completed.hanzi || 0, Math.min(1, (p.completed.hanzi||0) + 0.35 + ratio*0.25));
    saveProfile(p);

    burstConfetti();
    toast("XP получен!", `+${score*10 + (ratio>=0.75 ? 50 : 0)} XP.`, "🟢", 2400);

    const wrap = $$("#hzEnd");
    wrap.innerHTML = `
      <div class="cta-row">
        <a class="btn" href="canvas.html">Тренажёр штрихов</a>
        <a class="btn secondary" href="culture.html">Культурный квест</a>
        <a class="btn ghost" href="lessons.html">К списку</a>
      </div>
      <p class="help">Подсказка: лучше 2–3 знака каждый день, чем 30 за раз.</p>
    `;
  }

  render();
})();
