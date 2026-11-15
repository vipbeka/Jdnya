// لوحة الإدارة — الأساس: الاتصال بـ Supabase، الحالة، الصلاحيات، وأدوات مشتركة.
const ROLE_LABEL = {
  super_admin: "سوبر أدمن",
  admin: "أدمن",
  editor: "محرر",
  viewer: "مشاهد",
  section_manager: "مسؤول شعبة",
};
const DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const TIMES = ["08:30", "09:45", "11:00", "12:15", "01:30", "02:45", "04:00", "05:15"];
const TIME_END = { "08:30": "09:40", "09:45": "10:55", "11:00": "12:10", "12:15": "01:25", "01:30": "02:40", "02:45": "03:55", "04:00": "05:10", "05:15": "06:25" };
const BASE_SECTIONS = [
  { id: "y1-mgmt-en", title: "إدارة إنجليزي", major: "إدارة أعمال", language: "إنجليزي", year: "1", year_label: "الفرقة الأولى", sort: 1 },
  { id: "y1-mgmt-ar", title: "إدارة عربي", major: "إدارة أعمال", language: "عربي", year: "1", year_label: "الفرقة الأولى", sort: 2 },
  { id: "y1-is-en", title: "نظم إنجليزي", major: "نظم المعلومات", language: "إنجليزي", year: "1", year_label: "الفرقة الأولى", sort: 2 },
  { id: "y1-is-ar", title: "نظم عربي", major: "نظم المعلومات", language: "عربي", year: "1", year_label: "الفرقة الأولى", sort: 3 },
  { id: "mgmt-en", title: "إدارة إنجليزي", major: "إدارة أعمال", language: "إنجليزي", year: "2", year_label: "الفرقة الثانية", sort: 4 },
  { id: "mgmt-ar", title: "إدارة عربي", major: "إدارة أعمال", language: "عربي", year: "2", year_label: "الفرقة الثانية", sort: 5 },
  { id: "is-en", title: "نظم إنجليزي", major: "نظم المعلومات", language: "إنجليزي", year: "2", year_label: "الفرقة الثانية", sort: 6 },
  { id: "is-ar", title: "نظم عربي", major: "نظم المعلومات", language: "عربي", year: "2", year_label: "الفرقة الثانية", sort: 7 },
];
const NAV = [
  ["home", "لوحة التحكم"],
  ["sections", "الشعب"],
  ["classes", "الفصول"],
  ["lectures", "المحاضرات"],
  ["exams", "الامتحانات"],
  ["about", "من نحن"],
  ["assistant", "مساعد جدولاوي"],
  ["notices", "التنبيهات والإعلانات"],
  ["settings", "إعدادات الموقع"],
  ["users", "المستخدمون"],
  ["log", "سجل التعديلات"],
  ["export", "رفع جدول"],
  ["groups", "جروبات الواتساب"],
  ["holidays", "الإجازات"],
  ["push", "الإشعارات"],
  ["insights", "الإحصائيات"],
];

const config = window.JADWALI_SUPABASE;
const client = supabase.createClient(config.url, config.key, {
  global: { fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }) },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: localStorage,
    storageKey: "jadwali-admin-auth",
  },
});
const state = {
  profile: null,
  panel: "home",
  settings: {},
  sections: [],
  classes: [],
  lectures: [],
  exams: [],
  announcements: [],
  users: [],
  logs: [],
  groups: [],
  visits: null,
  pushQueue: [],
  pushLog: [],
  pushStats: null,
  pushStatus: null,
  pushReady: true,
  usage: [],
  edit: null,
  note: "",
  bad: false,
  missing: false,
  openKeys: [],
  flash: "",
  pendingDelete: null,
  archiveView: null,
  archives: [],
  archiveMissing: false,
};

function clip(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    if (char === "&") return "&" + "amp;";
    if (char === "<") return "&" + "lt;";
    if (char === ">") return "&" + "gt;";
    if (char === '"') return "&" + "quot;";
    return "&" + "#39;";
  });
}
function role() { return state.profile?.role || "viewer"; }
function isSuper() { return role() === "super_admin"; }
function isStaff() { return role() !== "viewer"; }
function canRemove() { return ["super_admin", "admin", "section_manager"].includes(role()); }
function canSettings() { return isSuper() || role() === "admin"; }
function canAbout() { return canSettings(); }
function owns(sectionId) {
  return role() !== "section_manager" || sectionId === state.profile.section_id;
}
function norm(value) {
  return String(value || "").toLowerCase().replace(/[ً-ْٰ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();
}
function searchHits(raw) {
  const query = norm(raw);
  if (query.length < 1) return [];
  const tokens = query.split(" ").filter(Boolean);
  const match = (...parts) => {
    const hay = norm(parts.filter(Boolean).join(" "));
    return tokens.every((token) => hay.includes(token));
  };
  const hits = [];
  visibleSections().forEach((section) => {
    if (!match(section.title, section.year_label, section.major, section.language)) return;
    hits.push({ panel: "sections", title: `${section.year_label} · ${section.title}`, meta: "شعبة", id: section.id, open: section.id, exact: norm(section.title) === query });
  });
  visibleClasses().forEach((klass) => {
    if (!match("فصل", klass.class_number, sectionTitle(klass.section_id), klass.group_name)) return;
    hits.push({ panel: "lectures", title: `${sectionTitle(klass.section_id)} · فصل ${klass.class_number}`, meta: "فصل", id: klass.id, open: `${klass.section_id},${klass.id}`, exact: norm(klass.class_number) === query });
  });
  state.lectures.forEach((item) => {
    const klass = state.classes.find((row) => row.id === item.class_id);
    if (!klass || !owns(klass.section_id)) return;
    if (!match(item.subject, item.instructor, item.room, item.day, klass.class_number, sectionTitle(klass.section_id))) return;
    hits.push({ panel: "lectures", title: item.subject, meta: `${sectionTitle(klass.section_id)} · فصل ${klass.class_number} · ${item.day} ${item.start_time}`, id: item.id, open: `${klass.section_id},${klass.id}`, exact: norm(item.subject) === query });
  });
  state.exams.filter((item) => !item.section_id || owns(item.section_id)).forEach((item) => {
    if (!match(item.title, item.subject, item.room, sectionTitle(item.section_id), item.class_number)) return;
    hits.push({ panel: "exams", title: item.title, meta: `امتحان · ${sectionTitle(item.section_id) || "كل الشعب"}`, id: item.id, open: "", exact: false });
  });
  if (isSuper()) {
    state.announcements.forEach((item) => {
      if (match(item.title, item.body)) hits.push({ panel: "notices", title: item.title, meta: "إعلان", id: item.id, open: "", exact: false });
    });
    state.users.forEach((user) => {
      if (match(user.email, ROLE_LABEL[user.role], sectionTitle(user.section_id))) hits.push({ panel: "users", title: user.email, meta: ROLE_LABEL[user.role] || "مستخدم", id: user.id, open: "", exact: false });
    });
  }
  (state.groups || []).filter((item) => canSettings() && owns(item.section_id)).forEach((item) => {
    if (!match(item.label, item.class_number, sectionTitle(item.section_id))) return;
    hits.push({ panel: "groups", title: item.label, meta: `جروب · ${sectionTitle(item.section_id)} · فصل ${item.class_number}`, id: item.id, open: "", exact: false });
  });
  return hits.sort((a, b) => Number(b.exact) - Number(a.exact)).slice(0, 8);
}
function renderHits() {
  const box = document.getElementById("search-hits");
  const input = document.getElementById("admin-search");
  if (!box || !input) return;
  const hits = searchHits(input.value);
  box.hidden = !input.value.trim() || !hits.length;
  box.innerHTML = hits.map((hit) => `<button type="button" class="hit" data-hit="${esc(hit.panel)}" data-open="${esc(hit.open)}" data-id="${esc(hit.id)}"><b>${esc(hit.title)}</b><small>${esc(hit.meta)}</small></button>`).join("");
  if (input.value.trim() && !hits.length) {
    box.hidden = false;
    box.innerHTML = `<p class="muted hit-none">مفيش نتيجة.</p>`;
  }
}
function deleteText(kind, id) {
  if (kind === "kb") return `هيتحذف سؤال «${kbEntries()[Number(id)]?.q || ""}» من مساعد جدولاوي.`;
  if (kind === "lectures") {
    const item = state.lectures.find((row) => row.id === id);
    const klass = state.classes.find((row) => row.id === item?.class_id);
    return item ? `هتتحذف محاضرة «${item.subject}» يوم ${item.day} الساعة ${item.start_time}${klass ? ` من ${classLabel(klass)}` : ""}.` : "هتتحذف المحاضرة دي.";
  }
  if (kind === "class-lectures") {
    const klass = state.classes.find((row) => row.id === id);
    const count = state.lectures.filter((row) => row.class_id === id).length;
    return klass ? `هتتحذف محاضرات فصل ${klass.class_number} في ${sectionTitle(klass.section_id)}. العدد: ${count}. الفصل نفسه هيفضل موجود.` : "هتتحذف محاضرات الفصل.";
  }
  if (kind === "classes") {
    const item = state.classes.find((row) => row.id === id);
    const count = state.lectures.filter((row) => row.class_id === id).length;
    return item ? `هيتحذف فصل ${item.class_number} من ${sectionTitle(item.section_id)}، ومعاه ${count} محاضرة.` : "هيتحذف الفصل.";
  }
  if (kind === "sections") {
    const item = state.sections.find((row) => row.id === id);
    const classCount = state.classes.filter((row) => row.section_id === id).length;
    return item ? `هتتحذف شعبة «${item.year_label} · ${item.title}» ومعاها ${classCount} فصل وكل محاضراتهم.` : "هتتحذف الشعبة.";
  }
  if (kind === "exams") {
    const item = state.exams.find((row) => row.id === id);
    return item ? `هيتحذف امتحان «${item.title}»${item.exam_date ? ` بتاريخ ${item.exam_date}` : ""}.` : "هيتحذف الامتحان.";
  }
  if (kind === "announcements") {
    const item = state.announcements.find((row) => row.id === id);
    return item ? `هيتحذف إعلان «${item.title}» من صفحة الطلبة.` : "هيتحذف الإعلان.";
  }
  if (kind === "groups") {
    const item = (state.groups || []).find((row) => row.id === id);
    return item ? `هيتحذف جروب «${item.label}» لفصل ${item.class_number}، والزر هيختفي من يوم الطلبة.` : "هيتحذف الجروب.";
  }
  if (kind === "holidays") {
    const item = (state.holidays || []).find((row) => row.id === id);
    return item ? `هتتحذف إجازة «${item.name}» يوم ${item.holiday_date}، والمحاضرات ترجع تظهر اليوم ده.` : "هتتحذف الإجازة.";
  }
  if (kind === "users") {
    const user = state.users.find((row) => row.id === id);
    return user ? `هيتحذف حساب ${user.email} ومش هيقدر يدخل اللوحة.` : "هيتحذف المستخدم.";
  }
  return "هيتحذف العنصر ده.";
}
function askDelete(kind, id) {
  state.pendingDelete = { kind, id };
  document.getElementById("confirm-text").textContent = deleteText(kind, id);
  document.getElementById("confirm").hidden = false;
}
function sectionMeta(id) {
  const section = state.sections.find((item) => item.id === id);
  if (!section) return { title: id || "—", year: "", cls: "" };
  const second = String(section.year) === "2" || /ثاني/.test(section.year_label || "");
  return { title: section.title || id, year: second ? "تانية" : "أولى", cls: second ? "y2" : "y1", sort: Number(section.sort || section.year || 9) };
}
function sectionTitle(id) {
  const meta = sectionMeta(id);
  return meta.year ? `${meta.title} · ${meta.year}` : meta.title;
}
function yearTag(id) {
  const meta = sectionMeta(id);
  return meta.year ? `<span class="year-tag ${meta.cls}">${meta.year}</span>` : "";
}
function classLabel(row) {
  return `${sectionTitle(row.section_id)} · فصل ${row.class_number}`;
}
function options(list, value, placeholder) {
  return `${placeholder ? `<option value="">${placeholder}</option>` : ""}${list.map(([id, label]) => `<option value="${esc(id)}" ${String(value ?? "") === String(id) ? "selected" : ""}>${esc(label)}</option>`).join("")}`;
}
function visibleSections() {
  return role() === "section_manager" ? state.sections.filter((item) => item.id === state.profile.section_id) : state.sections;
}
function visibleClasses() {
  const rows = role() === "section_manager" ? state.classes.filter((item) => item.section_id === state.profile.section_id) : state.classes;
  return rows.slice().sort((a, b) => sectionMeta(a.section_id).sort - sectionMeta(b.section_id).sort || Number(a.class_number) - Number(b.class_number));
}
function field(label, name, value, extra = "") {
  return `<label>${label}<input name="${name}" value="${esc(value ?? "")}" ${extra} /></label>`;
}
function actions(kind, id) {
  const edit = isStaff() ? `<button type="button" class="ghost" data-edit="${kind}" data-id="${id}">تعديل</button>` : "";
  const remove = canRemove() ? `<button type="button" class="ghost danger" data-delete="${kind}" data-id="${id}">حذف</button>` : "";
  return `${edit} ${remove}`;
}
function table(headers, rows) {
  if (!rows) return UI.empty({ art: "inbox", title: "لسه مفيش بيانات", text: "أول ما تضيف عنصر هيظهر هنا." });
  // فلتر سريع للجداول الطويلة
  const long = (rows.match(/<tr/g) || []).length > 6;
  const tools = long ? `<div class="table-tools"><label class="finder-box">${icon("search", 16)}<input type="search" data-table-filter placeholder="فلترة سريعة في الجدول" autocomplete="off" aria-label="فلترة الجدول" /></label><span class="muted small" data-table-count></span></div>` : "";
  return `<div class="table-block">${tools}<div class="table-wrap"><table><thead><tr>${headers.map((item) => `<th>${item}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div><p class="table-none muted" hidden>مفيش صف مطابق للفلتر.</p></div>`;
}

async function log(action, entity, summary) {
  await client.from("activity_log").insert({
    actor_id: state.profile.id,
    actor_email: state.profile.email,
    action,
    entity,
    summary,
  });
}
function fail(error) {
  const text = `${error?.message || ""} ${error?.code || ""}`;
  if (/schema cache|does not exist|PGRST205|42P01/i.test(text)) {
    state.missing = true;
    state.note = "شغّل ملف sql/extras.sql مرة واحدة من محرر SQL في سوبا بيس، وبعدين حدّث الصفحة.";
  } else {
    state.note = error?.message ? `العملية ما تمتش: ${error.message}` : "العملية ما تمتش. تأكد من الصلاحية.";
  }
  state.bad = true;
  draw();
}
async function write(query) {
  const result = await query.select();
  if (result.error || !result.data?.length) {
    fail(result.error || { message: "الحفظ ما اتسجلش. ادخل بحساب سوبر أدمن." });
    return null;
  }
  return result.data;
}
async function markPublished() {
  const result = await client.from("settings").update({
    publish_timetables: true,
    updated_at: new Date().toISOString(),
  }).eq("id", "public").select("publish_timetables");
  if (result.error || !result.data?.length) return false;
  state.settings.publish_timetables = true;
  return true;
}

async function fetchAll(table, column) {
  const rows = [];
  for (let from = 0; from < 20000; from += 1000) {
    let query = client.from(table).select("*").range(from, from + 999);
    if (column) query = query.order(column);
    const result = await query;
    if (result.error) throw result.error;
    rows.push(...(result.data || []));
    if (!result.data || result.data.length < 1000) break;
  }
  return rows;
}
async function loadAll() {
  const settings = await client.from("settings").select("*").eq("id", "public").maybeSingle();
  if (settings.error) throw settings.error;
  state.settings = settings.data || {};
  const jobs = await Promise.all([
    fetchAll("sections", "sort"),
    fetchAll("classes", "class_number"),
    fetchAll("lectures", "id"),
    fetchAll("exams", "exam_date"),
    fetchAll("announcements", "created_at"),
  ]);
  const names = ["sections", "classes", "lectures", "exams", "announcements"];
  names.forEach((name, index) => {
    state[name] = jobs[index] || [];
  });
  state.announcements.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  if (isSuper()) {
    const users = await client.from("profiles").select("*").order("created_at");
    if (users.error) throw users.error;
    state.users = users.data || [];
    const logs = await client.from("activity_log").select("*").order("created_at", { ascending: false }).limit(80);
    state.logs = logs.error ? [] : logs.data || [];
    const stats = await client.from("stats").select("visits").eq("id", "public").maybeSingle();
    state.visits = stats.error ? null : Number(stats.data?.visits || 0);
  }
  const groups = await client.from("class_groups").select("*").order("class_number");
  state.groups = groups.error ? [] : groups.data || [];
  const holidays = await client.from("holidays").select("*").order("holiday_date");
  state.holidays = holidays.error ? [] : holidays.data || [];
  const archives = await client.from("term_archives").select("id,academic_year,term,label,lecture_count,exam_count,announcement_count,holiday_count,created_at").order("created_at", { ascending: false });
  state.archiveMissing = !!archives.error;
  state.archives = archives.error ? [] : archives.data || [];
  state.pushQueue = [];
  state.pushLog = [];
  state.pushStats = null;
  state.usage = [];
  if (isStaff()) {
    const queue = await client.from("push_queue").select("id,section_id,class_number,kind").limit(5000);
    state.pushReady = !queue.error;
    state.pushQueue = queue.error ? [] : queue.data || [];
  }
  if (canSettings() && state.pushReady) {
    const history = await client.from("push_log").select("*").order("created_at", { ascending: false }).limit(25);
    state.pushLog = history.error ? [] : history.data || [];
    const stats = await client.rpc("push_stats");
    state.pushStats = stats.error ? null : stats.data;
    const since = new Date(Date.now() - 30 * 864e5).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
    const usage = await client.from("usage_stats").select("*").gte("day", since).limit(5000);
    state.usage = usage.error ? [] : usage.data || [];
  }
  state.missing = false;
}

