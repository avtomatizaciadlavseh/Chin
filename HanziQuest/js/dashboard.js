(() => {
  const { $$, loadProfile, saveProfile, updateStreak, toast } = window.HQ;

  const userEl = $$("#dashUser");
  const xpEl = $$("#dashXP");
  const streakEl = $$("#dashStreak");
  const pTones = $$("#pTones");
  const pHanzi = $$("#pHanzi");
  const pCulture = $$("#pCulture");
  const dailyEl = $$("#dailyText");

  const btnDaily = $$("#btnDaily");
  const btnResume = $$("#btnResume");

  let p = loadProfile();
  if(!p) return;

  p = updateStreak(p);
  saveProfile(p);

  const pct = (x) => Math.round(Math.max(0, Math.min(1, x||0))*100);

  if(userEl) userEl.textContent = p.username;
  if(xpEl) xpEl.textContent = String(p.xp || 0);
  if(streakEl) streakEl.textContent = String(p.streak || 0);

  if(pTones) pTones.style.width = pct(p.completed.tones) + "%";
  if(pHanzi) pHanzi.style.width = pct(p.completed.hanzi) + "%";
  if(pCulture) pCulture.style.width = pct(p.completed.culture) + "%";

  const candidates = [
    { key:"tones", href:"lesson-tones.html", text:"Сделай 5 раундов тона: это даст +XP и уверенность в речи." },
    { key:"hanzi", href:"lesson-hanzi.html", text:"Разбери 3 иероглифа по компонентам и закрепи рукой в тренажёре." },
    { key:"culture", href:"culture.html", text:"Пройди сцену про QR‑оплату и сервисы доставки в мегаполисе." }
  ];

  candidates.sort((a,b) => (p.completed[a.key]||0) - (p.completed[b.key]||0));
  const next = candidates[0];

  if(dailyEl) dailyEl.textContent = next.text;

  btnDaily?.addEventListener("click", () => location.href = next.href);

  btnResume?.addEventListener("click", () => {
    // heuristics: resume lowest progress lesson
    toast("Продолжаем", "Я открыл для тебя самый полезный урок на сегодня.", "🚀");
    setTimeout(() => location.href = next.href, 400);
  });
})();
