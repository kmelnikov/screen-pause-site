(() => {
  const trigger = document.getElementById("open-demo");
  const dialog = document.getElementById("pause-demo");
  const closeBtn = document.getElementById("demo-close");
  const timerEl = document.getElementById("demo-timer");
  if (!trigger || !dialog || !closeBtn || !timerEl) return;

  let timerId = null;

  function stopDemo() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    document.body.classList.remove("pause-is-open");
    if (dialog.open) dialog.close();
  }

  function updateCountdown(remaining) {
    timerEl.textContent = `${remaining} seconds`;
    timerEl.setAttribute("aria-label", `${remaining} seconds remaining`);
  }

  trigger.addEventListener("click", () => {
    const startedAt = Date.now();
    updateCountdown(10);
    dialog.showModal();
    document.body.classList.add("pause-is-open");
    timerId = window.setInterval(() => {
      const remaining = Math.max(0, 10 - Math.floor((Date.now() - startedAt) / 1000));
      updateCountdown(remaining);
      if (remaining === 0) stopDemo();
    }, 200);
  });

  closeBtn.addEventListener("click", stopDemo);
  dialog.addEventListener("close", stopDemo);
  dialog.addEventListener("cancel", stopDemo);
})();
