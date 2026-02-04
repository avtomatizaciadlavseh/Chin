(() => {
  const { $$, loadProfile } = window.HQ;

  const wrap = $$("#lessonsGrid");
  const p = loadProfile();
  if(!wrap || !p) return;

  const lessons = [
    {
      id:"tones",
      title:"Тоны: услышать и сказать",
      tag:{text:"произношение", cls:"tag blue"},
      desc:"Мини‑игра: угадай тон по звучанию и по ритму. Без «академической» скуки — только рабочая практика.",
      href:"lesson-tones.html",
      prog: p.completed.tones || 0
    },
    {
      id:"hanzi",
      title:"Иероглифы: смысл и конструктор",
      tag:{text:"письмо", cls:"tag"},
      desc:"Иероглифы как Lego: радикалы + компоненты. Учимся не зубрить, а понимать.",
      href:"lesson-hanzi.html",
      prog: p.completed.hanzi || 0
    },
    {
      id:"culture",
      title:"Квест: Китай сегодня",
      tag:{text:"культура", cls:"tag pink"},
      desc:"Сцены из реальности: QR‑оплата, super‑apps, доставка, стрим‑шоппинг, скоростные поезда. Ты выбираешь варианты и собираешь XP.",
      href:"culture.html",
      prog: p.completed.culture || 0
    },
    {
      id:"canvas",
      title:"Тренажёр штрихов (Canvas)",
      tag:{text:"навык руки", cls:"tag orange"},
      desc:"Тренируй 4 базовых знака: 人, 口, 好, 学. Есть подсказки по штрихам и экспорт рисунка.",
      href:"canvas.html",
      prog: Math.min(1, (p.completed.hanzi||0) * 0.65) // preview
    },
  ];

  const pct = (x) => Math.round(Math.max(0, Math.min(1, x||0))*100);

  wrap.innerHTML = lessons.map(l => `
    <div class="lesson-card">
      <div class="top">
        <div>
          <b>${l.title}</b><br>
          <span class="${l.tag.cls}">${l.tag.text}</span>
        </div>
        <span style="color: var(--muted); font-size: 13px">${pct(l.prog)}%</span>
      </div>
      <div class="p">${l.desc}</div>
      <div class="progress"><i style="width:${pct(l.prog)}%"></i></div>
      <div class="cta-row">
        <a class="btn small" href="${l.href}">Играть</a>
        <a class="btn small ghost" href="${l.href}#about">Что внутри</a>
      </div>
    </div>
  `).join("");
})();
