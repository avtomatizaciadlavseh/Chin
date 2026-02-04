(() => {
  const { $$, toast, loadProfile, saveProfile, addXP, burstConfetti } = window.HQ;

  const wrap = $$("#cultureWrap");
  const btnStart = $$("#btnCultureStart");
  const prog = $$("#cultureProg");
  const xpEl = $$("#cultureXP");

  let p = loadProfile();
  if(!wrap || !p) return;

  const nodes = {
    start:{
      title:"Город 2026: всё через телефон",
      text:"Ты прилетаешь в огромный мегаполис. Вокруг — QR‑коды, супер‑приложения, быстрые оплаты, e‑чеки. Твоя задача: прожить 5 сцен и собрать словарь.",
      vocab:[
        {h:"手机", py:"shǒujī", ru:"телефон"},
        {h:"城市", py:"chéngshì", ru:"город"},
      ],
      options:[
        {to:"metro", label:"В метро", xp:10},
        {to:"cafe", label:"В кофейню", xp:10},
      ]
    },
    metro:{
      title:"Метро: вход по QR",
      text:"На турникете — QR. Большинство людей прикладывают экран и проходят. Ты хочешь купить проезд и не выглядеть туристом 🙂",
      vocab:[
        {h:"扫码", py:"sǎomǎ", ru:"сканировать код"},
        {h:"入口", py:"rùkǒu", ru:"вход"},
        {h:"支付", py:"zhīfù", ru:"оплата"},
      ],
      options:[
        {to:"delivery", label:"Открыть супер‑приложение и оплатить", xp:20},
        {to:"metroAsk", label:"Спросить у сотрудника", xp:12},
      ]
    },
    metroAsk:{
      title:"Короткий диалог",
      text:"Ты говоришь фразу-минимум. Сотрудник улыбается и показывает кнопку «扫码支付».",
      vocab:[
        {h:"请问", py:"qǐngwèn", ru:"извините/подскажите"},
        {h:"怎么", py:"zěnme", ru:"как?"},
      ],
      options:[
        {to:"delivery", label:"Теперь оплатить и пройти", xp:18},
      ]
    },
    cafe:{
      title:"Кофейня: «好喝» или «少糖»?",
      text:"Ты берёшь напиток. На табло куча настроек: меньше сахара, лёд, размер. Всё быстро и по делу.",
      vocab:[
        {h:"咖啡", py:"kāfēi", ru:"кофе"},
        {h:"少糖", py:"shǎotáng", ru:"меньше сахара"},
        {h:"好喝", py:"hǎohē", ru:"вкусно"},
      ],
      options:[
        {to:"delivery", label:"Оплатить и взять стакан", xp:18},
        {to:"live", label:"Сесть и посмотреть стрим‑магазин", xp:14},
      ]
    },
    delivery:{
      title:"Доставка: «外卖» за 30 минут",
      text:"Ты заказываешь еду в приложении. В городе это стандарт: курьер приезжает быстро, а трекинг виден на карте.",
      vocab:[
        {h:"外卖", py:"wàimài", ru:"доставка еды"},
        {h:"快递", py:"kuàidì", ru:"доставка/курьерка"},
        {h:"地址", py:"dìzhǐ", ru:"адрес"},
      ],
      options:[
        {to:"live", label:"Параллельно открыть стрим‑покупки", xp:18},
        {to:"hsr", label:"Поехать на 高铁 в соседний город", xp:18},
      ]
    },
    hsr:{
      title:"高铁: скорость как норма",
      text:"Ты на высокоскоростной железной дороге. Всё организовано, навигация понятная, билеты — в телефоне.",
      vocab:[
        {h:"高铁", py:"gāotiě", ru:"высокоскоростной поезд"},
        {h:"票", py:"piào", ru:"билет"},
        {h:"站", py:"zhàn", ru:"станция/вокзал"},
      ],
      options:[
        {to:"end", label:"Вернуться в город и завершить день", xp:20},
      ]
    },
    live:{
      title:"直播: шоппинг в прямом эфире",
      text:"В приложении идёт стрим: ведущий показывает товары, зрители задают вопросы, скидки появляются «на минуту». Это часть современной потребительской культуры.",
      vocab:[
        {h:"直播", py:"zhíbō", ru:"прямая трансляция"},
        {h:"优惠", py:"yōuhuì", ru:"скидка"},
        {h:"下单", py:"xiàdān", ru:"оформить заказ"},
      ],
      options:[
        {to:"end", label:"Завершить квест", xp:22},
      ]
    },
    end:{
      title:"Квест завершён",
      text:"Ты прошёл современный день: телефон, QR, доставка, скорость, стримы. Это и есть «реальный Китай» в бытовом смысле — технология встроена в повседневность.",
      vocab:[
        {h:"学习", py:"xuéxí", ru:"учиться"},
        {h:"今天", py:"jīntiān", ru:"сегодня"},
      ],
      options:[]
    }
  };

  let state = {
    nodeId: "start",
    gained: 0,
    learned: new Map()
  };

  function addVocab(list){
    (list||[]).forEach(v => {
      const key = `${v.h}|${v.py}|${v.ru}`;
      state.learned.set(key, v);
    });
  }

  function render(){
    const n = nodes[state.nodeId];

    addVocab(n.vocab);

    const totalSteps = 5; // approximate for progress bar
    const visited = state.learned.size;
    const progress = Math.min(1, (visited / 14)); // cap on vocab items

    prog.style.width = Math.round(progress*100) + "%";
    xpEl.textContent = String(state.gained);

    wrap.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <b>${n.title}</b>
          <span>Словарь: ${state.learned.size} · XP за квест: ${state.gained}</span>
        </div>
        <div style="height:10px"></div>
        <div class="p">${n.text}</div>

        <div style="height:14px"></div>
        <div class="card pad" style="background: rgba(2,6,23,.25); box-shadow:none">
          <b>Слова сцены</b>
          <div class="grid-3" style="margin-top:10px">
            ${(n.vocab||[]).map(v => `
              <div class="kpi">
                <div class="dot" style="background: var(--warn); box-shadow: 0 0 0 5px rgba(245,158,11,.10)"></div>
                <div>
                  <b style="font-size:18px">${v.h}</b><br>
                  <span>${v.py} — ${v.ru}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div style="height:14px"></div>
        <div class="choices">
          ${(n.options||[]).map((o,idx) => `
            <div class="choice" data-i="${idx}">
              <b>${o.label}</b>
              <div style="color: var(--muted); margin-top:4px">+${o.xp} XP</div>
            </div>
          `).join("")}
          ${(n.options||[]).length === 0 ? `
            <div class="cta-row">
              <a class="btn" href="lessons.html">К урокам</a>
              <a class="btn secondary" href="canvas.html">Тренажёр</a>
              <a class="btn ghost" href="dashboard.html">Панель</a>
            </div>
            <div style="height:10px"></div>
            <div class="p">Твой словарь на сегодня:</div>
            <ul class="list">
              ${Array.from(state.learned.values()).map(v => `<li><span class="kbd">${v.h}</span> ${v.py} — ${v.ru}</li>`).join("")}
            </ul>
          ` : ""}
        </div>
      </div>
    `;

    // bind choices
    Array.from(wrap.querySelectorAll(".choice[data-i]")).forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.dataset.i,10);
        const opt = n.options[idx];
        state.gained += opt.xp;
        toast("Выбор сделан", `+${opt.xp} XP`, "🧧", 1400);
        state.nodeId = opt.to;
        render();
        if(state.nodeId === "end"){
          finish();
        }
      });
    });
  }

  function finish(){
    // Apply profile updates once
    let p2 = loadProfile();
    if(!p2) return;

    p2 = addXP(p2, state.gained + 40);
    p2.completed.culture = Math.max(p2.completed.culture || 0, Math.min(1, (p2.completed.culture||0) + 0.45));
    saveProfile(p2);

    burstConfetti();
    toast("Квест закрыт!", `+${state.gained + 40} XP.`, "🎉", 2600);
  }

  function start(){
    state = { nodeId:"start", gained:0, learned:new Map() };
    render();
  }

  btnStart?.addEventListener("click", start);

  // Start via assistant event
  document.addEventListener("hqStartCulture", start);

  // auto-start (nice UX)
  start();
})();
