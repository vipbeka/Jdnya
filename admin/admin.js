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
    box.innerHTML = `<p class="muted" style="padding:12px 14px">مفيش نتيجة.</p>`;
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
  if (!rows) return `<p class="muted">لسه مفيش بيانات.</p>`;
  return `<div class="table-wrap"><table><thead><tr>${headers.map((item) => `<th>${item}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
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
  return `<p class="kicker">رفع جدول</p><h1>رفع محاضرات أو امتحانات</h1>
    <p class="lead">ارفع PDF الجدول مرة واحدة. اختَر جدول محاضرات، والشعبة، واكتب رقم الفصل. الملف لازم يكون فيه نص مش صورة متصورة، والخطوط والمواعيد ظاهرة.</p>
    <form id="upload-form">
      <label class="check"><input type="radio" name="upload-kind" value="lectures" checked /> جدول محاضرات</label>
      <label class="check"><input type="radio" name="upload-kind" value="exams" /> جدول امتحانات</label>
      <label>الشعبة<select id="upload-section">${sections.map((item) => `<option value="${esc(item.id)}" ${item.id === sectionId ? "selected" : ""}>${esc(item.year_label)} · ${esc(item.title)}</option>`).join("")}</select></label>
      <label>الفصل<input id="upload-class" list="class-list" placeholder="رقم الفصل، مثال 5" /></label>
      <datalist id="class-list">${classes.map((item) => `<option value="${esc(item)}"></option>`).join("")}</datalist>
      <label class="drop" id="upload-drop">اسحب PDF أو صورة الجدول هنا<input id="upload-file" type="file" accept=".xlsx,.xls,.csv,.pdf,application/pdf,image/jpeg,image/png,image/webp" required /></label>
      <div class="row"><button class="btn" id="upload-publish" type="button" disabled>نشر الجدول على الموقع</button></div>
    </form>
    <div id="upload-preview"></div>
    <p class="muted">مش محتاج تنسّق الملف. لو الجدول صورة جوه الـ PDF هيحاول يقرأها. راجع المعاينة قبل النشر.</p>`;
}

const SCREENS = { home, sections: sectionsPanel, classes: classesPanel, lectures: lecturesPanel, exams: examsPanel, about: aboutPanel, assistant: assistantPanel, notices: noticesPanel, settings: settingsPanel, users: usersPanel, log: logPanel, export: exportPanel, groups: groupsPanel, holidays: holidaysPanel, push: pushPanel, insights: insightsPanel };

function draw() {
  if (["users", "about", "assistant", "notices", "log"].includes(state.panel) && !isSuper()) state.panel = "home";
  if (state.panel === "insights" && !canSettings()) state.panel = "home";
  if (state.panel === "push" && !isStaff()) state.panel = "home";
  nav();
  document.title = `${pageTitle()} — جدولي`;
  closeMenu();
  const banner = state.missing ? `<p class="banner">${esc(state.note)}</p>` : "";
  const note = !state.missing && state.note ? `<p class="note${state.bad ? " bad" : ""}">${esc(state.note)}</p>` : "";
  document.getElementById("screen").innerHTML = `${banner}${state.panel === "push" ? "" : pendingBanner()}${SCREENS[state.panel]?.() || home()}${note}`;
}

async function reload(message) {
  state.note = message || "";
  state.bad = false;
  state.edit = null;
  await client.from("settings").update({ updated_at: new Date().toISOString() }).eq("id", "public");
  try { await loadAll(); } catch (error) { fail(error); }
  draw();
}

function valueOf(form, name) {
  return String(new FormData(form).get(name) ?? "").trim();
}

async function saveSection(form) {
  const payload = {
    id: valueOf(form, "id"),
    title: valueOf(form, "title"),
    major: valueOf(form, "major"),
    language: valueOf(form, "language"),
    year: valueOf(form, "year"),
    year_label: valueOf(form, "year_label"),
  };
  if (!owns(payload.id)) return;
  const exists = state.sections.some((item) => item.id === payload.id);
  const saved = await write(exists
    ? client.from("sections").update(payload).eq("id", payload.id)
    : client.from("sections").insert(payload));
  if (!saved) return;
  await markPublished();
  await log(exists ? "تعديل" : "إضافة", "شعبة", payload.title);
  await reload("الشعبة اتحفظت وظهرت على الموقع.");
}
async function saveClass(form) {
  const id = valueOf(form, "id");
  const payload = { section_id: valueOf(form, "section_id"), class_number: clip(valueOf(form, "class_number"), 12), group_name: clip(valueOf(form, "group_name"), 40) };
  if (!owns(payload.section_id)) return;
  const saved = await write(id
    ? client.from("classes").update(payload).eq("id", id)
    : client.from("classes").insert(payload));
  if (!saved) return;
  await markPublished();
  await log(id ? "تعديل" : "إضافة", "فصل", `${payload.class_number}`);
  await reload("الفصل اتحفظ وظهر على الموقع.");
}
async function touchClass(classId) {
  if (!classId) return;
  await client.from("classes").update({ revised_at: new Date().toISOString() }).eq("id", classId);
}
async function saveLecture(form) {
  const id = valueOf(form, "id");
  const start = valueOf(form, "start_time");
  const payload = {
    class_id: valueOf(form, "class_id"),
    day: valueOf(form, "day"),
    start_time: start,
    end_time: TIME_END[start] || "",
    subject: clip(valueOf(form, "subject"), 120),
    instructor: clip(valueOf(form, "instructor"), 80),
    room: clip(valueOf(form, "room"), 40),
    status: ["active", "cancelled", "moved"].includes(valueOf(form, "status")) ? valueOf(form, "status") : "active",
    note: clip(valueOf(form, "note"), 160),
    moved_day: valueOf(form, "status") === "moved" ? valueOf(form, "moved_day") : "",
    moved_start: valueOf(form, "status") === "moved" ? valueOf(form, "moved_start") : "",
  };
  const sectionId = state.classes.find((item) => item.id === payload.class_id)?.section_id;
  if (!owns(sectionId)) return;
  const saved = await write(id ? client.from("lectures").update(payload).eq("id", id) : client.from("lectures").insert(payload));
  if (!saved) return;
  await touchClass(payload.class_id);
  await markPublished();
  await log(id ? "تعديل" : "إضافة", "محاضرة", payload.subject);
  await reload("المحاضرة اتحفظت وظهرت في جدول الفصل.");
}
async function saveHoliday(form) {
  if (!canSettings()) return;
  const payload = { holiday_date: valueOf(form, "holiday_date"), name: clip(valueOf(form, "name"), 80) };
  const saved = await write(client.from("holidays").insert(payload));
  if (!saved) return;
  await log("إضافة", "إجازة", `${payload.holiday_date} ${payload.name}`);
  await reload("الإجازة اتضافت وهتختفي من يوم الطلبة.");
}
async function saveExam(form) {
  const id = valueOf(form, "id");
  const payload = {
    title: clip(valueOf(form, "title"), 120),
    subject: clip(valueOf(form, "subject"), 120),
    section_id: valueOf(form, "section_id") || null,
    class_number: clip(valueOf(form, "class_number"), 12),
    exam_date: valueOf(form, "exam_date") || null,
    start_time: valueOf(form, "start_time"),
    end_time: valueOf(form, "end_time"),
    room: clip(valueOf(form, "room"), 40),
    notes: clip(valueOf(form, "notes"), 200),
  };
  if (payload.section_id && !owns(payload.section_id)) return;
  const saved = await write(id ? client.from("exams").update(payload).eq("id", id) : client.from("exams").insert(payload));
  if (!saved) return;
  await markPublished();
  await log(id ? "تعديل" : "إضافة", "امتحان", payload.title);
  await reload("الامتحان اتحفظ وظهر في صفحة الامتحانات.");
}
async function writeKb(entries, message) {
  const text = entries.map((item) => `${item.q.replace(/\|/g, "/")} | ${item.a}`).join("\n");
  const result = await client.from("settings").update({ assistant_kb: text, updated_at: new Date().toISOString() }).eq("id", "public");
  if (result.error) return fail(/assistant_kb/.test(result.error.message || "") ? { message: "شغّل ملف sql/assistant_kb.sql مرة واحدة من محرر SQL في سوبا بيس، وبعدين جرّب تاني." } : result.error);
  await log("تعديل", "اسأل جدولي", message);
  await reload(message);
}
async function saveKb(form) {
  if (!isSuper()) return;
  const q = clip(valueOf(form, "q"), 120);
  const a = clip(valueOf(form, "a"), 300);
  if (!q || !a) return;
  const entries = kbEntries();
  const at = valueOf(form, "index");
  if (at !== "" && entries[Number(at)]) {
    entries[Number(at)] = { q, a };
    return writeKb(entries, "السؤال اتعدّل.");
  }
  if (entries.length >= 40) return fail({ message: "وصلت للحد الأقصى 40 سؤال. احذف سؤال قبل ما تضيف." });
  entries.push({ q, a });
  return writeKb(entries, "السؤال اتضاف.");
}
async function removeKb(id) {
  if (!isSuper()) return;
  const entries = kbEntries();
  if (!entries[Number(id)]) return;
  entries.splice(Number(id), 1);
  return writeKb(entries, "السؤال اتحذف.");
}
async function saveAbout(form) {
  if (!isSuper()) return;
  const payload = {
    about_lead: valueOf(form, "about_lead"),
    about_why: valueOf(form, "about_why"),
    programmer_name: valueOf(form, "programmer_name"),
    whatsapp: valueOf(form, "whatsapp"),
    portfolio: valueOf(form, "portfolio"),
    updated_at: new Date().toISOString(),
  };
  const result = await client.from("settings").update(payload).eq("id", "public");
  if (result.error) return fail(result.error);
  await log("تعديل", "من نحن", "تحديث صفحة من نحن");
  await reload("صفحة من نحن اتحفظت.");
}
function safeLink(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (url.username || url.password) return "";
    return url.href;
  } catch {
    return "";
  }
}
async function uploadAnnouncementImage(file) {
  if (!file) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("الصورة لازم تكون JPG أو PNG أو WebP");
  if (file.size > 1500000) throw new Error("الصورة أكبر من 1.5 ميجا");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const uploaded = await client.storage.from("announcements").upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) throw new Error("رفع الصورة ما تمش. شغّل sql/announce.sql مرة واحدة.");
  return client.storage.from("announcements").getPublicUrl(path).data.publicUrl;
}
async function saveGroup(form) {
  if (!canSettings()) return;
  const sectionId = valueOf(form, "section_id");
  const classNumber = valueOf(form, "class_number").replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit)).trim();
  const label = valueOf(form, "label");
  const url = valueOf(form, "url").trim();
  let host = "";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { host = ""; }
  if (!["chat.whatsapp.com", "wa.me", "whatsapp.com"].includes(host)) {
    state.note = "حط رابط جروب واتساب، زي https://chat.whatsapp.com/…";
    state.bad = true;
    draw();
    return;
  }
  const saved = await write(client.from("class_groups").upsert({
    section_id: sectionId,
    class_number: classNumber,
    label,
    url,
  }, { onConflict: "section_id,class_number" }));
  if (!saved) return;
  await log("حفظ", "جروب", `${sectionId} · فصل ${classNumber}`);
  await reload("الجروب ظهر في يوم الطالب.");
}
async function saveNotice(form) {
  if (!isSuper()) return;
  const id = valueOf(form, "id");
  const linkLabel = valueOf(form, "link_label");
  const linkUrl = safeLink(valueOf(form, "link_url"));
  if (valueOf(form, "link_url") && !linkUrl) {
    state.note = "الرابط لازم يبدأ بـ http أو https.";
    state.bad = true;
    draw();
    return;
  }
  if ((linkLabel && !linkUrl) || (!linkLabel && linkUrl)) {
    state.note = "اكتب نص الزر والرابط مع بعض.";
    state.bad = true;
    draw();
    return;
  }
  let imageUrl = form.querySelector("[name=remove_image]")?.checked ? "" : safeLink(valueOf(form, "image_url"));
  const file = form.querySelector("[name=image]")?.files?.[0];
  if (file) {
    try { imageUrl = await uploadAnnouncementImage(file); }
    catch (error) { return fail(error); }
  }
  const payload = {
    title: clip(valueOf(form, "title"), 120),
    body: clip(valueOf(form, "body"), 600),
    published: form.querySelector("[name=published]").checked,
    image_url: imageUrl,
    link_label: linkLabel,
    link_url: linkUrl,
    audience: ["all", "section", "class"].includes(valueOf(form, "audience")) ? valueOf(form, "audience") : "all",
    section_id: valueOf(form, "audience") === "all" ? null : (valueOf(form, "section_id") || null),
    class_number: valueOf(form, "audience") === "class" ? clip(valueOf(form, "class_number"), 12) : "",
  };
  if (payload.audience !== "all" && !payload.section_id) {
    state.note = "اختار الشعبة، أو خلّي الإعلان لكل الطلبة.";
    state.bad = true;
    draw();
    return;
  }
  if (payload.audience === "class" && !payload.class_number) {
    state.note = "اكتب رقم الفصل، أو خلّي الإعلان للشعبة كلها.";
    state.bad = true;
    draw();
    return;
  }
  const saved = await write(id ? client.from("announcements").update(payload).eq("id", id) : client.from("announcements").insert(payload));
  if (!saved) return;
  await log(id ? "تعديل" : "إضافة", "إعلان", payload.title);
  let message = "الإعلان ظهر في صفحة الطلبة.";
  if (form.querySelector("[name=push]")?.checked && payload.published) {
    const out = await callPush({ mode: "announcement", id: id || saved[0].id });
    message += out?.ok ? ` وبعتنا إشعار لـ ${out.sent} جهاز.` : ` لكن الإشعار ما اتبعتش: ${pushError(out)}`;
  }
  await reload(message);
}
async function wipeRows(table) {
  for (let round = 0; round < 50; round += 1) {
    const page = await client.from(table).select("id").limit(200);
    if (page.error) return page.error;
    const ids = (page.data || []).map((row) => row.id);
    if (!ids.length) return null;
    const removed = await client.from(table).delete().in("id", ids);
    if (removed.error) return removed.error;
  }
  return { message: `مسح ${table} ما اكتملش.` };
}
async function archiveTerm(nextTerm) {
  const term = state.settings.term || "الترم الأول";
  const year = state.settings.academic_year || "";
  const lectures = state.lectures.map((item) => {
    const klass = state.classes.find((row) => row.id === item.class_id);
    return {
      section: sectionTitle(klass?.section_id),
      section_id: klass?.section_id || "",
      class_number: klass?.class_number || "",
      day: item.day,
      start_time: item.start_time,
      end_time: item.end_time,
      subject: item.subject,
      instructor: item.instructor || "",
      room: item.room || "",
      status: item.status || "active",
      note: item.note || "",
      moved_day: item.moved_day || "",
      moved_start: item.moved_start || "",
    };
  });
  const exams = state.exams.map((item) => ({
    title: item.title,
    subject: item.subject || "",
    exam_date: item.exam_date || "",
    start_time: item.start_time || "",
    end_time: item.end_time || "",
    room: item.room || "",
    notes: item.notes || "",
    section: item.section_id ? sectionTitle(item.section_id) : "كل الشعب",
    section_id: item.section_id || "",
    class_number: item.class_number || "",
  }));
  const announcements = state.announcements.map((item) => ({
    title: item.title,
    body: item.body || "",
    audience: item.audience || "all",
    section_id: item.section_id || "",
    class_number: item.class_number || "",
    link_url: item.link_url || "",
    image_url: item.image_url || "",
  }));
  const holidays = (state.holidays || []).map((item) => ({ holiday_date: item.holiday_date, name: item.name }));
  state.note = "جارٍ أرشفة الترم…";
  state.bad = false;
  draw();
  const saved = await client.from("term_archives").insert({
    academic_year: year,
    term,
    label: `${term} · ${year}`.trim(),
    snapshot: { lectures, exams, announcements, holidays },
    lecture_count: lectures.length,
    exam_count: exams.length,
    announcement_count: announcements.length,
    holiday_count: holidays.length,
    archived_by: state.profile?.email || "",
  });
  if (saved.error) {
    state.archiveMissing = /schema cache|does not exist|PGRST205|42P01|ignore_bundle/i.test(saved.error.message || "");
    return fail(saved.error.message ? { message: `${saved.error.message} — شغّل sql/archive.sql الأول.` } : saved.error);
  }
  const wiped = await wipeRows("exams") || await wipeRows("announcements") || await wipeRows("holidays") || await wipeRows("lectures");
  if (wiped) return fail(wiped);
  await client.from("push_queue").delete().not("id", "is", null);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  const settings = await client.from("settings").update({
    term: nextTerm,
    exam_mode: false,
    ignore_bundle: true,
    publish_timetables: true,
    last_review: today,
    updated_at: new Date().toISOString(),
  }).eq("id", "public");
  if (settings.error) return fail({ message: `${settings.error.message} — شغّل sql/archive.sql عشان عمود الترم الجديد.` });
  await log("أرشفة", "ترم", `${term} ← ${nextTerm}`);
  state.archiveView = null;
  await reload(`اتأرشف ${term}. موقع الطلبة بقى على ${nextTerm} ومن غير جدول ولا امتحانات لحد ما ترفع الجديد.`);
}
function askArchive() {
  const nextTerm = document.getElementById("next-term")?.value.trim();
  if (!nextTerm) return fail({ message: "اكتب اسم الترم الجديد قبل الأرشفة." });
  const current = state.settings.term || "الترم الأول";
  state.pendingDelete = { kind: "archive", id: nextTerm };
  document.getElementById("confirm-title").textContent = "أرشفة الترم";
  document.getElementById("confirm-text").textContent = `هيتحفظ ${current}: ${state.lectures.length} محاضرة، ${state.exams.length} امتحان، ${state.announcements.length} إعلان، و${(state.holidays || []).length} إجازة. بعد كده يختفوا من موقع الطلبة، والترم يبقى «${nextTerm}».`;
  document.getElementById("confirm-yes").textContent = "نعم، أرشف الترم";
  document.getElementById("confirm").hidden = false;
}
async function saveSettings(form) {
  const payload = {
    academic_year: valueOf(form, "academic_year"),
    term: valueOf(form, "term") || "الترم الأول",
    last_review: valueOf(form, "last_review"),
    lead_minutes: Math.min(60, Math.max(1, Number(valueOf(form, "lead_minutes")) || 10)),
    publish_timetables: canSettings() ? !!form.querySelector("[name=publish_timetables]")?.checked : !!state.settings.publish_timetables,
    exam_mode: canSettings() ? !!form.querySelector("[name=exam_mode]")?.checked : !!state.settings.exam_mode,
    updated_at: new Date().toISOString(),
  };
  const result = await client.from("settings").update(payload).eq("id", "public");
  if (result.error) return fail(result.error);
  await log("تعديل", "إعدادات", `العام ${payload.academic_year}`);
  await reload("الإعدادات اتحفظت.");
}

async function createUser(form) {
  const email = valueOf(form, "email");
  const password = valueOf(form, "password");
  const nextRole = valueOf(form, "role");
  const sectionId = nextRole === "section_manager" ? (valueOf(form, "section_id") || null) : null;
  if (nextRole === "section_manager" && !sectionId) return fail({ message: "مسؤول الشعبة لازم تختار له شعبة. غير كده الحساب يشوف كل الشعب." });
  const memory = {};
  const maker = supabase.createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => memory[key] ?? null,
        setItem: (key, value) => { memory[key] = value; },
        removeItem: (key) => { delete memory[key]; },
      },
    },
    global: { fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }) },
  });
  const created = await maker.auth.signUp({ email, password });
  if (created.error || !created.data.user) return fail(created.error || { message: "تعذر إنشاء المستخدم" });
  const id = created.data.user.id;
  let saved = false;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const result = await client.from("profiles").update({ role: nextRole, section_id: nextRole === "section_manager" ? sectionId : null, email, active: true }).eq("id", id).select("id");
    if (!result.error && result.data?.length) { saved = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  if (!saved) return fail({ message: "المستخدم اتعمل لكن الدور ما ترتّبش. جرّب الحفظ من الجدول." });
  await log("إضافة", "مستخدم", email);
  await reload("المستخدم اتضاف. لو تفعيل البريد شغّال في سوبا بيس لازم يأكده.");
}

async function remove(kind, id) {
  if (kind === "kb") return removeKb(id);
  if (kind === "groups" && !canSettings()) return;
  if (!canRemove() && kind !== "groups") return;
  if (kind === "users") {
    if (id === state.profile.id) return;
    const result = await client.rpc("delete_user", { target: id });
    if (result.error) return fail(result.error);
    await log("حذف", "مستخدم", id);
    return reload("المستخدم اتحذف.");
  }
  if (kind === "class-lectures") {
    const removed = await client.from("lectures").delete().eq("class_id", id);
    if (removed.error) return fail(removed.error);
    await touchClass(id);
    await log("حذف", "محاضرات فصل", id);
    return reload("محاضرات الفصل اتحذفت.");
  }
  const classId = kind === "lectures" ? state.lectures.find((item) => item.id === id)?.class_id : "";
  const tableName = { sections: "sections", classes: "classes", lectures: "lectures", exams: "exams", announcements: "announcements", groups: "class_groups", holidays: "holidays" }[kind];
  if (!tableName) return;
  const result = await client.from(tableName).delete().eq("id", id);
  if (result.error) return fail(result.error);
  if (classId) await touchClass(classId);
  await log("حذف", kind, id);
  await reload("اتحذف.");
}

function cleanSlot(slot) {
  const day = DAYS.includes(slot.day) ? slot.day : "";
  const start = String(slot.start || "");
  const end = String(slot.end || "");
  const subject = String(slot.subject || "").replace(/\s+/g, " ").trim();
  const time = /^\d{2}:\d{2}$/;
  if (!day || !time.test(start) || !time.test(end)) return null;
  if (subject.length < 2 || subject.length > 80) return null;
  if (/^(lect|r|gr)\s*\d+$/i.test(subject)) return null;
  return {
    day,
    start_time: start,
    end_time: end,
    subject,
    instructor: String(slot.instructor || "").replace(/\s+/g, " ").trim(),
    room: String(slot.room || "").replace(/\s+/g, " ").trim(),
  };
}
async function importCurrent() {
  if (!window.JADWALI_CLASSES) return fail({ message: "ملف الجداول مش متحمّل" });
  state.note = "جارٍ الاستيراد…";
  state.bad = false;
  draw();
  const sections = await client.from("sections").upsert(BASE_SECTIONS);
  if (sections.error) return fail(sections.error);
  const classRows = window.JADWALI_CLASSES.map((item) => ({
    section_id: item.sectionId,
    class_number: String(item.classNumber),
    group_name: item.group || "",
  }));
  for (let index = 0; index < classRows.length; index += 200) {
    const saved = await client.from("classes").upsert(classRows.slice(index, index + 200), { onConflict: "section_id,class_number" });
    if (saved.error) return fail(saved.error);
  }
  const stored = await fetchAll("classes", "class_number");
  const byKey = new Map(stored.map((item) => [`${item.section_id}:${item.class_number}`, item.id]));
  const ids = [...new Set(classRows.map((item) => byKey.get(`${item.section_id}:${item.class_number}`)).filter(Boolean))];
  for (let index = 0; index < ids.length; index += 80) {
    const cleared = await client.from("lectures").delete().in("class_id", ids.slice(index, index + 80));
    if (cleared.error) return fail(cleared.error);
  }
  const lectures = [];
  const seen = new Set();
  window.JADWALI_CLASSES.forEach((item) => {
    const classId = byKey.get(`${item.sectionId}:${String(item.classNumber)}`);
    if (!classId) return;
    (item.slots || []).forEach((slot) => {
      const clean = cleanSlot(slot);
      if (!clean) return;
      const key = `${classId}|${clean.day}|${clean.start_time}`;
      if (seen.has(key)) return;
      seen.add(key);
      lectures.push({ class_id: classId, ...clean });
    });
  });
  for (let index = 0; index < lectures.length; index += 400) {
    const part = await client.from("lectures").insert(lectures.slice(index, index + 400));
    if (part.error) return fail(part.error);
  }
  await log("استيراد", "جداول", `${classRows.length} فصل · ${lectures.length} محاضرة`);
  await reload(`اتستورد ${classRows.length} فصل و${lectures.length} محاضرة، من غير تكرار. موقع الطلبة مش هيتغير غير بعد تفعيل النشر.`);
}

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[ً-ْٰ]/g, "")
    .replace(/[یى]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[أإآٱ]/g, "ا")
    .trim()
    .toLowerCase();
}
const ARABIC_WORDS = ["محاضرة", "امتحان", "مادة", "قاعة", "مدرج", "إدارة", "السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "دكتور", "الفصل", "شعبة", "أعمال", "مبادئ", "محاسبة", "تسويق", "اقتصاد", "قانون", "نهائي", "ميدتيرم"];
function reverseArabicRuns(value) {
  return String(value || "").replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, (run) => [...run].reverse().join(""));
}
function arabicScore(value) {
  return ARABIC_WORDS.reduce((score, word) => score + (String(value).includes(word) ? 1 : 0), 0);
}
function normalizeVisualLine(value) {
  const visual = String(value || "").replace(/\s+/g, " ").trim();
  if (!/[\u0600-\u06FF]/.test(visual)) return visual;
  const reversedRuns = reverseArabicRuns(visual);
  const reversedWords = visual.split(" ").reverse().join(" ");
  const reversedBoth = reverseArabicRuns(reversedWords);
  const reversedRunsWords = reversedRuns.split(" ").reverse().join(" ");
  return [visual, reversedRuns, reversedWords, reversedBoth, reversedRunsWords].sort((a, b) => arabicScore(b) - arabicScore(a))[0];
}
function latin(value) {
  return String(value || "").replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
}
function normalizeDay(value) {
  return findDay(value);
}
function findDay(value) {
  const direct = dayFrom(value);
  if (direct) return direct;
  return dayFrom(reverseArabicRuns(value));
}
function dayFrom(value) {
  const text = normalizeHeader(value).replace(/\s/g, "");
  const days = [
    ["السبت", "السبت"], ["سبت", "السبت"], ["saturday", "السبت"],
    ["الاحد", "الأحد"], ["الأحد", "الأحد"], ["sunday", "الأحد"],
    ["الاثنين", "الإثنين"], ["الإثنين", "الإثنين"], ["اثنين", "الإثنين"], ["monday", "الإثنين"],
    ["الثلاثاء", "الثلاثاء"], ["ثلاثاء", "الثلاثاء"], ["tuesday", "الثلاثاء"],
    ["الاربعاء", "الأربعاء"], ["الأربعاء", "الأربعاء"], ["اربعاء", "الأربعاء"], ["wednesday", "الأربعاء"],
    ["الخميس", "الخميس"], ["خميس", "الخميس"], ["thursday", "الخميس"],
  ];
  const hit = days.find(([key]) => text.includes(key.replace(/\s/g, "")));
  return hit ? hit[1] : "";
}
function dayHeader(value) {
  const day = findDay(value);
  if (!day) return "";
  const extra = normalizeHeader(value).replace(/السبت|الاحد|الأحد|الاثنين|الإثنين|اثنين|الثلاثاء|ثلاثاء|الاربعاء|الأربعاء|اربعاء|الخميس|خميس|saturday|sunday|monday|tuesday|wednesday|thursday|sat|sun|mon|tue|wed|thu/g, "").replace(/\s/g, "");
  return extra.length <= 3 ? day : "";
}
function cleanTime(value) {
  const text = latin(value);
  const match = text.match(/(\d{1,2})\s*[:.]\s*(\d{2})/);
  if (!match) return "";
  let hour = Number(match[1]);
  const minute = match[2];
  if (hour > 12 && hour <= 23) hour -= 12;
  if (hour === 0) hour = 12;
  if (hour > 12 || Number(minute) > 59) return "";
  return `${String(hour).padStart(2, "0")}:${minute}`;
}
function timeRange(value) {
  const text = latin(value);
  const times = [...text.matchAll(/(\d{1,2})\s*[:.]\s*(\d{2})/g)].map((match) => cleanTime(match[0])).filter(Boolean);
  return { start: times[0] || "", end: times[1] || TIME_END[times[0]] || "" };
}
function findClass(value) {
  const match = latin(value).match(/(?:فصل|مجموعة|مجموعه|class|group)\s*[:#.\-]?\s*(\d{1,3})/i);
  return match ? String(Number(match[1])) : "";
}
function findDate(value) {
  const text = latin(value);
  const iso = (year, month, day) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  let match = text.match(/(20\d{2})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*(\d{1,2})/);
  if (match) return iso(match[1], match[2], match[3]);
  match = text.match(/(\d{1,2})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*(20\d{2})/);
  if (match) return iso(match[3], match[2], match[1]);
  const months = { يناير: 1, فبراير: 2, مارس: 3, ابريل: 4, أبريل: 4, مايو: 5, يونيو: 6, يوليو: 7, اغسطس: 8, أغسطس: 8, سبتمبر: 9, اكتوبر: 10, أكتوبر: 10, نوفمبر: 11, ديسمبر: 12 };
  const named = Object.keys(months).find((name) => text.includes(name));
  if (!named) return "";
  const day = text.match(/(\d{1,2})/);
  const year = text.match(/20\d{2}/);
  if (!day) return "";
  return iso(year ? year[0] : "2026", months[named], day[1]);
}
function findRoom(value) {
  const match = String(value || "").match(/(?:قاع(?:ة|ه)?|مدرج|معمل|hall|room|lab)\s*[:#.\-]?\s*([A-Za-z0-9\u0600-\u06FF-]{1,14})/i);
  if (match) return match[1];
  const code = String(value || "").match(/\b[RHL]\d{2,3}\b/i);
  return code ? code[0].toUpperCase() : "";
}
function cleanSubject(value) {
  return stripMeta(value).replace(/\bLect\s*\d+\b/ig, " ").replace(/\b[RHL]\d{2,3}\b/ig, " ").replace(/\s+/g, " ").trim();
}
function stripMeta(value) {
  return String(value || "")
    .replace(/(?:فصل|مجموعة|مجموعه|class|group)\s*[:#.\-]?\s*\d{1,3}/ig, " ")
    .replace(/(?:قاع(?:ة|ه)?|مدرج|معمل|hall|room|lab)\s*[:#.\-]?\s*[A-Za-z0-9\u0600-\u06FF-]{1,14}/ig, " ")
    .replace(/20\d{2}\s*[-\/.]\s*\d{1,2}\s*[-\/.]\s*\d{1,2}/g, " ")
    .replace(/\d{1,2}\s*[-\/.]\s*\d{1,2}\s*[-\/.]\s*20\d{2}/g, " ")
    .replace(/\d{1,2}\s*[:.]\s*\d{2}/g, " ")
    .replace(/السبت|الأحد|الاحد|الإثنين|الاثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس/g, " ")
    .replace(/إلى|الى|من|–|—|->/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function lineOf(row) {
  return (Array.isArray(row) ? row : [row]).map((cell) => String(cell || "").trim()).filter(Boolean).join(" ");
}
function dedupeSlots(slots) {
  const seen = new Set();
  return slots.filter((slot) => {
    const key = `${slot.classNumber || ""}|${slot.day || ""}|${slot.date || ""}|${slot.start || ""}|${slot.subject}`;
    if (!slot.subject || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function parseLectures(rows) {
  const attempts = [parseGrid(rows), parseByHeader(rows), parseBlocks(rows), parseLoose(rows)];
  return attempts.sort((a, b) => b.length - a.length)[0] || [];
}
function parseGrid(rows) {
  const columns = parseDayColumns(rows);
  if (columns.length) return columns;
  return parseDayRows(rows);
}
function parseDayColumns(rows) {
  const headerIndex = rows.findIndex((row) => row.filter((cell) => dayHeader(cell)).length >= 2);
  if (headerIndex < 0) return [];
  const dayCols = rows[headerIndex].map((cell, index) => ({ index, day: dayHeader(cell) })).filter((item) => item.day);
  const slots = [];
  let classNumber = "";
  rows.forEach((row, index) => {
    const foundClass = findClass(lineOf(row));
    if (foundClass && lineOf(row).length < 40) classNumber = foundClass;
    if (index <= headerIndex) return;
    const range = timeRange(row.map((cell) => cell).find((cell) => cleanTime(cell) && !dayHeader(cell)) || "");
    if (!range.start) return;
    dayCols.forEach(({ index: column, day }) => {
      const raw = String(row[column] || "").trim();
      if (!raw || raw === "-" || raw === "—") return;
      const bits = splitCell(stripMeta(raw) || raw);
      if (!bits.subject || dayHeader(bits.subject)) return;
      slots.push({ day, start: range.start, end: range.end, classNumber, ...bits, room: bits.room || findRoom(raw) });
    });
  });
  return slots;
}
function parseDayRows(rows) {
  const dayRows = rows.map((row, index) => ({ index, day: dayHeader(row[0] || "") || row.map(dayHeader).find(Boolean) || "" })).filter((item) => item.day);
  if (dayRows.length < 2) return [];
  const header = rows.find((row) => row.filter((cell) => cleanTime(cell)).length >= 2) || [];
  const slots = [];
  dayRows.forEach(({ index, day }) => {
    const row = rows[index];
    header.forEach((cell, column) => {
      const range = timeRange(cell);
      if (!range.start || column >= row.length) return;
      const raw = String(row[column] || "").trim();
      if (!raw || dayHeader(raw)) return;
      const bits = splitCell(stripMeta(raw) || raw);
      if (bits.subject) slots.push({ day, start: range.start, end: range.end, ...bits, room: bits.room || findRoom(raw) });
    });
  });
  return slots;
}
function parseByHeader(rows, requireDay = true) {
  const headerIndex = rows.findIndex((row) => row.filter((cell) => HEADER_MAP[normalizeHeader(cell)]).length >= 2);
  if (headerIndex < 0) return [];
  const keys = rows[headerIndex].map((cell) => HEADER_MAP[normalizeHeader(cell)] || "");
  let classNumber = "";
  return rows.slice(headerIndex + 1).map((row) => {
    const foundClass = findClass(lineOf(row));
    if (foundClass && lineOf(row).length < 40) classNumber = foundClass;
    const item = {};
    keys.forEach((key, index) => { if (key) item[key] = row[index]; });
    const range = timeRange(item.time || `${item.start || ""} ${item.end || ""}`);
    const day = findDay(item.day);
    const subject = stripMeta(item.subject || item.title || "") || String(item.subject || item.title || "").trim();
    if (!subject || dayHeader(subject)) return null;
    if (requireDay && (!day || !range.start)) return null;
    return { day, start: range.start, end: range.end, subject, instructor: String(item.instructor || "").trim(), room: String(item.room || "").trim() || findRoom(lineOf(row)), date: findDate(item.date || lineOf(row)), notes: String(item.notes || "").trim(), classNumber: findClass(lineOf(row)) || classNumber };
  }).filter(Boolean);
}
function parseBlocks(rows) {
  const lines = rows.map(lineOf).filter(Boolean);
  let day = "";
  let classNumber = "";
  const slots = [];
  let current = null;
  const flush = () => {
    if (current?.subject && current.day && current.start) slots.push(current);
    current = null;
  };
  lines.forEach((line) => {
    const foundClass = findClass(line);
    if (foundClass && line.length < 36) { flush(); classNumber = foundClass; return; }
    const headerDay = dayHeader(line);
    if (headerDay && !cleanTime(line)) { flush(); day = headerDay; return; }
    const range = timeRange(line);
    const subject = stripMeta(line);
    if (range.start && (headerDay || day || findDay(line))) {
      flush();
      current = { day: headerDay || findDay(line) || day, start: range.start, end: range.end, subject, instructor: "", room: findRoom(line), classNumber };
      return;
    }
    if (!current || !subject) return;
    if (!current.subject) current.subject = subject;
    else if (!current.instructor && /د\s*[\/.]|دكتور|doctor|محاضر/i.test(line)) current.instructor = subject.replace(/^د[.\/]?\s*/, "");
    else if (!current.room) current.room = findRoom(line) || subject;
  });
  flush();
  return slots;
}
function parseLoose(rows) {
  return rows.map((row) => {
    const line = lineOf(row);
    const day = findDay(line);
    const range = timeRange(line);
    const subject = stripMeta(line);
    if (!day || !range.start || !subject) return null;
    return { day, start: range.start, end: range.end, subject, instructor: "", room: findRoom(line), classNumber: findClass(line) };
  }).filter(Boolean);
}
function parseExamsAny(rows) {
  const headed = parseByHeader(rows, false).filter((item) => item.subject);
  const lines = rows.flatMap((row) => {
    const line = normalizeVisualLine(lineOf(row));
    if (!line) return [];
    const pieces = line.split(/\s*(?=Lect\s*\d+)/i).map((part) => part.trim()).filter((part) => part.length > 1);
    return pieces.length ? pieces : [line];
  });
  let classNumber = "";
  const free = [];
  lines.forEach((line) => {
    const foundClass = findClass(line);
    if (foundClass && line.length < 36) { classNumber = foundClass; return; }
    const date = findDate(line);
    const range = timeRange(line);
    const subject = cleanSubject(line);
    if (!subject || subject.length < 2) return;
    if (!date && !range.start && subject.length > 80) return;
    free.push({
      subject: subject.slice(0, 160),
      date,
      start: range.start,
      end: range.end,
      room: findRoom(line),
      notes: "",
      classNumber: foundClass || classNumber,
      day: findDay(line),
    });
  });
  const picked = free.length >= headed.length ? free : headed;
  return dedupeSlots(picked);
}
const HEADER_MAP = {
  اليوم: "day", day: "day",
  من: "start", البدايه: "start", "وقت البدايه": "start", start: "start",
  الي: "end", النهايه: "end", end: "end",
  الوقت: "time", الموعد: "time",
  الماده: "subject", المقرر: "subject", "اسم الماده": "subject", subject: "subject",
  الدكتور: "instructor", الدكتوره: "instructor", المحاضر: "instructor", instructor: "instructor",
  القاعه: "room", المدرج: "room", المكان: "room", room: "room",
  التاريخ: "date", date: "date",
  ملاحظه: "notes", ملاحظات: "notes", notes: "notes",
  العنوان: "title", title: "title",
};
function splitCell(value) {
  const lines = String(value || "").split(/\n+| \/ |\s+\|\s+|،/).map((line) => line.trim()).filter(Boolean);
  let subject = lines[0] || "";
  let instructor = "";
  let room = "";
  lines.slice(1).forEach((line) => {
    if (/قاع|مدرج|hall|room/i.test(line)) room = line.replace(/^(القاعة|القاعه|مدرج)\s*/, "");
    else if (!instructor) instructor = line.replace(/^(د\/|د\.|المحاضر)\s*/, "");
    else room = line;
  });
  return { subject, instructor, room };
}
function previewLectures(slots) {
  const times = [...new Set(slots.map((slot) => slot.start))].sort((a, b) => {
    const minute = (value) => { const [hour, part] = value.split(":").map(Number); return ((hour <= 7 ? hour + 12 : hour) * 60) + part; };
    return minute(a) - minute(b);
  });
  return `<div class="site-preview"><div class="table-wrap"><table><thead><tr><th>الوقت</th>${DAYS.map((day) => `<th>${day}</th>`).join("")}</tr></thead><tbody>${times.map((start) => `<tr><td class="time-col">${esc(start)}</td>${DAYS.map((day) => {
    const slot = slots.find((item) => item.day === day && item.start === start);
    return `<td>${slot ? `<b>${esc(slot.subject)}</b>${slot.instructor ? `<br><span class="muted">${esc(slot.instructor)}</span>` : ""}${slot.room ? `<br><span dir="ltr">${esc(slot.room)}</span>` : ""}` : ""}</td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div></div>`;
}
function previewExams(rows) {
  return `<div class="stack">${rows.map((item) => `<article class="lecture"><p class="kicker">${esc(item.date || "ميعاد")}</p><p style="margin:8px 0 0;font-weight:650">${esc(item.subject)}</p>${item.start ? `<p>الوقت ${esc(item.start)}${item.end ? ` – ${esc(item.end)}` : ""}</p>` : ""}${item.room ? `<p class="muted">${esc(item.room)}</p>` : ""}</article>`).join("")}</div>`;
}
function pdfRows(items) {
  const tokens = items.filter((item) => String(item.str || "").trim()).map((item) => ({
    text: String(item.str).trim(),
    x: item.transform[4],
    y: item.transform[5],
    w: item.width || String(item.str).length * 4,
    h: Math.abs(item.transform[3]) || item.height || 10,
  }));
  if (!tokens.length) return [];
  const lines = [];
  tokens.sort((a, b) => b.y - a.y || a.x - b.x).forEach((token) => {
    const line = lines.find((row) => Math.abs(row.y - token.y) < Math.max(6, token.h * 0.65));
    if (line) line.tokens.push(token);
    else lines.push({ y: token.y, tokens: [token] });
  });
  const grid = lines.map((line) => {
    const ordered = line.tokens.sort((a, b) => a.x - b.x);
    const cells = [];
    let current = [];
    ordered.forEach((token) => {
      const previous = current[current.length - 1];
      const gap = previous ? token.x - (previous.x + previous.w) : 0;
      if (previous && gap > 26) {
        cells.push(cellText(current));
        current = [token];
      } else current.push(token);
    });
    if (current.length) cells.push(cellText(current));
    return cells.filter(Boolean);
  }).filter((row) => row.length);
  return grid;
}
function cellText(tokens) {
  const letters = tokens.filter((token) => token.text.length === 1).length > tokens.length * 0.6;
  const visual = tokens.map((token) => token.text).join(letters ? "" : " ");
  return normalizeVisualLine(visual);
}
function saneSlots(slots, kind) {
  return dedupeSlots(slots).filter((slot) => {
    const subject = String(slot.subject || "").replace(/\s+/g, " ").trim();
    if (subject.length < 2 || subject.length > 60) return false;
    if ((subject.match(/Lect/gi) || []).length > 1) return false;
    slot.subject = subject;
    if (kind === "lectures") return Boolean(slot.day && slot.start);
    return Boolean(slot.date || slot.start || slot.day);
  });
}
function bestSlots(rows, kind) {
  const attempts = kind === "exams"
    ? [parseExamsAny(rows), parseByHeader(rows, false)]
    : [parseGrid(rows), parseByHeader(rows), parseBlocks(rows)];
  return attempts.map((slots) => saneSlots(slots, kind)).sort((a, b) => b.length - a.length)[0] || [];
}
function gridFromWords(words) {
  const tokens = (words || []).map((word) => {
    const box = word.bbox || {};
    const text = String(word.text || "").trim();
    if (!text || (word.confidence != null && word.confidence < 30)) return null;
    if (box.x1 == null || box.y1 == null) return null;
    return { text, x: box.x0, y: (box.y0 + box.y1) / 2, w: Math.max(4, box.x1 - box.x0), h: Math.max(8, box.y1 - box.y0) };
  }).filter(Boolean);
  if (tokens.length < 4) return [];
  const height = tokens.map((token) => token.h).sort((a, b) => a - b)[Math.floor(tokens.length / 2)] || 12;
  const lines = [];
  tokens.sort((a, b) => a.y - b.y || a.x - b.x).forEach((token) => {
    const line = lines.find((row) => Math.abs(row.y - token.y) < height * 0.7);
    if (line) line.tokens.push(token);
    else lines.push({ y: token.y, tokens: [token] });
  });
  return lines.map((line) => {
    const ordered = line.tokens.sort((a, b) => a.x - b.x);
    const gaps = ordered.slice(1).map((token, index) => token.x - (ordered[index].x + ordered[index].w)).filter((gap) => gap > 0).sort((a, b) => a - b);
    const typical = gaps[Math.floor(gaps.length / 2)] || 12;
    const splitAt = Math.max(36, typical * 2.4);
    const cells = [];
    let current = [];
    ordered.forEach((token) => {
      const previous = current[current.length - 1];
      const gap = previous ? token.x - (previous.x + previous.w) : 0;
      if (previous && gap > splitAt) {
        cells.push(current.map((item) => item.text).join(" ").trim());
        current = [token];
      } else current.push(token);
    });
    if (current.length) cells.push(current.map((item) => item.text).join(" ").trim());
    return cells.filter(Boolean);
  }).filter((row) => row.length);
}
async function openReader() {
  if (!window.Tesseract) throw new Error("قارئ الصور مش متحمّل. افتح اللوحة والنت شغال.");
  const worker = await Tesseract.createWorker("ara+eng", 1, {
    workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js",
    corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm.js",
    langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
  });
  await worker.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
  return worker;
}
async function gridFromSource(worker, source) {
  const result = await worker.recognize(source);
  const grid = gridFromWords(result.data.words);
  if (grid.length) return grid;
  return String(result.data.text || "").split(/\n/).map((line) => [line.trim()]).filter((row) => row[0]);
}
async function canvasFromImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("الصورة ما اتفتحتش"));
      element.src = url;
    });
    const longSide = Math.max(image.width, image.height);
    const scale = Math.min(2.2, Math.max(1, 1800 / longSide));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
function clusterPositions(points) {
  const merged = [];
  points.forEach((point) => {
    if (!merged.length || point - merged[merged.length - 1] > 6) merged.push(point);
    else merged[merged.length - 1] = Math.round((merged[merged.length - 1] + point) / 2);
  });
  return merged;
}
function tableGrid(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const data = canvas.getContext("2d").getImageData(0, 0, width, height).data;
  const darkAt = (x, y) => {
    const index = (y * width + x) * 4;
    return data[index] * 0.3 + data[index + 1] * 0.59 + data[index + 2] * 0.11 < 120;
  };
  const rowHits = [];
  const colHits = [];
  for (let y = 0; y < height; y += 2) {
    let dark = 0;
    for (let x = 0; x < width; x += 2) if (darkAt(x, y)) dark += 1;
    if (dark > (width / 2) * 0.28) rowHits.push(y);
  }
  for (let x = 0; x < width; x += 2) {
    let dark = 0;
    for (let y = 0; y < height; y += 2) if (darkAt(x, y)) dark += 1;
    if (dark > (height / 2) * 0.22) colHits.push(x);
  }
  const ys = clusterPositions(rowHits);
  const xs = clusterPositions(colHits);
  if (xs.length < 6 || ys.length < 8) return null;
  const rows = [];
  for (let row = 0; row < ys.length - 1; row += 1) {
    const cells = [];
    for (let column = 0; column < xs.length - 1; column += 1) {
      const cell = { x0: xs[column] + 2, y0: ys[row] + 2, x1: xs[column + 1] - 2, y1: ys[row + 1] - 2 };
      cell.ink = cell.x1 - cell.x0 > 16 && cell.y1 - cell.y0 > 10 && cellHasInk(data, width, cell);
      cells.push(cell);
    }
    rows.push(cells);
  }
  return rows;
}
function cellHasInk(data, width, cell) {
  let dark = 0;
  let seen = 0;
  for (let y = cell.y0 + 3; y < cell.y1 - 3; y += 3) {
    for (let x = cell.x0 + 3; x < cell.x1 - 3; x += 3) {
      seen += 1;
      const index = (y * width + x) * 4;
      if (data[index] * 0.3 + data[index + 1] * 0.59 + data[index + 2] * 0.11 < 150) dark += 1;
    }
  }
  return seen > 4 && dark / seen > 0.015;
}
function roomCode(value) {
  const match = String(value || "").match(/Lect\s*\d+|Gr\s*\d+|[RHL]\s*\d{1,3}/i);
  if (!match) return "";
  return match[0].replace(/\s+/g, " ").replace(/lect/i, "Lect").replace(/gr/i, "Gr").replace(/^([RHL])\s*/i, (letter) => letter.toUpperCase());
}
function metaLine(value) {
  const text = String(value || "").trim();
  if (!text) return true;
  if (findDay(text) || cleanTime(text)) return true;
  if (roomCode(text) && text.length < 12) return true;
  if (/^(د|م|أ|ا)\s*[\/.]/.test(text)) return true;
  return false;
}
function parseAcademyMatrix(matrix) {
  if (!matrix.length) return [];
  let header = -1;
  let headerScore = 0;
  matrix.forEach((row, index) => {
    const score = row.filter((cell) => timeRange(cell).start).length;
    if (score > headerScore) { headerScore = score; header = index; }
  });
  const width = Math.max(...matrix.map((row) => row.length));
  let dayColumn = -1;
  let dayScore = 0;
  for (let column = 0; column < width; column += 1) {
    const score = matrix.filter((row) => findDay(row[column] || "")).length;
    if (score > dayScore) { dayScore = score; dayColumn = column; }
  }
  if (dayScore < 2) return [];
  const times = Array.from({ length: width }, (_, column) => timeRange(matrix[header]?.[column] || ""));
  const timeColumns = [];
  for (let column = 0; column < width; column += 1) if (column !== dayColumn) timeColumns.push(column);
  const knownOrder = dayColumn === width - 1 ? [...timeColumns].reverse() : timeColumns;
  if (headerScore < 4) {
    knownOrder.forEach((column, index) => {
      if (TIMES[index]) times[column] = { start: TIMES[index], end: TIME_END[TIMES[index]] || "" };
    });
  }
  const dayRows = [];
  matrix.forEach((row, index) => {
    if (index === header) return;
    const found = findDay(row[dayColumn] || "");
    if (found) dayRows.push({ index, day: found });
  });
  const cellsOf = (index) => (matrix[index] || []).filter((cell, column) => column !== dayColumn && String(cell || "").trim());
  const starts = dayRows.map((item) => {
    const before = cellsOf(item.index - 1);
    const here = cellsOf(item.index);
    const subjectBefore = before.some((line) => !metaLine(line));
    const doctorHere = here.some((line) => /د\s*[\/.]|م\s*[\/.]/.test(line));
    if (subjectBefore && (doctorHere || here.every(metaLine))) return Math.max(header + 1, item.index - 1);
    return item.index;
  });
  const slots = [];
  dayRows.forEach((item, index) => {
    const start = starts[index];
    const end = (starts[index + 1] ?? matrix.length) - 1;
    const bucket = matrix.slice(start, end + 1);
    timeColumns.forEach((column) => {
      const range = times[column];
      if (!range?.start) return;
      const lines = bucket.map((row) => String(row[column] || "").trim()).filter(Boolean);
      if (!lines.length) return;
      const subject = lines.find((line) => !metaLine(line)) || "";
      const instructor = lines.find((line) => /د\s*[\/.]|م\s*[\/.]|دكتور|مهندس/.test(line)) || "";
      const room = lines.map(roomCode).find(Boolean) || "";
      if (!subject) return;
      slots.push({
        day: item.day,
        start: range.start,
        end: range.end || TIME_END[range.start] || "",
        subject: subject.slice(0, 80),
        instructor: instructor.replace(/^(د|م|أ|ا)\s*[\/.]?\s*/, "").trim(),
        room,
        classNumber: "",
      });
    });
  });
  return slots;
}
async function readCell(worker, canvas, cell) {
  const width = Math.max(8, cell.x1 - cell.x0);
  const height = Math.max(8, cell.y1 - cell.y0);
  const scale = Math.max(1, Math.min(3, 72 / height));
  const copy = document.createElement("canvas");
  copy.width = Math.ceil((width + 12) * scale);
  copy.height = Math.ceil((height + 12) * scale);
  const context = copy.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, copy.width, copy.height);
  context.drawImage(canvas, cell.x0, cell.y0, width, height, 6 * scale, 6 * scale, width * scale, height * scale);
  const result = await worker.recognize(copy);
  return String(result.data.text || "").replace(/\s+/g, " ").trim();
}
async function academyFromCanvas(worker, canvas, onProgress) {
  const rows = tableGrid(canvas);
  if (!rows) return [];
  await worker.setParameters({ tessedit_pageseg_mode: "7" });
  const jobs = [];
  rows.forEach((row, rowIndex) => row.forEach((cell, column) => {
    if (cell.ink) jobs.push({ rowIndex, column, cell });
  }));
  const text = new Map();
  for (let index = 0; index < jobs.length; index += 1) {
    onProgress?.(`جارٍ قراءة خانات الجدول ${index + 1} من ${jobs.length}`);
    const job = jobs[index];
    text.set(`${job.rowIndex}:${job.column}`, await readCell(worker, canvas, job.cell));
  }
  const matrix = rows.map((row, rowIndex) => row.map((_, column) => text.get(`${rowIndex}:${column}`) || ""));
  return parseAcademyMatrix(matrix);
}
async function renderPdfPage(page) {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  return canvas;
}
function tidyLine(value) {
  return String(value || "")
    .replace(/[()]/g, " ")
    .replace(/\s*([./])\s*/g, "$1")
    .replace(/^[./]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}
function academyRange(value) {
  const times = [...latin(value).matchAll(/(\d{1,2})\s*[:.]\s*(\d{2})/g)].map((match) => cleanTime(match[0])).filter(Boolean);
  const start = times.find((time) => TIMES.includes(time));
  if (!start) return { start: "", end: "" };
  return { start, end: times.find((time) => time !== start) || TIME_END[start] || "" };
}
function academySlotsFromItems(raw) {
  const tokens = raw.map((item) => {
    const text = String(item.str || item.text || "").normalize("NFKC").replace(/\s+/g, " ").trim();
    if (!text) return null;
    const x = item.x ?? item.transform?.[4] ?? 0;
    const y = item.y ?? item.transform?.[5] ?? 0;
    return { text, x, y, w: item.w || item.width || Math.max(8, text.length * 4) };
  }).filter(Boolean);
  const timeTokens = tokens.map((token) => {
    const range = academyRange(token.text);
    return range.start ? { ...token, ...range, mid: token.x + token.w / 2 } : null;
  }).filter(Boolean);
  if (timeTokens.length < 4) return [];
  const clusters = [];
  timeTokens.forEach((token) => {
    const cluster = clusters.find((row) => Math.abs(row.y - token.y) < 8);
    if (cluster) {
      cluster.tokens.push(token);
      cluster.y = (cluster.y * (cluster.tokens.length - 1) + token.y) / cluster.tokens.length;
    } else clusters.push({ y: token.y, tokens: [token] });
  });
  const header = clusters.sort((a, b) => b.tokens.length - a.tokens.length)[0];
  if (!header || header.tokens.length < 4) return [];
  const byX = header.tokens.slice().sort((a, b) => a.mid - b.mid);
  const bands = byX.map((column, index) => ({
    ...column,
    left: index === 0 ? column.mid - 80 : (byX[index - 1].mid + column.mid) / 2,
    right: index === byX.length - 1 ? column.mid + 55 : (column.mid + byX[index + 1].mid) / 2,
  }));
  const edge = Math.max(...bands.map((band) => band.mid)) + 48;
  const dayMarks = [];
  tokens.forEach((token) => {
    if (token.x < edge) return;
    const day = findDay(token.text);
    if (!day || dayMarks.some((mark) => mark.day === day && Math.abs(mark.y - token.y) < 12)) return;
    dayMarks.push({ y: token.y, day });
  });
  if (dayMarks.length < 2) return [];
  const saturday = dayMarks.find((mark) => mark.day === "السبت");
  const thursday = dayMarks.find((mark) => mark.day === "الخميس");
  const yDown = saturday && thursday ? saturday.y < thursday.y : true;
  dayMarks.sort((a, b) => (yDown ? a.y - b.y : b.y - a.y));
  const slots = [];
  dayMarks.forEach((mark, index) => {
    const previous = dayMarks[index - 1];
    const next = dayMarks[index + 1];
    const top = previous ? (mark.y + previous.y) / 2 : mark.y + (yDown ? -28 : 28);
    const bottom = next ? (mark.y + next.y) / 2 : mark.y + (yDown ? 28 : -28);
    const low = Math.min(top, bottom);
    const high = Math.max(top, bottom);
    bands.forEach((band) => {
      const cell = tokens.filter((token) => {
        const mid = token.x + token.w / 2;
        return token.y >= low && token.y <= high && mid >= band.left && mid < band.right && token.x < edge && !findDay(token.text) && !academyRange(token.text).start;
      });
      if (!cell.length) return;
      const lines = [];
      cell.sort((a, b) => (yDown ? a.y - b.y : b.y - a.y) || b.x - a.x).forEach((token) => {
        const line = lines.find((row) => Math.abs(row.y - token.y) < 3.6);
        if (line) line.tokens.push(token);
        else lines.push({ y: token.y, tokens: [token] });
      });
      lines.sort((a, b) => (yDown ? a.y - b.y : b.y - a.y));
      const texts = lines.map((line) => tidyLine(cellText(line.tokens.sort((a, b) => b.x - a.x)))).filter(Boolean);
      const room = texts.map(roomCode).find(Boolean) || "";
      const subject = texts.find((line) => line !== room && !roomCode(line) && !findDay(line) && line.length > 2) || "";
      const instructor = texts.find((line) => line !== subject && line !== room && !roomCode(line) && !findDay(line)) || "";
      if (!subject || findDay(subject) || roomCode(subject)) return;
      slots.push({
        day: mark.day,
        start: band.start,
        end: band.end,
        subject: subject.slice(0, 80),
        instructor,
        room,
        classNumber: "",
      });
    });
  });
  return dedupeSlots(slots);
}
function classNumberNear(raw) {
  const tokens = raw.map((item) => ({
    text: String(item.str || item.text || "").normalize("NFKC").trim(),
    x: item.x ?? item.transform?.[4] ?? 0,
    y: item.y ?? item.transform?.[5] ?? 0,
  })).filter((item) => item.text);
  const label = tokens.find((token) => /الفصل/.test(normalizeHeader(token.text)) && !/الدراسي/.test(normalizeHeader(token.text)));
  if (!label) return "";
  const near = tokens.filter((token) => Math.abs(token.y - label.y) < 14 && /^\d{1,3}$/.test(latin(token.text)));
  near.sort((a, b) => Math.abs(a.x - label.x) - Math.abs(b.x - label.x) || Math.abs(a.y - label.y) - Math.abs(b.y - label.y));
  return near[0] ? String(Number(latin(near[0].text))) : "";
}
function slotsFromPdfItems(items) {
  const tokens = items.filter((item) => String(item.str || "").trim()).map((item) => ({
    text: String(item.str).trim(),
    x: item.transform[4],
    y: item.transform[5],
    w: item.width || String(item.str).length * 5,
  }));
  if (tokens.length < 8) return [];
  const lines = [];
  tokens.sort((a, b) => b.y - a.y || a.x - b.x).forEach((token) => {
    const line = lines.find((row) => Math.abs(row.y - token.y) < 3.2);
    if (line) line.tokens.push(token);
    else lines.push({ y: token.y, tokens: [token] });
  });
  const headerColumns = (line) => {
    const ordered = line.tokens.slice().sort((a, b) => a.x - b.x);
    const cells = [];
    ordered.forEach((token) => {
      const previous = cells[cells.length - 1];
      const gap = previous ? token.x - (previous.x + previous.w) : 999;
      if (previous && gap < 36) {
        previous.tokens.push(token);
        previous.w = token.x + token.w - previous.x;
      } else cells.push({ x: token.x, w: token.w, tokens: [token] });
    });
    return cells.map((cell) => {
      const text = cell.tokens.map((token) => token.text).join(" ");
      const range = timeRange(text);
      if (!range.start) return null;
      return { mid: cell.x + cell.w / 2, ...range };
    }).filter(Boolean);
  };
  let header = null;
  lines.forEach((line) => {
    const columns = headerColumns(line);
    if (!header || columns.length > header.columns.length) header = { y: line.y, columns };
  });
  if (!header || header.columns.length < 4) return [];
  const columns = header.columns.sort((a, b) => a.mid - b.mid);
  const bounds = columns.map((column, index) => ({
    ...column,
    left: index === 0 ? column.mid - 90 : (columns[index - 1].mid + column.mid) / 2,
    right: index === columns.length - 1 ? column.mid + 90 : (column.mid + columns[index + 1].mid) / 2,
  }));
  const dayMarks = [];
  lines.forEach((line) => {
    const outside = line.tokens.filter((token) => {
      const mid = token.x + token.w / 2;
      return !bounds.some((column) => mid >= column.left && mid <= column.right);
    });
    const day = findDay(cellText(outside.sort((a, b) => a.x - b.x)));
    if (day) dayMarks.push({ y: line.y, day });
  });
  const body = lines.filter((line) => line.y < header.y - 4).sort((a, b) => b.y - a.y);
  let currentDay = "";
  const matrix = [[...columns.map((column) => `${column.start}${column.end ? `–${column.end}` : ""}`), "اليوم"]];
  body.forEach((line) => {
    const near = dayMarks.map((mark) => ({ ...mark, dist: Math.abs(mark.y - line.y) })).sort((a, b) => a.dist - b.dist)[0];
    const day = near && near.dist < 28 ? near.day : currentDay;
    const cells = columns.map(() => []);
    line.tokens.forEach((token) => {
      const mid = token.x + token.w / 2;
      const index = bounds.findIndex((column) => mid >= column.left && mid <= column.right);
      if (index >= 0) cells[index].push(token);
    });
    const row = cells.map((list) => cellText(list.sort((a, b) => a.x - b.x)));
    row.push(day && day !== currentDay ? day : "");
    if (day) currentDay = day;
    if (row.some(Boolean)) matrix.push(row);
  });
  return parseAcademyMatrix(matrix);
}
async function openPdf(data) {
  if (!window.pdfjsLib) throw new Error("قارئ PDF مش متحمّل");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const task = pdfjsLib.getDocument({ data, isEvalSupported: false, useWorkerFetch: false });
  const timeout = new Promise((_, reject) => setTimeout(() => {
    try { task.destroy(); } catch { /* الملف اتأخر */ }
    reject(new Error("قراءة الملف اتأخرت. ارفع الجدول تاني."));
  }, 20000));
  return Promise.race([task.promise, timeout]);
}
async function academyFromFile(file, onProgress) {
  const pdfFile = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
  if (pdfFile) {
    onProgress?.("جارٍ قراءة الجدول…");
    const pdf = await openPdf(await file.arrayBuffer());
    const slots = [];
    let hintedClass = "";
    const limit = Math.min(pdf.numPages, 6);
    let textItems = 0;
    for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      textItems += content.items.length;
      const parsed = academySlotsFromItems(content.items);
      if (!hintedClass) hintedClass = classNumberNear(content.items);
      slots.push(...(parsed.length ? parsed : slotsFromPdfItems(content.items)));
    }
    slots.classHint = hintedClass;
    if (slots.length >= 4 || textItems > 40) return slots;
    onProgress?.("الملف صورته بس، جارٍ قراءتها…");
    const worker = await openReader();
    try {
      const visual = [];
      for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 1); pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        visual.push(...await academyFromCanvas(worker, await renderPdfPage(page), onProgress));
      }
      visual.classHint = hintedClass;
      return visual.length >= slots.length ? visual : slots;
    } finally {
      await worker.terminate();
    }
  }
  const worker = await openReader();
  try {
    if (/^image\//.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name)) {
      return academyFromCanvas(worker, await canvasFromImage(file), onProgress);
    }
    return [];
  } finally {
    await worker.terminate();
  }
}
async function rowsFromFile(file) {
  if (/^image\//.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name)) {
    const worker = await openReader();
    try { return gridFromSource(worker, await canvasFromImage(file)); }
    finally { await worker.terminate(); }
  }
  const buffer = await file.arrayBuffer();
  if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
    if (!window.pdfjsLib) throw new Error("قارئ PDF مش متحمّل");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const textRows = [];
    const canvases = [];
    for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 2); pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      textRows.push(...pdfRows(content.items));
      if (pdf.numPages > 2) continue;
      canvases.push(await renderPdfPage(page));
    }
    if (!canvases.length) return { textRows, ocrRows: [] };
    const worker = await openReader();
    try {
      const ocrRows = [];
      for (const canvas of canvases) ocrRows.push(...await gridFromSource(worker, canvas));
      return { textRows, ocrRows };
    } finally {
      await worker.terminate();
    }
  }
  const book = XLSX.read(buffer, { type: "array" });
  const sheet = book.Sheets[book.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
}
async function readUpload(file) {
  const kind = document.querySelector("[name=upload-kind]:checked")?.value || "lectures";
  const box = document.getElementById("upload-preview");
  const button = document.getElementById("upload-publish");
  button.disabled = true;
  state.preview = [];
  box.innerHTML = `<p class="muted">جارٍ قراءة شبكة الجدول خانة خانة. الصورة الواضحة ممكن تاخد دقيقة.</p>`;
  try {
    const parsed = await academyFromFile(file, (message) => {
      box.innerHTML = `<p class="muted">${esc(message)}</p>`;
    });
    const hint = parsed.classHint || "";
    const academy = saneSlots(parsed, kind);
    if (kind === "exams" && academy.length >= 4) {
      box.innerHTML = `<p class="note bad">الصورة دي جدول محاضرات أسبوعي، مش جدول امتحانات. اختَر «جدول محاضرات»، واكتب رقم الفصل، وبعدين ارفعها تاني.</p>`;
      return;
    }
    let slots = kind === "lectures" ? academy : [];
    if (slots.length < 4) {
      const loaded = await rowsFromFile(file);
      const sets = loaded?.ocrRows
        ? [bestSlots(loaded.ocrRows, kind), bestSlots(loaded.textRows, kind)]
        : [bestSlots(loaded, kind)];
      const other = sets.sort((a, b) => b.length - a.length)[0] || [];
      if (other.length > slots.length) slots = other;
    }
    state.preview = slots;
    const classField = document.getElementById("upload-class");
    if (classField && !classField.value.trim() && hint) classField.value = hint;
    if (!state.preview.length) {
      box.innerHTML = `<p class="note bad">الجدول ما ترتّبش. ارفع الصورة كاملة وهي مفرودة، والخطوط السودا باينة، واختار جدول محاضرات لو الجدول أسبوعي.</p>`;
      return;
    }
    const classes = [...new Set(state.preview.map((item) => item.classNumber).filter(Boolean))];
    const counts = DAYS.map((day) => `${day} ${state.preview.filter((item) => item.day === day).length}`).filter((item) => !item.endsWith(" 0")).join(" · ");
    const lecturePreview = classes.length > 1
      ? classes.map((number) => `<h2>فصل ${esc(number)}</h2>${previewLectures(state.preview.filter((item) => item.classNumber === number))}`).join("")
      : previewLectures(state.preview);
    box.innerHTML = `<p class="kicker">معاينة بشكل الموقع</p><p class="muted">${state.preview.length} خانة. ${esc(counts)}. اكتب رقم الفصل قبل النشر، ولو فيه خانة غلط ما تنشرش.</p>${kind === "exams" ? previewExams(state.preview) : lecturePreview}`;
    button.disabled = false;
  } catch (error) {
    box.innerHTML = `<p class="note bad">${esc(error.message || "الملف ما اتقراش.")}</p>`;
  }
}
async function publishUpload() {
  const sectionId = document.getElementById("upload-section").value;
  const classNumber = String(document.getElementById("upload-class").value || "").replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit)).trim();
  const kind = document.querySelector("[name=upload-kind]:checked")?.value || "lectures";
  const section = catalogSections().find((item) => item.id === sectionId);
  const typedClass = classNumber;
  const slots = state.preview || [];
  const groups = kind === "lectures"
    ? (typedClass
      ? [{ classNumber: typedClass, slots }]
      : [...new Set(slots.map((item) => item.classNumber).filter(Boolean))].map((number) => ({
        classNumber: number,
        slots: slots.filter((item) => item.classNumber === number),
      })))
    : (typedClass
      ? [{ classNumber: typedClass, slots }]
      : [...new Set(slots.map((item) => String(item.classNumber || "")))].map((number) => ({
        classNumber: number,
        slots: slots.filter((item) => String(item.classNumber || "") === number),
      })));
  if (!section || !state.preview?.length || !groups.length) {
    state.note = kind === "lectures" ? "اكتب رقم الفصل، أو خلّي الملف فيه أرقام الفصول." : "اختار الشعبة واستنى المعاينة تظهر.";
    state.bad = true;
    draw();
    return;
  }
  state.note = "جارٍ النشر…";
  state.bad = false;
  draw();
  const savedSection = await write(client.from("sections").upsert({
    id: section.id,
    title: section.title,
    major: section.major || "—",
    language: section.language || "—",
    year: String(section.year || "1"),
    year_label: section.year_label || "الفرقة",
    sort: section.sort || 0,
  }));
  if (!savedSection) return;
  for (const group of groups) {
    if (kind === "lectures") {
      const savedClass = await write(client.from("classes").upsert({
        section_id: sectionId,
        class_number: group.classNumber,
        group_name: "",
      }, { onConflict: "section_id,class_number" }));
      if (!savedClass) return;
      const classId = savedClass[0].id;
      const cleared = await client.from("lectures").delete().eq("class_id", classId);
      if (cleared.error) return fail(cleared.error);
      const inserted = await write(client.from("lectures").insert(group.slots.map((slot) => ({
        class_id: classId,
        day: slot.day,
        start_time: slot.start,
        end_time: slot.end || TIME_END[slot.start] || "",
        subject: slot.subject,
        instructor: slot.instructor || "",
        room: slot.room || "",
      }))));
      if (!inserted) return;
      await touchClass(classId);
    } else {
      const removed = await client.from("exams").delete().eq("section_id", sectionId).eq("class_number", group.classNumber);
      if (removed.error) return fail(removed.error);
      const inserted = await write(client.from("exams").insert(group.slots.map((slot) => ({
        section_id: sectionId,
        class_number: group.classNumber,
        title: slot.subject,
        subject: slot.subject,
        exam_date: /^\d{4}-\d{2}-\d{2}$/.test(String(slot.date || "")) ? slot.date : null,
        start_time: slot.start || "",
        end_time: slot.end || "",
        room: slot.room || "",
        notes: slot.notes || (!/^\d{4}-\d{2}-\d{2}$/.test(String(slot.date || "")) ? String(slot.date || "") : ""),
      }))));
      if (!inserted) return;
    }
  }
  const published = await markPublished();
  if (!published) {
    state.note = "الجدول اتحفظ، لكن تفعيله على الموقع محتاج حساب سوبر أدمن.";
    state.bad = true;
    draw();
    return;
  }
  await log("نشر", kind === "lectures" ? "محاضرات" : "امتحانات", `${section.title} · ${groups.map((group) => group.classNumber).join("، ")}`);
  state.preview = [];
  await reload("اتنشر. حدّث موقع الطلبة وافتح نفس الشعبة والفصل.");
}

document.getElementById("nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-panel]");
  if (!button) return;
  state.panel = button.dataset.panel;
  state.edit = null;
  state.note = "";
  draw();
});

document.getElementById("screen").addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-save]");
  if (!form) return;
  event.preventDefault();
  state.note = "جارٍ الحفظ…";
  state.bad = false;
  const kind = form.dataset.save;
  if (kind === "sections") await saveSection(form);
  if (kind === "classes") await saveClass(form);
  if (kind === "lectures") await saveLecture(form);
  if (kind === "exams") await saveExam(form);
  if (kind === "about") await saveAbout(form);
  if (kind === "kb") await saveKb(form);
  if (kind === "groups") await saveGroup(form);
  if (kind === "holidays") await saveHoliday(form);
  if (kind === "announcements") await saveNotice(form);
  if (kind === "settings") await saveSettings(form);
  if (kind === "users") await createUser(form);
});

document.getElementById("screen").addEventListener("change", async (event) => {
  if (event.target.id === "upload-section") {
    state.uploadSection = event.target.value;
    const list = document.getElementById("class-list");
    if (list) list.innerHTML = catalogClasses(event.target.value).map((item) => `<option value="${esc(item)}"></option>`).join("");
  }
  if (event.target.name === "upload-kind") {
    const field = document.getElementById("upload-class");
    if (field) field.placeholder = event.target.value === "exams" ? "سيبه فاضي لو الامتحان لكل الشعبة" : "رقم الفصل، مثال 5";
  }
  if (event.target.id === "upload-file" && event.target.files?.[0]) await readUpload(event.target.files[0]);
  if (event.target.id === "new-role") {
    const field = document.getElementById("new-section");
    if (field) field.style.display = event.target.value === "section_manager" ? "" : "none";
  }
  if (event.target.matches("[data-role]")) {
    const section = event.target.closest("tr")?.querySelector("[data-section]");
    if (!section) return;
    const manager = event.target.value === "section_manager";
    section.disabled = !manager;
    if (!manager) section.value = "";
  }
});

document.getElementById("screen").addEventListener("dragover", (event) => {
  if (!event.target.closest("#upload-drop")) return;
  event.preventDefault();
});
document.getElementById("screen").addEventListener("drop", async (event) => {
  if (!event.target.closest("#upload-drop")) return;
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (file) await readUpload(file);
});

document.getElementById("screen").addEventListener("click", async (event) => {
  const kbEdit = event.target.closest("[data-kb-edit]");
  if (kbEdit) {
    const index = Number(kbEdit.dataset.kbEdit);
    const row = kbEntries()[index];
    if (!row) return;
    state.edit = { kind: "kb", row: { index, q: row.q, a: row.a } };
    draw();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (event.target.closest("[data-kb-cancel]")) {
    state.edit = null;
    draw();
    return;
  }
  const edit = event.target.closest("[data-edit]");
  const removeButton = event.target.closest("[data-delete]");
  const saveUser = event.target.closest("[data-save-user]");
  if (event.target.id === "import-current") return importCurrent();
  if (event.target.id === "upload-publish") return publishUpload();
  if (event.target.id === "archive-term") return askArchive();
  const archiveButton = event.target.closest("[data-archive]");
  if (archiveButton) {
    const row = await client.from("term_archives").select("label,term,academic_year,snapshot").eq("id", archiveButton.dataset.archive).maybeSingle();
    if (row.error) return fail(row.error);
    state.archiveView = row.data;
    state.panel = "settings";
    draw();
    return;
  }
  if (edit) {
    const list = { sections: state.sections, classes: state.classes, lectures: state.lectures, exams: state.exams, announcements: state.announcements }[edit.dataset.edit];
    state.edit = { kind: edit.dataset.edit, row: list.find((item) => item.id === edit.dataset.id) };
    state.panel = edit.dataset.edit === "announcements" ? "notices" : edit.dataset.edit;
    draw();
    return;
  }
  const clearClass = event.target.closest("[data-clear-class]");
  if (clearClass) {
    event.preventDefault();
    event.stopPropagation();
    return askDelete("class-lectures", clearClass.dataset.clearClass);
  }
  if (removeButton) return askDelete(removeButton.dataset.delete, removeButton.dataset.id);
  if (saveUser) {
    const id = saveUser.dataset.saveUser;
    const nextRole = document.querySelector(`[data-role][data-id="${id}"]`).value;
    const sectionId = document.querySelector(`[data-section][data-id="${id}"]`).value || null;
    if (id === state.profile.id && nextRole !== "super_admin" && !state.users.some((user) => user.id !== id && user.role === "super_admin")) {
      state.note = "لازم يفضل سوبر أدمن واحد على الأقل.";
      state.bad = true;
      draw();
      return;
    }
    const result = await client.from("profiles").update({ role: nextRole, section_id: nextRole === "section_manager" ? sectionId : null }).eq("id", id);
    if (result.error) return fail(result.error);
    await log("تعديل", "مستخدم", id);
    await reload("الدور اتحدث.");
  }
});

document.getElementById("admin-search").addEventListener("input", renderHits);
document.getElementById("search-hits").addEventListener("click", (event) => {
  const hit = event.target.closest("[data-hit]");
  if (!hit) return;
  state.panel = hit.dataset.hit;
  state.openKeys = hit.dataset.open ? hit.dataset.open.split(",").filter(Boolean) : [];
  state.flash = hit.dataset.id || "";
  document.getElementById("admin-search").value = "";
  document.getElementById("search-hits").hidden = true;
  draw();
  document.querySelector(`[data-anchor="${CSS.escape(state.flash)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
});
document.getElementById("confirm-no").addEventListener("click", () => {
  state.pendingDelete = null;
  document.getElementById("confirm-yes").textContent = "نعم، احذف";
  document.getElementById("confirm-title").textContent = "هيتم حذف الآتي";
  document.getElementById("confirm").hidden = true;
});
document.getElementById("confirm-yes").addEventListener("click", async () => {
  const pending = state.pendingDelete;
  state.pendingDelete = null;
  document.getElementById("confirm-yes").textContent = "نعم، احذف";
  document.getElementById("confirm-title").textContent = "هيتم حذف الآتي";
  document.getElementById("confirm").hidden = true;
  if (!pending) return;
  if (pending.kind === "archive") return archiveTerm(pending.id);
  await remove(pending.kind, pending.id);
});
const LOGIN_URL = "admin.html";
function toLogin(reason) {
  location.replace(reason ? `${LOGIN_URL}?e=${reason}` : LOGIN_URL);
}
function showApp() {
  document.getElementById("boot").hidden = true;
  document.getElementById("app").hidden = false;
}

function closeMenu() {
  document.getElementById("side").classList.remove("open");
  document.getElementById("scrim").hidden = true;
}
document.getElementById("menu-btn").addEventListener("click", () => {
  document.getElementById("side").classList.add("open");
  document.getElementById("scrim").hidden = false;
});
document.getElementById("scrim").addEventListener("click", closeMenu);

document.getElementById("logout").addEventListener("click", async () => {
  state.profile = null;
  try { await client.auth.signOut(); } catch { /* نكمل للخروج */ }
  toLogin();
});

let entering = false;
async function enter(session) {
  if (!session || entering || state.profile) return;
  entering = true;
  try {
    const profile = await client.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    if (profile.error && /schema cache|does not exist|PGRST205/i.test(profile.error.message || "")) {
      await client.auth.signOut();
      return toLogin("setup");
    }
    if (profile.error) {
      if (/JWT|401|unauthorized/i.test(profile.error.message || "")) {
        await client.auth.signOut();
        return toLogin("expired");
      }
      return toLogin("offline");
    }
    if (!profile.data) {
      await client.auth.signOut();
      return toLogin("noaccess");
    }
    if (profile.data.active === false) {
      await client.auth.signOut();
      return toLogin("disabled");
    }
    state.profile = profile.data;
    state.email = session.user.email || "";
    showApp();
    try { await loadAll(); } catch (error) { fail(error); }
    draw();
  } finally {
    entering = false;
  }
}

client.auth.onAuthStateChange((event, session) => {
  setTimeout(() => {
    if (event === "SIGNED_OUT") {
      state.profile = null;
      toLogin();
      return;
    }
    if (session && !state.profile && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) enter(session);
  }, 0);
});

// حماية الصفحة: من غير جلسة يرجع لصفحة الدخول
client.auth.getSession().then(({ data }) => {
  if (!data?.session) toLogin();
}).catch(() => toLogin("offline"));
