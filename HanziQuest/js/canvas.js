(() => {
  const { $$, toast, openModal } = window.HQ;

  const canvas = $$("#hanziCanvas");
  const ctx = canvas?.getContext("2d");
  const list = $$("#charList");
  const btnClear = $$("#btnClear");
  const btnUndo = $$("#btnUndo");
  const btnExport = $$("#btnExport");
  const rng = $$("#brushSize");
  const chkGuide = $$("#showGuide");
  const chkGrid = $$("#showGrid");
  const btnHelp = $$("#btnCanvasHelp");
  const meta = $$("#charMeta");

  if(!canvas || !ctx) return;

  const dpr = window.devicePixelRatio || 1;
  let W=0,H=0;

  const chars = [
    {
      id:"ren",
      hanzi:"人",
      pinyin:"rén",
      meaning:"человек",
      strokes:[
        [[0.52,0.18],[0.40,0.42],[0.33,0.80]],
        [[0.52,0.28],[0.58,0.46],[0.70,0.82]],
      ],
      tip:"Две уверенные диагонали. Не делай «дрожащих» линий."
    },
    {
      id:"kou",
      hanzi:"口",
      pinyin:"kǒu",
      meaning:"рот/проём",
      strokes:[
        [[0.35,0.28],[0.35,0.74]],
        [[0.35,0.28],[0.70,0.28]],
        [[0.70,0.28],[0.70,0.74]],
        [[0.35,0.74],[0.70,0.74]],
      ],
      tip:"Держи прямые. Сначала вертикаль, потом «рамка»."
    },
    {
      id:"hao",
      hanzi:"好",
      pinyin:"hǎo",
      meaning:"хороший",
      strokes:[
        // very simplified guide
        [[0.34,0.30],[0.34,0.76]],            // 女 left
        [[0.28,0.48],[0.46,0.44]],            // 女 middle
        [[0.30,0.62],[0.48,0.76]],            // 女 diagonal
        [[0.56,0.36],[0.72,0.36]],            // 子 top
        [[0.64,0.36],[0.64,0.76]],            // 子 vertical
        [[0.54,0.56],[0.76,0.56]],            // 子 middle
        [[0.56,0.76],[0.76,0.76]],            // 子 bottom
      ],
      tip:"Это тестовый гайд. Смысл — почувствовать композицию: «женщина + ребёнок»."
    },
    {
      id:"xue",
      hanzi:"学",
      pinyin:"xué",
      meaning:"учиться",
      strokes:[
        [[0.42,0.30],[0.60,0.30]],            // roof top
        [[0.36,0.36],[0.66,0.36]],            // roof line
        [[0.46,0.36],[0.40,0.50]],            // left dot/curve
        [[0.56,0.36],[0.62,0.50]],            // right dot/curve
        [[0.50,0.44],[0.50,0.60]],            // middle stroke
        [[0.38,0.62],[0.62,0.62]],            // 子 top (simplified)
        [[0.50,0.62],[0.50,0.78]],            // vertical
        [[0.40,0.70],[0.60,0.70]],            // middle
        [[0.42,0.78],[0.60,0.78]],            // bottom
      ],
      tip:"В реальности штрихов больше. Здесь мы тренируем ритм и пропорции."
    }
  ];

  let active = chars[0];
  let strokes = []; // user strokes: [{pts:[{x,y}], w}]
  let drawing = false;
  let current = null;
  let brush = 10;

  function resize(){
    const rect = canvas.getBoundingClientRect();
    W = Math.max(420, Math.floor(rect.width));
    H = Math.max(420, Math.floor(rect.height));
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }

  function drawGrid(){
    if(!chkGrid?.checked) return;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;

    const step = 32;
    for(let x=0; x<=W; x+=step){
      ctx.beginPath();
      ctx.moveTo(x,0); ctx.lineTo(x,H);
      ctx.stroke();
    }
    for(let y=0; y<=H; y+=step){
      ctx.beginPath();
      ctx.moveTo(0,y); ctx.lineTo(W,y);
      ctx.stroke();
    }
    // center cross
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H);
    ctx.moveTo(0, H/2); ctx.lineTo(W, H/2);
    ctx.stroke();
    ctx.restore();
  }

  function drawGuide(){
    if(!chkGuide?.checked) return;
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // faint glyph using font (fallback)
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = "#e5e7eb";
    const size = Math.min(W,H) * 0.55;
    ctx.font = `900 ${size}px system-ui, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(active.hanzi, W/2, H/2 + size*0.04);

    // stroke order overlay
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 9;
    active.strokes.forEach((s, idx) => {
      ctx.beginPath();
      s.forEach((pt,j) => {
        const x = pt[0]*W;
        const y = pt[1]*H;
        if(j===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
      });
      ctx.stroke();

      // index dots
      const head = s[0];
      ctx.fillStyle = "#22c55e";
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(head[0]*W, head[1]*H, 9, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#0b1220";
      ctx.font = "700 12px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(idx+1), head[0]*W, head[1]*H+0.5);
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = "#22c55e";
    });

    ctx.restore();
  }

  function drawUserStrokes(){
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#e5e7eb";

    for(const s of strokes){
      ctx.globalAlpha = 0.92;
      ctx.lineWidth = s.w;
      ctx.beginPath();
      s.pts.forEach((p,idx) => {
        if(idx===0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    // current
    if(current){
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = current.w;
      ctx.beginPath();
      current.pts.forEach((p,idx) => {
        if(idx===0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    ctx.restore();
  }

  function clear(){
    strokes = [];
    current = null;
    draw();
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    drawGrid();
    drawGuide();
    drawUserStrokes();
  }

  function canvasPos(e){
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    return {x,y};
  }

  function pointerDown(e){
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    const p = canvasPos(e);
    current = { pts:[p], w: brush };
    draw();
  }

  function pointerMove(e){
    if(!drawing || !current) return;
    const p = canvasPos(e);
    const last = current.pts[current.pts.length-1];
    const dx = p.x-last.x, dy = p.y-last.y;
    if(dx*dx + dy*dy < 2) return; // throttle
    current.pts.push(p);
    draw();
  }

  function pointerUp(e){
    if(!drawing) return;
    drawing = false;
    if(current && current.pts.length > 1){
      strokes.push(current);
    }
    current = null;
    draw();
  }

  function exportPNG(){
    // re-render on clean background for export
    const tmp = document.createElement("canvas");
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const t = tmp.getContext("2d");
    t.setTransform(dpr,0,0,dpr,0,0);

    t.fillStyle = "#0b1220";
    t.fillRect(0,0,W,H);
    // optional: include faint guide glyph
    t.globalAlpha = 0.16;
    t.fillStyle = "#e5e7eb";
    const size = Math.min(W,H) * 0.55;
    t.font = `900 ${size}px system-ui, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
    t.textAlign="center"; t.textBaseline="middle";
    t.fillText(active.hanzi, W/2, H/2 + size*0.04);

    // draw strokes
    t.globalAlpha = 1;
    t.lineCap="round"; t.lineJoin="round";
    t.strokeStyle="#ffffff";

    for(const s of strokes){
      t.lineWidth = s.w;
      t.beginPath();
      s.pts.forEach((p,idx)=>{ idx? t.lineTo(p.x,p.y):t.moveTo(p.x,p.y); });
      t.stroke();
    }

    const url = tmp.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `HanziQuest_${active.hanzi}.png`;
    a.click();
    toast("Экспорт готов", "PNG скачан. Можно вести «дневник иероглифов».", "🖼️");
  }

  function setActive(id){
    active = chars.find(c => c.id === id) || chars[0];
    strokes = [];
    current = null;
    renderList();
    renderMeta();
    draw();
  }

  function renderList(){
    list.innerHTML = chars.map(c => `
      <div class="char-item ${c.id===active.id ? "active":""}" data-id="${c.id}">
        <div class="big">${c.hanzi}</div>
        <div class="meta">${c.pinyin} — ${c.meaning}</div>
      </div>
    `).join("");

    Array.from(list.querySelectorAll(".char-item")).forEach(el => {
      el.addEventListener("click", () => setActive(el.dataset.id));
    });
  }

  function renderMeta(){
    meta.innerHTML = `
      <b style="font-size:18px">${active.hanzi} · ${active.pinyin}</b>
      <div class="p">${active.meaning}</div>
      <div style="height:10px"></div>
      <div class="help">Совет: ${active.tip}</div>
    `;
  }

  rng?.addEventListener("input", () => {
    brush = parseInt(rng.value,10) || 10;
    $$("#brushVal").textContent = String(brush);
  });

  btnClear?.addEventListener("click", () => {
    clear();
    toast("Очищено", "Начни заново — это нормально.", "🧽", 1500);
  });

  btnUndo?.addEventListener("click", () => {
    strokes.pop();
    draw();
    toast("Отменено", "Убрали последний штрих.", "↩️", 1300);
  });

  btnExport?.addEventListener("click", exportPNG);

  btnHelp?.addEventListener("click", () => {
    openModal("Как тренироваться в Canvas", `
      <p><b>1)</b> Включи подсказки и обведи знак 2–3 раза.</p>
      <p><b>2)</b> Отключи подсказки и напиши по памяти.</p>
      <p><b>3)</b> Экспортируй PNG и веди «дневник» — это мотивирует.</p>
      <p class="help">Работает с мышью, тачпадом и стилусом (если браузер поддерживает pointer events).</p>
    `);
  });

  chkGuide?.addEventListener("change", draw);
  chkGrid?.addEventListener("change", draw);

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // init
  brush = parseInt(rng.value,10) || 10;
  $$("#brushVal").textContent = String(brush);
  renderList();
  renderMeta();
  resize();
  window.addEventListener("resize", resize);
})();
