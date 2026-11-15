// التشغيل: أول رسم، المؤقتات، والتفاعل مع حالة الشبكة.

function tick() {
  const count = document.getElementById("count");
  const savedNow = current();
  if (count && savedNow) {
    const info = nextInfo(savedNow.schedule, new Date());
    if (info) count.textContent = softLeft((info.live ? info.end : info.start) - new Date());
  }
  const bar = document.getElementById("prog");
  if (bar) {
    const startMin = Number(bar.dataset.s);
    const endMin = Number(bar.dataset.e);
    bar.style.width = `${Math.min(100, Math.max(0, ((cairoMinutes(new Date()) - startMin) / (endMin - startMin)) * 100))}%`;
  }
  if (ui.view === "day" && !ui.pickedDay) {
    const sig = daySig();
    if (sig !== lastSig && !document.activeElement?.closest("input, textarea")) render(true);
  }
  checkAlerts();
}

async function boot() {
  // هيكل التحميل ظاهر من الـ HTML. الزائر الجديد بيشوف الصفحة الرئيسية فورًا،
  // واللي حافظ فصله بيستنى البيانات شوية وبعدها نرسم باللي معانا ونحدّث في الخلفية.
  let painted = false;
  const paint = () => {
    const busy = painted && document.activeElement?.closest("input, textarea, select");
    if (busy) return;
    readRoute();
    render(painted);
    painted = true;
  };
  let hasKey = false;
  try { hasKey = !!localStorage.getItem("jadwali-my-class"); } catch { /* التخزين مقفول */ }
  const classLink = /^#\/?c\//.test(location.hash);
  let early = 0;
  if (!hasKey && !classLink) paint();
  else if (readSaved() || classLink) early = setTimeout(paint, 2500);
  await loadPublicSettings();
  clearTimeout(early);
  paint();
  trackVisit();
  trackClassVisit();
  void upgradePush();
  setInterval(() => {
    if (document.visibilityState === "visible") refreshQuiet(false);
  }, 20000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      ensureRealtime();
      refreshQuiet(false);
    } else {
      disconnectRealtime();
    }
  });
  ensureRealtime();
  setInterval(tick, 1000);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(() => flushPendingCalendar()).catch(() => {});
  }
}
window.addEventListener("hashchange", () => {
  if (routing) return;
  readRoute();
  closeDrawer();
  render();
});
window.addEventListener("online", async () => {
  await loadPublicSettings();
  render(true);
  UI.toast("الاتصال رجع، والجدول اتحدّث", "success", { id: "net" });
});
window.addEventListener("offline", () => {
  drawSyncNote();
  UI.toast("مفيش اتصال. بتشوف آخر نسخة محفوظة.", "warn", { id: "net" });
});
window.addEventListener("appinstalled", () => {
  trackEvent("install");
  UI.toast("جدولي اتثبّت على جهازك", "success");
});
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installEvent = event;
  if (ui.view === "day" || ui.view === "alerts") render(true);
});
boot();
