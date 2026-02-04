(() => {
  const { $$, toast } = window.HQ;

  const btn = $$("#btnDemoToast");
  btn?.addEventListener("click", () => {
    toast("Демо‑опыт", "На сайте всё работает офлайн. Регистрация хранится в localStorage.", "🧪", 2800);
  });

  // tiny parallax on hero badge
  const hero = $$("#heroCard");
  if(hero){
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - 0.5;
      const y = (e.clientY - r.top)/r.height - 0.5;
      hero.style.transform = `translateY(-2px) rotateX(${(-y*2).toFixed(2)}deg) rotateY(${(x*3).toFixed(2)}deg)`;
    });
    hero.addEventListener("mouseleave", () => {
      hero.style.transform = "";
    });
  }
})();
