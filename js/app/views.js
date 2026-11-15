// طبقة العرض: الأيقونات، المكوّنات المشتركة، وكل صفحات موقع الطلبة.

// ---------- الأيقونات ----------
const PATHS = {
  home: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z",
  today: "M6.5 4.5h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2zM4.5 9.5h15M8 3v3M16 3v3M9 14.5l2 2 4-4",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4",
  clock: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2",
  table: "M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2zM3.5 9.5h17M9 9.5v10M15 9.5v10",
  exam: "M7 3.5h8l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1zM14.5 3.5V8H19M9 13h6M9 17h4",
  bell: "M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15zM10 21h4",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  info: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 11v5M12 8v.01",
  spark: "M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4zM18 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z",
  channel: "M4 13v-2a1 1 0 0 1 1-1h3l7-4v12l-7-4H5a1 1 0 0 1-1-1zM18 9.5a3.5 3.5 0 0 1 0 5",
  image: "M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2zM4 17l5-4.5 4 3.5 3-2.5 4 3.5M9 9.5v.01",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  flag: "M6 21V4M6 5h11l-2 4 2 4H6",
  swap: "M7 8h12l-3-3M17 16H5l3 3",
  trash: "M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10.5 11v5M13.5 11v5",
  pin: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 7.1a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8z",
  user: "M12 4.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zM5 20c.6-3.6 3.5-5.4 7-5.4s6.4 1.8 7 5.4",
  more: "M4 7h16M4 12h16M4 17h10",
  search: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM16 16l4 4",
  download: "M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14",
  print: "M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v6H7z",
  file: "M7 3.5h8l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1zM14.5 3.5V8H19M9 13h6M9 16.5h6",
  calendar: "M6.5 4.5h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2zM4.5 9.5h15M8 3v3M16 3v3",
  share: "M12 15V4M8 7.5L12 4l4 3.5M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrow: "M19 12H5M11 6l-6 6 6 6",
  chevron: "M14 6l-6 6 6 6",
  wifi: "M3 9a13 13 0 0 1 18 0M6 12.5a8.5 8.5 0 0 1 12 0M9 16a4 4 0 0 1 6 0M12 19.5v.01",
  cards: "M4 5h16v6H4zM4 14h16v5H4z",
  rows: "M4 6h16M4 12h16M4 18h16",
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  coffee: "M5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v2.5M12 3v2.5",
  phone: "M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2",
  external: "M7 17L17 7M8 7h9v9",
};
function I(name, size = 20, width = 1.8) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${PATHS[name] || ""}"/></svg>`;
}
// الأسماء دي مستخدمة في مساعد «اسأل جدولي»
const ICON = {
  pin: I("pin", 14, 1.9),
  user: I("user", 14, 1.9),
  home: I("home", 22),
  table: I("table", 22),
  exam: I("exam", 22),
  bell: I("bell", 22),
  more: I("more", 22),
  sun: I("sun", 22),
  clock: I("clock", 22),
  image: I("image", 18),
};
const WEEK_ORDER = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const CHANNEL_URL = "https://whatsapp.com/channel/0029VbDlzPv4dTnT0xECBk1B";
const VIEW_TITLE = {
  day: "يومك",
  today: "محاضرات النهاردة",
  tomorrow: "بكرة",
  free: "فاضي امتى",
  table: "الجدول الكامل",
  exams: "الامتحانات",
  alerts: "الإشعارات",
  about: "من نحن",
  sections: "تصفح الشعب",
  assistant: "اسأل جدولي",
  start: "اختار فصلك",
  setup: "",
};
let lastSig = "";

// ---------- أدوات صغيرة ----------
function greeting(now) {
  const hour = Math.floor(cairoMinutes(now) / 60);
  return hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء النور";
}
function dateLine(now) {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", { timeZone: "Africa/Cairo", day: "numeric", month: "long" }).format(now);
}
function countLabel(count) {
  if (count === 1) return "محاضرة واحدة";
  if (count === 2) return "محاضرتين";
  return `${count} محاضرات`;
}
function roomPhrase(slot) {
  return slot?.room ? ` في <span dir="ltr">${esc(slot.room)}</span>` : "";
}
function softLeft(ms) {
  const minutes = Math.max(0, Math.ceil(ms / 60000));
  if (minutes <= 1) return "أقل من دقيقة";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourText = hours === 1 ? "ساعة" : hours === 2 ? "ساعتين" : `${hours} ساعات`;
  return rest ? `${hourText} و ${rest} دقيقة` : hourText;
}
function nextStudyDay(now) {
  const tomorrow = shiftCairo(now, 1, 12 * 60);
  const tomorrowHoliday = holidayOn(tomorrow);
  if (tomorrowHoliday) return { label: "بكرة", name: "", holiday: tomorrowHoliday };
  const tomorrowName = jsDay(tomorrow);
  if (tomorrowName) return { label: "بكرة", name: tomorrowName, holiday: null };
  const after = shiftCairo(now, 2, 12 * 60);
  return { label: "بعد بكرة", name: jsDay(after) || "السبت", holiday: holidayOn(after) };
}
function openDay(schedule, day) {
  return slotsOn(schedule, day).filter((slot) => slot.status !== "cancelled");
}
function classLine(saved) {
  return `${esc(saved.section.yearLabel)} · ${esc(saved.section.title)} · فصل ${esc(saved.schedule.classNumber)}`;
}
function pageHead({ kicker = "", title, sub = "", actions = "" }) {
  return `<header class="page-head"><div class="page-head-text">${kicker ? `<p class="kicker">${kicker}</p>` : ""}<h1>${title}</h1>${sub ? `<p class="page-sub">${sub}</p>` : ""}</div>${actions ? `<div class="head-actions">${actions}</div>` : ""}</header>`;
}
function slotMatches(slot, needle) {
  if (!needle) return true;
  return [slot.subject, slot.instructor, slot.room, slot.day].some((value) => fold(value).includes(needle));
}
function statusBadge(slot, status) {
  if (slot.status === "cancelled") return `<span class="badge danger">اتلغت</span>`;
  if (slot.status === "moved") return `<span class="badge warn">اتأجلت</span>`;
  if (status === "live") return `<span class="badge ok pulse"><i class="dot"></i>دلوقتي</span>`;
  if (status === "next") return `<span class="badge primary">الجاية</span>`;
  if (status === "done") return `<span class="badge">خلصت</span>`;
  return "";
}
function roomPill(slot) {
  return slot && slot.room ? `<span class="pill" dir="ltr">${ICON.pin}${esc(slot.room)}</span>` : "";
}

// ---------- الهيكل والرسم ----------
function current() {
  return readSaved();
}
function setChrome(saved, view) {
  const shell = saved && view !== "setup" && view !== "start" ? "app" : "guest";
  document.documentElement.dataset.shell = shell;
  document.body.classList.toggle("landing", view === "setup");
  document.body.classList.toggle("chat-mode", view === "assistant");
  if (view !== "assistant") document.body.classList.remove("chat-typing");
  const title = document.getElementById("page-title");
  if (title) title.innerHTML = shell === "app" ? `<b>${VIEW_TITLE[view] || ""}</b><span class="ellipsis">${classLine(saved)}</span>` : "";
  document.title = VIEW_TITLE[view] ? `${VIEW_TITLE[view]} — جدولي` : "جدولي — جدول محاضراتك في مكان واحد";
}
function render(quiet) {
  const root = document.getElementById("view");
  const scrollY = quiet ? window.scrollY : 0;
  const saved = current();
  const guest = new Set(["setup", "about", "sections", "start"]);
  if (!saved && !guest.has(ui.view)) ui.view = "setup";
  const view = ui.view;
  root.innerHTML = views[view](saved);
  root.className = quiet ? "" : "rise";
  setChrome(saved, view);
  drawNav(saved);
  drawTabs(saved);
  lastSig = daySig();
  if (quiet) window.scrollTo(0, scrollY);
  if (view === "assistant") mountChat();
}
function daySig() {
  const saved = current();
  if (!saved || ui.view !== "day") return "";
  const now = new Date();
  const name = jsDay(now);
  return cairoKey(now) + (name ? openDay(saved.schedule, name).map((slot) => slotStatus(slot, now)).join(",") : "");
}

// ---------- الإعلانات ----------
function newsBlock(saved) {
  const items = visibleNews(saved);
  if (!items.length) return "";
  return `<section class="news" aria-label="إعلانات">${items.map(announcementCard).join("")}</section>`;
}
function announcementCard(item) {
  const image = safeHttpUrl(item.image_url);
  const link = safeHttpUrl(item.link_url);
  const label = String(item.link_label || "").trim();
  const key = esc(newsKey(item));
  return `<article class="announce">
    ${image ? `<img src="${esc(image)}" alt="" loading="lazy" />` : ""}
    <div class="announce-body">
      <span class="badge warn">${I("channel", 14)}${item.audience === "class" ? "إعلان فصلك" : item.audience === "section" ? "إعلان شعبتك" : "إعلان"}</span>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.body)}</p>
      ${link && label ? `<a class="btn sm" data-dismiss-news="${key}" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : ""}
    </div>
  </article>`;
}

// ---------- بطاقات المحاضرات ----------
function lectureCard(schedule, slot, status) {
  const label = lectureOf(schedule.slots, slot);
  const cancelled = slot.status === "cancelled";
  const look = cancelled ? "cancelled" : status || "";
  return `<article class="lecture ${esc(look)}" style="--c:${colorOf(slot.subject)}">
    <div class="between"><span class="kind">${esc(label.ar)} <span class="muted" dir="ltr">· ${esc(label.en)}</span></span>${statusBadge(slot, status)}</div>
    <h3 class="${cancelled || status === "done" ? "strike" : ""}">${esc(readable(slot.subject))}</h3>
    ${slot.instructor ? `<p class="who">${ICON.user}${esc(readable(slot.instructor))}</p>` : ""}
    <div class="meta"><span class="pill">${I("clock", 14, 1.9)}${range(slot.start, slot.end)}</span>${roomPill(slot)}${slot.was ? `<span class="pill soft">كانت ${esc(slot.was)}</span>` : ""}</div>
    ${slot.note ? `<p class="muted note">${esc(slot.note)}</p>` : ""}
  </article>`;
}
function slotRow(schedule, slot, status) {
  const label = lectureOf(schedule.slots, slot);
  const cancelled = slot.status === "cancelled";
  const st = cancelled ? "cancelled" : status || "";
  return `<div class="tl-row ${esc(st)}"><div class="tl-time"><b dir="ltr">${esc(clock(slot.start))}</b><small dir="ltr">${esc(clock(slot.end))}</small></div>
    <article class="tl-card" style="--c:${colorOf(slot.subject)}">
      <div class="between"><span class="kind">${esc(label.ar)}</span>${statusBadge(slot, st)}</div>
      <h3 class="${cancelled || st === "done" ? "strike" : ""}">${esc(readable(slot.subject))}</h3>
      ${slot.instructor ? `<p class="who">${ICON.user}${esc(readable(slot.instructor))}</p>` : ""}
      ${slot.room || slot.was ? `<div class="meta">${roomPill(slot)}${slot.was ? `<span class="pill soft">كانت ${esc(slot.was)}</span>` : ""}</div>` : ""}
      ${slot.note ? `<p class="muted note">${esc(slot.note)}</p>` : ""}</article></div>`;
}
function timelineHtml(saved, slots, now, showingToday, nextStart) {
  return `<div class="timeline">${slots.map((slot, i) => {
    const prev = slots[i - 1];
    let gap = "";
    if (prev && prev.status !== "cancelled" && slot.status !== "cancelled") {
      const minutes = slotMinutes(slot.start) - slotMinutes(prev.end);
      if (minutes >= 15) gap = `<div class="tl-gap"><span>${I("coffee", 14)}فاضي ${softLeft(minutes * 60000)}</span></div>`;
    }
    return gap + slotRow(saved.schedule, slot, showingToday ? slotStatus(slot, now, nextStart) : "");
  }).join("")}</div>`;
}

// ---------- لوحة اليوم ----------
function focusCard(saved, now) {
  const holiday = holidayOn(now);
  const dayName = jsDay(now);
  const slots = !holiday && dayName ? openDay(saved.schedule, dayName) : [];
  const live = slots.find((slot) => slotStatus(slot, now) === "live");
  const later = slots.find((slot) => slotStatus(slot, now) === "later");
  const done = slots.filter((slot) => slotStatus(slot, now) === "done").length;
  const info = nextInfo(saved.schedule, now);
  if (live) {
    const s = slotMinutes(live.start);
    const e = slotMinutes(live.end);
    const pct = Math.min(100, Math.max(0, Math.round(((cairoMinutes(now) - s) / (e - s)) * 100)));
    return `<article class="focus live"><div class="between"><span class="badge ok pulse"><i class="dot"></i>شغّالة دلوقتي</span><span class="focus-time">${range(live.start, live.end)}</span></div>
      <h2>${esc(readable(live.subject))}</h2>
      ${live.instructor ? `<p class="who">${ICON.user}${esc(readable(live.instructor))}</p>` : ""}
      <div class="focus-foot">${roomPill(live)}<span class="left">فاضل <b id="count">${softLeft(info ? info.end - now : 0)}</b></span></div>
      <div class="prog"><span id="prog" data-s="${s}" data-e="${e}" style="width:${pct}%"></span></div></article>`;
  }
  if (later) {
    const start = info ? info.start : now;
    return `<article class="focus"><div class="between"><span class="badge primary">${done ? "المحاضرة الجاية" : "أول محاضرة النهاردة"}</span><span class="focus-time">${range(later.start, later.end)}</span></div>
      <h2>${esc(readable(later.subject))}</h2>
      ${later.instructor ? `<p class="who">${ICON.user}${esc(readable(later.instructor))}</p>` : ""}
      <div class="focus-foot">${roomPill(later)}<span class="left">بعد <b id="count">${softLeft(start - now)}</b></span></div></article>`;
  }
  const title = holiday ? `إجازة: ${esc(holiday.name)}` : slots.length ? "يومك خلص، ربنا يقويك" : dayName ? "مفيش محاضرات النهاردة" : "النهاردة جمعة";
  const nx = info?.slot;
  return `<article class="focus calm"><span class="badge">${slots.length ? `خلصت ${done} من ${slots.length}` : "راحة"}</span>
    <h2>${title}</h2>
    ${nx ? `<p class="who">الجاية: ${esc(nx.day)} · ${esc(readable(nx.subject))}</p><div class="focus-foot">${roomPill(nx)}<span class="left">${range(nx.start, nx.end)}</span></div>` : ""}</article>`;
}
function weekStrip(saved, now, focus) {
  const todayIdx = WEEK_ORDER.indexOf(weekdayName(now));
  const shift = todayIdx === 6 ? 7 : 0;
  return `<div class="days" role="tablist" aria-label="أيام الأسبوع">${DAYS.map((day, i) => {
    const date = shiftCairo(now, i - todayIdx + shift, 12 * 60);
    const count = openDay(saved.schedule, day).length;
    const off = holidayOn(date);
    const isToday = cairoKey(date) === cairoKey(now);
    return `<button type="button" role="tab" aria-selected="${focus === day}" class="${focus === day ? "on" : ""} ${isToday ? "today" : ""} ${off ? "off" : ""}" data-day="${day}"><small>${DAY_SHORT[day]}</small><b>${cairoFields(date).day}</b><i class="dots">${off ? "إجازة" : count ? `${count} ${count === 1 ? "محاضرة" : "محاضرات"}` : "فاضي"}</i></button>`;
  }).join("")}</div>`;
}
function kpiCard(icon, tone, label, value, sub, extra = "") {
  return `<article class="kpi ${tone}"><span class="kpi-ico">${I(icon, 20)}</span><p class="kpi-label">${label}</p><p class="kpi-value">${value}</p><p class="kpi-sub">${sub}</p>${extra}</article>`;
}
function kpiRow(saved, now) {
  const holiday = holidayOn(now);
  const dayName = jsDay(now);
  const today = !holiday && dayName ? openDay(saved.schedule, dayName) : [];
  const done = today.filter((slot) => slotStatus(slot, now) === "done").length;
  const pct = today.length ? Math.round((done / today.length) * 100) : 0;
  const info = nextInfo(saved.schedule, now);
  const week = saved.schedule.slots.filter((slot) => slot.status !== "cancelled");
  const subjects = new Set(week.map((slot) => slot.subject)).size;
  const todayKey = cairoKey(now);
  const exam = myExams(saved).filter((item) => item.exam_date && item.exam_date >= todayKey).sort((a, b) => a.exam_date.localeCompare(b.exam_date))[0];
  let freeMinutes = 0;
  for (let i = 0; i < today.length - 1; i += 1) {
    const minutes = slotMinutes(today[i + 1].start) - slotMinutes(today[i].end);
    if (minutes >= 15) freeMinutes += minutes;
  }
  const first = kpiCard("today", "primary", "محاضرات النهاردة",
    today.length ? `<span class="num">${done}</span><small> / ${today.length}</small>` : holiday ? "إجازة" : "راحة",
    today.length ? (done === today.length ? "خلصت يومك كله" : `فاضل ${countLabel(today.length - done)}`) : holiday ? esc(holiday.name) : "مفيش محاضرات",
    today.length ? `<div class="kpi-bar"><span style="width:${pct}%"></span></div>` : "");
  const second = info
    ? kpiCard("clock", "ok", info.live ? "شغّالة دلوقتي" : "المحاضرة الجاية", `<span dir="ltr" class="num">${esc(clock(info.slot.start))}</span>`, `${esc(info.slot.day)} · ${esc(readable(info.slot.subject))}`)
    : kpiCard("clock", "ok", "المحاضرة الجاية", "—", "مفيش محاضرات جاية");
  const third = kpiCard("layers", "violet", "محاضرات الأسبوع", `<span class="num">${week.length}</span>`, `${subjects} ${subjects >= 3 && subjects <= 10 ? "مواد" : "مادة"} على ${new Set(week.map((slot) => slot.day)).size} أيام`);
  const fourth = exam
    ? kpiCard("exam", "warn", "أقرب امتحان", esc(examCountdown(exam.exam_date)), esc(readable(exam.title || exam.subject || "")))
    : kpiCard("coffee", "warn", "وقت فاضي النهاردة", freeMinutes ? softLeft(freeMinutes * 60000) : "—", freeMinutes ? "بين المحاضرات" : "مفيش فراغ بين المحاضرات");
  return `<section class="kpis" aria-label="ملخص سريع">${first}${second}${third}${fourth}</section>`;
}
function seenKey(saved) {
  return `jadwali-rev-${saved.schedule.sectionId}-${saved.schedule.classNumber}`;
}
function updateBanner(saved) {
  const revision = saved.schedule.revisedAt;
  if (!revision || localStorage.getItem(seenKey(saved)) === revision) return "";
  return `<article class="banner-card"><span class="banner-ico">${I("bell", 20)}</span><div><h3>جدولك اتحدّث</h3><p>في تعديل جديد على فصل ${esc(saved.schedule.classNumber)}. راجع محاضراتك قبل ما تتحرك.</p></div><button type="button" class="btn sm" id="seen-update">تمام، شفته</button></article>`;
}
function alertAsk() {
  if (localStorage.getItem("jadwali-reminders") === "1" || localStorage.getItem("jadwali-alert-ask") === "1") return "";
  return `<article class="card side-card ask-card"><span class="side-ico">${I("bell", 20)}</span><h3>فعّل إشعار جدولي</h3><p>هننبّهك قبل محاضرتك حتى والتطبيق مقفول، ولو القاعة اتغيرت أو المحاضرة اتلغت.</p>${alertNote ? `<p class="hint warn">${esc(alertNote)}</p>` : ""}<div class="row"><button type="button" class="btn sm" id="ask-alert">تفعيل الإشعار</button><button type="button" class="ghost sm" id="ask-later">بعدين</button></div></article>`;
}
function installCard() {
  if (!installEvent || localStorage.getItem("jadwali-install-hide") === "1") return "";
  return `<article class="card side-card"><span class="side-ico">${I("phone", 20)}</span><h3>ثبّت جدولي كتطبيق</h3><p>أيقونة على شاشتك، بيفتح أسرع، وبيشتغل من غير نت.</p><div class="row"><button type="button" class="btn sm" id="install-now">تثبيت</button><button type="button" class="ghost sm" id="hide-install">مش دلوقتي</button></div></article>`;
}
function groupKey(saved) {
  return `jadwali-wa-${saved.schedule.sectionId}-${saved.schedule.classNumber}`;
}
function groupUrl(value) {
  const link = safeHttpUrl(value);
  if (!link) return "";
  const host = new URL(link).hostname.replace(/^www\./, "");
  if (host !== "chat.whatsapp.com" && host !== "wa.me" && host !== "whatsapp.com") return "";
  return link;
}
function groupInvite(saved) {
  const group = GROUPS.find((item) => item.section_id === saved.schedule.sectionId && String(item.class_number) === String(saved.schedule.classNumber));
  const link = groupUrl(group?.url);
  if (!group || !link || localStorage.getItem(groupKey(saved)) === "1") return "";
  return `<article class="card side-card wa-card"><span class="side-ico ok">${WA_ICON}</span><h3>جروب فصلك</h3><p>${esc(group.label)}</p><div class="row"><a class="btn sm" id="join-group" href="${esc(link)}" target="_blank" rel="noopener noreferrer">انضم للجروب</a></div></article>`;
}
function shareCard() {
  return `<article class="card side-card"><h3>شارك جدولك</h3><div class="share-list">
    <button type="button" id="share-today">${I("image", 18)}<span>صورة جدول النهاردة</span></button>
    <button type="button" id="share-week">${I("image", 18)}<span>صورة الأسبوع</span></button>
    <button type="button" id="share-class">${I("link", 18)}<span>ابعت لينك الفصل</span></button>
    <button type="button" id="copy-class">${I("file", 18)}<span>انسخ لينك الفصل</span></button>
  </div></article>`;
}
function dayView(saved) {
  const now = new Date();
  const dayName = jsDay(now);
  const holiday = holidayOn(now);
  const todaySlots = !holiday && dayName ? openDay(saved.schedule, dayName) : [];
  const finished = todaySlots.length > 0 && todaySlots.every((slot) => slotStatus(slot, now) === "done");
  const evening = finished && !ui.pickedDay;
  const upcoming = nextStudyDay(now);
  const viewing = ui.pickedDay || (evening ? upcoming.name || "السبت" : dayName || "السبت");
  const showingToday = !evening && viewing === dayName && !holiday;
  const slots = slotsOn(saved.schedule, viewing);
  const open = slots.filter((slot) => slot.status !== "cancelled");
  const nextStart = showingToday ? open.find((slot) => slotStatus(slot, now) === "later")?.start : "";
  const doneCount = showingToday ? open.filter((slot) => slotStatus(slot, now) === "done").length : 0;
  const title = evening ? `${upcoming.label} · ${esc(viewing)}` : showingToday ? "محاضرات النهاردة" : `محاضرات ${esc(viewing)}`;
  const emptyText = evening && upcoming.holiday ? `${upcoming.label} إجازة: ${esc(upcoming.holiday.name)}.` : showingToday && holiday ? `إجازة: ${esc(holiday.name)}.` : `مفيش محاضرات يوم ${esc(viewing)}.`;
  const quick = [["table", "الجدول الكامل", "table"], ["tomorrow", "بكرة", "sun"], ["free", "فاضي امتى", "coffee"], ["exams", "الامتحانات", "exam"]];
  return `<div class="page day-page">
    ${pageHead({
      kicker: greeting(now),
      title: `${esc(weekdayName(now))}<span class="h-sub">${esc(dateLine(now))}</span>`,
      sub: `<span class="class-chip">${I("layers", 14)}${classLine(saved)}</span>`,
      actions: `<button type="button" class="btn" data-go="assistant">${I("spark", 18)}<span>اسأل جدولي</span></button><button type="button" class="ghost" id="change-class">${I("swap", 18)}<span>تغيير الفصل</span></button>`,
    })}
    ${updateBanner(saved)}
    ${kpiRow(saved, now)}
    <div class="dash">
      <div class="dash-main">
        ${focusCard(saved, now)}
        <section id="today-board" class="board">
          ${weekStrip(saved, now, evening ? viewing : ui.pickedDay || (dayName && !holiday ? dayName : viewing))}
          <div class="between sec-head"><h2>${title}</h2>${showingToday && open.length ? `<span class="badge">خلصت ${doneCount} من ${open.length}</span>` : ""}</div>
          ${slots.length ? timelineHtml(saved, slots, now, showingToday, nextStart) : UI.empty({ art: "rest", title: "يوم راحة", text: emptyText, actions: `<button type="button" class="ghost sm" data-go="table">${I("table", 16)}شوف الجدول الكامل</button>` })}
        </section>
      </div>
      <aside class="dash-side" aria-label="اختصارات وتنبيهات">
        <nav class="card quick" aria-label="اختصارات">${quick.map(([id, label, icon]) => `<button type="button" data-go="${id}"><span class="quick-ico">${I(icon, 20)}</span><span>${label}</span></button>`).join("")}</nav>
        ${newsBlock(saved)}
        ${alertAsk()}
        ${installCard()}
        ${groupInvite(saved)}
        ${shareCard()}
      </aside>
    </div>
  </div>`;
}
function dayList(saved, date, title) {
  const day = jsDay(date);
  const holiday = holidayOn(date);
  const slots = holiday ? [] : slotsOn(saved.schedule, day);
  const now = new Date();
  const showingToday = cairoKey(date) === cairoKey(now);
  const nextStart = showingToday ? slots.find((slot) => slotStatus(slot, now) === "later")?.start : "";
  const open = slots.filter((slot) => slot.status !== "cancelled");
  return `<div class="page narrow">
    ${pageHead({ kicker: `${esc(weekdayName(date))} · ${esc(dateLine(date))}`, title: esc(title), sub: open.length ? `عندك ${countLabel(open.length)} · فصل ${esc(saved.schedule.classNumber)}` : `فصل ${esc(saved.schedule.classNumber)}` })}
    ${slots.length ? timelineHtml(saved, slots, now, showingToday, nextStart) : UI.empty({ art: "rest", title: holiday ? "إجازة رسمية" : "مفيش محاضرات", text: holiday ? esc(holiday.name) : day ? "اليوم ده فاضي في جدولك." : "الجمعة إجازة، مفيش محاضرات.", actions: `<button type="button" class="ghost sm" data-go="table">${I("table", 16)}الجدول الكامل</button>` })}
  </div>`;
}

// ---------- فاضي امتى ----------
function freeView(saved) {
  const today = jsDay(new Date());
  let total = 0;
  const blocks = DAYS.map((day) => {
    const slots = openDay(saved.schedule, day);
    const gaps = [];
    for (let i = 0; i < slots.length - 1; i += 1) {
      const minutes = slotMinutes(slots[i + 1].start) - slotMinutes(slots[i].end);
      if (minutes >= 15) gaps.push({ start: slots[i].end, end: slots[i + 1].start, minutes });
    }
    const sum = gaps.reduce((acc, gap) => acc + gap.minutes, 0);
    total += sum;
    return `<article class="card free-day${day === today ? " today" : ""}"><div class="between"><h3>${day}</h3>${day === today ? `<span class="badge primary">النهاردة</span>` : sum ? `<span class="badge">${softLeft(sum * 60000)}</span>` : ""}</div>
      ${gaps.length ? `<ul class="gap-list">${gaps.map((gap) => `<li><span class="gap-time">${range(gap.start, gap.end)}</span><span class="badge ok">${gap.minutes} دقيقة</span></li>`).join("")}</ul>` : `<p class="muted small">${slots.length ? "مفيش فراغ بين المحاضرات." : "اليوم كله فاضي."}</p>`}</article>`;
  }).join("");
  return `<div class="page">
    ${pageHead({ kicker: "جدولي", title: "فاضي امتى", sub: `الفراغات بين محاضرات فصلك طول الأسبوع${total ? ` · المجموع ${softLeft(total * 60000)}` : ""}.` })}
    <div class="card-grid">${blocks}</div>
  </div>`;
}

// ---------- الجدول الكامل ----------
function tableGrid(saved, needle) {
  const today = jsDay(new Date());
  const days = ui.dayFilter ? [ui.dayFilter] : DAYS;
  const times = [...TIMES];
  saved.schedule.slots.forEach((slot) => {
    if (slot.start && !times.some((row) => row[0] === slot.start)) times.push([slot.start, slot.end || ""]);
  });
  times.sort((a, b) => slotMinutes(a[0]) - slotMinutes(b[0]));
  return `<div class="table-wrap"><table class="grid-table"><thead><tr><th class="time-col">الوقت</th>${days.map((day) => `<th class="${day === today ? "hit" : ""}">${day}</th>`).join("")}</tr></thead><tbody>${times.map(([start, end]) => `<tr><th class="time-col" scope="row"><b dir="ltr">${esc(clock(start))}</b>${end ? `<small dir="ltr">${esc(clock(end))}</small>` : ""}</th>${days.map((day) => {
    const slot = saved.schedule.slots.find((item) => item.day === day && item.start === start && item.status !== "cancelled");
    const cls = day === today ? "hit" : "";
    if (!slot) return `<td class="${cls}"></td>`;
    const label = lectureOf(saved.schedule.slots, slot);
    const dim = needle && !slotMatches(slot, needle);
    return `<td class="${cls}"><div class="cell${dim ? " dim" : ""}" style="--c:${colorOf(slot.subject)}"><b>${esc(readable(slot.subject))}</b><span class="cell-meta">${esc(label.ar)}${slot.status === "moved" ? ` · <em>اتأجلت</em>` : ""}</span>${slot.room ? `<span class="cell-room" dir="ltr">${esc(slot.room)}</span>` : ""}</div></td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function tableList(saved, needle) {
  const days = ui.dayFilter ? [ui.dayFilter] : DAYS;
  const blocks = days.map((day) => {
    const slots = slotsOn(saved.schedule, day).filter((slot) => slotMatches(slot, needle));
    if (!slots.length) return needle ? "" : `<section class="day-block"><h2>${day}</h2><p class="muted small">مفيش محاضرات.</p></section>`;
    return `<section class="day-block"><div class="between"><h2>${day}</h2><span class="badge">${countLabel(slots.filter((slot) => slot.status !== "cancelled").length)}</span></div><div class="card-grid">${slots.map((slot) => lectureCard(saved.schedule, slot)).join("")}</div></section>`;
  }).join("");
  return blocks || "";
}
function tableRows(saved, needle) {
  const slots = sortSlots(saved.schedule.slots).filter((slot) => (!ui.dayFilter || slot.day === ui.dayFilter) && slotMatches(slot, needle));
  if (!slots.length) return "";
  return `<div class="table-wrap"><table class="rows-table"><thead><tr><th>اليوم</th><th>الوقت</th><th>المادة</th><th>المحاضر</th><th>القاعة</th><th>الحالة</th></tr></thead><tbody>${slots.map((slot) => `<tr class="${slot.status === "cancelled" ? "off" : ""}"><td>${esc(slot.day)}</td><td class="nowrap">${range(slot.start, slot.end)}</td><td><span class="sub-dot" style="--c:${colorOf(slot.subject)}"></span><b>${esc(readable(slot.subject))}</b></td><td class="muted">${esc(readable(slot.instructor)) || "—"}</td><td dir="ltr" class="nowrap">${esc(slot.room) || "—"}</td><td>${statusBadge(slot, "") || `<span class="badge ok">في معادها</span>`}</td></tr>`).join("")}</tbody></table></div>`;
}
function tableBody(saved) {
  const needle = fold(ui.filter);
  const filtered = saved.schedule.slots.filter((slot) => (!ui.dayFilter || slot.day === ui.dayFilter) && slotMatches(slot, needle));
  if ((needle || ui.dayFilter) && !filtered.length) {
    return UI.empty({ art: "search", title: "مفيش نتيجة", text: needle ? `مفيش محاضرة مطابقة لـ «${esc(ui.filter)}»${ui.dayFilter ? ` يوم ${esc(ui.dayFilter)}` : ""}.` : `مفيش محاضرات يوم ${esc(ui.dayFilter)}.`, actions: `<button type="button" class="ghost sm" id="clear-filter">امسح الفلتر</button>` });
  }
  if (!saved.schedule.slots.length) return UI.empty({ art: "calendar", title: "الجدول لسه فاضي", text: "أول ما الإدارة تنزّل محاضرات الفصل ده هتظهر هنا.", actions: `<button type="button" class="ghost sm" id="change-class">غيّر الفصل</button>` });
  const count = needle || ui.dayFilter ? `<p class="result-count muted small" aria-live="polite">${filtered.length} ${filtered.length >= 3 && filtered.length <= 10 ? "نتائج" : "نتيجة"}</p>` : "";
  const body = ui.mode === "grid" ? tableGrid(saved, needle) : ui.mode === "rows" ? tableRows(saved, needle) : tableList(saved, needle);
  return count + body;
}
function tableView(saved) {
  const subjects = [...new Set(saved.schedule.slots.map((slot) => slot.subject))];
  const menuItem = (id, icon, label, hint) => `<button type="button" id="${id}" role="menuitem">${I(icon, 18)}<span><b>${label}</b><small>${hint}</small></span></button>`;
  const modes = [["grid", "شبكة", "table"], ["list", "بطاقات", "cards"], ["rows", "جدول", "rows"]];
  return `<div class="page table-page">
    ${pageHead({
      kicker: `${esc(saved.section.yearLabel)} · ${esc(saved.section.title)} · العام الدراسي <span dir="ltr">${esc(YEAR)}</span>`,
      title: `فصل ${esc(saved.schedule.classNumber)}`,
      sub: `${saved.schedule.slots.filter((slot) => slot.status !== "cancelled").length} محاضرة في الأسبوع · ${subjects.length} ${subjects.length >= 3 && subjects.length <= 10 ? "مواد" : "مادة"}`,
      actions: `<details class="menu" id="export-menu"><summary class="btn">${I("share", 18)}<span>تصدير ومشاركة</span></summary><div class="menu-pop" role="menu">
        ${menuItem("download", "image", "صورة الجدول", "PNG جاهزة للمشاركة")}
        ${menuItem("print-table", "print", "طباعة أو PDF", "من نافذة الطباعة اختار حفظ PDF")}
        ${menuItem("export-csv", "file", "ملف CSV", "يفتح في Excel و Google Sheets")}
        ${menuItem("export-ics", "calendar", "ملف التقويم", "ICS لتقويم جوجل وآبل")}
        ${menuItem("share-class", "link", "لينك الفصل", "ابعته لزمايلك على واتساب")}
      </div></details>`,
    })}
    <div class="toolbar no-print">
      <label class="search-box">${I("search", 18, 1.9)}<input class="input" id="table-filter" type="search" autocomplete="off" placeholder="فلتر بالمادة، الدكتور أو القاعة" aria-label="فلتر الجدول" value="${esc(ui.filter)}" /></label>
      <div class="segmented" role="group" aria-label="طريقة العرض">${modes.map(([id, label, icon]) => `<button type="button" class="${ui.mode === id ? "on" : ""}" data-mode="${id}" aria-pressed="${ui.mode === id}">${I(icon, 16)}<span>${label}</span></button>`).join("")}</div>
    </div>
    <div class="chips no-print" role="group" aria-label="فلتر اليوم"><button type="button" class="chip${ui.dayFilter ? "" : " on"}" data-fday="">كل الأيام</button>${DAYS.map((day) => `<button type="button" class="chip${ui.dayFilter === day ? " on" : ""}" data-fday="${day}">${day}</button>`).join("")}</div>
    <div id="table-out" class="mode-${esc(ui.mode)}">${tableBody(saved)}</div>
    ${subjects.length ? `<div class="legend" aria-label="ألوان المواد">${subjects.map((subject) => `<button type="button" class="legend-item" data-legend="${esc(subject)}"><i style="--c:${colorOf(subject)}"></i>${esc(readable(subject))}</button>`).join("")}</div>` : ""}
    <p class="print-foot">جدولي · ${classLine(saved)} · العام الدراسي <span dir="ltr">${esc(YEAR)}</span></p>
  </div>`;
}

// ---------- الامتحانات ----------
function myExams(saved) {
  return EXAMS.filter((item) => {
    if (!saved) return true;
    if (item.section_id && item.section_id !== saved.schedule.sectionId) return false;
    if (item.class_number && String(item.class_number) !== String(saved.schedule.classNumber)) return false;
    return true;
  });
}
function examCountdown(date) {
  if (!date) return "";
  const today = cairoKey(new Date());
  if (date === today) return "النهاردة";
  if (date < today) return "خلّص";
  const diff = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  if (diff === 1) return "بكرة";
  return `فاضل ${diff} يوم`;
}
function examTone(date) {
  if (!date) return "";
  const today = cairoKey(new Date());
  if (date < today) return "";
  const diff = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  return diff <= 2 ? "danger" : diff <= 7 ? "warn" : "ok";
}
function examCard(item) {
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(String(item.exam_date || ""));
  const date = valid ? new Date(`${item.exam_date}T12:00:00Z`) : null;
  const fmt = (options) => new Intl.DateTimeFormat("ar-EG-u-nu-latn", { timeZone: "UTC", ...options }).format(date);
  const tone = examTone(valid ? item.exam_date : "");
  const past = valid && item.exam_date < cairoKey(new Date());
  return `<article class="exam-card${past ? " past" : ""}">
    <div class="exam-date ${tone}">${date ? `<small>${fmt({ weekday: "short" })}</small><b>${fmt({ day: "numeric" })}</b><span>${fmt({ month: "short" })}</span>` : `<small>ميعاد</small><b>؟</b>`}</div>
    <div class="exam-body">
      <div class="between"><h3>${esc(readable(item.title || item.subject))}</h3>${valid ? `<span class="badge ${tone}">${esc(examCountdown(item.exam_date))}</span>` : ""}</div>
      <div class="meta">${item.start_time ? `<span class="pill">${I("clock", 14, 1.9)}<span dir="ltr">${esc(item.start_time)}${item.end_time ? ` – ${esc(item.end_time)}` : ""}</span></span>` : ""}${item.room ? `<span class="pill" dir="ltr">${ICON.pin}${esc(item.room)}</span>` : ""}${item.class_number ? "" : `<span class="pill soft">لكل فصول الشعبة</span>`}</div>
      ${item.notes ? `<p class="muted note">${esc(readable(item.notes))}</p>` : ""}
    </div>
  </article>`;
}
function examsView(saved) {
  const rows = myExams(saved).slice().sort((a, b) => String(a.exam_date || "9").localeCompare(String(b.exam_date || "9")));
  const today = cairoKey(new Date());
  const upcoming = rows.filter((item) => !item.exam_date || item.exam_date >= today).length;
  return `<div class="page narrow">
    ${pageHead({ kicker: saved ? classLine(saved) : "جدولي", title: "الامتحانات", sub: rows.length ? `${upcoming} ${upcoming >= 3 && upcoming <= 10 ? "امتحانات جاية" : "امتحان جاي"} · التنبيه بيشتغل قبل كل امتحان.` : "الميدتيرم والنهائي هيظهروا هنا أول ما الأكاديمية تنزّل الجدول الرسمي." })}
    ${rows.length ? `<div class="stack">${rows.map(examCard).join("")}</div>` : UI.empty({ art: "exam", title: "لسه مفيش جدول امتحانات رسمي", text: "مش هنحط معاد متخمّن. فعّل الإشعار وهنبعتلك أول ما الجدول ينزل.", actions: saved ? `<button type="button" class="btn sm" data-go="alerts">${I("bell", 16)}فعّل الإشعار</button>` : "" })}
  </div>`;
}
function examBoard(saved) {
  const rows = myExams(saved).slice().sort((a, b) => String(a.exam_date || "9").localeCompare(String(b.exam_date || "9")));
  return `<div class="page narrow">
    ${pageHead({ kicker: "وضع الامتحانات", title: "امتحاناتك", sub: "المحاضرات متقفلة دلوقتي، وهترجع أول ما الإدارة تقفل الوضع." })}
    ${rows.length ? `<div class="stack">${rows.map(examCard).join("")}</div>` : UI.empty({ art: "exam", title: "لسه مفيش جدول امتحانات", text: "أول ما الجدول ينزل هتلاقيه هنا." })}
    ${newsBlock(saved)}
  </div>`;
}

// ---------- الإشعارات ----------
function alertsView(saved) {
  const on = localStorage.getItem("jadwali-reminders") === "1";
  const pushOn = pushActive();
  const lead = Number(localStorage.getItem("jadwali-lead") || DEFAULT_LEAD);
  const state = on ? (pushOn ? ["ok", "شغّال", "الإشعار بيوصلك حتى والتطبيق مقفول. أيام الإجازة الرسمية مفيش تنبيه."] : ["warn", "شغّال جزئيًا", "الإشعار شغّال والصفحة مفتوحة بس. فعّله تاني عشان يوصلك والتطبيق مقفول."]) : ["", "متوقف", "التفعيل مرة واحدة من المتصفح، وبعدها بيوصلك من غير ما تفتح جدولي."];
  return `<div class="page narrow">
    ${pageHead({ kicker: classLine(saved), title: "إشعار جدولي", sub: "تنبيه قبل كل محاضرة، ولو محاضرة اتلغت أو اتأجلت أو قاعتها اتغيرت، ولو نزل إعلان لفصلك." })}
    <section class="card setting">
      <div class="setting-row"><span class="side-ico ${state[0]}">${I("bell", 20)}</span><div class="setting-text"><h3>التنبيه قبل المحاضرة <span class="badge ${state[0]}">${state[0] === "ok" ? `<i class="dot"></i>` : ""}${state[1]}</span></h3><p>${state[2]}</p></div>
        ${on ? `<button type="button" class="ghost" id="alert-off">إيقاف الإشعار</button>` : `<button type="button" class="btn" id="alert-on">تفعيل التنبيه</button>`}</div>
      <p id="alert-note" class="hint warn"${alertNote ? "" : " hidden"}>${esc(alertNote)}</p>
      <div class="setting-row"><div class="setting-text"><h3>نبّهني قبلها بـ</h3><p>نفس المدة بتتطبق على الامتحانات.</p></div>
        <div class="segmented" role="group" aria-label="مدة التنبيه">${[5, 10, 15, 30].map((minutes) => `<button type="button" class="${lead === minutes ? "on" : ""}" data-lead="${minutes}" aria-pressed="${lead === minutes}">${minutes} د</button>`).join("")}</div></div>
    </section>
    <div class="card-grid two">
      <section class="card info-card"><span class="side-ico">${I("calendar", 20)}</span><h3>أضف محاضراتك للتقويم</h3><p>الزر يفتح شاشة إضافة المواعيد. على الآيفون اختار تقويم جديد اسمه جدولي، مش التقويم الشخصي. التنبيه قبل كل محاضرة بـ ${lead} دقيقة، وأيام الإجازة مش داخلة.</p><div class="row"><button type="button" class="btn sm" id="add-calendar">${I("calendar", 16)}أضف محاضراتي للتقويم</button></div><p id="calendar-note" class="muted small"></p>
        <details class="more"><summary>إزاي أمسحهم مرة واحدة؟</summary><p>من تطبيق التقويم اضغط التقاويم تحت، ثم علامة المعلومات جنب تقويم جدولي، وانزل لآخر الصفحة واضغط حذف التقويم. كده كل المحاضرات تتشال مع بعض.</p></details></section>
      <section class="card info-card"><span class="side-ico">${I("phone", 20)}</span><h3>ثبّت جدولي كتطبيق</h3><p>على الآيفون اعمل الخطوات دي من سفاري، مش من جوه تطبيق تاني:</p><ol class="steps"><li>افتح جدولي في سفاري.</li><li>اضغط زر المشاركة، المربع والسهم، تحت الشاشة.</li><li>اختار إضافة إلى الشاشة الرئيسية.</li><li>اضغط إضافة. الأيقونة هتظهر مع تطبيقاتك.</li></ol><p class="muted small">على أندرويد: من قائمة المتصفح اختار تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.</p>${installEvent ? `<div class="row"><button type="button" class="btn sm" id="install-now">تثبيت دلوقتي</button></div>` : ""}</section>
    </div>
  </div>`;
}

// <start-view>
const CRUMB_ARROW = I("chevron", 14, 2);
const STEP_CHECK = I("check", 16, 2.4);
const SEARCH_ICON = I("search", 18, 1.9);
function startView() {
  const section = sectionById(ui.sectionId);
  const sections = SECTIONS.filter((item) => item.year === ui.year);
  const classes = ui.sectionId ? classesIn(ui.sectionId) : [];
  const needle = digits(ui.classQuery);
  const visible = needle ? classes.filter((item) => item.classNumber.startsWith(needle)) : classes;
  const ready = !!(ui.sectionId && ui.classPick);
  const yearLabel = ui.year === "1" ? "الفرقة الأولى" : ui.year === "2" ? "الفرقة الثانية" : "";
  const next = !ui.year ? "اختار فرقتك عشان نبدأ" : !ui.sectionId ? "الجاي: اختار شعبتك" : !ui.classPick ? "الجاي: اختار رقم فصلك" : "كله تمام، احفظ وابدأ";
  const crumbs = [yearLabel, section ? section.title : "", ui.classPick ? `فصل ${ui.classPick}` : ""].filter(Boolean);
  const count = (id) => { const n = classesIn(id).length; return `${n} ${n >= 3 && n <= 10 ? "فصول" : "فصل"}`; };
  const doneSteps = [!!ui.year, !!ui.sectionId, ready].filter(Boolean).length;
  const step = (n, done, locked, title, body) => `<section class="step${done ? " done" : ""}${locked ? " locked" : ""}"><span class="node" aria-hidden="true">${done ? STEP_CHECK : n}</span><div class="step-body"><h2>${title}</h2>${body}</div></section>`;
  const years = `<div class="years">${["1", "2"].map((year) => `<button type="button" class="year${ui.year === year ? " on" : ""}" data-year="${year}" aria-pressed="${ui.year === year}"><b>${year === "1" ? "الفرقة الأولى" : "الفرقة الثانية"}</b><span>${SECTIONS.filter((item) => item.year === year).length} شعب</span></button>`).join("")}</div>`;
  const secs = ui.year
    ? `<div class="sec-grid">${sections.map((item) => `<button type="button" class="sec${ui.sectionId === item.id ? " on" : ""}" data-section="${item.id}" aria-pressed="${ui.sectionId === item.id}"><b>${esc(item.title)}</b><span>${esc(item.major)}</span><em>${count(item.id)}</em></button>`).join("")}</div>`
    : `<p class="locked-note">اختار فرقتك الأول وهتظهرلك الشعب.</p>`;
  const nums = ui.sectionId
    ? `<label class="search-box">${SEARCH_ICON}<input class="input" id="class-query" type="text" inputmode="numeric" autocomplete="off" placeholder="اكتب رقم فصلك" aria-label="رقم الفصل" value="${esc(ui.classQuery)}" /></label>${visible.length ? `<div class="nums">${visible.map((item) => `<button type="button" class="${ui.classPick === item.classNumber ? "on" : ""}" data-class="${esc(item.classNumber)}" aria-pressed="${ui.classPick === item.classNumber}">${esc(item.classNumber)}</button>`).join("")}</div>` : `<p class="locked-note bad">مفيش فصل بالرقم ده في ${esc(section.title)}. راجع الرقم وجرّب تاني.</p>`}`
    : `<p class="locked-note">اختار شعبتك الأول وهتظهرلك أرقام الفصول.</p>`;
  return `<div class="page start">
    <header class="start-head"><p class="kicker">خطوة واحدة وتبدأ</p><h1>اختار فصلك</h1><p class="lead">مرة واحدة بس، والصفحة الجاية تبقى يومك.</p>
      <div class="start-progress" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${doneSteps}"><span style="width:${(doneSteps / 3) * 100}%"></span></div></header>
    <div class="rail">
      ${step(1, !!ui.year, false, "فرقتك", years)}
      ${step(2, !!ui.sectionId, !ui.year, "شعبتك", secs)}
      ${step(3, ready, !ui.sectionId, "رقم فصلك", nums)}
    </div>
    <div class="dock"><div class="dock-sum" aria-live="polite">${crumbs.length ? `<div class="crumbs">${crumbs.map((item) => `<span>${esc(item)}</span>`).join(CRUMB_ARROW)}</div>` : ""}<small>${next}</small></div>
      <button type="button" class="btn lg" id="save-class" ${ready ? "" : "disabled"}>احفظ وابدأ يومي</button></div>
  </div>`;
}
function nudgeStep() {
  const open = document.querySelectorAll(".step:not(.locked)");
  const calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (open.length) open[open.length - 1].scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "nearest" });
}
// </start-view>

// <about-view>
const WA_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.4-4.1A8 8 0 1 1 8.2 18.7z"/><path d="M9.3 9.3c.2 2.1 2.3 4.2 4.4 4.4l1.1-1.1-1.6-1-.8.6c-.8-.3-1.5-1-1.8-1.8l.6-.8-1-1.6z"/></svg>';
const USER_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="9" r="4.6"/><path d="M2.5 24c0-5.6 4.3-8.6 9.5-8.6s9.5 3 9.5 8.6z"/></svg>';
const VERIFIED_ICON = '<svg class="verified" viewBox="0 0 24 24" width="18" height="18" role="img" aria-label="حساب موثّق"><path fill="#1d9bf0" d="M12 1.8l2.3 1.6 2.8-.2 1.2 2.5 2.5 1.2-.2 2.8 1.6 2.3-1.6 2.3.2 2.8-2.5 1.2-1.2 2.5-2.8-.2L12 22.2l-2.3-1.6-2.8.2-1.2-2.5-2.5-1.2.2-2.8L1.8 12l1.6-2.3-.2-2.8 2.5-1.2 1.2-2.5 2.8.2z"/><path d="M7.9 12.3l2.9 2.9 5.3-5.9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SITE_ICON = I("external", 18, 1.9);
function aboutView() {
  const wa = safeHttpUrl(WHATSAPP);
  const site = safeHttpUrl(PORTFOLIO);
  const facts = [["العام الدراسي", `<span dir="ltr">${esc(YEAR)}</span>`], ["الترم", esc(TERM)], ["آخر مراجعة", esc(LAST_REVIEW)]];
  return `<section class="page narrow about-page">
    <div class="about-hero"><span class="about-ring"><img src="jadwali-logo.jpg" alt="شعار جدولي" width="96" height="96" /></span>
      <h1>جدولي</h1>
      <p class="lead">${esc(ABOUT.lead)} <span dir="ltr">${esc(YEAR)}</span>.</p></div>
    <dl class="facts">${facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>
    ${ABOUT.why ? `<article class="card why"><h2>ليه الفرقة الأولى والتانية بس؟</h2><p>${esc(ABOUT.why)}</p></article>` : ""}
    <article class="card maker">
      <div class="maker-id"><span class="avatar" aria-hidden="true">${USER_ICON}</span><div><p class="name"><span>${esc(ABOUT.name)}</span>${VERIFIED_ICON}</p><p class="role" dir="ltr">Software Engineer</p></div></div>
      ${wa || site ? `<div class="maker-actions">${wa ? `<a class="btn" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${WA_ICON}<span>تواصل واتساب</span></a>` : ""}${site ? `<a class="ghost" href="${esc(site)}" target="_blank" rel="noopener noreferrer">${SITE_ICON}<span>البورتفوليو</span></a>` : ""}</div>` : ""}
    </article>
    <a class="card channel-card" href="${CHANNEL_URL}" target="_blank" rel="noopener noreferrer"><span class="side-ico ok">${I("channel", 20)}</span><div><h3>قناة تحديثات جدولي</h3><p>أخبار الجدول والإعلانات أول بأول على واتساب.</p></div>${I("external", 18)}</a>
  </section>`;
}
// </about-view>

// ---------- تصفح الشعب ----------
function sectionsView() {
  const years = [...new Set(SECTIONS.map((item) => item.yearLabel))];
  const picked = sectionById(ui.sectionId);
  const pickedClasses = picked ? classesIn(picked.id) : [];
  return `<div class="page">
    ${pageHead({ kicker: `العام الدراسي <span dir="ltr">${esc(YEAR)}</span>`, title: "تصفح الشعب", sub: "اختار شعبة وبعدها رقم الفصل عشان تفتح جدوله." })}
    ${years.map((year) => `<section class="day-block"><h2>${esc(year)}</h2><div class="card-grid four">${SECTIONS.filter((item) => item.yearLabel === year).map((item) => {
      const n = classesIn(item.id).length;
      return `<button type="button" class="section-card${ui.sectionId === item.id ? " on" : ""}" data-open-section="${esc(item.id)}" aria-pressed="${ui.sectionId === item.id}"><span class="side-ico">${I("layers", 20)}</span><b>${esc(item.title)}</b><small>${esc(item.major)} · ${esc(item.language)}</small><em>${n} ${n >= 3 && n <= 10 ? "فصول" : "فصل"}</em></button>`;
    }).join("")}</div></section>`).join("")}
    ${picked ? `<section class="card class-picker" id="class-picker"><div class="between"><h2>فصول ${esc(picked.title)}</h2><span class="badge">${esc(picked.yearLabel)}</span></div>${pickedClasses.length ? `<div class="nums">${pickedClasses.map((item) => `<button type="button" data-open-class="${esc(item.classNumber)}">${esc(item.classNumber)}</button>`).join("")}</div>` : `<p class="muted">لسه مفيش فصول منشورة للشعبة دي.</p>`}</section>` : ""}
  </div>`;
}

// ---------- البحث ----------
function searchResults(raw) {
  const result = smartSearch(raw);
  if (!String(raw || "").trim()) return "";
  if (result.tooShort) return `<p class="search-empty muted">اكتب حرفين على الأقل.</p>`;
  const classes = result.classes.map((schedule) => {
    const section = sectionById(schedule.sectionId);
    return `<button type="button" class="search-hit" data-jump="${esc(schedule.sectionId)}|${esc(schedule.classNumber)}"><span class="hit-ico">${I("layers", 18)}</span><span class="hit-text"><b>فصل ${esc(schedule.classNumber)}</b><small>${esc(section?.yearLabel || "")} · ${esc(section?.title || "")}</small></span><span class="badge primary">فصل</span></button>`;
  }).join("");
  const lectures = result.lectures.map((hit) => {
    const section = sectionById(hit.schedule.sectionId);
    return `<button type="button" class="search-hit" data-jump="${esc(hit.schedule.sectionId)}|${esc(hit.schedule.classNumber)}"><span class="hit-ico" style="--c:${colorOf(hit.slot.subject)}">${I("table", 18)}</span><span class="hit-text"><b>${esc(readable(hit.slot.subject))}</b><small>${esc(hit.slot.day)} ${range(hit.slot.start, hit.slot.end)} · فصل ${esc(hit.schedule.classNumber)} ${esc(section?.title || "")}${hit.slot.room ? ` · <span dir="ltr">${esc(hit.slot.room)}</span>` : ""}</small></span><span class="badge">${esc(hit.via)}</span></button>`;
  }).join("");
  return classes || lectures ? classes + lectures : `<p class="search-empty muted">مفيش نتيجة لـ «${esc(raw)}». جرّب رقم الفصل أو اسم المادة.</p>`;
}

// ---------- الصفحة الرئيسية ----------
function demoSchedule() {
  return CLASSES.find((item) => DAYS.some((day) => openDay(item, day).length >= 3)) || CLASSES[0] || null;
}
function demoBody(schedule) {
  const days = DAYS.filter((day) => openDay(schedule, day).length);
  const day = days.includes(ui.demoDay) ? ui.demoDay : days.slice().sort((a, b) => openDay(schedule, b).length - openDay(schedule, a).length)[0];
  const slots = openDay(schedule, day).slice(0, 3);
  const live = slots[0];
  return `<div class="demo-days">${days.map((item) => `<button type="button" class="${item === day ? "on" : ""}" data-demo-day="${item}">${DAY_SHORT[item]}</button>`).join("")}</div>
    ${live ? `<article class="focus live mini"><div class="between"><span class="badge ok pulse"><i class="dot"></i>شغّالة دلوقتي</span><span class="focus-time">${range(live.start, live.end)}</span></div><h2>${esc(readable(live.subject))}</h2><div class="focus-foot">${roomPill(live)}<span class="left">فاضل <b>25 دقيقة</b></span></div><div class="prog"><span style="width:64%"></span></div></article>` : ""}
    <div class="timeline">${slots.slice(1).map((slot, i) => slotRow(schedule, slot, i === 0 ? "next" : "later")).join("")}</div>`;
}
function hero() {
  const saved = current();
  const demo = demoSchedule();
  const lectures = CLASSES.reduce((sum, item) => sum + item.slots.length, 0);
  const action = EXAM_MODE
    ? `<button type="button" class="btn lg" data-go="${saved ? "exams" : "start"}">${saved ? "امتحاناتي" : "اختار فصلك"}</button>`
    : saved
    ? `<button type="button" class="btn lg" data-go="day">اعرض جدولي</button><button type="button" class="ghost lg" data-go="table">الجدول الكامل</button>`
    : `<button type="button" class="btn lg" data-go="start">ابدأ الآن، مجانًا${I("arrow", 18, 2)}</button><button type="button" class="ghost lg" data-go="sections">تصفح الشعب</button>`;
  const feature = (cls, icon, title, text, extra = "") => `<article class="bento-card ${cls}"><span class="side-ico">${I(icon, 20)}</span><h3>${title}</h3><p>${text}</p>${extra}</article>`;
  const steps = [["اختار فرقتك وشعبتك", "الفرقة الأولى أو الثانية، إدارة أو نظم، عربي أو إنجليزي."], ["اكتب رقم فصلك", "مرة واحدة بس، وجدولي يفتكرك على طول."], ["يومك قدامك", "المحاضرة الجاية، القاعة، والوقت الفاضل من غير ملفات ولا لف."]];
  return `<div class="landing-page">
    <section class="hero" aria-label="مقدمة جدولي">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="hero-copy">
        <span class="badge primary hero-badge"><i class="dot"></i>العام الدراسي <span dir="ltr">${esc(YEAR)}</span> · آخر مراجعة ${esc(LAST_REVIEW)}</span>
        <h1>جدولك. يومك.<br><em>من غير لف.</em></h1>
        <p class="lead">${EXAM_MODE ? "وضع الامتحانات شغّال. المحاضرات راجعة أول ما الإدارة تقفل الوضع." : "محاضرات الفرقة الأولى والتانية في الأكاديمية الحديثة بالمعادي في مكان واحد. اختار فصلك مرة، وجدولي يوريك محاضرتك الجاية وقاعتها وينبّهك قبلها."}</p>
        <div class="hero-actions">${action}</div>
        ${EXAM_MODE ? "" : `<form id="search-form" class="hero-search" role="search">
          <label class="search-box">${I("search", 18, 1.9)}<input class="input" id="search" type="search" autocomplete="off" placeholder="أو ابحث برقم الفصل، المادة، الدكتور أو القاعة" aria-label="بحث في الجداول" value="${esc(ui.search)}" /></label>
          <div id="search-out" class="search-pop" ${ui.search.trim() ? "" : "hidden"}>${searchResults(ui.search)}</div>
        </form>`}
        <ul class="hero-trust"><li>${I("check", 16, 2.4)}مجاني بالكامل</li><li>${I("check", 16, 2.4)}من غير تسجيل</li><li>${I("check", 16, 2.4)}بيشتغل من غير نت</li></ul>
      </div>
      ${demo ? `<div class="hero-preview" aria-label="معاينة تفاعلية للتطبيق">
        <div class="device">
          <div class="device-bar"><span class="device-dots"><i></i><i></i><i></i></span><span class="device-title">يومك · فصل ${esc(demo.classNumber)}</span><span class="badge ok">مباشر</span></div>
          <div class="device-body" id="demo-body">${demoBody(demo)}</div>
        </div>
        <div class="float-card float-a"><span class="side-ico ok">${I("bell", 18)}</span><div><b>محاضرتك بعد 10 دقايق</b><small>إشعار قبل كل محاضرة</small></div></div>
        <div class="float-card float-b"><span class="side-ico warn">${I("pin", 18)}</span><div><b>القاعة اتغيرت</b><small>بنبلّغك في نفس اللحظة</small></div></div>
      </div>` : ""}
    </section>

    <section class="stat-strip" aria-label="أرقام جدولي">
      <div><b class="num">${SECTIONS.length}</b><span>شعب</span></div>
      <div><b class="num">${CLASSES.length}</b><span>فصل</span></div>
      <div><b class="num">${lectures.toLocaleString("en-US")}</b><span>محاضرة أسبوعيًا</span></div>
      <div><b class="num">${DAYS.length}</b><span>أيام دراسة</span></div>
    </section>

    ${newsBlock(saved)}

    <section class="block" aria-labelledby="features-title">
      <header class="block-head"><p class="kicker">ليه جدولي؟</p><h2 id="features-title">كل اللي محتاجه عشان ما تتوهش</h2><p class="lead">مش مجرد جدول. جدولي بيعرف انت فين في يومك وبيقولك اللي جاي.</p></header>
      <div class="bento">
        ${feature("wide", "today", "يومك لحظة بلحظة", "المحاضرة اللي شغّالة دلوقتي، اللي بعدها، وفاضل قد إيه على ما تخلص. كله بيتحدّث لوحده.", `<div class="bento-demo"><span class="badge ok pulse"><i class="dot"></i>دلوقتي</span><span class="badge primary">الجاية</span><span class="badge">خلصت</span><span class="badge warn">اتأجلت</span><span class="badge danger">اتلغت</span></div>`)}
        ${feature("", "bell", "إشعارات قبل المحاضرة", "تنبيه قبلها بـ 5 لـ 30 دقيقة، حتى والتطبيق مقفول.")}
        ${feature("", "spark", "اسأل جدولي", "مساعد ذكي بيرد على «بكرة عندي إيه؟» و«فاضي امتى؟».")}
        ${feature("", "wifi", "بيشتغل من غير نت", "ثبّته كتطبيق وافتح جدولك في أي وقت، حتى في المدرج.")}
        ${feature("", "exam", "الامتحانات في مكانها", "مواعيد الميدتيرم والنهائي وقاعاتها مع عدّ تنازلي.")}
        ${feature("wide", "share", "شارك وصدّر بضغطة", "صورة جاهزة لجدول النهاردة أو الأسبوع، ملف PDF للطباعة، CSV، أو ضيف المحاضرات لتقويم موبايلك.", `<div class="bento-demo"><span class="pill">${I("image", 14)}PNG</span><span class="pill">${I("print", 14)}PDF</span><span class="pill">${I("file", 14)}CSV</span><span class="pill">${I("calendar", 14)}ICS</span><span class="pill">${I("link", 14)}لينك</span></div>`)}
      </div>
    </section>

    <section class="block" aria-labelledby="how-title">
      <header class="block-head"><p class="kicker">في أقل من دقيقة</p><h2 id="how-title">تبدأ إزاي؟</h2></header>
      <ol class="how">${steps.map(([title, text], i) => `<li><span class="how-n">${i + 1}</span><h3>${title}</h3><p>${text}</p></li>`).join("")}</ol>
    </section>

    <section class="cta-band"><div><h2>جاهز تعرف محاضرتك الجاية؟</h2><p>اختار فصلك دلوقتي، ومش هتحتاج تفتح ملف الجدول تاني.</p></div><div class="hero-actions">${action}</div></section>
  </div>`;
}

const views = {
  setup() {
    return hero();
  },
  start() {
    return startView();
  },
  day(saved) {
    return EXAM_MODE ? examBoard(saved) : dayView(saved);
  },
  today(saved) {
    return EXAM_MODE ? examBoard(saved) : dayList(saved, new Date(), "محاضراتي النهاردة");
  },
  tomorrow(saved) {
    return EXAM_MODE ? examBoard(saved) : dayList(saved, shiftCairo(new Date(), 1, 12 * 60), "بكرة");
  },
  free(saved) {
    return EXAM_MODE ? examBoard(saved) : freeView(saved);
  },
  table(saved) {
    return EXAM_MODE ? examBoard(saved) : tableView(saved);
  },
  exams() {
    return examsView(current());
  },
  alerts(saved) {
    return alertsView(saved);
  },
  about() {
    return aboutView();
  },
  assistant(saved) {
    return assistantView(saved);
  },
  sections() {
    return sectionsView();
  },
};

// ---------- التنقل ----------
function drawTabs(saved) {
  const bar = document.getElementById("tabbar");
  if (!bar) return;
  const show = !!saved && ui.view !== "setup" && ui.view !== "start";
  bar.hidden = !show;
  document.body.classList.toggle("has-tabs", show);
  if (!show) return;
  const tabs = EXAM_MODE
    ? [["exams", "امتحاناتك", "exam"], ["alerts", "الإشعارات", "bell"]]
    : [["day", "يومك", "home"], ["table", "الجدول", "table"], ["exams", "الامتحانات", "exam"], ["alerts", "الإشعارات", "bell"]];
  const dayGroup = ["day", "today", "tomorrow", "free"];
  bar.innerHTML = tabs.map(([id, label, icon]) => {
    const on = ui.view === id || (id === "day" && dayGroup.includes(ui.view));
    return `<button type="button" class="${on ? "on" : ""}" data-go="${id}"${on ? ' aria-current="page"' : ""}>${I(icon, 22)}<span>${label}</span></button>`;
  }).join("") + `<button type="button" data-more aria-haspopup="dialog">${I("more", 22)}<span>المزيد</span></button>`;
}
function drawNav(saved) {
  const row = (icon, label, attrs, cls = "", tail = "") => `<button type="button" class="nav-item ${cls}" ${attrs} title="${label}"><span class="ni">${I(icon, 20)}</span><span class="nl">${label}</span>${tail}</button>`;
  const goBtn = (id, label, icon) => row(icon, label, `data-go="${id}"${ui.view === id ? ' aria-current="page"' : ""}`, ui.view === id ? "on" : "");
  const act = (id, label, icon, cls = "") => row(icon, label, `id="${id}"`, cls);
  const group = (title, items) => `<section class="nav-group"><p class="nav-label">${title}</p>${items}</section>`;
  const chip = document.getElementById("drawer-class");
  if (saved) {
    chip.hidden = false;
    chip.innerHTML = `<span class="dc-num">${esc(saved.schedule.classNumber)}</span><span class="dc-text"><span class="dc-kicker">فصلك</span><span class="dc-sub">${esc(saved.section.yearLabel)} · ${esc(saved.section.title)}</span></span>`;
  } else {
    chip.hidden = true;
    chip.innerHTML = "";
  }
  const channel = `<a class="nav-item nav-link" href="${CHANNEL_URL}" target="_blank" rel="noopener noreferrer" title="قناة تحديثات جدولي"><span class="ni">${I("channel", 20)}</span><span class="nl">قناة تحديثات جدولي</span><span class="nav-tail">${I("external", 14, 2)}</span></a>`;
  const aboutGroup = group("عن جدولي", goBtn("about", "من نحن", "info") + channel);
  const classGroup = saved
    ? group("فصلك", act("report", "في غلطة؟ بلّغنا", "flag") + act("change-class", "تغيير الفصل", "swap") + act("clear-class", "إزالة الفصل", "trash", "danger"))
    : group("ابدأ", goBtn("start", "اختار فصلك", "check"));
  const shareGroup = saved
    ? group("شارك جدولك", act("share-today", "صورة جدول النهاردة", "image") + act("share-week", "صورة الأسبوع", "image") + act("share-class", "ابعت لينك الفصل", "link"))
    : "";
  const foot = `<div class="drawer-foot"><button type="button" class="nav-item" data-theme-toggle title="تبديل الوضع"><span class="ni theme-toggle">${I("sun", 20).replace("<svg", '<svg class="i-sun"')}${UI.svg('<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/>', 20, 1.8).replace("<svg", '<svg class="i-moon"')}</span><span class="nl">الوضع الداكن / الفاتح</span></button><p class="foot-note">جدولي · <span dir="ltr">${esc(YEAR)}</span><br>آخر مراجعة ${esc(LAST_REVIEW)}</p></div>`;
  const guestGroup = group("جدولي", goBtn("setup", "الرئيسية", "home") + goBtn("sections", "تصفح الشعب", "grid"));
  document.getElementById("drawer-nav").innerHTML = (!saved
    ? guestGroup + classGroup + aboutGroup
    : EXAM_MODE
    ? group("الامتحانات", goBtn("exams", "امتحاناتك", "exam") + goBtn("assistant", "اسأل جدولي", "spark") + goBtn("alerts", "إشعار جدولي", "bell")) + aboutGroup + classGroup
    : group("اليوم", goBtn("day", "يومك", "home") + goBtn("assistant", "اسأل جدولي", "spark") + goBtn("today", "محاضراتي النهاردة", "today") + goBtn("tomorrow", "بكرة", "sun") + goBtn("free", "فاضي امتى", "coffee"))
      + group("الجدول", goBtn("table", "الجدول الكامل", "table") + goBtn("exams", "الامتحانات", "exam") + goBtn("alerts", "إشعار جدولي", "bell") + goBtn("sections", "تصفح الشعب", "grid"))
      + shareGroup + aboutGroup + classGroup) + foot;
}

// ---------- المسارات ----------
function applyClassLink(sectionId, classNumber) {
  const schedule = getClass(decodeURIComponent(sectionId), decodeURIComponent(classNumber));
  if (!schedule) return false;
  writeSaved(schedule);
  ui.year = sectionById(schedule.sectionId)?.year || null;
  ui.sectionId = schedule.sectionId;
  ui.classPick = schedule.classNumber;
  ui.view = "table";
  return true;
}
function readRoute() {
  const raw = location.hash.replace(/^#\/?/, "");
  const match = raw.match(/^c\/([^/]+)\/([^/]+)/);
  if (match && applyClassLink(match[1], match[2])) return;
  const name = raw.split(/[/?]/)[0];
  ui.view = VIEW_IDS.has(name) ? name : "setup";
  if (readSaved() && (!name || name === "setup")) {
    ui.view = "day";
    if ((location.hash || "#/") !== "#/day") {
      routing = true;
      location.hash = "#/day";
      routing = false;
    }
  }
}
function closeDrawer() {
  document.getElementById("drawer").hidden = true;
  document.body.classList.remove("drawer-open");
}
function openDrawer() {
  document.getElementById("drawer").hidden = false;
  document.body.classList.add("drawer-open");
  document.querySelector("#drawer .nav-item")?.focus({ preventScroll: true });
}
function go(view) {
  ui.view = view;
  if (view === "day") ui.pickedDay = null;
  const next = view === "setup" ? "#/" : `#/${view}`;
  closeDrawer();
  if ((location.hash || "#/") !== next) {
    routing = true;
    location.hash = next;
    routing = false;
  }
  render();
  window.scrollTo(0, 0);
}
