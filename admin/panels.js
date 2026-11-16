// لوحة الإدارة — الشاشات: الأيقونات، القائمة، وكل لوحات العرض.
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  sections: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  classes: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M9 4v16"/>',
  lectures: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
  exams: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
  export: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  holidays: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  notices: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  about: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  assistant: '<path d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4zM18 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  groups: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l1.9-5.4A8.4 8.4 0 1 1 21 11.5z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  log: '<path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  trash: '<path d="M4 7h16M10 7V4.5h4V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/>',
  visits: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  year: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
  term: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  review: '<path d="M20 6L9 17l-5-5"/>',
  role: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/>',
  push: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
  insights: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
};
function icon(name, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}
const NAV_GROUPS = [
  ["", ["home"]],
  ["الجداول", ["sections", "classes", "lectures", "exams", "export", "holidays"]],
  ["المحتوى", ["notices", "about", "assistant", "groups", "push"]],
  ["النظام", ["settings", "users", "log", "insights"]],
];
function navAllowed(id) {
  if (id === "push") return isStaff();
  if (id === "insights") return canSettings();
  if (id === "users" || id === "about" || id === "assistant" || id === "notices" || id === "log") return isSuper();
  if (id === "groups" || id === "holidays") return canSettings();
  if (id === "settings") return canSettings() || role() === "viewer" || role() === "editor";
  return true;
}
function pageTitle() {
  return (NAV.find(([id]) => id === state.panel) || NAV[0])[1];
}

function nav() {
  const labels = Object.fromEntries(NAV);
  document.getElementById("nav").innerHTML = NAV_GROUPS.map(([title, ids]) => {
    const items = ids.filter(navAllowed).map((id) => `<button type="button" data-panel="${id}" class="${state.panel === id ? "on" : ""}">${icon(id)}<span>${labels[id]}</span></button>`);
    if (!items.length) return "";
    return `<div class="nav-group">${title ? `<p class="nav-title">${title}</p>` : ""}${items.join("")}</div>`;
  }).join("");
  const email = state.profile?.email || state.email || "";
  document.getElementById("who").textContent = ROLE_LABEL[role()] || "";
  document.getElementById("me-email").textContent = email || "حسابي";
  document.getElementById("avatar").textContent = (email || "؟").trim().charAt(0).toUpperCase();
}

function home() {
  const settings = state.settings;
  const lecturesCount = state.lectures.filter((item) => owns(state.classes.find((row) => row.id === item.class_id)?.section_id)).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "صباح الخير" : hour < 18 ? "نهارك سعيد" : "مساء الخير";
  const published = !!settings.publish_timetables;
  const card = (ico, label, value, tone = "") => `<article class="stat ${tone}"><span class="stat-ico">${icon(ico, 22)}</span><div><span class="muted">${label}</span><b>${value}</b></div></article>`;
  const canImport = isSuper() || role() === "admin";
  return `<div class="page-head">
      <div>
        <p class="kicker">${greet}</p>
        <h1>لوحة التحكم</h1>
        <p class="lead">${published ? "الجداول المنشورة ظاهرة للطلبة دلوقتي." : "جداول الطلبة الحالية لسه على الملف الأصلي. مش هتتغير غير بعد تفعيل النشر."}</p>
      </div>
      <span class="pill ${published ? "ok" : "warn"}"><i></i>${published ? "النشر شغّال" : "النشر متوقف"}</span>
    </div>
    <div class="stats">
      ${card("sections", "الشعب", visibleSections().length)}
      ${card("classes", "الفصول", visibleClasses().length)}
      ${card("lectures", "المحاضرات", lecturesCount)}
      ${isSuper() ? card("visits", "زيارات جدولي", state.visits == null ? "—" : Number(state.visits).toLocaleString("ar-EG")) : card("role", "دورك", esc(ROLE_LABEL[role()]))}
    </div>
    <section class="panel">
      <h2 class="panel-title">بيانات الموقع</h2>
      <div class="info-grid">
        <div class="info">${icon("year")}<div><span class="muted">العام الدراسي</span><b>${esc(settings.academic_year || "2026/2027")}</b></div></div>
        <div class="info">${icon("term")}<div><span class="muted">الترم</span><b>${esc(settings.term || "الترم الأول")}</b></div></div>
        <div class="info">${icon("review")}<div><span class="muted">آخر مراجعة</span><b>${esc(settings.last_review || "—")}</b></div></div>
        <div class="info">${icon("role")}<div><span class="muted">دورك</span><b>${esc(ROLE_LABEL[role()])}</b></div></div>
      </div>
      ${isSuper() ? `<p class="muted small">عداد الزيارات ظاهر للسوبر أدمن فقط. الزيارة تتحسب مرة واحدة لكل جهاز في اليوم.</p>` : ""}
    </section>
    ${canImport ? `<section class="panel">
      <h2 class="panel-title">استيراد الجداول الحالية</h2>
      <p class="muted">الاستيراد ينسخ الشعب والفصول والمحاضرات الموجودة دلوقتي إلى لوحة التحكم، من غير ما يغيّر موقع الطلبة إلا لو النشر متفعّل.</p>
      <div class="row"><button type="button" class="btn" id="import-current">استيراد الجداول الحالية</button></div>
    </section>` : ""}`;
}

function sectionsPanel() {
  const row = state.edit?.kind === "sections" ? state.edit.row : {};
  const form = isStaff() ? `<form data-save="sections">
      ${field("المعرّف", "id", row.id || "", row.id ? "readonly" : "required")}
      ${field("الاسم", "title", row.title, "required")}
      ${field("التخصص", "major", row.major, "required")}
      ${field("اللغة", "language", row.language, "required")}
      <label>الفرقة<select name="year">${options([["1", "الأولى"], ["2", "الثانية"]], row.year || "1")}</select></label>
      ${field("اسم الفرقة", "year_label", row.year_label || "الفرقة الأولى", "required")}
      <div class="row"><button class="btn" type="submit">${row.id ? "حفظ التعديل" : "إضافة شعبة"}</button></div>
    </form>` : "";
  const rows = visibleSections().map((item) => `<tr><td>${esc(item.year_label)} · ${esc(item.title)}</td><td>${esc(item.major)} · ${esc(item.language)}</td><td>${actions("sections", item.id)}</td></tr>`).join("");
  return `<p class="kicker">الشعب</p><h1>الأقسام</h1>${form}${table(["الشعبة", "التفاصيل", ""], rows)}`;
}

function classesPanel() {
  const row = state.edit?.kind === "classes" ? state.edit.row : {};
  const form = isStaff() ? `<form data-save="classes">
      <input type="hidden" name="id" value="${esc(row.id || "")}" />
      <label>الشعبة<select name="section_id" required>${options(visibleSections().map((item) => [item.id, `${item.year_label} · ${item.title}`]), row.section_id, "اختار شعبة")}</select></label>
      ${field("رقم الفصل", "class_number", row.class_number, "required")}
      ${field("المجموعة", "group_name", row.group_name)}
      <div class="row"><button class="btn" type="submit">${row.id ? "حفظ التعديل" : "إضافة فصل"}</button></div>
    </form>` : "";
  const byYear = new Map();
  visibleClasses().forEach((item) => {
    const meta = sectionMeta(item.section_id);
    const yearKey = meta.cls === "y2" ? "2" : "1";
    if (!byYear.has(yearKey)) byYear.set(yearKey, new Map());
    const sections = byYear.get(yearKey);
    if (!sections.has(item.section_id)) sections.set(item.section_id, []);
    sections.get(item.section_id).push(item);
  });
  const blocks = [...byYear.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map(([yearKey, sections]) => {
    const sectionBlocks = [...sections.entries()].sort((a, b) => sectionMeta(a[0]).sort - sectionMeta(b[0]).sort).map(([sectionId, list]) => {
      const rows = list.map((item) => `<tr data-anchor="${esc(item.id)}" class="${state.flash === item.id ? "flash" : ""}"><td>فصل ${esc(item.class_number)}</td><td>${esc(item.group_name || "—")}</td><td>${actions("classes", item.id)}</td></tr>`).join("");
      return `<details class="fold inner" ${state.openKeys.includes(sectionId) ? "open" : ""}><summary><b>${esc(sectionMeta(sectionId).title)}</b><span class="count">${list.length} فصل</span></summary>${table(["الفصل", "المجموعة", ""], rows)}</details>`;
    }).join("");
    const total = [...sections.values()].reduce((sum, list) => sum + list.length, 0);
    const yearOpen = state.openKeys.includes(`year-${yearKey}`) || [...sections.keys()].some((id) => state.openKeys.includes(id));
    return `<details class="fold" ${yearOpen ? "open" : ""}><summary><b>${yearKey === "2" ? "الفرقة التانية" : "الفرقة الأولى"}</b><span class="count">${sections.size} شعبة · ${total} فصل</span></summary>${sectionBlocks}</details>`;
  }).join("");
  return `<p class="kicker">الفصول</p><h1>الفصول</h1><p class="lead">كل فرقة مقفولة، وجواها شعبها. افتح الشعبة عشان تعدّل الفصل أو تحذفه.</p>${form}${blocks || `<p class="muted">لسه مفيش فصول.</p>`}`;
}

function lecturesPanel() {
  const row = state.edit?.kind === "lectures" ? state.edit.row : {};
  const form = isStaff() ? `<form data-save="lectures">
      <input type="hidden" name="id" value="${esc(row.id || "")}" />
      <label>الفصل<select name="class_id" required>${options(visibleClasses().map((item) => [item.id, classLabel(item)]), row.class_id, "اختار فصل")}</select></label>
      <label>اليوم<select name="day">${options(DAYS.map((day) => [day, day]), row.day || DAYS[0])}</select></label>
      <label>من<select name="start_time">${options(TIMES.map((time) => [time, time]), row.start_time || TIMES[0])}</select></label>
      ${field("المادة", "subject", row.subject, "required")}
      ${field("الدكتور", "instructor", row.instructor)}
      ${field("القاعة", "room", row.room)}
      <label>الحالة<select name="status">${options([["active", "عادية"], ["cancelled", "اتلغت"], ["moved", "اتأجلت"]], row.status || "active")}</select></label>
      <label>اليوم الجديد<select name="moved_day">${options(DAYS.map((day) => [day, day]), row.moved_day || row.day || DAYS[0])}</select></label>
      <label>الميعاد الجديد<select name="moved_start">${options(TIMES.map((time) => [time, time]), row.moved_start || row.start_time || TIMES[0])}</select></label>
      ${field("ملاحظة للطالب", "note", row.note, "placeholder=\"مثال: المحاضرة اتلغت الأسبوع ده\"")}
      <div class="row"><button class="btn" type="submit">${row.id ? "حفظ التعديل" : "إضافة محاضرة"}</button></div>
    </form>` : "";
  const sections = new Map();
  state.lectures.forEach((item) => {
    const klass = state.classes.find((rowItem) => rowItem.id === item.class_id);
    if (!klass || !owns(klass.section_id)) return;
    if (!sections.has(klass.section_id)) sections.set(klass.section_id, new Map());
    const classes = sections.get(klass.section_id);
    if (!classes.has(klass.id)) classes.set(klass.id, []);
    classes.get(klass.id).push(item);
  });
  const order = Object.fromEntries(DAYS.map((day, index) => [day, index]));
  const blocks = [...sections.entries()].sort((a, b) => sectionMeta(a[0]).sort - sectionMeta(b[0]).sort).map(([sectionId, classes]) => {
    const total = [...classes.values()].reduce((sum, list) => sum + list.length, 0);
    const classBlocks = [...classes.entries()].sort((a, b) => Number(state.classes.find((item) => item.id === a[0])?.class_number) - Number(state.classes.find((item) => item.id === b[0])?.class_number)).map(([classId, list]) => {
      const klass = state.classes.find((item) => item.id === classId);
      list.sort((a, b) => (order[a.day] ?? 9) - (order[b.day] ?? 9) || String(a.start_time).localeCompare(String(b.start_time)));
      const rows = list.map((item) => {
        const flag = item.status === "cancelled" ? "اتلغت" : item.status === "moved" ? `اتأجلت إلى ${item.moved_day || ""} ${item.moved_start || ""}` : "عادية";
        return `<tr data-anchor="${esc(item.id)}" class="${state.flash === item.id ? "flash" : ""}"><td>${esc(item.day)} · ${esc(item.start_time)}</td><td>${esc(item.subject)}</td><td>${esc(flag)}</td><td dir="ltr">${esc(item.room || "—")}</td><td>${actions("lectures", item.id)}</td></tr>`;
      }).join("");
      return `<details class="fold inner" ${state.openKeys.includes(classId) ? "open" : ""}><summary><b>فصل ${esc(klass?.class_number || "")}</b><span class="count">${list.length} محاضرة</span>${canRemove() ? `<button type="button" class="ghost danger" data-clear-class="${esc(classId)}">حذف محاضرات الفصل</button>` : ""}</summary>${table(["الموعد", "المادة", "الحالة", "القاعة", ""], rows)}</details>`;
    }).join("");
    return `<details class="fold" ${state.openKeys.includes(sectionId) ? "open" : ""}><summary><b>${esc(sectionMeta(sectionId).title)}</b>${yearTag(sectionId)}<span class="count">${classes.size} فصل · ${total} محاضرة</span></summary>${classBlocks}</details>`;
  }).join("");
  return `<p class="kicker">المحاضرات</p><h1>جدول المحاضرات</h1><p class="lead">كل شعبة مقفولة، وجواها فصولها. افتح الشعبة عشان تعدّل أو تحذف.</p>${form}${blocks || `<p class="muted">لسه مفيش محاضرات.</p>`}`;
}

function examsPanel() {
  const row = state.edit?.kind === "exams" ? state.edit.row : {};
  const form = isStaff() ? `<form data-save="exams">
      <input type="hidden" name="id" value="${esc(row.id || "")}" />
      ${field("العنوان", "title", row.title, "required")}
      ${field("المادة", "subject", row.subject)}
      <label>الشعبة<select name="section_id">${options(visibleSections().map((item) => [item.id, `${item.year_label} · ${item.title}`]), row.section_id, "كل الشعب")}</select></label>
      ${field("رقم الفصل", "class_number", row.class_number)}
      <label>التاريخ<input type="date" name="exam_date" value="${esc(row.exam_date || "")}" /></label>
      ${field("من", "start_time", row.start_time)}
      ${field("إلى", "end_time", row.end_time)}
      ${field("القاعة", "room", row.room)}
      <label>ملاحظة<textarea name="notes">${esc(row.notes || "")}</textarea></label>
      <div class="row"><button class="btn" type="submit">${row.id ? "حفظ التعديل" : "إضافة امتحان"}</button></div>
    </form>` : "";
  const rows = state.exams.filter((item) => !item.section_id || owns(item.section_id)).map((item) => `<tr><td>${esc(item.title)}</td><td>${esc(item.exam_date || "—")} · ${esc(item.start_time || "")}</td><td>${esc(sectionMeta(item.section_id).title)} ${item.section_id ? yearTag(item.section_id) : "كل الشعب"}</td><td>${actions("exams", item.id)}</td></tr>`).join("");
  return `<p class="kicker">الامتحانات</p><h1>جدول الامتحانات</h1>${form}${table(["الامتحان", "الموعد", "الشعبة", ""], rows)}`;
}

function aboutPanel() {
  const settings = state.settings;
  const locked = !canAbout();
  return `<p class="kicker">من نحن</p><h1>محتوى صفحة من نحن</h1>
    <form data-save="about">
      <label>المقدمة<textarea name="about_lead" ${locked ? "disabled" : ""}>${esc(settings.about_lead || "")}</textarea></label>
      <label>ليه الفرقة الأولى والتانية<textarea name="about_why" ${locked ? "disabled" : ""}>${esc(settings.about_why || "")}</textarea></label>
      ${field("Software Engineer", "programmer_name", settings.programmer_name, locked ? "disabled" : "")}
      ${field("واتساب", "whatsapp", settings.whatsapp, locked ? "disabled" : "")}
      ${field("البورتفوليو", "portfolio", settings.portfolio, locked ? "disabled" : "")}
      ${locked ? "" : `<div class="row"><button class="btn" type="submit">حفظ الصفحة</button></div>`}
    </form>`;
}

function kbEntries() {
  return String(state.settings?.assistant_kb || "").split("\n").map((line) => {
    const at = line.indexOf("|");
    return at > 0 ? { q: line.slice(0, at).trim(), a: line.slice(at + 1).trim() } : null;
  }).filter((item) => item && item.q && item.a).slice(0, 40);
}
function assistantPanel() {
  const locked = !canAbout();
  const entries = kbEntries();
  const editing = state.edit?.kind === "kb" ? state.edit.row : null;
  const rows = entries.map((item, index) => `<tr><td>${esc(item.q)}</td><td>${esc(item.a)}</td><td>${locked ? "" : `<button type="button" class="ghost" data-kb-edit="${index}">تعديل</button> <button type="button" class="ghost danger" data-delete="kb" data-id="${index}">حذف</button>`}</td></tr>`).join("");
  const form = locked ? "" : `<form data-save="kb">
      <input type="hidden" name="index" value="${editing ? editing.index : ""}" />
      <label>السؤال<input name="q" maxlength="120" required placeholder="فين الكنتين؟" value="${esc(editing?.q || "")}" /></label>
      <label>الجواب<textarea name="a" rows="3" maxlength="300" required placeholder="الكنتين في الدور الأرضي جنب المدخل">${esc(editing?.a || "")}</textarea></label>
      <div class="row"><button class="btn" type="submit">${editing ? "حفظ التعديل" : "إضافة السؤال"}</button>${editing ? `<button class="ghost" type="button" data-kb-cancel>إلغاء</button>` : ""}</div>
    </form>`;
  return `<p class="kicker">مساعد جدولاوي</p><h1>أسئلة وأجوبة المساعد</h1>
    <p class="muted">جدولاوي بيجاوب منها لو سؤال الطالب ليه إجابة هنا، ولو مفيش بيقول إنه مش متأكد. اكتب معلومات عامة بس لأنها بتظهر لأي حد يفتح التطبيق. العدد: ${entries.length} من 40.</p>
    ${form}${table(["السؤال", "الجواب", ""], rows)}`;
}

function noticesPanel() {
  const row = state.edit?.kind === "announcements" ? state.edit.row : {};
  const image = safeLink(row.image_url);
  const form = isStaff() && role() !== "section_manager" ? `<form data-save="announcements">
      <input type="hidden" name="id" value="${esc(row.id || "")}" />
      <input type="hidden" name="image_url" value="${esc(image)}" />
      ${field("عنوان الإعلان", "title", row.title, "required")}
      <label>النص<textarea name="body" required>${esc(row.body || "")}</textarea></label>
      <label>صورة الإعلان<input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      ${image ? `<img src="${esc(image)}" alt="" style="width:100%;max-height:180px;object-fit:cover;border-radius:18px;margin-top:12px" /><label class="check"><input type="checkbox" name="remove_image" /> حذف الصورة الحالية</label>` : ""}
      ${field("نص الزر", "link_label", row.link_label, "placeholder=\"مثال: سجّل الآن\"")}
      ${field("رابط الزر", "link_url", row.link_url, "placeholder=\"https://\" inputmode=\"url\"")}
      <label>مين يشوفه<select name="audience">${options([["all", "كل الطلبة"], ["section", "شعبة محددة"], ["class", "فصل محدد"]], row.audience || "all")}</select></label>
      <label>الشعبة<select name="section_id">${options(state.sections.map((item) => [item.id, `${item.year_label} · ${item.title}`]), row.section_id, "كل الشعب")}</select></label>
      ${field("رقم الفصل", "class_number", row.class_number, "placeholder=\"سيبّه فاضي لو الإعلان للشعبة كلها\"")}
      <label class="check"><input type="checkbox" name="published" ${row.published === false ? "" : "checked"} /> ظاهر للطلبة</label>
      <label class="check"><input type="checkbox" name="push" ${row.id ? "" : "checked"} /> ابعت إشعار للطلبة بعد الحفظ</label>
      <div class="row"><button class="btn" type="submit">${row.id ? "حفظ الإعلان" : "نشر الإعلان"}</button></div>
    </form>` : "";
  const rows = state.announcements.map((item) => {
    const who = item.audience === "class" ? `${sectionTitle(item.section_id)} · فصل ${item.class_number}` : item.audience === "section" ? sectionTitle(item.section_id) : "كل الطلبة";
    return `<tr><td>${esc(item.title)}</td><td>${esc(who)}</td><td>${item.published ? "ظاهر" : "مخفي"}</td><td>${actions("announcements", item.id)}${item.published && isSuper() ? ` <button type="button" class="ghost" data-push="ann" data-id="${esc(item.id)}">ابعت إشعار</button>` : ""}</td></tr>`;
  }).join("");
  return `<p class="kicker">التنبيهات</p><h1>الإعلانات</h1>
    <p class="lead">تقدر تنشر إعلان لكل الطلبة، أو لشعبة، أو لفصل واحد. الاتنين بيشتغلوا مع بعض.</p>
    ${form}${table(["الإعلان", "لمن", "الحالة", ""], rows)}`;
}

function settingsPanel() {
  const settings = state.settings;
  const locked = !canSettings();
  return `<p class="kicker">الإعدادات</p><h1>إعدادات الموقع</h1>
    <form data-save="settings">
      ${field("العام الدراسي", "academic_year", settings.academic_year, locked ? "disabled" : "required")}
      ${field("الترم", "term", settings.term || "الترم الأول", locked ? "disabled" : "required")}
      ${field("آخر مراجعة", "last_review", settings.last_review, locked ? "disabled" : "required")}
      ${field("التنبيه قبل المحاضرة بالدقائق", "lead_minutes", settings.lead_minutes ?? 10, locked ? "disabled" : "")}
      <label class="check"><input type="checkbox" name="publish_timetables" ${settings.publish_timetables ? "checked" : ""} ${canSettings() ? "" : "disabled"} /> نشر جداول اللوحة على موقع الطلبة</label>
      <label class="check"><input type="checkbox" name="exam_mode" ${settings.exam_mode ? "checked" : ""} ${canSettings() ? "" : "disabled"} /> وضع الامتحانات: إخفاء المحاضرات وإظهار الامتحانات بس</label>
      ${locked ? "" : `<div class="row"><button class="btn" type="submit">حفظ الإعدادات</button></div>`}
    </form>
    ${canSettings() ? archiveBlock() : ""}
    <p class="muted">رفع جدول المحاضرات أو الامتحانات من صفحة رفع جدول ينشره على الموقع على طول، وباقي الفصول تفضل زي ما هي.</p>`;
}

function nextTermName(current) {
  if (/أول/.test(current || "")) return "الترم الثاني";
  if (/ثاني/.test(current || "")) return "الترم الأول";
  return "";
}
function archiveBlock() {
  const current = state.settings.term || "الترم الأول";
  const hint = state.archiveMissing ? `<p class="banner">شغّل ملف sql/archive.sql مرة واحدة من محرر SQL في سوبا بيس، وبعدين حدّث الصفحة.</p>` : "";
  const rows = (state.archives || []).map((item) => `<tr><td>${esc(item.label || item.term)}</td><td>${esc(item.academic_year || "—")}</td><td>${Number(item.lecture_count).toLocaleString("ar-EG")} محاضرة · ${Number(item.exam_count).toLocaleString("ar-EG")} امتحان</td><td><button type="button" class="ghost" data-archive="${esc(item.id)}">عرض</button></td></tr>`).join("");
  const view = archiveDetail();
  return `<section class="panel">
      <h2 class="panel-title">أرشفة الترم</h2>
      <p class="muted">بتحفظ الجدول والامتحانات والإعلانات والإجازات وكل تعديلات الترم، وبعدين بتخفيها من موقع الطلبة. جروبات الواتساب بتفضل. ارفع جدول الترم الجديد بعد الأرشفة.</p>
      ${hint}
      <label>اسم الترم الجديد<input id="next-term" value="${esc(nextTermName(current))}" placeholder="الترم الثاني" /></label>
      <div class="row"><button type="button" class="btn danger-btn" id="archive-term" ${state.archiveMissing ? "disabled" : ""}>أرشفة «${esc(current)}» وفتح الترم الجديد</button></div>
    </section>
    <h2>الترمّات المؤرشفة</h2>
    ${rows ? table(["الترم", "العام", "المحتوى", ""], rows) : `<p class="muted">لسه مفيش ترم متأرشف.</p>`}
    ${view}`;
}
function archiveDetail() {
  const view = state.archiveView;
  if (!view) return "";
  const snap = view.snapshot || {};
  const exams = (snap.exams || []).map((item) => `<tr><td>${esc(item.title || item.subject)}</td><td>${esc(item.exam_date || "—")} · ${esc(item.start_time || "")}</td><td>${esc(item.section || "كل الشعب")}${item.class_number ? ` · فصل ${esc(item.class_number)}` : ""}</td></tr>`).join("");
  const news = (snap.announcements || []).map((item) => `<tr><td>${esc(item.title)}</td><td>${esc(item.audience || "الكل")}</td></tr>`).join("");
  const holidays = (snap.holidays || []).map((item) => `<tr><td>${esc(item.holiday_date)}</td><td>${esc(item.name)}</td></tr>`).join("");
  const counts = new Map();
  (snap.lectures || []).forEach((item) => {
    const key = item.section || "شعبة";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const lectures = [...counts.entries()].map(([name, count]) => `<tr><td>${esc(name)}</td><td>${count.toLocaleString("ar-EG")}</td></tr>`).join("");
  return `<section class="panel"><h2 class="panel-title">${esc(view.label || view.term)}</h2>
    <p class="muted">نسخة محفوظة للقراءة فقط، ومش ظاهرة للطلبة.</p>
    <h2>المحاضرات</h2>${table(["الشعبة", "العدد"], lectures)}
    <h2>الامتحانات</h2>${table(["الامتحان", "الموعد", "لمن"], exams)}
    <h2>الإعلانات</h2>${table(["العنوان", "لمن"], news)}
    <h2>الإجازات</h2>${table(["التاريخ", "الاسم"], holidays)}
  </section>`;
}

function usersPanel() {
  return `<p class="kicker">المستخدمون</p><h1>الأدمن</h1>
    <form data-save="users">
      ${field("البريد", "email", "", "type=\"email\" required")}
      ${field("كلمة السر", "password", "", "type=\"password\" minlength=\"6\" required")}
      <label>الدور<select name="role" id="new-role">${options(Object.entries(ROLE_LABEL), "admin")}</select></label>
      <label id="new-section" style="display:none">الشعبة<select name="section_id">${options(state.sections.map((item) => [item.id, `${item.year_label} · ${item.title}`]), "", "اختار الشعبة")}</select></label>
      <p class="muted" id="section-note">الأدمن من غير شعبة محددة يشوف كل الشعب. الشعبة لمسؤول الشعبة بس.</p>
      <div class="row"><button class="btn" type="submit">إضافة مستخدم</button></div>
    </form>
    ${table(["البريد", "الدور", "الشعبة", ""], state.users.map((user) => `<tr><td>${esc(user.email)}</td><td><select data-role data-id="${user.id}">${options(Object.entries(ROLE_LABEL), user.role)}</select></td><td><select data-section data-id="${user.id}" ${user.role === "section_manager" ? "" : "disabled"}>${options(state.sections.map((item) => [item.id, item.title]), user.role === "section_manager" ? user.section_id : "", "كل الشعب")}</select></td><td><button type="button" class="ghost" data-save-user="${user.id}">حفظ</button> ${user.id === state.profile.id ? "" : `<button type="button" class="ghost danger" data-delete="users" data-id="${user.id}">حذف</button>`}</td></tr>`).join(""))}`;
}

function holidaysPanel() {
  if (!canSettings()) return "";
  const rows = (state.holidays || []).map((item) => `<tr><td>${esc(item.holiday_date)}</td><td>${esc(item.name)}</td><td><button type="button" class="ghost danger" data-delete="holidays" data-id="${item.id}">حذف</button></td></tr>`).join("");
  return `<p class="kicker">الإجازات</p><h1>الإجازات الرسمية</h1>
    <p class="lead">اليوم اللي هتضيفه يختفي من يوم الطالب، ومن تنبيه المحاضرات، ومن التقويم. من غير ما تمسح الجدول.</p>
    <form data-save="holidays">
      <label>التاريخ<input type="date" name="holiday_date" required /></label>
      ${field("اسم الإجازة", "name", "", "placeholder=\"مثال: إجازة رسمية\" required")}
      <div class="row"><button class="btn" type="submit">إضافة الإجازة</button></div>
    </form>
    ${table(["التاريخ", "الاسم", ""], rows)}`;
}
function groupsPanel() {
  if (!canSettings()) return "";
  const sections = catalogSections();
  const rows = (state.groups || []).filter((item) => owns(item.section_id)).map((item) => `<tr><td>${esc(sectionTitle(item.section_id))} · فصل ${esc(item.class_number)}</td><td>${esc(item.label)}</td><td><button type="button" class="ghost danger" data-delete="groups" data-id="${item.id}">حذف</button></td></tr>`).join("");
  return `<p class="kicker">واتساب</p><h1>جروبات الفصول</h1>
    <p class="lead">الزر يظهر في صفحة يوم الطالب مرة واحدة، وبعد ما يضغط انضم لجروب ما يرجعش تاني. من غير رابط، مفيش زر.</p>
    <form data-save="groups">
      <label>الشعبة<select name="section_id" required>${options(sections.map((item) => [item.id, `${item.year_label} · ${item.title}`]), "", "اختار شعبة")}</select></label>
      ${field("رقم الفصل", "class_number", "", "required")}
      ${field("نص الجروب", "label", "", "placeholder=\"مثال: جروب نظم إنجليزي فصل 3\" required")}
      ${field("رابط الجروب", "url", "", "placeholder=\"https://chat.whatsapp.com/\" required")}
      <div class="row"><button class="btn" type="submit">حفظ الجروب</button></div>
    </form>
    ${table(["الفصل", "النص", ""], rows)}`;
}
function logPanel() {
  const rows = state.logs.map((item) => `<tr><td>${esc(new Date(item.created_at).toLocaleString("ar-EG"))}</td><td>${esc(item.actor_email)}</td><td>${esc(item.action)} · ${esc(item.entity)}</td><td>${esc(item.summary)}</td></tr>`).join("");
  return `<p class="kicker">السجل</p><h1>سجل التعديلات</h1>${table(["الوقت", "الحساب", "العمل", "التفاصيل"], rows)}`;
}

// ---------- الإشعارات ----------
async function callPush(body) {
  const { data } = await client.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return { ok: false, error: "unauthorized" };
  let response;
  try {
    response = await fetch(`${config.url}/functions/v1/${window.JADWALI_PUSH_FN || "send-push"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: config.key },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  if (response.status === 404) return { ok: false, error: "not_deployed" };
  let out = {};
  try { out = await response.json(); } catch { /* رد فاضي */ }
  return { ...out, ok: response.ok && out.ok !== false };
}
const PUSH_ERRORS = {
  not_deployed: "دالة الإشعارات لسه مش منشورة. اتبع خطوات PUSH-SETUP.md.",
  missing_vapid: "مفاتيح VAPID مش موجودة في Secrets.",
  network: "الاتصال قطع. حاول تاني.",
  unauthorized: "الدخول انتهى. ادخل تاني.",
  forbidden: "مالكش صلاحية الإرسال ده.",
  empty: "اكتب العنوان والرسالة.",
  section_required: "اختار الشعبة.",
  class_required: "اكتب رقم الفصل.",
  not_found: "الإعلان مش ظاهر أو اتحذف.",
};
function pushError(out) {
  return PUSH_ERRORS[out?.error] || `حصلت مشكلة${out?.error ? ` (${out.error})` : ""}.`;
}
function pushResult(out) {
  if (!out.recipients && !out.sent) return "مفيش حد مشترك في الإشعارات للفئة دي لسه.";
  return `اتبعت ${out.sent} إشعار${out.failed ? `، وفشل ${out.failed}` : ""}.`;
}
function ago(iso) {
  if (!iso) return "—";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "من أقل من دقيقة";
  if (minutes < 60) return `من ${minutes} دقيقة`;
  if (minutes < 1440) return `من ${Math.round(minutes / 60)} ساعة`;
  return `من ${Math.round(minutes / 1440)} يوم`;
}
function pendingBanner() {
  const rows = state.pushQueue || [];
  if (!rows.length || !isStaff()) return "";
  const classes = new Set(rows.map((row) => `${row.section_id}|${row.class_number}`)).size;
  return `<div class="push-banner">
    <div><b>في ${rows.length} تعديل على ${classes} فصل لسه ما اتبلّغش للطلبة</b><span class="muted">هيوصلهم إشعار واحد لكل فصل. تجاهلها لو ده استيراد أو تعديل داخلي.</span></div>
    <div class="row"><button type="button" class="btn" data-push="flush">ابعت للطلبة</button><button type="button" class="ghost" data-push="ignore">تجاهل</button></div>
  </div>`;
}
const KIND_LABEL = { change: "تعديل جدول", announcement: "إعلان", custom: "رسالة" };
function pushPanel() {
  const stats = state.pushStats;
  const status = state.pushStatus;
  const wide = canSettings();
  const audiences = wide ? [["all", "كل الطلبة"], ["section", "شعبة"], ["class", "فصل"]] : [["section", "شعبتي كلها"], ["class", "فصل في شعبتي"]];
  const imported = state.lectures.length;
  const setup = !state.pushReady ? `<p class="banner">شغّل ملف sql/push.sql من Supabase الأول عشان الإشعارات تشتغل.</p>` : "";
  const cards = `<div class="stats">
    <article class="stat"><span class="stat-ico">${icon("users", 22)}</span><div><span class="muted">مشتركين في الإشعارات</span><b>${stats ? Number(stats.total).toLocaleString("ar-EG") : "—"}</b></div></article>
    <article class="stat"><span class="stat-ico">${icon("log", 22)}</span><div><span class="muted">نشطين آخر 7 أيام</span><b>${stats ? Number(stats.active7).toLocaleString("ar-EG") : "—"}</b></div></article>
    <article class="stat"><span class="stat-ico">${icon("lectures", 22)}</span><div><span class="muted">محاضرات جاهزة للتذكير</span><b>${imported.toLocaleString("ar-EG")}</b></div></article>
    <article class="stat"><span class="stat-ico">${icon("push", 22)}</span><div><span class="muted">آخر تشغيل للتذكيرات</span><b class="small-b">${status ? ago(status.heartbeat) : "اضغط فحص"}</b></div></article>
  </div>`;
  const hints = [
    imported ? "" : `<p class="banner">مفيش محاضرات في اللوحة. اضغط «استيراد الجداول الحالية» من الرئيسية، لأن التذكيرات بتتحسب من جداول اللوحة.</p>`,
    status && !status.heartbeat ? `<p class="banner">التذكيرات التلقائية لسه ما اشتغلتش. شغّل sql/push_cron.sql بعد ما تحط CRON_SECRET.</p>` : "",
    status && status.heartbeat && Date.now() - new Date(status.heartbeat).getTime() > 180000 ? `<p class="banner">آخر تشغيل للتذكيرات قديم. اتأكد إن مهمة cron شغالة.</p>` : "",
  ].join("");
  const history = state.pushLog.map((item) => `<tr><td>${esc(new Date(item.created_at).toLocaleString("ar-EG"))}</td><td>${esc(KIND_LABEL[item.kind] || item.kind)}</td><td>${esc(item.title)}</td><td>${esc(item.target)}</td><td>${Number(item.sent).toLocaleString("ar-EG")}</td></tr>`).join("");
  return `<p class="kicker">الإشعارات</p><h1>إشعارات الطلبة</h1>
    <p class="lead">التذكيرات قبل المحاضرات بتتبعت تلقائي. هنا تبعت تعديلات الجدول وإعلانات سريعة.</p>
    ${setup}${hints}${pendingBanner()}${canSettings() ? cards : ""}
    <div class="row"><button type="button" class="ghost" data-push="status">فحص الإعداد</button></div>
    ${status ? `<p class="muted small">المشتركين: ${Number(status.subscribers).toLocaleString("ar-EG")} · سر الـ cron ${status.cron_secret ? "موجود" : "ناقص"}</p>` : ""}
    <form data-push-form>
      <h2>رسالة سريعة</h2>
      <label>العنوان<input name="title" maxlength="80" required placeholder="مثال: تغيير قاعة" /></label>
      <label>الرسالة<textarea name="body" maxlength="180" required placeholder="اكتب رسالة قصيرة وواضحة"></textarea></label>
      <label>مين يستلم<select name="audience">${options(audiences, audiences[0][0])}</select></label>
      <label>الشعبة<select name="section_id">${options(visibleSections().map((item) => [item.id, `${item.year_label} · ${item.title}`]), "", wide ? "اختار الشعبة" : "")}</select></label>
      ${field("رقم الفصل", "class_number", "", 'placeholder="لو اخترت فصل"')}
      <div class="row"><button class="btn" type="submit">ابعت الإشعار</button></div>
    </form>
    ${canSettings() ? `<h2>آخر الإرسال</h2>${table(["الوقت", "النوع", "العنوان", "المستلمين", "اتبعت"], history)}` : ""}`;
}

function insightsPanel() {
  const stats = state.pushStats;
  const usage = state.usage || [];
  const day = (offset) => new Date(Date.now() - offset * 864e5).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  const days = Array.from({ length: 14 }, (_, index) => day(13 - index));
  const week = new Set(Array.from({ length: 7 }, (_, index) => day(index)));
  const total = (kind, only) => usage.filter((row) => row.kind === kind && (!only || only.has(row.day))).reduce((sum, row) => sum + Number(row.n), 0);
  const perDay = days.map((key) => usage.filter((row) => row.kind === "visit" && row.day === key).reduce((sum, row) => sum + Number(row.n), 0));
  const peak = Math.max(1, ...perDay);
  const bars = days.map((key, index) => `<div class="bar"><span>${perDay[index]}</span><i style="height:${Math.round((perDay[index] / peak) * 100)}%"></i><small>${Number(key.slice(8))}</small></div>`).join("");
  const visitsByClass = new Map();
  usage.filter((row) => row.kind === "visit" && row.section_id && row.class_number).forEach((row) => {
    const key = `${row.section_id}|${row.class_number}`;
    visitsByClass.set(key, (visitsByClass.get(key) || 0) + Number(row.n));
  });
  const subsByClass = new Map((stats?.by_class || []).map((row) => [`${row.section_id}|${row.class_number}`, Number(row.n)]));
  const topVisits = [...visitsByClass.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, count]) => {
    const [sectionId, classNumber] = key.split("|");
    return `<tr><td>${esc(sectionTitle(sectionId))} · فصل ${esc(classNumber)}</td><td>${count.toLocaleString("ar-EG")}</td><td>${(subsByClass.get(key) || 0).toLocaleString("ar-EG")}</td></tr>`;
  }).join("");
  const topSubs = (stats?.by_class || []).map((row) => `<tr><td>${esc(sectionTitle(row.section_id))} · فصل ${esc(row.class_number)}</td><td>${Number(row.n).toLocaleString("ar-EG")}</td></tr>`).join("");
  const actionsList = [["share_today", "مشاركة اليوم"], ["share_week", "مشاركة الأسبوع"], ["share_class", "مشاركة الفصل"], ["calendar", "إضافة للتقويم"], ["report", "بلاغات أخطاء"], ["install", "تثبيت التطبيق"], ["push_on", "تفعيل الإشعارات"], ["push_off", "إيقاف الإشعارات"]];
  const actionRows = actionsList.map(([kind, label]) => `<tr><td>${label}</td><td>${total(kind).toLocaleString("ar-EG")}</td></tr>`).join("");
  const setup = !state.pushReady ? `<p class="banner">شغّل ملف sql/push.sql من Supabase الأول عشان الإحصائيات تبدأ تتسجل.</p>` : "";
  return `<p class="kicker">الإحصائيات</p><h1>استخدام جدولي</h1>
    <p class="lead">الأرقام بتبدأ من أول ما ترفع النسخة الجديدة. بتتحسب مرة لكل جهاز في اليوم.</p>
    ${setup}
    <div class="stats">
      <article class="stat"><span class="stat-ico">${icon("users", 22)}</span><div><span class="muted">مشتركين في الإشعارات</span><b>${stats ? Number(stats.total).toLocaleString("ar-EG") : "—"}</b></div></article>
      <article class="stat"><span class="stat-ico">${icon("visits", 22)}</span><div><span class="muted">زيارات آخر 7 أيام</span><b>${total("visit", week).toLocaleString("ar-EG")}</b></div></article>
      <article class="stat"><span class="stat-ico">${icon("exams", 22)}</span><div><span class="muted">بلاغات (30 يوم)</span><b>${total("report").toLocaleString("ar-EG")}</b></div></article>
      <article class="stat"><span class="stat-ico">${icon("export", 22)}</span><div><span class="muted">مشاركات (30 يوم)</span><b>${(total("share_today") + total("share_week") + total("share_class")).toLocaleString("ar-EG")}</b></div></article>
    </div>
    <section class="panel"><h2 class="panel-title">الزيارات اليومية (آخر 14 يوم)</h2><div class="bars">${bars}</div></section>
    <h2>أكتر الفصول زيارة (30 يوم)</h2>${table(["الفصل", "زيارات", "مشتركين"], topVisits)}
    <h2>أكتر الفصول اشتراكًا</h2>${table(["الفصل", "مشتركين"], topSubs)}
    <h2>الاستخدام (30 يوم)</h2>${table(["الإجراء", "العدد"], actionRows)}`;
}

document.getElementById("screen").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-push]");
  if (!button || button.disabled) return;
  const kind = button.dataset.push;
  button.disabled = true;
  try {
    if (kind === "flush") {
      const out = await callPush({ mode: "flush_queue" });
      if (!out?.ok) { state.note = pushError(out); state.bad = true; return draw(); }
      return reload(out.classes ? `بعتنا التعديلات لـ ${out.classes} فصل (${Number(out.sent || 0)} إشعار).` : "مفيش تعديلات تتبعت.");
    }
    if (kind === "ignore") {
      for (let round = 0; round < 40; round += 1) {
        const page = await client.from("push_queue").select("id").limit(200);
        if (page.error) return fail(page.error);
        const ids = (page.data || []).map((row) => row.id);
        if (!ids.length) break;
        const removed = await client.from("push_queue").delete().in("id", ids);
        if (removed.error) return fail(removed.error);
      }
      return reload("اتجاهلنا كل التعديلات، ومحدش اتبعتله حاجة.");
    }
    if (kind === "status") {
      const out = await callPush({ mode: "status" });
      if (!out?.ok) { state.note = pushError(out); state.bad = true; return draw(); }
      state.pushStatus = out;
      state.note = "";
      return draw();
    }
    if (kind === "ann") {
      const out = await callPush({ mode: "announcement", id: button.dataset.id });
      state.bad = !out?.ok;
      state.note = out?.ok ? pushResult(out) : pushError(out);
      return draw();
    }
  } finally {
    button.disabled = false;
  }
});

document.getElementById("screen").addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-push-form]");
  if (!form) return;
  event.preventDefault();
  const submit = form.querySelector("button[type=submit]");
  submit.disabled = true;
  const out = await callPush({
    mode: "custom",
    title: valueOf(form, "title"),
    body: valueOf(form, "body"),
    audience: valueOf(form, "audience"),
    section_id: valueOf(form, "section_id"),
    class_number: valueOf(form, "class_number").replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit)),
  });
  state.bad = !out?.ok;
  state.note = out?.ok ? pushResult(out) : pushError(out);
  if (out?.ok) await reload(state.note);
  else draw();
});

function catalogSections() {
  const map = new Map(BASE_SECTIONS.map((item) => [item.id, { ...item }]));
  state.sections.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
  return [...map.values()].filter((item) => owns(item.id));
}
function catalogClasses(sectionId) {
  const numbers = new Set();
  (window.JADWALI_CLASSES || []).forEach((item) => {
    if (item.sectionId === sectionId) numbers.add(String(item.classNumber));
  });
  state.classes.forEach((item) => {
    if (item.section_id === sectionId) numbers.add(String(item.class_number));
  });
  return [...numbers];
}
function exportPanel() {
  const sections = catalogSections();
  const sectionId = state.uploadSection || sections[0]?.id || "";
  const classes = catalogClasses(sectionId);
  const kind = state.uploadKind || "lectures";
  const step = (n, title, text) => `<li><span>${n}</span><div><b>${title}</b><p class="muted">${text}</p></div></li>`;
  return `<p class="kicker">رفع جدول</p><h1>رفع محاضرات أو امتحانات</h1>
    <p class="lead">ارفع الجدول بأي شكل: PDF، صورة، Excel أو CSV. جدولي بيقرا الصفوف والأعمدة مهما كان ترتيبها، وبينسّقها، وبيعرضهالك تراجعها وتعدّلها قبل ما أي حاجة تتنشر.</p>
    <form id="upload-form" data-nogrid novalidate>
      <div class="upload-kinds" role="radiogroup" aria-label="نوع الجدول">
        <label class="check"><input type="radio" name="upload-kind" value="lectures" ${kind === "lectures" ? "checked" : ""} /> جدول محاضرات</label>
        <label class="check"><input type="radio" name="upload-kind" value="exams" ${kind === "exams" ? "checked" : ""} /> جدول امتحانات</label>
      </div>
      <div class="upload-grid">
        <label>الشعبة<select id="upload-section">${sections.map((item) => `<option value="${esc(item.id)}" ${item.id === sectionId ? "selected" : ""}>${esc(item.year_label)} · ${esc(item.title)}</option>`).join("")}</select></label>
        <label>الفصل (اختياري)<input id="upload-class" list="class-list" inputmode="numeric" placeholder="${kind === "exams" ? "سيبه فاضي لو الامتحان لكل الشعبة" : "سيبه فاضي لو الملف فيه أرقام الفصول"}" /></label>
      </div>
      <datalist id="class-list">${classes.map((item) => `<option value="${esc(item)}"></option>`).join("")}</datalist>
      <label class="drop" id="upload-drop" tabindex="0">
        <span class="drop-ico">${icon("export", 26)}</span>
        <b>اسحب الملف هنا أو اضغط للاختيار</b>
        <span class="muted">PDF · PNG · JPG · WEBP · Excel · CSV — لحد 20 ميجا</span>
        <input id="upload-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,application/pdf,image/png,image/jpeg,image/webp" />
      </label>
      <label class="check"><input type="checkbox" id="upload-ai" ${state.uploadAi === false ? "" : "checked"} /> استعين بالذكاء الاصطناعي لو القراءة مش واضحة أو الملف صورة</label>
      <div id="upload-status" class="upload-status" role="status" aria-live="polite" hidden></div>
      <div class="row"><button type="button" class="ghost" id="upload-manual">${icon("plus", 16)}أو ابدأ بجدول فاضي</button></div>
    </form>
    <section class="panel">
      <h2 class="panel-title">بيشتغل إزاي؟</h2>
      <ol class="upload-steps">
        ${step(1, "القراءة", "نص الـ PDF بيتقري مباشرة، والصور والـ PDF المتصوّر بيتقروا خانة خانة بالعربي والإنجليزي.")}
        ${step(2, "الفهم والتنسيق", "اليوم والوقت والمادة والمحاضر والقاعة بيتعرفوا من محتواهم، مش من ترتيب الأعمدة. المواعيد بتتوحّد على صيغة جدولي.")}
        ${step(3, "الذكاء الاصطناعي", "الصور والجداول الصعبة بتتبعت لنموذج بيشوف الجدول ويرتّبه، وتقدر تقارن نتيجته بالقراءة العادية وتختار الأحسن.")}
        ${step(4, "المراجعة والنشر", "أي حقل ناقص أو مشكوك فيه بيتعلّم بالأصفر. عدّل، ضيف، احذف، وبعدها أكّد النشر.")}
      </ol>
    </section>`;
}
const SCREENS = { home, sections: sectionsPanel, classes: classesPanel, lectures: lecturesPanel, exams: examsPanel, about: aboutPanel, assistant: assistantPanel, notices: noticesPanel, settings: settingsPanel, users: usersPanel, log: logPanel, export: exportPanel, groups: groupsPanel, holidays: holidaysPanel, push: pushPanel, insights: insightsPanel };

function noteTone(text) {
  if (state.bad) return "error";
  return /^(جارٍ|جاري)/.test(text) ? "info" : "success";
}
function draw() {
  if (["users", "about", "assistant", "notices", "log"].includes(state.panel) && !isSuper()) state.panel = "home";
  if (state.panel === "insights" && !canSettings()) state.panel = "home";
  if (state.panel === "push" && !isStaff()) state.panel = "home";
  nav();
  document.title = `${pageTitle()} — جدولي`;
  closeMenu();
  const screen = document.getElementById("screen");
  const banner = state.missing ? `<p class="banner">${esc(state.note)}</p>` : "";
  screen.innerHTML = `${banner}${state.panel === "push" ? "" : pendingBanner()}${SCREENS[state.panel]?.() || home()}`;
  // نتيجة كل عملية بتظهر كإشعار منبثق بدل سطر في آخر الصفحة
  if (!state.missing && state.note) {
    UI.toast(state.note, noteTone(state.note), { id: "admin-note", duration: Math.max(3200, state.note.length * 70) });
    state.note = "";
    state.bad = false;
  }
  openEditSheet(screen);
}
// وقت التعديل، نموذج الشاشة بيتحول للوحة منزلقة من الجنب بدل ما يفضل فوق الجدول.
function openEditSheet(screen) {
  document.body.classList.remove("sheet-open");
  const row = state.edit?.row;
  if (!row || (state.edit.kind !== "kb" && !row.id)) return;
  const form = screen.querySelector(`form[data-save="${state.edit.kind}"]`);
  if (!form) return;
  form.classList.add("sheet");
  form.setAttribute("role", "dialog");
  form.setAttribute("aria-modal", "true");
  form.setAttribute("aria-label", "تعديل");
  form.insertAdjacentHTML("afterbegin", `<div class="sheet-head"><div><p class="kicker">${esc(pageTitle())}</p><h2>تعديل البيانات</h2></div><button type="button" class="icon-btn" data-edit-cancel aria-label="إغلاق">${icon("close", 18)}</button></div>`);
  form.insertAdjacentHTML("afterend", `<button type="button" class="sheet-scrim" data-edit-cancel aria-label="إغلاق"></button>`);
  document.body.classList.add("sheet-open");
  form.querySelector("input:not([type=hidden]):not([readonly]), select, textarea")?.focus({ preventScroll: true });
}

async function reload(message) {
  state.note = message || "";
  state.bad = false;
  state.edit = null;
  await client.from("settings").update({ updated_at: new Date().toISOString() }).eq("id", "public");
  try { await loadAll(); } catch (error) { fail(error); }
  draw();
}

