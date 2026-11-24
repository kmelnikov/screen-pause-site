(() => {
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
