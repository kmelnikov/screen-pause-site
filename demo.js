(() => {
  function sanitizeTag(value) {
    if (!value) return "";
    return value.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
  }

  function applyCookielessAttribution() {
    const params = new URLSearchParams(window.location.search);
    const source = sanitizeTag(params.get("utm_source") || params.get("ref"));
    const medium = sanitizeTag(params.get("utm_medium"));
    const campaign = sanitizeTag(params.get("utm_campaign"));
    if (!source && !medium && !campaign) return;

    document.querySelectorAll("a[data-gumroad-slot]").forEach((link) => {
      const url = new URL(link.href);
      if (source) url.searchParams.set("utm_source", source);
      if (medium) url.searchParams.set("utm_medium", medium);
      if (campaign) url.searchParams.set("utm_campaign", campaign);
      const slot = sanitizeTag(link.getAttribute("data-gumroad-slot"));
      if (slot) url.searchParams.set("utm_content", slot);
      link.href = url.toString();
    });
  }

  applyCookielessAttribution();

  const triggers = document.querySelectorAll("[data-open-demo], #open-demo");
  const dialog = document.getElementById("pause-demo");
  const closeBtn = document.getElementById("demo-close");
  const timerEl = document.getElementById("demo-timer");
  const progressBar = document.getElementById("demo-progress-bar");
  if (!triggers.length || !dialog || !closeBtn || !timerEl) return;

  const DURATION_MS = 10000;
  let timerId = null;
  let lastTrigger = null;

  function stopDemo() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    document.body.classList.remove("pause-is-open");
    if (dialog.open) dialog.close();
    if (lastTrigger && typeof lastTrigger.focus === "function") {
      lastTrigger.focus();
      lastTrigger = null;
    }
  }

  function updateCountdown(remainingMs) {
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
    const unit = remainingSec === 1 ? "second" : "seconds";
    timerEl.textContent = `${remainingSec} ${unit}`;
    timerEl.setAttribute("aria-label", `${remainingSec} ${unit} remaining`);
    if (progressBar) {
      const pct = Math.max(0, Math.min(100, (remainingMs / DURATION_MS) * 100));
      progressBar.style.width = `${pct}%`;
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (dialog.open) return;
      lastTrigger = trigger;
      const startedAt = Date.now();
      updateCountdown(DURATION_MS);
      dialog.showModal();
      document.body.classList.add("pause-is-open");
      timerId = window.setInterval(() => {
        const remainingMs = Math.max(0, DURATION_MS - (Date.now() - startedAt));
        updateCountdown(remainingMs);
        if (remainingMs === 0) stopDemo();
      }, 100);
    });
  });

  closeBtn.addEventListener("click", stopDemo);
  dialog.addEventListener("close", stopDemo);
  dialog.addEventListener("cancel", stopDemo);
})();
