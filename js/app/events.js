// ربط الواجهة: كل الضغطات والإدخال في مكان واحد (event delegation).

const CLICK_TARGETS = [
  "[data-go]", "[data-year]", "[data-section]", "[data-class]", "[data-day]", "[data-mode]", "[data-lead]", "[data-fday]", "[data-legend]", "[data-demo-day]",
  "[data-open-section]", "[data-open-class]",
  "#save-class", "#menu-open", "#menu-close", "#menu-x", "#rail-toggle", "#hide-install", "#install-now", "#download", "#print-table", "#export-csv", "#export-ics",
  "#alert-on", "#alert-off", "#ask-alert", "#ask-later", "#share-today", "#share-week", "#share-class", "#copy-class", "#add-calendar", "#join-group",
  "#report", "#change-class", "#clear-class", "#clear-filter", "#seen-update",
].join(",");

function refreshTable() {
  const saved = current();
  const out = document.getElementById("table-out");
  if (!saved || !out) return;
  out.className = `mode-${ui.mode}`;
  out.innerHTML = tableBody(saved);
}
function closeMenus(except) {
  document.querySelectorAll("details.menu[open]").forEach((menu) => { if (menu !== except) menu.removeAttribute("open"); });
}
function closeSearchPops() {
  const top = document.getElementById("top-hits");
  if (top) top.hidden = true;
}

document.body.addEventListener("click", async (event) => {
  const dismiss = event.target.closest("[data-dismiss-news]");
  if (dismiss) {
    rememberNews(dismiss.dataset.dismissNews);
    const card = dismiss.closest(".announce");
    const news = card?.parentElement;
    card?.remove();
    if (news && !news.querySelector(".announce")) news.remove();
  }
  if (!event.target.closest("details.menu")) closeMenus();
  if (!event.target.closest("#top-search-wrap")) closeSearchPops();
  const askChip = event.target.closest("[data-ask]");
  if (askChip) return askAssistant(askChip.dataset.ask);
  const target = event.target.closest(CLICK_TARGETS);
  if (!target) return;
  if (target.closest(".menu-pop")) closeMenus();
  if (target.dataset.go) {
    event.preventDefault();
    if (target.dataset.go === "setup" && current()) return go("day");
    return go(target.dataset.go);
  }
  if (target.id === "seen-update") {
    const savedNow = current();
    if (savedNow?.schedule.revisedAt) localStorage.setItem(seenKey(savedNow), savedNow.schedule.revisedAt);
    render(true);
  }
  if (target.id === "menu-open") openDrawer();
  if (target.id === "menu-close" || target.id === "menu-x") closeDrawer();
  if (target.id === "rail-toggle") {
    const root = document.documentElement;
    const collapsed = root.dataset.rail !== "1";
    if (collapsed) root.dataset.rail = "1";
    else delete root.dataset.rail;
    localStorage.setItem("jadwali-rail", collapsed ? "1" : "0");
    target.setAttribute("aria-pressed", String(collapsed));
  }
  if (target.dataset.year) {
    ui.year = target.dataset.year;
    ui.sectionId = null;
    ui.classPick = null;
    ui.classQuery = "";
    render(true);
    nudgeStep();
  }
  if (target.dataset.section) {
    ui.sectionId = target.dataset.section;
    ui.classPick = null;
    ui.classQuery = "";
    render(true);
    nudgeStep();
  }
  if (target.dataset.class) {
    ui.classPick = target.dataset.class;
    render(true);
  }
  if (target.id === "save-class" && ui.sectionId && ui.classPick) {
    const schedule = getClass(ui.sectionId, ui.classPick);
    writeSaved(schedule);
    go("day");
    if (schedule) UI.toast(`اتحفظ فصل ${schedule.classNumber}. ده يومك من النهاردة.`, "success");
  }
  if (target.dataset.day) {
    ui.pickedDay = target.dataset.day;
    render(true);
  }
  if (target.dataset.mode) {
    ui.mode = target.dataset.mode;
    render(true);
  }
  if ("fday" in target.dataset) {
    ui.dayFilter = target.dataset.fday;
    render(true);
  }
  if (target.dataset.legend) {
    ui.filter = ui.filter === target.dataset.legend ? "" : target.dataset.legend;
    render(true);
  }
  if (target.id === "clear-filter") {
    ui.filter = "";
    ui.dayFilter = "";
    render(true);
  }
  if (target.dataset.demoDay) {
    ui.demoDay = target.dataset.demoDay;
    const body = document.getElementById("demo-body");
    const demo = demoSchedule();
    if (body && demo) body.innerHTML = demoBody(demo);
  }
  if (target.dataset.lead) {
    localStorage.setItem("jadwali-lead", target.dataset.lead);
    schedulePushSync();
    render(true);
    UI.toast(`هننبّهك قبل المحاضرة بـ ${target.dataset.lead} دقيقة`, "success", { id: "lead" });
  }
  if (target.id === "hide-install") {
    localStorage.setItem("jadwali-install-hide", "1");
    render(true);
  }
  if (target.id === "install-now" && installEvent) {
    const prompt = installEvent;
    installEvent = null;
    prompt.prompt();
  }
  if (target.id === "change-class") {
    const saved = current();
    ui.year = saved?.section.year || null;
    ui.sectionId = saved?.schedule.sectionId || null;
    ui.classPick = saved?.schedule.classNumber || null;
    go("start");
  }
  if (target.id === "clear-class") {
    const saved = current();
    closeDrawer();
    const sure = await UI.confirm({
      title: "إزالة الفصل؟",
      text: saved ? `هنشيل فصل ${saved.schedule.classNumber} من الجهاز ده. تقدر تختاره تاني في أي وقت.` : "",
      confirmLabel: "نعم، شيله",
      danger: true,
    });
    if (!sure) return;
    writeSaved(null);
    ui.year = null;
    ui.sectionId = null;
    ui.classPick = null;
    ui.classQuery = "";
    go("setup");
    UI.toast("الفصل اتشال من الجهاز", "info");
    return;
  }
  if (target.dataset.openSection) {
    ui.sectionId = target.dataset.openSection;
    render(true);
    document.getElementById("class-picker")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  if (target.dataset.openClass && ui.sectionId) {
    const schedule = getClass(ui.sectionId, target.dataset.openClass);
    writeSaved(schedule);
    go("table");
    if (schedule) UI.toast(`فتحنا جدول فصل ${schedule.classNumber}`, "success");
  }
  if (target.id === "alert-on" || target.id === "ask-alert") {
    await enableAlerts();
    if (localStorage.getItem("jadwali-reminders") === "1") UI.toast(alertNote || "الإشعار اتفعّل. هننبّهك قبل كل محاضرة.", alertNote ? "warn" : "success");
    else if (alertNote) UI.toast(alertNote, "warn", { duration: 7000 });
    return;
  }
  if (target.id === "ask-later") {
    localStorage.setItem("jadwali-alert-ask", "1");
    render(true);
    UI.toast("تمام. تقدر تفعّله بعدين من صفحة الإشعارات.", "info");
  }
  if (target.id === "alert-off") {
    localStorage.removeItem("jadwali-reminders");
    alertNote = "";
    if (pushActive() || localStorage.getItem("jadwali-push") === "1") trackEvent("push_off");
    void disablePush();
    render(true);
    UI.toast("الإشعار اتوقف", "info");
  }
  const saved = current();
  if (!saved) return;
  if (target.id === "share-today") { trackEvent("share_today"); UI.toast("بنجهّز صورة النهاردة…", "info", { id: "share", duration: 1800 }); shareToday(saved); }
  if (target.id === "share-week") { trackEvent("share_week"); UI.toast("بنجهّز صورة الأسبوع…", "info", { id: "share", duration: 1800 }); shareWeek(saved); }
  if (target.id === "share-class") { trackEvent("share_class"); shareClass(saved); }
  if (target.id === "copy-class") { trackEvent("share_class"); copyClassLink(saved); }
  if (target.id === "report") { trackEvent("report"); report(saved); }
  if (target.id === "download") { UI.toast("بنجهّز صورة الجدول…", "info", { id: "share", duration: 1800 }); downloadTable(saved); }
  if (target.id === "print-table") printTable();
  if (target.id === "export-csv") exportCsv(saved);
  if (target.id === "export-ics") { trackEvent("calendar"); exportIcs(saved); }
  if (target.id === "add-calendar") { trackEvent("calendar"); addCalendar(saved); }
  if (target.id === "join-group") {
    localStorage.setItem(groupKey(saved), "1");
    target.closest(".wa-card")?.remove();
  }
});

document.getElementById("drawer-nav")?.addEventListener("click", (event) => {
  const item = event.target.closest(".nav-item");
  if (item && !item.matches("[data-theme-toggle]")) setTimeout(closeDrawer, 0);
});
document.getElementById("tabbar")?.addEventListener("click", (event) => {
  if (event.target.closest("[data-more]")) openDrawer();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!document.getElementById("drawer").hidden && document.body.classList.contains("drawer-open")) closeDrawer();
    closeMenus();
    closeSearchPops();
    const out = document.getElementById("search-out");
    if (out) out.hidden = true;
  }
  // اختصار البحث: / أو Ctrl+K
  const typing = event.target.closest?.("input, textarea, select, [contenteditable]");
  if ((event.key === "/" && !typing) || (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey))) {
    const input = [document.getElementById("top-search"), document.getElementById("search"), document.getElementById("table-filter")].find((node) => node && node.offsetParent !== null);
    if (input) {
      event.preventDefault();
      input.focus();
      input.select();
    }
  }
});

document.body.addEventListener("input", (event) => {
  if (event.target.id === "class-query") {
    ui.classQuery = event.target.value;
    const exact = classesIn(ui.sectionId).find((item) => digits(item.classNumber) === digits(ui.classQuery));
    if (exact) ui.classPick = exact.classNumber;
    render(true);
    const input = document.getElementById("class-query");
    if (input) {
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    }
  }
  if (event.target.id === "search") {
    ui.search = event.target.value;
    const box = document.getElementById("search-out");
    if (box) {
      box.innerHTML = searchResults(ui.search);
      box.hidden = !ui.search.trim();
    }
  }
  if (event.target.id === "top-search") {
    const box = document.getElementById("top-hits");
    box.innerHTML = searchResults(event.target.value);
    box.hidden = !event.target.value.trim();
  }
  if (event.target.id === "table-filter") {
    ui.filter = event.target.value;
    refreshTable();
  }
});
document.body.addEventListener("focusin", (event) => {
  if (event.target.id === "top-search" && event.target.value.trim()) document.getElementById("top-hits").hidden = false;
});
document.body.addEventListener("submit", (event) => {
  if (event.target.id !== "search-form") return;
  event.preventDefault();
  const box = document.getElementById("search-out");
  if (!box) return;
  box.innerHTML = searchResults(ui.search) || `<p class="search-empty muted">اكتب رقم الفصل أو اسم المادة.</p>`;
  box.hidden = false;
});
document.body.addEventListener("click", (event) => {
  const jump = event.target.closest("[data-jump]");
  if (!jump) return;
  const [sectionId, classNumber] = jump.dataset.jump.split("|");
  const schedule = getClass(sectionId, classNumber);
  writeSaved(schedule);
  ui.search = "";
  const top = document.getElementById("top-search");
  if (top) top.value = "";
  closeSearchPops();
  go("table");
  if (schedule) UI.toast(`فتحنا جدول فصل ${schedule.classNumber}`, "success");
});
