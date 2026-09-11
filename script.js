(() => {
  "use strict";

  const d = window.PORTFOLIO_DATA;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const MODE = (d.mode || "kinetic");

  /* ============================================================
     1. APPLY THEME (CSS custom properties) + MODE (body class)
     ============================================================ */
  const root = document.documentElement.style;
  const t = d.theme || {};
  const setVar = (name, val) => { if (val) root.setProperty(name, val); };
  setVar("--bg", t.bg); setVar("--surface", t.surface);
  setVar("--ink", t.ink); setVar("--ink-soft", t.inkSoft);
  setVar("--accent-1", t.accent1); setVar("--accent-2", t.accent2); setVar("--accent-3", t.accent3);
  setVar("--line", t.line); setVar("--footer-bg", t.footerBg); setVar("--footer-text", t.footerText);
  setVar("--cta-text", t.ctaText);

  document.body.classList.add("mode-" + MODE);

  /* ============================================================
     2. POPULATE CONTENT FROM data.js
     ============================================================ */
  document.title = d.meta.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", d.meta.description);

  document.getElementById("navMark").textContent = d.person.initials;
  document.getElementById("navResume").href = d.person.resumeUrl || "#";
  document.getElementById("heroResumeBtn").href = d.person.resumeUrl || "#";
  document.getElementById("heroRole").textContent = d.person.role;
  document.getElementById("heroTagline").textContent = d.person.tagline;
  document.getElementById("heroLocation").textContent = d.person.location;
  document.getElementById("heroAvailability").textContent = d.person.availability || "";
  document.getElementById("contactEmailBtn").href = "mailto:" + (d.person.email || "");
  document.getElementById("aboutText").textContent = (d.about || "").trim().replace(/\s+/g, " ");

  const heroNameEl = document.getElementById("heroName");
  heroNameEl.setAttribute("aria-label", d.person.name);
  heroNameEl.setAttribute("data-text", d.person.name);
  heroNameEl.innerHTML = "";
  const letterEls = [];
  (d.person.name || "").split("").forEach((ch) => {
    if (ch === " ") {
      const s = document.createElement("span");
      s.className = "space";
      heroNameEl.appendChild(s);
    } else {
      const s = document.createElement("span");
      s.className = "letter";
      s.textContent = ch;
      heroNameEl.appendChild(s);
      letterEls.push(s);
    }
  });

  function buildMarquee(el) {
    el.innerHTML = "";
    (d.skills || []).forEach((skill) => {
      const span = document.createElement("span");
      span.textContent = skill;
      el.appendChild(span);
    });
  }
  buildMarquee(document.getElementById("marqueeTrack"));
  buildMarquee(document.getElementById("marqueeTrack2"));

  const projectGrid = document.getElementById("projectGrid");
  (d.projects || []).forEach((p) => {
    const a = document.createElement("a");
    a.className = "project-card reveal";
    a.href = p.link || "#";
    a.dataset.accent = p.accent || "accent1";
    const tagRow = document.createElement("div");
    tagRow.className = "tag-row";
    (p.tags || []).forEach((tg) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tg;
      tagRow.appendChild(span);
    });
    const h3 = document.createElement("h3");
    h3.textContent = p.title;
    const desc = document.createElement("p");
    desc.textContent = p.description;
    a.appendChild(tagRow); a.appendChild(h3); a.appendChild(desc);
    projectGrid.appendChild(a);
  });

  const timeline = document.getElementById("timeline");
  (d.experience || []).forEach((e) => {
    const item = document.createElement("div");
    item.className = "timeline-item reveal";
    const period = document.createElement("div");
    period.className = "timeline-period"; period.textContent = e.period;
    const role = document.createElement("div");
    role.className = "timeline-role"; role.textContent = e.role;
    const org = document.createElement("div");
    org.className = "timeline-org"; org.textContent = e.org;
    const desc = document.createElement("p");
    desc.className = "timeline-desc"; desc.textContent = e.description;
    item.appendChild(period); item.appendChild(role); item.appendChild(org); item.appendChild(desc);
    timeline.appendChild(item);
  });

  const socials = document.getElementById("socials");
  (d.socials || []).forEach((s) => {
    if (!s.url) return;
    const a = document.createElement("a");
    a.href = s.url; a.textContent = s.label;
    socials.appendChild(a);
  });

  /* ============================================================
     3. SCROLL REVEAL
     ============================================================ */
  if (!reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  if (reduceMotion) return;

  /* ============================================================
     4. GLITCH MODE — periodic RGB-split flicker + hover jitter
        (works fine on touch too, no pointer needed)
     ============================================================ */
  if (MODE === "glitch") {
    const nameEl = heroNameEl;
    function burst() {
      nameEl.classList.add("glitching");
      setTimeout(() => nameEl.classList.remove("glitching"), 140 + Math.random() * 120);
      setTimeout(burst, 2200 + Math.random() * 2600);
    }
    setTimeout(burst, 900);
  }

  if (isTouch) return; // everything below is pointer/cursor driven

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  window.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });

  /* ============================================================
     5. SPRING ENGINE (used by kinetic + minimal modes)
     ============================================================ */
  class Spring {
    constructor(stiffness = 0.12, damping = 0.72) {
      this.value = 0; this.target = 0; this.velocity = 0;
      this.stiffness = stiffness; this.damping = damping;
    }
    update() {
      const force = (this.target - this.value) * this.stiffness;
      this.velocity = (this.velocity + force) * this.damping;
      this.value += this.velocity;
      return this.value;
    }
  }

  if (MODE === "kinetic" || MODE === "minimal") {
    const amp = MODE === "kinetic" ? 1 : 0.35; // minimal = subtler motion

    const blob = document.getElementById("cursorBlob");
    const blobX = new Spring(0.16, 0.78);
    const blobY = new Spring(0.16, 0.78);
    blobX.value = blobX.target = mouseX;
    blobY.value = blobY.target = mouseY;
    let blobShown = false;
    window.addEventListener("mousemove", () => {
      if (!blobShown) { blob.classList.add("active"); blobShown = true; }
    });
    document.querySelectorAll("a, button, [data-magnetic]").forEach((el) => {
      el.addEventListener("mouseenter", () => blob.classList.add("grow"));
      el.addEventListener("mouseleave", () => blob.classList.remove("grow"));
    });

    // Hero letters repel from cursor (disabled in minimal mode — amp 0 => no motion)
    const letterSprings = letterEls.map((el) => ({ x: new Spring(0.18, 0.72), y: new Spring(0.18, 0.72), el }));
    const REPEL_RADIUS = 90;
    const REPEL_STRENGTH = 26 * (MODE === "kinetic" ? 1 : 0); // off for minimal

    function updateHeroLetters() {
      letterSprings.forEach(({ x, y, el }) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        const dx = cx - mouseX, dy = cy - mouseY;
        const dist = Math.hypot(dx, dy);
        if (dist < REPEL_RADIUS && REPEL_STRENGTH > 0) {
          const pull = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          const angle = Math.atan2(dy, dx);
          x.target = Math.cos(angle) * pull; y.target = Math.sin(angle) * pull;
        } else { x.target = 0; y.target = 0; }
        const vx = x.update(), vy = y.update();
        if (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) el.style.transform = `translate(${vx.toFixed(2)}px, ${vy.toFixed(2)}px)`;
      });
    }

    if (MODE === "kinetic") {
      const magneticEls = Array.from(document.querySelectorAll("[data-magnetic]"));
      const MAGNETIC_STRENGTH = 0.35;
      magneticEls.forEach((el) => {
        el.style.willChange = "transform";
        el.addEventListener("mousemove", (e) => {
          const rect = el.getBoundingClientRect();
          const relX = e.clientX - (rect.left + rect.width / 2);
          const relY = e.clientY - (rect.top + rect.height / 2);
          el.style.transform = `translate(${relX * MAGNETIC_STRENGTH}px, ${relY * MAGNETIC_STRENGTH}px)`;
        });
        el.addEventListener("mouseleave", () => {
          el.style.transition = "transform .5s cubic-bezier(.34,1.76,.64,1)";
          el.style.transform = "translate(0,0)";
          setTimeout(() => { el.style.transition = ""; }, 500);
        });
        el.addEventListener("mouseenter", () => { el.style.transition = ""; });
      });

      document.querySelectorAll(".project-card").forEach((card) => {
        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = `translate(${px * 8}px, ${py * 8}px) rotate(${px * 2}deg)`;
        });
        card.addEventListener("mouseleave", () => {
          card.style.transition = "transform .45s cubic-bezier(.34,1.76,.64,1)";
          card.style.transform = "translate(0,0) rotate(0deg)";
          setTimeout(() => { card.style.transition = ""; }, 450);
        });
        card.addEventListener("mouseenter", () => { card.style.transition = ""; });
      });
    }

    function loop() {
      const bx = blobX.update(), by = blobY.update();
      blobX.target = mouseX; blobY.target = mouseY;
      blob.style.transform = `translate(${bx}px, ${by}px)`;
      updateHeroLetters();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ============================================================
     6. CINEMATIC MODE — smooth scroll-linked hero parallax
     ============================================================ */
  if (MODE === "cinematic") {
    const hero = document.querySelector(".hero");
    const nav = document.querySelector(".nav");
    function onScroll() {
      const y = window.scrollY;
      const fade = Math.max(0, 1 - y / 520);
      hero.style.transform = `translateY(${y * 0.25}px)`;
      hero.style.opacity = fade.toFixed(3);
      nav.style.boxShadow = y > 12 ? "0 8px 24px rgba(0,0,0,0.08)" : "none";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
