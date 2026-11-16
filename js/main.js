(function () {
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const trackKey = TRACKS[params.get("track")] ? params.get("track") : "all";
  const track = TRACKS[trackKey];
  // 최신순 (start 기준)
  const order = Object.keys(PROJECTS).sort((a, b) => PROJECTS[b].start.localeCompare(PROJECTS[a].start));
  const catNames = (p) => p.cats.map((c) => CATEGORIES[c]).join(" · ");
  const withTrack = (href) => {
    if (trackKey === "all") return href;
    const [path, hash] = href.split("#");
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}track=${trackKey}${hash ? "#" + hash : ""}`;
  };
  const accent = (s) => s.replace(/\[\[(.+?)\]\]/g, "<em>$1</em>");
  const plain = (s) => s.replace(/\[\[(.+?)\]\]/g, "$1");
  const pad = (n) => String(n).padStart(2, "0");

  // keep ?track= on internal links
  document.querySelectorAll("[data-keep-track]").forEach((a) => {
    a.setAttribute("href", withTrack(a.getAttribute("href") === "#" ? "index.html" : a.getAttribute("href")));
  });

  // contact
  const mail = $("#mail");
  if (mail) {
    mail.textContent = PROFILE.email;
    mail.href = "mailto:" + PROFILE.email;
    $("#copy").addEventListener("click", async (e) => {
      try { await navigator.clipboard.writeText(PROFILE.email); e.target.textContent = "복사했습니다 ✓"; }
      catch { e.target.textContent = PROFILE.email; }
      setTimeout(() => (e.target.textContent = "이메일 복사"), 2000);
    });
  }

  // floating top / bottom buttons
  const fab = document.createElement("div");
  fab.className = "fab";
  fab.innerHTML = `<button type="button" data-to="top" aria-label="맨 위로">↑</button><button type="button" data-to="bottom" aria-label="맨 아래로">↓</button>`;
  document.body.appendChild(fab);
  fab.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    window.scrollTo({ top: b.dataset.to === "top" ? 0 : document.documentElement.scrollHeight });
  });

  if ($("#grid")) renderHome();
  if ($("#project")) renderProject();

  /* ---------------- HOME ---------------- */
  function renderHome() {
    $("#tagline").innerHTML = PROFILE.tagline.replace("하나의 경험", "<em>하나의 경험</em>");
    if (track.statement) { $("#statement").innerHTML = track.statement; $("#statement").hidden = false; }
    $("#langs").innerHTML = PROFILE.languages
      .map((l, i) => `<div><p class="n">${pad(i + 1)}</p><p class="k">${l.k}</p><p class="v">${l.v}</p></div>`).join("");
    $("#intro").innerHTML = PROFILE.intro.join("<br>");

    $("#highlights").innerHTML = HIGHLIGHTS
      .map((h) => `<a href="${h.href || withTrack("project.html?id=" + h.id)}"><p class="num">${h.n}</p><p class="lbl">${h.l}</p></a>`).join("");

    const cats = ["all", ...Object.keys(CATEGORIES)];
    $("#filters").innerHTML = cats
      .map((c) => `<button class="chip" data-cat="${c}">${c === "all" ? "전체" : CATEGORIES[c]}</button>`).join("");

    $("#grid").innerHTML = order.map((id) => {
      const p = PROJECTS[id];
      return `<a class="card reveal" data-cats="${p.cats.join(" ")}" href="${withTrack("project.html?id=" + id)}">
        <div class="thumb"><img src="assets/covers/${id}.jpg" alt="${p.title}" loading="lazy"></div>
        <div class="row"><span class="no"></span><h3 class="ttl">${p.title}</h3><span class="yr">${p.year}</span></div>
        <p class="sub">${plain(p.headline)}</p>
        <p class="cat">${catNames(p)} · ${p.label}</p>
      </a>`;
    }).join("");

    const applyFilter = (cat) => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.cat === cat));
      let n = 0;
      document.querySelectorAll(".card").forEach((card) => {
        const show = cat === "all" || card.dataset.cats.split(" ").includes(cat);
        card.classList.toggle("hide", !show);
        if (show) card.querySelector(".no").textContent = pad(++n);
      });
      $("#count").textContent = n;
    };
    applyFilter(track.filter || "all");
    $("#filters").addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      applyFilter(b.dataset.cat);
      document.querySelectorAll(".card:not(.hide)").forEach((c) => c.classList.add("in"));
    });

    $("#career").innerHTML = CAREER.map((c) => `<div class="item">
      <p class="when">${c.period}<br>${c.dur}</p>
      <div><p class="what">${c.co}<small>${c.role}</small></p><ul>${c.items.map((t) => `<li>${t}</li>`).join("")}</ul></div></div>`).join("");
    $("#career").insertAdjacentHTML("beforeend", `<div class="etc"><p class="etc-h">ETC</p>${CAREER_ETC.map(([w, c, d]) =>
      `<div class="etc-row"><span class="when">${w}</span><span><span class="co">${c}</span><span class="d">${d}</span></span></div>`).join("")}</div>`);
    $("#edu").innerHTML = EDUCATION.map(([a, b]) => `<div class="item"><p class="when">${b}</p><p class="what">${a}</p></div>`).join("");
    $("#courses").innerHTML = COURSES.map(([a, b, c]) => `<div class="item"><p class="when">${b}</p><div><p class="what">${a}</p><p>${c}</p></div></div>`).join("");
    $("#skills").innerHTML = SKILLS.map(([a, b]) => `<div class="item"><p class="what">${a}</p><p>${b}</p></div>`).join("");
    $("#lang").innerHTML = LANG.map(([a, b]) => `<div class="item"><p class="what">${a}</p><p>${b}</p></div>`).join("");

    observe();
    if (location.hash) {
      const t = document.querySelector(location.hash);
      if (t) { t.scrollIntoView(); window.addEventListener("load", () => t.scrollIntoView()); }
    }
  }

  /* ---------------- PROJECT ---------------- */
  function renderProject() {
    const id = params.get("id");
    const p = PROJECTS[id];
    if (!p) { location.replace(withTrack("index.html")); return; }
    document.title = `${p.title} — 김재석 포트폴리오`;
    const idx = order.indexOf(id);
    const prev = order[(idx - 1 + order.length) % order.length];
    const next = order[(idx + 1) % order.length];

    const slides = Array.from({ length: p.slides }, (_, i) =>
      `<a href="assets/slides/${id}-${i + 1}.jpg" target="_blank" rel="noopener" title="크게 보기"><img class="reveal" src="assets/slides/${id}-${i + 1}.jpg" alt="${p.title} 상세 ${i + 1}" loading="${i ? "lazy" : "eager"}" width="1920" height="1080"></a>`).join("");

    $("#project").innerHTML = `
      <section class="p-hero"><div class="wrap">
        <a class="back" href="${withTrack("index.html#work")}">← 전체 프로젝트</a>
        <p class="eyebrow">${catNames(p)} — ${p.label}</p>
        <h1 class="p-title">${p.title}</h1>
        <p class="p-headline">${accent(p.headline)}</p>
        <div class="p-body">
          <div>
            <p class="p-desc">${p.desc}</p>
            ${p.links.length ? `<div class="links">${p.links.map(([t, u]) => `<a class="btn" href="${u}" target="_blank" rel="noopener">${t} ↗</a>`).join("")}</div>` : ""}
          </div>
          <div class="meta">
            <div class="full"><h4>ROLE</h4><dl>${p.role.map(([r, v]) => `<dt>${r}</dt><dd>${v}</dd>`).join("")}</dl></div>
            <div><h4>PERIOD</h4><p>${p.period}</p></div>
            <div><h4>PLATFORM</h4><p>${p.platform}</p></div>
            <div class="full"><h4>TOOL</h4><p>${p.tool}</p></div>
          </div>
        </div>
        ${p.metrics.length ? `<div class="metrics">${p.metrics.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join("")}</div>` : ""}
      </div></section>
      <section class="wrap slides">${slides}</section>
      <nav class="wrap pn">
        <a href="${withTrack("project.html?id=" + prev)}"><span class="eyebrow">← 이전</span><p class="t">${PROJECTS[prev].title}</p></a>
        <a href="${withTrack("project.html?id=" + next)}"><span class="eyebrow">다음 →</span><p class="t">${PROJECTS[next].title}</p></a>
      </nav>`;
    window.scrollTo(0, 0);
    observe();
  }

  function observe() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  }
})();
