// لوحة الإدارة — شاشة «راجع ونسّق قبل النشر».
// الصفوف المستخرجة من الملف بتتعرض هنا قابلة للتعديل، وأي حقل ناقص أو مشكوك فيه بيتعلّم بالأصفر. مفيش حاجة بتتحفظ في القاعدة غير بعد التأكيد.

const REVIEW_TYPES = ["محاضرة", "سكشن", "معمل"];
const REVIEW_FIELDS = {
  lectures: [["classNumber", "الفصل"], ["day", "اليوم"], ["start", "من"], ["end", "إلى"], ["subject", "المادة"], ["instructor", "المحاضر"], ["room", "القاعة"], ["type", "النوع"]],
  exams: [["classNumber", "الفصل"], ["subject", "المادة"], ["date", "التاريخ"], ["start", "من"], ["end", "إلى"], ["room", "القاعة"], ["notes", "ملاحظات"]],
};
// الحقول اللي من غيرها الصف ما ينفعش يتحفظ
const REVIEW_REQUIRED = { lectures: ["classNumber", "day", "start", "subject"], exams: ["subject"] };
let reviewSeq = 0;

function reviewRow(slot = {}) {
  reviewSeq += 1;
  return { id: `r${reviewSeq}`, sel: false, classNumber: "", day: "", start: "", end: "", subject: "", instructor: "", room: "", type: "محاضرة", date: "", notes: "", guessed: false, ...slot };
}
function openReview({ kind, sectionId, slots, fileName = "", source = "", strategy = "", warnings = [], variants = null, variant = "local", aiSource = null, aiModel = "" }) {
  state.review = {
    variants: variants || { local: slots },
    variant,
    aiSource,
    aiModel,
    aiBusy: false,
    kind,
    sectionId,
    rows: (slots.length ? slots : [{}]).map((slot) => reviewRow(slot)),
    fileName,
    source,
    strategy,
    warnings,
    onlyIssues: false,
    tab: "edit",
    noteType: true,
    dirty: false,
    busy: false,
  };
  renderReview();
  document.getElementById("review").hidden = false;
  document.body.classList.add("review-open");
  document.querySelector("#review [data-review-next]")?.focus({ preventScroll: true });
}
async function closeReview(force) {
  const review = state.review;
  if (!review || review.busy) return;
  if (!force && review.dirty && !(await UI.confirm({ title: "تقفل من غير نشر؟", text: "التعديلات اللي عملتها على الصفوف هتضيع.", confirmLabel: "اقفل", danger: true }))) return;
  state.review = null;
  document.getElementById("review").hidden = true;
  document.getElementById("review").innerHTML = "";
  document.body.classList.remove("review-open");
}
function reviewIssues(review) {
  return new Map(review.rows.map((row) => [row.id, slotIssues(row, review.kind, review.rows)]));
}
function reviewBlocking(review, issues) {
  const required = REVIEW_REQUIRED[review.kind];
  return review.rows.filter((row) => required.some((field) => issues.get(row.id)[field] && !(field === "start" && /متخمَّن|محاضرة تانية/.test(issues.get(row.id)[field]))));
}

// ---------- الرسم ----------
function reviewCell(row, field, label, issue) {
  const value = row[field] ?? "";
  const common = `data-field="${field}" aria-label="${label}"${issue ? ' aria-invalid="true"' : ""}`;
  let control;
  if (field === "day") {
    const known = DAYS.includes(value);
    control = `<select ${common}><option value="">— اليوم —</option>${!known && value ? `<option value="${esc(value)}" selected>${esc(value)}</option>` : ""}${DAYS.map((day) => `<option ${day === value ? "selected" : ""}>${day}</option>`).join("")}</select>`;
  } else if (field === "type") {
    control = `<select ${common}>${REVIEW_TYPES.map((type) => `<option ${type === value ? "selected" : ""}>${type}</option>`).join("")}</select>`;
  } else if (field === "start" || field === "end") {
    control = `<input ${common} value="${esc(value)}" list="review-times" dir="ltr" inputmode="numeric" placeholder="08:30" autocomplete="off" />`;
  } else if (field === "date") {
    control = `<input ${common} type="date" value="${esc(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "")}" />`;
  } else if (field === "classNumber") {
    control = `<input ${common} value="${esc(value)}" inputmode="numeric" placeholder="${state.review.kind === "exams" ? "كل الشعبة" : "رقم"}" autocomplete="off" />`;
  } else if (field === "subject") {
    control = `<span class="rv-subject"><i class="rv-dot" style="--c:${subjectColor(value)}"></i><input ${common} value="${esc(value)}" autocomplete="off" /></span>`;
  } else {
    control = `<input ${common} value="${esc(value)}" ${field === "room" ? 'dir="auto"' : ""} autocomplete="off" />`;
  }
  return `<td class="rv-${field}${issue ? " warn" : ""}" data-label="${label}">${control}<small class="rv-hint">${esc(issue || "")}</small></td>`;
}
function reviewRowHtml(row, index, issues, fields) {
  const count = Object.keys(issues).length;
  return `<tr data-row="${row.id}" class="${count ? "has-issue" : ""}${row.sel ? " picked" : ""}">
    <td class="rv-pick" data-label=""><label class="rv-check"><input type="checkbox" data-pick ${row.sel ? "checked" : ""} aria-label="تحديد الصف ${index + 1}" /><span>${index + 1}</span></label></td>
    ${fields.map(([field, label]) => reviewCell(row, field, label, issues[field])).join("")}
    <td class="rv-actions" data-label=""><button type="button" class="icon-btn" data-row-copy title="تكرار الصف" aria-label="تكرار الصف">${icon("copy", 16)}</button><button type="button" class="icon-btn danger" data-row-delete title="حذف الصف" aria-label="حذف الصف">${icon("trash", 16)}</button></td>
  </tr>`;
}
function reviewBody() {
  const review = state.review;
  const issues = reviewIssues(review);
  const fields = REVIEW_FIELDS[review.kind];
  if (review.tab === "site") {
    const classes = [...new Set(review.rows.map((row) => row.classNumber || ""))].sort((a, b) => Number(a) - Number(b));
    if (review.kind === "exams") {
      return `<div class="rv-site">${review.rows.map((row) => `<article class="lecture"><p class="kicker">${esc(row.date || "من غير تاريخ")}${row.classNumber ? ` · فصل ${esc(row.classNumber)}` : " · كل الشعبة"}</p><b>${esc(row.subject)}</b>${row.start ? `<p class="muted" dir="ltr">${esc(row.start)}${row.end ? ` – ${esc(row.end)}` : ""}</p>` : ""}${row.room ? `<p class="muted">${esc(row.room)}</p>` : ""}</article>`).join("")}</div>`;
    }
    return `<div class="rv-site">${classes.map((number) => `<h3>${number ? `فصل ${esc(number)}` : "من غير رقم فصل"}</h3>${previewLectures(review.rows.filter((row) => (row.classNumber || "") === number))}`).join("")}</div>`;
  }
  const rows = review.rows.map((row, index) => ({ row, index })).filter(({ row }) => !review.onlyIssues || Object.keys(issues.get(row.id)).length);
  if (!rows.length) return UI.empty({ art: "inbox", title: review.onlyIssues ? "كل الصفوف سليمة" : "مفيش صفوف", text: review.onlyIssues ? "مفيش حاجة محتاجة مراجعة." : "ضيف صف وابدأ اكتب.", actions: review.onlyIssues ? `<button type="button" class="ghost sm" data-review-only>اعرض كل الصفوف</button>` : `<button type="button" class="btn sm" data-row-add>${icon("plus", 16)}صف جديد</button>` });
  return `<div class="table-wrap rv-wrap"><table class="rv-table"><thead><tr><th class="rv-pick"><label class="rv-check"><input type="checkbox" data-pick-all ${review.rows.length && review.rows.every((row) => row.sel) ? "checked" : ""} aria-label="تحديد الكل" /><span>#</span></label></th>${fields.map(([, label]) => `<th>${label}</th>`).join("")}<th></th></tr></thead><tbody>${rows.map(({ row, index }) => reviewRowHtml(row, index, issues.get(row.id), fields)).join("")}</tbody></table></div>`;
}
function reviewCounts() {
  const review = state.review;
  const issues = reviewIssues(review);
  const flagged = review.rows.filter((row) => Object.keys(issues.get(row.id)).length).length;
  const picked = review.rows.filter((row) => row.sel).length;
  return { flagged, picked, blocking: reviewBlocking(review, issues).length, total: review.rows.length };
}
function reviewHead() {
  const review = state.review;
  const counts = reviewCounts();
  return `<span class="badge">${counts.total} صف</span>${counts.flagged
    ? `<button type="button" class="badge warn rv-next" data-review-next title="روح لأول حقل محتاج مراجعة"><i class="dot"></i>${counts.flagged} محتاج مراجعة</button>`
    : `<span class="badge ok"><i class="dot"></i>كله تمام</span>`}${review.variant === "ai" ? `<span class="badge primary" title="${esc(review.aiModel)}">${icon("assistant", 14)}ذكاء اصطناعي</span>` : review.strategy ? `<span class="badge primary">${esc(review.strategy)}</span>` : ""}`;
}
function renderReview() {
  const review = state.review;
  const host = document.getElementById("review");
  if (!review || !host) return;
  const counts = reviewCounts();
  const sections = catalogSections();
  const fields = REVIEW_FIELDS[review.kind];
  host.innerHTML = `<div class="review-card" role="dialog" aria-modal="true" aria-labelledby="review-title">
    <header class="review-head">
      <div class="review-title"><p class="kicker">${esc([review.source, review.fileName].filter(Boolean).join(" · ") || "إدخال يدوي")}</p><h2 id="review-title">راجع ${review.kind === "exams" ? "الامتحانات" : "المحاضرات"} قبل النشر</h2></div>
      <div class="review-counts" id="review-counts">${reviewHead()}</div>
      <button type="button" class="icon-btn" data-review-close aria-label="إغلاق">${icon("close", 18)}</button>
    </header>
    ${review.warnings.length ? `<p class="banner rv-banner">${review.warnings.map(esc).join(" ")}</p>` : ""}
    <div class="review-tools">
      <label class="rv-field"><span>الشعبة</span><select data-review-section>${sections.map((item) => `<option value="${esc(item.id)}" ${item.id === review.sectionId ? "selected" : ""}>${esc(item.year_label)} · ${esc(item.title)}</option>`).join("")}</select></label>
      <div class="rv-bulk" role="group" aria-label="تعبئة جماعية">
        <label class="rv-field"><span>عبّي</span><select data-bulk-field>${fields.filter(([field]) => field !== "subject").map(([field, label]) => `<option value="${field}">${label}</option>`).join("")}</select></label>
        <label class="rv-field grow"><span>بالقيمة</span><input data-bulk-value list="review-bulk" placeholder="مثال: 5" autocomplete="off" /></label>
        <button type="button" class="ghost" data-bulk-apply id="review-bulk-apply">${counts.picked ? `طبّق على ${counts.picked} محدد` : "طبّق على الكل"}</button>
      </div>
      <div class="rv-buttons">
        <button type="button" class="ghost" data-row-add>${icon("plus", 16)}<span>صف جديد</span></button>
        <button type="button" class="ghost" data-review-format title="إعادة تنظيف وتوحيد كل الصفوف">${icon("review", 16)}<span>إعادة التنسيق</span></button>
        ${review.variants.ai && review.variants.local.length
          ? `<div class="segmented" role="group" aria-label="مصدر القراءة"><button type="button" class="${review.variant === "local" ? "on" : ""}" data-review-variant="local">قراءة عادية (${review.variants.local.length})</button><button type="button" class="${review.variant === "ai" ? "on" : ""}" data-review-variant="ai">${icon("assistant", 14)}ذكاء اصطناعي (${review.variants.ai.length})</button></div>`
          : review.aiSource && !review.variants.ai ? `<button type="button" class="ghost rv-ai" data-review-ai ${review.aiBusy ? "disabled" : ""}>${icon("assistant", 16)}<span>${review.aiBusy ? "جارٍ التحليل…" : "حلّل بالذكاء الاصطناعي"}</span></button>` : ""}
        <button type="button" class="ghost danger" data-pick-delete ${counts.picked ? "" : "disabled"}>${icon("trash", 16)}<span>حذف المحدد</span></button>
        <label class="check rv-only"><input type="checkbox" data-review-only ${review.onlyIssues ? "checked" : ""} /> المحتاج مراجعة بس</label>
        <div class="segmented" role="group" aria-label="طريقة العرض"><button type="button" class="${review.tab === "edit" ? "on" : ""}" data-review-tab="edit">تعديل</button><button type="button" class="${review.tab === "site" ? "on" : ""}" data-review-tab="site">شكل الموقع</button></div>
      </div>
    </div>
    <div class="review-body" id="review-body">${reviewBody()}</div>
    <footer class="review-foot">
      ${review.kind === "lectures" ? `<label class="check"><input type="checkbox" data-review-note ${review.noteType ? "checked" : ""} /> اكتب «سكشن» أو «معمل» كملاحظة تظهر للطالب</label>` : `<span class="muted small">الفصل الفاضي معناه إن الامتحان لكل فصول الشعبة.</span>`}
      <div class="row"><button type="button" class="ghost" data-review-close>إلغاء</button><button type="button" class="btn" data-review-publish>${icon("push", 18)}<span>تأكيد ونشر</span></button></div>
    </footer>
    <datalist id="review-times">${TIMES.map((time) => `<option value="${time}"></option>`).join("")}${Object.values(TIME_END).map((time) => `<option value="${time}"></option>`).join("")}</datalist>
    <datalist id="review-bulk"></datalist>
  </div>`;
  syncBulkList();
}
function syncBulkList() {
  const field = document.querySelector("#review [data-bulk-field]")?.value;
  const list = document.getElementById("review-bulk");
  const input = document.querySelector("#review [data-bulk-value]");
  if (!list || !input) return;
  const options = field === "day" ? DAYS : field === "type" ? REVIEW_TYPES : field === "start" ? TIMES : field === "end" ? Object.values(TIME_END) : [];
  list.innerHTML = options.map((item) => `<option value="${item}"></option>`).join("");
  input.type = field === "date" ? "date" : "text";
  input.placeholder = { classNumber: "مثال: 5", day: "مثال: الأحد", start: "08:30", end: "09:40", room: "مثال: Lect 3", type: "محاضرة / سكشن / معمل", instructor: "اسم المحاضر", notes: "ملاحظة" }[field] || "";
}
// تحديث علامات التنبيه والعدادات من غير إعادة رسم الجدول (عشان المؤشر ما يطيرش وانت بتكتب)
function refreshReview() {
  const review = state.review;
  if (!review) return;
  const issues = reviewIssues(review);
  document.querySelectorAll("#review tr[data-row]").forEach((node) => {
    const row = review.rows.find((item) => item.id === node.dataset.row);
    if (!row) return;
    const own = issues.get(row.id);
    node.classList.toggle("has-issue", Object.keys(own).length > 0);
    node.classList.toggle("picked", !!row.sel);
    node.querySelectorAll("[data-field]").forEach((input) => {
      const cell = input.closest("td");
      const issue = own[input.dataset.field] || "";
      cell.classList.toggle("warn", !!issue);
      cell.querySelector(".rv-hint").textContent = issue;
      if (issue) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
      if (document.activeElement !== input && input.value !== String(row[input.dataset.field] ?? "")) input.value = row[input.dataset.field] ?? "";
    });
    const dot = node.querySelector(".rv-dot");
    if (dot) dot.style.setProperty("--c", subjectColor(row.subject));
  });
  document.getElementById("review-counts").innerHTML = reviewHead();
  const counts = reviewCounts();
  const apply = document.getElementById("review-bulk-apply");
  if (apply) apply.textContent = counts.picked ? `طبّق على ${counts.picked} محدد` : "طبّق على الكل";
  const remove = document.querySelector("#review [data-pick-delete]");
  if (remove) remove.disabled = !counts.picked;
  const all = document.querySelector("#review [data-pick-all]");
  if (all) all.checked = review.rows.length > 0 && review.rows.every((row) => row.sel);
}
function redrawReviewBody() {
  document.getElementById("review-body").innerHTML = reviewBody();
  refreshReview();
}

// ---------- التعديل ----------
// بينضّف القيمة اللي اتكتبت بنفس قواعد المحرك: «sun» ← الأحد، «1:30 pm» ← 01:30 ...
function normalizeField(field, value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (field === "day") return findDay(text) || text;
  if (field === "start" || field === "end") return cleanTime(text) || (periodIndex(text) && field === "start" ? TIMES[periodIndex(text) - 1] : "") || text;
  if (field === "classNumber") return latin(text).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (field === "type") return REVIEW_TYPES.includes(text) ? text : detectType({ subject: text });
  if (field === "date") return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : findDate(text) || text;
  if (field === "instructor") return tidyInstructor(text);
  if (field === "room") return findRoom(text) || cleanText(text);
  return cleanText(text);
}
function setReviewField(row, field, value, final) {
  row[field] = final ? normalizeField(field, value) : value;
  if (field === "start") {
    row.guessed = false;
    if (final && row.start && (!row.end || timeMinutes(row.end) <= timeMinutes(row.start))) row.end = defaultEnd(row.start);
  }
  if (field === "date" && final) row.guessed = false;
  state.review.dirty = true;
}
function reformatReview() {
  const review = state.review;
  const picked = new Map(review.rows.map((row) => [row.id, row]));
  review.rows.forEach((row) => {
    const clean = formatSlot(row, review.kind);
    Object.assign(row, { ...clean, type: REVIEW_TYPES.includes(row.type) && row.type !== "محاضرة" ? row.type : clean.type, guessed: row.guessed, classNumber: clean.classNumber, date: clean.date || row.date });
  });
  unifySubjects(review.rows);
  const before = review.rows.length;
  const seen = new Set();
  review.rows = sortSlots(review.rows.filter((row) => {
    const key = `${row.classNumber}|${row.day}|${row.date}|${row.start}|${normalizeHeader(row.subject)}|${normalizeHeader(row.room)}`;
    if (row.subject && seen.has(key)) return false;
    seen.add(key);
    return true;
  }), review.kind).map((row) => picked.get(row.id) || row);
  review.dirty = true;
  redrawReviewBody();
  const removed = before - review.rows.length;
  UI.toast(removed ? `اتنسّق واترتّب، واتشال ${removed} صف مكرر.` : "الصفوف اتنسّقت واترتّبت.", "success", { id: "review" });
}
function focusNextIssue() {
  const review = state.review;
  if (review.tab !== "edit") { review.tab = "edit"; renderReview(); }
  const target = document.querySelector("#review td.warn [data-field]");
  if (!target) return;
  target.scrollIntoView({ block: "center", behavior: "smooth" });
  target.focus({ preventScroll: true });
  target.select?.();
}

// ---------- القراءة العادية / الذكاء الاصطناعي ----------
async function switchVariant(name) {
  const review = state.review;
  if (!review || review.variant === name || !review.variants[name]) return;
  if (review.dirty && !(await UI.confirm({ title: "تبدّل مصدر القراءة؟", text: "التعديلات اللي عملتها على الصفوف الحالية هتضيع.", confirmLabel: "بدّل" }))) return;
  review.variant = name;
  review.rows = review.variants[name].map((slot) => reviewRow(slot));
  review.dirty = false;
  renderReview();
}
async function runReviewAi() {
  const review = state.review;
  if (!review || review.aiBusy || !review.aiSource) return;
  review.aiBusy = true;
  renderReview();
  UI.toast("جارٍ التحليل بالذكاء الاصطناعي…", "info", { id: "review", duration: 0 });
  const ai = await aiExtract(review.aiSource);
  if (state.review !== review) return;
  review.aiBusy = false;
  if (!ai.ok) {
    renderReview();
    return UI.toast(aiErrorText(ai), "error", { id: "review" });
  }
  const fallback = review.rows.find((row) => row.classNumber)?.classNumber || "";
  review.variants.ai = ai.slots.map((slot) => ({ ...slot, classNumber: slot.classNumber || fallback }));
  review.aiModel = ai.model;
  renderReview();
  UI.toast(`الذكاء الاصطناعي طلّع ${ai.slots.length} صف. اختار «ذكاء اصطناعي» فوق عشان تشوفهم.`, "success", { id: "review", duration: 6000 });
  if (!review.dirty) await switchVariant("ai");
}

// ---------- النشر ----------
async function confirmReview() {
  const review = state.review;
  if (!review || review.busy) return;
  review.rows = review.rows.filter((row) => REVIEW_FIELDS[review.kind].some(([field]) => field !== "type" && String(row[field] || "").trim()));
  if (!review.rows.length) { redrawReviewBody(); return UI.toast("مفيش صفوف للنشر.", "error"); }
  const issues = reviewIssues(review);
  const blocking = reviewBlocking(review, issues);
  if (blocking.length) {
    review.onlyIssues = false;
    review.tab = "edit";
    renderReview();
    focusNextIssue();
    return UI.toast(`في ${blocking.length} صف ناقصه بيانات أساسية. كمّل الحقول الصفرا الأول.`, "error", { id: "review" });
  }
  const section = catalogSections().find((item) => item.id === review.sectionId);
  if (!section) return UI.toast("اختار الشعبة الأول.", "error", { id: "review" });
  const numbers = [...new Set(review.rows.map((row) => row.classNumber || ""))].sort((a, b) => Number(a) - Number(b));
  const existing = review.kind === "lectures"
    ? state.lectures.filter((lecture) => state.classes.some((item) => item.id === lecture.class_id && item.section_id === section.id && numbers.includes(String(item.class_number)))).length
    : state.exams.filter((exam) => exam.section_id === section.id && numbers.includes(String(exam.class_number || ""))).length;
  const soft = review.rows.filter((row) => Object.keys(issues.get(row.id)).length).length;
  const noun = review.kind === "lectures" ? "محاضرة" : "امتحان";
  const target = numbers.map((number) => (number ? `فصل ${number}` : "كل الشعبة")).join("، ");
  const sure = await UI.confirm({
    title: `نشر ${review.rows.length} ${noun}؟`,
    text: `${section.year_label} · ${section.title} — ${target}.${existing ? ` الموجود حاليًا (${existing} ${noun}) هيتستبدل بالجدول ده.` : ""}${soft ? ` لسه في ${soft} صف عليه تنبيه.` : ""}`,
    confirmLabel: "انشر",
  });
  if (!sure) return;
  review.busy = true;
  const button = document.querySelector("#review [data-review-publish]");
  if (button) { button.disabled = true; button.classList.add("busy"); }
  UI.toast("جارٍ النشر…", "info", { id: "admin-note", duration: 0 });
  const done = await publishReview(review, section);
  review.busy = false;
  if (button) { button.disabled = false; button.classList.remove("busy"); }
  if (done) await closeReview(true);
}

// ---------- الأحداث ----------
function wireReview() {
  const host = document.getElementById("review");
  const rowOf = (node) => state.review?.rows.find((row) => row.id === node.closest("tr[data-row]")?.dataset.row);
  host.addEventListener("input", (event) => {
    const input = event.target.closest("[data-field]");
    if (!input || !state.review) return;
    const row = rowOf(input);
    if (!row) return;
    setReviewField(row, input.dataset.field, input.value, input.tagName === "SELECT" || input.type === "date");
    refreshReview();
  });
  host.addEventListener("change", (event) => {
    const review = state.review;
    if (!review) return;
    const input = event.target.closest("[data-field]");
    if (input) {
      const row = rowOf(input);
      if (!row) return;
      setReviewField(row, input.dataset.field, input.value, true);
      if (input.value !== row[input.dataset.field]) input.value = row[input.dataset.field];
      return refreshReview();
    }
    if (event.target.matches("[data-pick]")) { const row = rowOf(event.target); if (row) row.sel = event.target.checked; return refreshReview(); }
    if (event.target.matches("[data-pick-all]")) { review.rows.forEach((row) => { row.sel = event.target.checked; }); return redrawReviewBody(); }
    if (event.target.matches("[data-review-section]")) { review.sectionId = event.target.value; review.dirty = true; return; }
    if (event.target.matches("[data-bulk-field]")) return syncBulkList();
    if (event.target.matches("[data-review-only]")) { review.onlyIssues = event.target.checked; return redrawReviewBody(); }
    if (event.target.matches("[data-review-note]")) review.noteType = event.target.checked;
  });
  host.addEventListener("click", (event) => {
    const review = state.review;
    if (!review) return;
    if (event.target === host || event.target.closest("[data-review-close]")) return closeReview();
    if (event.target.closest("[data-review-publish]")) return confirmReview();
    if (event.target.closest("[data-review-next]")) return focusNextIssue();
    if (event.target.closest("[data-review-format]")) return reformatReview();
    if (event.target.closest("[data-review-ai]")) return runReviewAi();
    const variantButton = event.target.closest("[data-review-variant]");
    if (variantButton) return switchVariant(variantButton.dataset.reviewVariant);
    if (event.target.closest("button[data-review-only]")) { review.onlyIssues = false; return renderReview(); }
    const tab = event.target.closest("[data-review-tab]");
    if (tab) { review.tab = tab.dataset.reviewTab; return renderReview(); }
    if (event.target.closest("[data-row-add]")) {
      const last = review.rows[review.rows.length - 1];
      const row = reviewRow({ classNumber: last?.classNumber || "", day: last?.day || "" });
      review.rows.push(row);
      review.dirty = true;
      review.onlyIssues = false;
      review.tab = "edit";
      renderReview();
      const node = document.querySelector(`#review tr[data-row="${row.id}"] [data-field="${review.kind === "exams" ? "subject" : "start"}"]`);
      node?.scrollIntoView({ block: "center" });
      node?.focus({ preventScroll: true });
      return;
    }
    if (event.target.closest("[data-row-copy]")) {
      const row = rowOf(event.target);
      const index = review.rows.indexOf(row);
      review.rows.splice(index + 1, 0, reviewRow({ ...row, id: undefined, sel: false }));
      review.rows[index + 1].id = `r${reviewSeq}`;
      review.dirty = true;
      return redrawReviewBody();
    }
    if (event.target.closest("[data-row-delete]")) {
      const row = rowOf(event.target);
      const index = review.rows.indexOf(row);
      review.rows.splice(index, 1);
      review.dirty = true;
      redrawReviewBody();
      const toast = UI.toast("الصف اتحذف. اضغط هنا للتراجع.", "info", { id: "review-undo", duration: 5000 });
      if (toast) toast.querySelector(".toast-msg").onclick = () => {
        if (!state.review) return;
        state.review.rows.splice(Math.min(index, state.review.rows.length), 0, row);
        redrawReviewBody();
        UI.toast("الصف رجع.", "success", { id: "review-undo", duration: 1800 });
      };
      return;
    }
    if (event.target.closest("[data-pick-delete]")) {
      const count = review.rows.filter((row) => row.sel).length;
      review.rows = review.rows.filter((row) => !row.sel);
      review.dirty = true;
      redrawReviewBody();
      return UI.toast(`اتحذف ${count} صف.`, "info", { id: "review" });
    }
    if (event.target.closest("[data-bulk-apply]")) {
      const field = host.querySelector("[data-bulk-field]").value;
      const value = normalizeField(field, host.querySelector("[data-bulk-value]").value);
      const picked = review.rows.filter((row) => row.sel);
      const targets = picked.length ? picked : review.rows;
      targets.forEach((row) => setReviewField(row, field, value, true));
      redrawReviewBody();
      return UI.toast(`اتطبّق على ${targets.length} صف.`, "success", { id: "review" });
    }
  });
  host.addEventListener("keydown", (event) => {
    if (!state.review) return;
    // Enter بينزل لنفس الحقل في الصف اللي تحته، زي الجداول
    if (event.key === "Enter" && event.target.matches("input[data-field]")) {
      event.preventDefault();
      const next = event.target.closest("tr").nextElementSibling?.querySelector(`[data-field="${event.target.dataset.field}"]`);
      event.target.dispatchEvent(new Event("change", { bubbles: true }));
      next?.focus();
      next?.select?.();
    }
    if (event.key === "Enter" && event.target.matches("[data-bulk-value]")) { event.preventDefault(); host.querySelector("[data-bulk-apply]").click(); }
  });
}
