/* =====================================================================
   VIEW — everything that draws to the screen. No app logic lives here;
   the Controller tells the View what to show.
   ===================================================================== */

const View = {

  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,

  els: {
    screens:    {},   // filled in init()
    menuItems:  [],
    wipe:       document.getElementById("wipe"),
    featGrid:   document.getElementById("feat-grid"),
    repoGrid:   document.getElementById("repo-grid"),
    repoStatus: document.getElementById("repo-status"),
    skillsBody: document.getElementById("skills-body"),
    sfx:        document.getElementById("sfx-select"),
    cursor:     document.getElementById("cursor"),
    clock:      document.getElementById("clock"),
  },

  init() {
    document.querySelectorAll(".screen").forEach(s => {
      this.els.screens[s.id.replace("screen-", "")] = s;
    });
    this.els.menuItems = [...document.querySelectorAll(".menu-item")];
    document.querySelectorAll("[data-ransom]").forEach(el => this.ransomize(el));
    this.els.sfx.volume = 0.45;
    this.startClock();
    this.startParallax();
    this.startCursor();

    // Ensure all background videos are muted, loopable, and auto-recover
    const screens = ["home", "projects", "skills", "about", "contact"];
    screens.forEach(s => {
      const vid = document.getElementById(`art-${s}`);
      if (vid) {
        vid.muted = true;
        vid.defaultMuted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.addEventListener("ended", () => {
          vid.currentTime = 0;
          if ((document.body.dataset.screen || "home") === s) {
            vid.play().catch(() => {});
          }
        });
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        const active = document.body.dataset.screen || "home";
        this.updateBackgroundVideos(active);
      }
    });

    // Start with the home video at 0.5x speed, pausing other videos for max smoothness
    this.updateBackgroundVideos("home");

    document.body.classList.add("loaded");
  },

  // Deterministic pseudo-random hash (so letters look the same every visit)
  hash(str) {
    let h = 9;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 387420489);
    return (h ^ h >>> 9) >>> 0;
  },

  /* ---------- Ransom-note lettering ---------- */
  ransomize(el) {
    const text = el.dataset.ransom || el.textContent;
    el.textContent = "";
    [...text].forEach((c, i) => {
      const span = document.createElement("span");
      span.className = "ch display";
      span.textContent = c;
      const h = this.hash(text + i);
      const rot = (h % 17) - 8;                 // -8..8 degrees
      const scale = 0.86 + ((h >> 3) % 30) / 100; // 0.86..1.15
      const dy = ((h >> 5) % 9) - 4;            // -4..4 px
      const t = `rotate(${rot}deg) scale(${scale}) translateY(${dy}px)`;
      span.style.setProperty("--t", t);
      span.style.transform = t;
    const variant = (h >> 7) % 10;

// Force specific letters to have black boxes
if (
  (text === "NUMAL" && c === "M") ||
  (text === "DAS" && c === "S") ||
  (text === "ABHIGYAN" && (c === "I" || c === "Y")) ||
  (text === "DUBEY" && (c === "B" || c === "Y"))
) {
  span.classList.add("box");
}
else if (variant === 0) {
  span.classList.add("box");
}
else if (variant === 1) {
  span.classList.add("boxw");
}
else if (variant === 2) {
  span.classList.add("red");
}

el.appendChild(span);
    });
  },

  /* ---------- Screens & menu ---------- */
  showScreen(name) {
    const s = this.els.screens;
    Object.values(s).forEach(sc => sc.classList.remove("active"));
    s[name].classList.add("active");
    s[name].scrollTop = 0;
    document.body.dataset.screen = name;

    // Switch video playback to active screen only (buttery smooth performance)
    this.updateBackgroundVideos(name);
  },

  updateBackgroundVideos(name) {
    const screens = ["home", "projects", "skills", "about", "contact"];
    screens.forEach(s => {
      const vid = document.getElementById(`art-${s}`);
      if (!vid) return;
      if (s === name) {
        if (s === "home") vid.playbackRate = 0.5;
        else vid.playbackRate = 1.0;

        if (vid.ended || (vid.duration && vid.currentTime >= vid.duration - 0.2)) {
          vid.currentTime = 0;
        }

        const p = vid.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        vid.pause();
      }
    });
  },

  setMenuSelection(index) {
    this.els.menuItems.forEach((m, j) => m.classList.toggle("sel", j === index));
  },

  // Diagonal wipe; calls swap() mid-way while the screen is covered
  wipe(swap, done) {
    if (this.reducedMotion) { swap(); done(); return; }
    const w = this.els.wipe;
    w.classList.remove("go"); void w.offsetWidth;  // restart animation
    w.classList.add("go");
    setTimeout(swap, 340);
    setTimeout(done, 720);
  },

  /* ---------- Sound ---------- */
  playSelect() {
    try {
      this.els.sfx.currentTime = 0;
      const p = this.els.sfx.play();
      if (p && p.catch) p.catch(() => {});  // blocked before first user gesture — fine
    } catch {}
  },

  /* ---------- Project cards ---------- */
  cardThumb(src) {
    return `<div class="thumb"><img src="${src}" alt="" loading="lazy"
      onerror="this.closest('.thumb').remove()"></div>`;
  },

  // Split "Medical Image…" so the first word renders red
  splitTitle(title) {
    const first = title.split(" ")[0];
    return `<em>${first}</em>${title.slice(first.length)}`;
  },

  renderFeatured(list) {
    if (this.els.featGrid.childElementCount) return;
    list.forEach((f, i) => {
      const a = document.createElement("a");
      a.className = "card feat";
      a.href = f.url; a.target = "_blank"; a.rel = "noopener";
      a.style.setProperty("--tilt", ((this.hash(f.title) % 5) - 2) * 0.8 + "deg");
      a.style.setProperty("--d", i * 70 + "ms");
      a.innerHTML = `
        ${this.cardThumb(f.img)}
        <span class="lang" style="--lc:${f.color}">${f.tag}</span>
        <h3>${f.live ? '<span class="live-dot"></span>' : ""}${this.splitTitle(f.title)}</h3>
        <p>${f.desc}</p>
        <div class="meta"><span>${f.live ? "LIVE NOW" : "HIGHLIGHT"}</span><span class="go">${f.cta}</span></div>`;
      this.els.featGrid.appendChild(a);
    });
  },

  renderRepos(repos, statusText, model) {
    this.els.repoStatus.textContent = statusText;
    this.els.repoGrid.innerHTML = "";
    repos.forEach((r, i) => {
      const a = document.createElement("a");
      a.className = "card";
      a.href = r.html_url; a.target = "_blank"; a.rel = "noopener";
      a.style.setProperty("--tilt", ((this.hash(r.name) % 5) - 2) * 0.8 + "deg");
      a.style.setProperty("--d", i * 70 + "ms");
      a.style.setProperty("--lc", model.langColors[r.language] || "#e60012");
      const pretty = r.name.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const img = model.projectImages[r.name] || `assets/projects/${r.name}.png`;
      a.innerHTML = `
        ${this.cardThumb(img)}
        <span class="lang">${r.language || "Repo"}</span>
        <h3>${this.splitTitle(pretty)}</h3>
        <p>${r.description || "No description yet, but the code speaks for itself."}</p>
        <div class="meta">
          <span>★ ${r.stargazers_count || 0}</span>
          <span class="go">View on GitHub →</span>
        </div>`;
      this.els.repoGrid.appendChild(a);
    });
  },

  /* ---------- Skills ---------- */
  renderSkills(groups) {
    groups.forEach(g => {
      const div = document.createElement("div");
      div.className = "skill-group";
      div.innerHTML = `<h3>${g.group}</h3>`;
      g.items.forEach(([name, value]) => {
        const row = document.createElement("div");
        row.className = "skill-row";
        row.innerHTML = `
          <span class="name">${name}</span>
          <div class="skill-bar"><div class="fill" data-v="${value}"></div></div>
          <span class="lv">${value}</span>`;
        div.appendChild(row);
      });
      this.els.skillsBody.appendChild(div);
    });
  },

  animateSkillBars() {
    const fills = this.els.skillsBody.querySelectorAll(".fill");
    fills.forEach(f => { f.style.width = "0"; });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fills.forEach((f, i) => setTimeout(() => { f.style.width = f.dataset.v + "%"; }, i * 60));
    }));
  },

  /* ---------- Ambient: clock, parallax, animated cursor ---------- */
  startClock() {
    setInterval(() => {
      this.els.clock.textContent =
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " · IND";
    }, 1000);
  },

  startParallax() {
    if (this.reducedMotion) return;
    const stripes = document.getElementById("bg-stripes");
    const halftone = document.getElementById("bg-halftone");
    const arts = [...document.querySelectorAll(".menu-art")];
    const stage = document.getElementById("stage");
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("mousemove", e => {
      tx = e.clientX / innerWidth - 0.5;
      ty = e.clientY / innerHeight - 0.5;
    }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      if (stripes) stripes.style.transform = `translate(${cx * 38}px, ${cy * 24}px)`;
      if (halftone) halftone.style.transform = `translate(${cx * -52}px, ${cy * -34}px)`;
      
      const activeScreen = document.body.dataset.screen || "home";
      const activeArt = document.getElementById(`art-${activeScreen}`);
      if (activeArt) {
        if (activeScreen === "skills") {
          activeArt.style.transform = `translate(${cx * 22}px, ${cy * 14}px) scale(-1.08, 1.08)`;
        } else {
          activeArt.style.transform = `translate(${cx * 22}px, ${cy * 14}px) scale(1.08)`;
        }
      }

      if (stage) {
        stage.style.transform = `perspective(1000px) rotateY(${cx * 3.5}deg) rotateX(${-cy * 2.5}deg) translate(${cx * 10}px, ${cy * 8}px)`;
      }
      requestAnimationFrame(loop);
    };
    loop();
  },

  // 30-frame sprite-strip cursor extracted from the original .ani files
  startCursor() {
    if (!matchMedia("(pointer:fine)").matches || this.reducedMotion) return;
    const cur = this.els.cursor;
    document.body.classList.add("cursor-on");
    let x = -100, y = -100, frame = 0, last = 0, visible = false;
    let curOffsetY = 0, targetOffsetY = 0, downKick = 0;
    let wasNearContact = false;

    addEventListener("mousemove", e => {
      x = e.clientX; y = e.clientY;
      if (!visible) { cur.style.display = "block"; visible = true; }
      const t = e.target;
      const overLink = t.closest &&
        t.closest("a,button,.card,.menu-item,.back-hint,.contact-chip,#big-name,.button,#seek-bar-container,#album-art");
      cur.classList.toggle("link", !!overLink);
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      cur.style.display = "none"; visible = false;
      targetOffsetY = 0;
      downKick = 0;
      wasNearContact = false;
    });

    const tick = ts => {
      if (ts - last >= 50) {                       // 50ms = original .ani frame rate
        frame = (frame + 1) % 30; last = ts;
        cur.style.backgroundPosition = -frame * 48 + "px 0";
      }

      // Proximity detection for Contact button / chips
      let isNearContact = false;
      const contactBtn = document.querySelector('[data-target="contact"]');
      if (contactBtn && contactBtn.offsetParent !== null) {
        const r = contactBtn.getBoundingClientRect();
        // When pointer is near or hovering the Contact button
        const inX = x >= r.left - 45 && x <= r.right + 45;
        const inY = y >= r.top - 45 && y <= r.bottom + 45;
        if (inX && inY) isNearContact = true;
      }

      const contactChips = document.querySelector('.contact-list');
      if (contactChips && contactChips.offsetParent !== null) {
        const cr = contactChips.getBoundingClientRect();
        if (x >= cr.left - 30 && x <= cr.right + 30 && y >= cr.top - 30 && y <= cr.bottom + 30) {
          isNearContact = true;
        }
      }

      if (isNearContact) {
        if (!wasNearContact) {
          // Sudden downward impulse/kick when entering contact zone
          downKick = 70;
        }
        targetOffsetY = 55;
      } else {
        targetOffsetY = 0;
      }
      wasNearContact = isNearContact;

      // Snappy physics: lerp towards target + decay kick
      curOffsetY += (targetOffsetY + downKick - curOffsetY) * 0.18;
      downKick *= 0.86;
      if (Math.abs(downKick) < 0.3) downKick = 0;

      // Compensate for CSS zoom so the cursor tracks full 100% screen bounds
      const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      cur.style.transform = `translate(${x / z}px, ${(y + curOffsetY) / z}px)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
};
