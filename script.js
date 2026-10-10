(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const workspace = $(".workspace");
  const windowElement = $("#app-window");
  const windowBody = $("#window-body");
  const emptyDesktop = $("#desktop-empty");
  const tabs = $$(".workspace-tab");
  const sections = ["about", "projects", "toolkit", "contact"];
  const filenames = {
    about: "about.md",
    projects: "projects",
    toolkit: "toolkit.json",
    contact: "hello",
  };
  const lifeBuilding = $("#life-building");
  const buildingNames = [
    ["Beijing 21CIS", "Beijing 21CIS"],
    ["University of Birmingham", "University of Birmingham"],
    ["Photography enthusiast", "摄影爱好者"],
    ["Drawing enthusiast", "绘画爱好者"],
  ];
  let buildingStep = 0;
  let activeTab = "about";
  let language = "en";
  let toastTimer;
  let expanded = false;
  let expandedHeight = "";
  const mobile = window.matchMedia("(max-width: 760px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const labels = {
    close: ["Close workspace window", "关闭工作空间窗口"],
    minimize: ["Minimize workspace window", "最小化工作空间窗口"],
    restore: ["Restore workspace window", "还原工作空间窗口"],
    expand: ["Expand workspace window", "放大工作空间窗口"],
    copy: ["Copy email address", "复制邮箱地址"],
    copied: ["Email address copied", "邮箱地址已复制"],
    copyFailed: [
      "Please select and copy the email address.",
      "请选中邮箱地址进行复制。",
    ],
    home: ["Haoyu Hong home", "Haoyu Hong 首页"],
    top: ["Back to top", "返回顶部"],
    navigation: ["Main navigation", "主导航"],
    workspace: ["Interactive personal workspace", "可交互的个人工作空间"],
    tabs: ["Workspace sections", "工作空间栏目"],
    dock: ["Workspace shortcuts", "工作空间快捷入口"],
    dockAbout: ["Open About me", "打开关于我"],
    dockProjects: ["Open Projects", "打开项目"],
    dockToolkit: ["Open My toolkit", "打开技能工具箱"],
    dockContact: ["Open Contact", "打开联系我"],
    rotateLeft: ["Rotate building left", "向左旋转建筑"],
    rotateRight: ["Rotate building right", "向右旋转建筑"],
    building: ["Rotate the building", "旋转建筑"],
    cursorColor: ["Cursor preview color", "光标预览颜色"],
    ice: ["Ice blue", "冰蓝色"],
    rose: ["Rose pink", "浅粉色"],
    sage: ["Sage green", "鼠尾草绿"],
  };
  const t = (key) => labels[key][language === "zh" ? 1 : 0];

  function setLabel(element, key) {
    element.setAttribute("aria-label", t(key));
    if (element.hasAttribute("title")) element.title = t(key);
  }

  function updateControlLabels() {
    setLabel($("#window-close"), "close");
    setLabel($("#window-minimize"), windowBody.hidden ? "restore" : "minimize");
    setLabel($("#window-expand"), expanded ? "restore" : "expand");
    $$(".copy-email").forEach((button) => setLabel(button, "copy"));
  }

  function updateClock() {
    const now = new Date();
    const clock = $("#workspace-clock");
    clock.dateTime = now.toISOString();
    clock.textContent = new Intl.DateTimeFormat(
      language === "zh" ? "zh-CN" : "en-GB",
      {
        timeZone: "Europe/London",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
    ).format(now);
  }

  function setLanguage(next, persist = true) {
    language = next === "zh" ? "zh" : "en";
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    $$("[data-en][data-zh]").forEach((element) => {
      element.textContent = element.dataset[language];
    });
    $$("[data-lang]").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.lang === language),
      ),
    );
    document.title =
      language === "zh"
        ? "Haoyu Hong — 以好奇心，写下代码"
        : "Haoyu Hong — Curiosity into code";
    $('meta[name="description"]').content =
      language === "zh"
        ? "Haoyu Hong，伯明翰大学计算机科学学生。探索软件开发、自动化与简洁自然的网页体验。"
        : "Haoyu Hong — Computer Science student at the University of Birmingham. Exploring software, automation, and thoughtful web experiences.";
    const targets = {
      ".site-header .brand": "home",
      ".main-nav": "navigation",
      ".back-top": "top",
      ".workspace": "workspace",
      ".workspace-tabs": "tabs",
      ".dock": "dock",
      '[data-dock="about"]': "dockAbout",
      '[data-dock="projects"]': "dockProjects",
      '[data-dock="toolkit"]': "dockToolkit",
      '[data-dock="contact"]': "dockContact",
      '[data-rotate="-1"]': "rotateLeft",
      '[data-rotate="1"]': "rotateRight",
      ".building-controls": "building",
      ".cursor-swatches": "cursorColor",
      '[data-cursor-swatch="ice"]': "ice",
      '[data-cursor-swatch="rose"]': "rose",
      '[data-cursor-swatch="sage"]': "sage",
    };
    Object.entries(targets).forEach(([selector, key]) =>
      setLabel($(selector), key),
    );
    updateControlLabels();
    updateClock();
    renderBuilding();
    if (persist) {
      try {
        localStorage.setItem("haoyu-language", language);
      } catch {
        /* Private browsing can disable storage. */
      }
    }
  }

  function showToast(message) {
    const toast = $("#toast");
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function restoreWindow() {
    windowElement.hidden = false;
    windowBody.hidden = false;
    emptyDesktop.hidden = true;
    workspace.classList.remove("is-minimized");
    $("#window-minimize").setAttribute("aria-expanded", "true");
    updateControlLabels();
  }

  function selectTab(name, focus = false) {
    if (!sections.includes(name)) return;
    activeTab = name;
    restoreWindow();
    tabs.forEach((tab) => {
      const selected = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $("#" + tab.getAttribute("aria-controls")).hidden = !selected;
      if (selected && focus) tab.focus({ preventScroll: true });
    });
    $$("[data-dock]").forEach((button) => {
      button.dataset.active = String(button.dataset.dock === name);
    });
    $("#window-filename").textContent = filenames[name];
    $("#workspace-item-count").textContent =
      `0${sections.indexOf(name) + 1} / 04`;
  }

  function setExpanded(next) {
    if (next === expanded) return;
    const wrapper = $("#workspace");
    if (next) {
      expandedHeight = wrapper.style.minHeight;
      wrapper.style.minHeight = `${wrapper.offsetHeight}px`;
      restoreWindow();
    }
    expanded = next;
    workspace.classList.toggle("is-expanded", expanded);
    document.body.classList.toggle("expanded-workspace", expanded);
    // Keep keyboard focus inside the expanded desktop without obscuring other content from assistive tech.
    $$(
      ".site-header, .hero-copy, .workspace-caption, .about-section, .work-section, .contact-section, .site-footer",
    ).forEach((element) => {
      element.inert = expanded;
    });
    $("#window-expand").setAttribute("aria-pressed", String(expanded));
    if (!expanded) wrapper.style.minHeight = expandedHeight;
    updateControlLabels();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => selectTab(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      const index = sections.indexOf(activeTab);
      const previous = mobile.matches ? "ArrowLeft" : "ArrowUp";
      const next = mobile.matches ? "ArrowRight" : "ArrowDown";
      let target;
      if (event.key === next) target = (index + 1) % sections.length;
      else if (event.key === previous)
        target = (index - 1 + sections.length) % sections.length;
      else if (event.key === "Home") target = 0;
      else if (event.key === "End") target = sections.length - 1;
      if (target !== undefined) {
        event.preventDefault();
        selectTab(sections[target], true);
      }
    });
  });
  $$("[data-dock]").forEach((button) =>
    button.addEventListener("click", () =>
      selectTab(button.dataset.dock, true),
    ),
  );
  $$("[data-open-workspace]").forEach((link) =>
    link.addEventListener("click", () =>
      selectTab(link.dataset.openWorkspace, true),
    ),
  );
  $("[data-restore]").addEventListener("click", () =>
    selectTab(activeTab, true),
  );
  $("#window-close").addEventListener("click", () => {
    setExpanded(false);
    windowElement.hidden = true;
    emptyDesktop.hidden = false;
    $$("[data-dock]").forEach((button) => {
      button.dataset.active = "false";
    });
    $("[data-restore]").focus({ preventScroll: true });
  });
  $("#window-minimize").addEventListener("click", () => {
    if (windowBody.hidden) restoreWindow();
    else {
      setExpanded(false);
      windowBody.hidden = true;
      workspace.classList.add("is-minimized");
      $("#window-minimize").setAttribute("aria-expanded", "false");
      updateControlLabels();
    }
  });
  $("#window-expand").addEventListener("click", () => setExpanded(!expanded));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && expanded) {
      setExpanded(false);
      $("#window-expand").focus({ preventScroll: true });
    }
    if (event.key === "Tab" && expanded) {
      const focusable = [
        ...workspace.querySelectorAll('button, a[href], [tabindex="0"]'),
      ].filter(
        (element) => element.tabIndex >= 0 && element.getClientRects().length,
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  const updateOrientation = () =>
    $(".workspace-tabs").setAttribute(
      "aria-orientation",
      mobile.matches ? "horizontal" : "vertical",
    );
  mobile.addEventListener("change", updateOrientation);
  updateOrientation();
  $$("[data-lang]").forEach((button) =>
    button.addEventListener("click", () => setLanguage(button.dataset.lang)),
  );
  $$(".copy-email").forEach((button) =>
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText("hehehong2006@gmail.com");
        showToast(t("copied"));
      } catch {
        showToast(t("copyFailed"));
        const email = button.previousElementSibling;
        const range = document.createRange();
        range.selectNodeContents(email);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }),
  );

  function renderBuilding() {
    const face = ((buildingStep % 4) + 4) % 4;
    lifeBuilding.style.setProperty(
      "--building-turn",
      -25 - buildingStep * 90 + "deg",
    );
    lifeBuilding.dataset.activeFace = String(face);
    $$("[data-face]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.face) === face),
      );
    });
    $("#building-status").textContent =
      "0" +
      (face + 1) +
      " / 04 — " +
      buildingNames[face][language === "zh" ? 1 : 0];
  }

  $$("[data-rotate]").forEach((button) =>
    button.addEventListener("click", () => {
      buildingStep += Number(button.dataset.rotate);
      renderBuilding();
    }),
  );
  $$("[data-face]").forEach((button) =>
    button.addEventListener("click", () => {
      const current = ((buildingStep % 4) + 4) % 4;
      const target = Number(button.dataset.face);
      buildingStep += ((target - current + 6) % 4) - 2;
      renderBuilding();
    }),
  );
  $(".building-controls").addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      buildingStep += event.key === "ArrowLeft" ? -1 : 1;
      renderBuilding();
    }
  });
  $$("[data-cursor-swatch]").forEach((button) =>
    button.addEventListener("click", () => {
      const color = button.dataset.cursorSwatch;
      $(".atelier-canvas").dataset.cursorColor = color;
      $$("[data-cursor-swatch]").forEach((swatch) =>
        swatch.setAttribute("aria-pressed", String(swatch === button)),
      );
    }),
  );

  let savedLanguage;
  try {
    savedLanguage = localStorage.getItem("haoyu-language");
  } catch {
    /* Use English when storage is unavailable. */
  }
  setLanguage(savedLanguage || "en", false);
  selectTab("about");
  $("#copyright-year").textContent = new Date().getFullYear();
  setInterval(updateClock, 60000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateClock();
  });

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("is-pending");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06 },
    );
    document.documentElement.classList.add("motion-ready");
    $$(".reveal").forEach((element) => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add("is-pending");
        observer.observe(element);
      }
    });
    reducedMotion.addEventListener("change", (event) => {
      if (event.matches) {
        observer.disconnect();
        $$(".is-pending").forEach((element) =>
          element.classList.remove("is-pending"),
        );
      }
    });
  }
})();
