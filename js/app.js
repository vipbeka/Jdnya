let CLASSES = window.JADWALI_CLASSES;
const DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const DAY_SHORT = { السبت: "سبت", الأحد: "أحد", الإثنين: "إثن", الثلاثاء: "ثلا", الأربعاء: "أرب", الخميس: "خمي" };
const TIMES = [
  ["08:30", "09:40"],
  ["09:45", "10:55"],
  ["11:00", "12:10"],
  ["12:15", "01:25"],
  ["01:30", "02:40"],
  ["02:45", "03:55"],
  ["04:00", "05:10"],
  ["05:15", "06:25"],
];
const ORDINALS = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة"];
let SECTIONS = [
  { id: "y1-mgmt-en", title: "إدارة إنجليزي", major: "إدارة أعمال", language: "إنجليزي", year: "1", yearLabel: "الفرقة الأولى" },
  { id: "y1-mgmt-ar", title: "إدارة عربي", major: "إدارة أعمال", language: "عربي", year: "1", yearLabel: "الفرقة الأولى" },
  { id: "y1-is-en", title: "نظم إنجليزي", major: "نظم المعلومات", language: "إنجليزي", year: "1", yearLabel: "الفرقة الأولى" },
  { id: "y1-is-ar", title: "نظم عربي", major: "نظم المعلومات", language: "عربي", year: "1", yearLabel: "الفرقة الأولى" },
  { id: "mgmt-en", title: "إدارة إنجليزي", major: "إدارة أعمال", language: "إنجليزي", year: "2", yearLabel: "الفرقة الثانية" },
  { id: "mgmt-ar", title: "إدارة عربي", major: "إدارة أعمال", language: "عربي", year: "2", yearLabel: "الفرقة الثانية" },
  { id: "is-en", title: "نظم إنجليزي", major: "نظم المعلومات", language: "إنجليزي", year: "2", yearLabel: "الفرقة الثانية" },
  { id: "is-ar", title: "نظم عربي", major: "نظم المعلومات", language: "عربي", year: "2", yearLabel: "الفرقة الثانية" },
];
const HOLIDAYS = [
  { date: "2027-01-07", name: "عيد الميلاد المجيد" },
  { date: "2027-01-25", name: "ثورة 25 يناير وعيد الشرطة" },
];
let YEAR = "2026/2027";
let TERM = "الترم الأول";
let EXAM_MODE = false;
let LAST_REVIEW = "16 أكتوبر 2026";
let DEFAULT_LEAD = 10;
let DATA_STALE = false;
let LAST_SYNC = Number(localStorage.getItem("jadwali-last-sync") || 0);
let SITE_REV = "";
let ANNOUNCEMENTS = [];
let EXAMS = [];
let GROUPS = [];
let EXTRA_HOLIDAYS = [];
const ABOUT = {
  lead: "جدولي جدول محاضرات الفرقة الأولى والتانية للعام الدراسي",
  why: "الفرقة الأولى والتانية هما أكتر فرق لسه مش فاهمة نظام الجداول. الفرقة الثالثة والرابعة غالبًا متعودة عليه.",
  name: "محمد أحمد",
};
let WHATSAPP = "https://wa.me/201224722928";
let PORTFOLIO = "https://mohamed-11.web.app";
const VIEW_IDS = new Set(["setup", "start", "day", "today", "tomorrow", "free", "table", "exams", "alerts", "about", "sections", "assistant"]);

const ui = {
  view: "setup",
  year: null,
  sectionId: null,
  classPick: null,
  classQuery: "",
  search: "",
  pickedDay: null,
  mode: "grid",
};
let installEvent = null;
let routing = false;
document.addEventListener("gesturestart", (event) => event.preventDefault());
document.addEventListener("touchmove", (event) => {
  if (event.touches.length > 1) event.preventDefault();
}, { passive: false });

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const code = char.charCodeAt(0);
    if (code === 38) return "&" + "amp;";
    if (code === 60) return "&" + "lt;";
    if (code === 62) return "&" + "gt;";
    if (code === 34) return "&" + "quot;";
    return "&" + "#39;";
  });
}
const ARABIC_WORDS = ["محاضرة", "امتحان", "مادة", "قاعة", "مدرج", "إدارة", "السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "دكتور", "الفصل", "شعبة", "أعمال", "مبادئ", "محاسبة", "تسويق", "اقتصاد", "قانون"];
function readable(value) {
  const visual = String(value || "").replace(/\s+/g, " ").trim();
  if (!/[\u0600-\u06FF]/.test(visual)) return visual;
  const reverseRuns = (text) => text.replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, (run) => [...run].reverse().join(""));
  const score = (text) => ARABIC_WORDS.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
  const reversedRuns = reverseRuns(visual);
  const reversedWords = visual.split(" ").reverse().join(" ");
  return [visual, reversedRuns, reversedWords, reverseRuns(reversedWords), reversedRuns.split(" ").reverse().join(" ")].sort((a, b) => score(b) - score(a))[0];
}
function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (url.username || url.password) return "";
    return url.href;
  } catch {
    return "";
  }
}
function newsKey(item) {
  return String(item.id || `${item.title}|${item.created_at || ""}|${item.image_url || ""}`);
}
function seenNews() {
  try {
    const saved = JSON.parse(localStorage.getItem("jadwali-seen-news") || "[]");
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}
function rememberNews(key) {
  if (!key) return;
  const seen = seenNews();
  seen.add(key);
  localStorage.setItem("jadwali-seen-news", JSON.stringify([...seen].slice(-40)));
}
function visibleNews(saved) {
  const seen = seenNews();
  return ANNOUNCEMENTS.filter((item) => {
    if (seen.has(newsKey(item))) return false;
    const audience = item.audience || "all";
    if (audience === "all") return true;
    if (!saved || item.section_id !== saved.schedule.sectionId) return false;
    if (audience === "class" && String(item.class_number || "") !== String(saved.schedule.classNumber)) return false;
    return audience === "section" || audience === "class";
  }).slice(0, 3);
}
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
    ${image ? `<img src="${esc(image)}" alt="" />` : ""}
    <div class="announce-body">
      <p class="kicker">${item.audience === "class" ? "إعلان فصلك" : item.audience === "section" ? "إعلان شعبتك" : "إعلان"}</p>
      <h2>${esc(item.title)}</h2>
      <p>${esc(item.body)}</p>
      ${link && label ? `<a class="btn" data-dismiss-news="${key}" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : ""}
    </div>
  </article>`;
}
function sectionById(id) {
  return SECTIONS.find((item) => item.id === id);
}
function digits(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^\d]/g, "")
    .replace(/^0+/, "");
}
function classesIn(sectionId) {
  return CLASSES.filter((item) => item.sectionId === sectionId).sort((a, b) => Number(a.classNumber) - Number(b.classNumber));
}
function getClass(sectionId, classNumber) {
  const number = digits(classNumber);
  return CLASSES.find((item) => item.sectionId === sectionId && digits(item.classNumber) === number);
}
function readSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem("jadwali-my-class") || "null");
    if (!parsed) return null;
    const schedule = getClass(parsed.sectionId, parsed.classNumber);
    return schedule ? { schedule, section: sectionById(schedule.sectionId) } : null;
  } catch {
    return null;
  }
}
function writeSaved(schedule) {
  if (!schedule) localStorage.removeItem("jadwali-my-class");
  else localStorage.setItem("jadwali-my-class", JSON.stringify({ sectionId: schedule.sectionId, classNumber: schedule.classNumber }));
  schedulePushSync();
}
function fold(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ً-ْٰ]/g, "");
}
function slotMinutes(hhmm) {
  const [hourText, minuteText] = hhmm.split(":");
  const hour = Number(hourText);
  return (hour <= 7 ? hour + 12 : hour) * 60 + Number(minuteText);
}
function timeIndex(start) {
  const index = TIMES.findIndex((row) => row[0] === start);
  return index < 0 ? 99 : index;
}
function sortSlots(slots) {
  return [...slots].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || slotMinutes(a.start) - slotMinutes(b.start));
}
function slotsOn(schedule, day) {
  if (!day) return [];
  return sortSlots(schedule.slots.filter((slot) => slot.day === day));
}
function lectureOf(slots, slot) {
  const n = slots.filter((item) => item.day === slot.day).sort((a, b) => timeIndex(a.start) - timeIndex(b.start)).findIndex((item) => item.start === slot.start) + 1;
  const index = n > 0 ? n : 1;
  return { ar: ORDINALS[index - 1] ? `المحاضرة ${ORDINALS[index - 1]}` : `المحاضرة ${index}`, en: `Lect ${index}` };
}
function clock(hhmm) {
  const [hourText, minuteText] = hhmm.split(":");
  const hour = Number(hourText);
  const afternoon = (hour >= 1 && hour <= 7) || hour === 12;
  return `${hour}:${String(minuteText).padStart(2, "0")} ${afternoon ? "م" : "ص"}`;
}
function range(start, end) {
  return `<span dir="ltr">${esc(clock(start))} – ${esc(clock(end))}</span>`;
}
function cairoFields(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  const weekday = { Sun: "الأحد", Mon: "الإثنين", Tue: "الثلاثاء", Wed: "الأربعاء", Thu: "الخميس", Fri: "الجمعة", Sat: "السبت" }[get("weekday")] || "";
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return {
    weekday,
    key: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: hour * 60 + minute,
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}
function cairoInstant(year, month, day, totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const read = (ms) => {
    const map = Object.fromEntries(fmt.formatToParts(new Date(ms)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    return Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour) % 24, Number(map.minute));
  };
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let ms = target;
  for (let i = 0; i < 4; i += 1) ms += target - read(ms);
  return new Date(ms);
}
function cairoMinutes(now) {
  return cairoFields(now).minutes;
}
function cairoKey(date) {
  return cairoFields(date).key;
}
function holidayOn(date) {
  const key = cairoKey(date);
  return HOLIDAYS.find((item) => item.date === key) || EXTRA_HOLIDAYS.find((item) => item.date === key) || null;
}
function allHolidays() {
  const map = new Map();
  [...HOLIDAYS, ...EXTRA_HOLIDAYS].forEach((item) => map.set(item.date, item));
  return [...map.values()];
}
function jsDay(date) {
  const name = cairoFields(date).weekday;
  return name === "الجمعة" ? null : name;
}
function weekdayName(date) {
  return cairoFields(date).weekday;
}
function shiftCairo(now, days, minutes) {
  const fields = cairoFields(now);
  return cairoInstant(fields.year, fields.month, fields.day + days, minutes);
}
function slotStatus(slot, now, nextStart) {
  if (slot.status === "cancelled") return "cancelled";
  const minute = cairoMinutes(now);
  if (minute >= slotMinutes(slot.end)) return "done";
  if (minute >= slotMinutes(slot.start)) return "live";
  if (nextStart && slot.start === nextStart) return "next";
  return "later";
}
function colorOf(subject) {
  const palette = ["#d4b08c", "#c4a484", "#e4c9a8", "#a88762", "#8d7358", "#f0ddc8", "#b08968", "#9a7b52"];
  let hash = 0;
  for (const char of subject) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

function smartSearch(raw) {
  const prepared = fold(raw).replace(/دكتوره|الدكتور|دكتور|استاذ|مهندس/g, " ").replace(/\s+/g, " ").trim();
  const compact = prepared.replace(/\s/g, "");
  const numeric = /^\d+$/.test(compact);
  if (!prepared || (!numeric && compact.length < 2)) return { classes: [], lectures: [], tooShort: raw.trim().length > 0 };
  const number = digits(raw);
  const foundClasses = numeric && number ? CLASSES.filter((item) => digits(item.classNumber) === number) : [];
  const dayKeys = {
    السبت: ["سبت"],
    الأحد: ["احد"],
    الإثنين: ["اثنين", "اتنين"],
    الثلاثاء: ["تلات", "ثلاث"],
    الأربعاء: ["اربع"],
    الخميس: ["خميس"],
  };
  const lectures = [];
  for (const schedule of CLASSES) {
    for (const slot of schedule.slots) {
      let score = 0;
      let via = "مادة";
      const subject = fold(slot.subject);
      const instructor = fold(slot.instructor);
      const room = fold(slot.room).replace(/\s/g, "");
      if (subject.includes(prepared)) {
        score = 82;
        via = "مادة";
      }
      if (instructor.includes(prepared)) {
        score = 74;
        via = "محاضر";
      }
      const dayHit = (dayKeys[slot.day] || []).some((key) => compact.includes(key) || key.includes(compact));
      if (dayHit && score < 66) {
        score = 66;
        via = "يوم";
      }
      if ((room === compact || (numeric && room.replace(/\D/g, "") === number)) && score < 96) {
        score = 96;
        via = "قاعة";
      }
      if (score) lectures.push({ schedule, slot, via, score });
    }
  }
  lectures.sort((a, b) => b.score - a.score);
  return { classes: foundClasses, lectures: lectures.slice(0, 20), tooShort: false };
}

function lectureCard(schedule, slot, status) {
  const label = lectureOf(schedule.slots, slot);
  const moved = slot.status === "moved";
  const cancelled = slot.status === "cancelled";
  const tag = cancelled ? "اتلغت" : moved ? "اتأجلت" : status === "done" ? "خلصت" : status === "live" ? "دلوقتي" : status === "next" ? "الجاية" : "";
  const look = cancelled ? "cancelled" : status || "";
  return `<article class="lecture ${esc(look)}">
    <span class="mark" style="background:${colorOf(slot.subject)}"></span>
    <div class="between">
      <p class="kicker" style="margin:0">${esc(label.ar)} <span class="muted">/</span> <span dir="ltr">${esc(label.en)}</span></p>
      ${tag ? `<span class="tag ${esc(cancelled ? "cancelled" : moved ? "moved" : status)}">${tag}</span>` : ""}
    </div>
    <p class="${cancelled || status === "done" ? "strike" : ""}" style="margin:8px 0 0;font-weight:650">${esc(readable(slot.subject))}</p>
    ${slot.instructor ? `<p class="muted" style="margin:6px 0 0">المحاضر: ${esc(readable(slot.instructor))}</p>` : ""}
    <p style="margin:10px 0 0">الوقت ${range(slot.start, slot.end)}</p>
    ${slot.was ? `<p class="muted" style="margin:6px 0 0">كانت ${esc(slot.was)}</p>` : ""}
    ${slot.note ? `<p class="muted" style="margin:6px 0 0">${esc(slot.note)}</p>` : ""}
    ${slot.room ? `<p class="between" style="margin:8px 0 0"><span class="muted">القاعة</span><span dir="ltr">${esc(slot.room)}</span></p>` : ""}
  </article>`;
}

function nextInfo(schedule, now) {
  const fields = cairoFields(now);
  const order = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const todayIndex = order.indexOf(fields.weekday);
  let best = null;
  for (const slot of schedule.slots) {
    if (slot.status === "cancelled") continue;
    const target = order.indexOf(slot.day);
    if (target < 0) continue;
    let delta = (target - todayIndex + 7) % 7;
    const endMin = slotMinutes(slot.end);
    if (delta === 0 && fields.minutes >= endMin) delta = 7;
    let start = cairoInstant(fields.year, fields.month, fields.day + delta, slotMinutes(slot.start));
    let end = cairoInstant(fields.year, fields.month, fields.day + delta, endMin);
    if (holidayOn(start)) {
      start = cairoInstant(fields.year, fields.month, fields.day + delta + 7, slotMinutes(slot.start));
      end = cairoInstant(fields.year, fields.month, fields.day + delta + 7, endMin);
      if (holidayOn(start)) continue;
    }
    if (!best || start < best.start) best = { slot, start, end, live: now >= start && now < end };
  }
  return best;
}
function formatCount(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const clockText = [hours, mins, secs].map((part) => String(part).padStart(2, "0")).join(":");
  return days > 0 ? `${days} يوم و ${clockText}` : clockText;
}

function current() {
  return readSaved();
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
  document.body.classList.toggle("landing", view === "setup");
  document.body.classList.toggle("chat-mode", view === "assistant");
  if (view !== "assistant") document.body.classList.remove("chat-typing");
  drawNav(saved);
  drawTabs(saved);
  lastSig = daySig();
  if (quiet) window.scrollTo(0, scrollY);
  if (view === "assistant") mountChat();
}

const ICON = {
  pin: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>',
  user: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.6-3.6 3.5-5.4 7-5.4s6.4 1.8 7 5.4"/></svg>',
  home: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
  table: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M9 9.5v10M15 9.5v10"/></svg>',
  exam: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h8l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M14.5 3.5V8H19M9 13h6M9 17h4"/></svg>',
  bell: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/></svg>',
  more: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  image: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/></svg>',
};
const WEEK_ORDER = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
let lastSig = "";
function greeting(now) {
  const hour = Math.floor(cairoMinutes(now) / 60);
  return hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء النور";
}
function dateLine(now) {
  return new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "long" }).format(now);
}
function roomPill(slot) {
  return slot && slot.room ? `<span class="pill" dir="ltr">${ICON.pin}${esc(slot.room)}</span>` : "";
}
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
    return `<article class="focus live"><div class="between"><span class="live-chip"><i></i>شغّالة دلوقتي</span><span class="focus-time">${range(live.start, live.end)}</span></div>
      <h2>${esc(readable(live.subject))}</h2>
      ${live.instructor ? `<p class="who">${ICON.user}${esc(readable(live.instructor))}</p>` : ""}
      <div class="focus-foot">${roomPill(live)}<span class="left">فاضل <b id="count">${softLeft(info ? info.end - now : 0)}</b></span></div>
      <div class="prog"><span id="prog" data-s="${s}" data-e="${e}" style="width:${pct}%"></span></div></article>`;
  }
  if (later) {
    const start = info ? info.start : now;
    return `<article class="focus"><div class="between"><span class="soft-chip">${done ? "المحاضرة الجاية" : "أول محاضرة النهاردة"}</span><span class="focus-time">${range(later.start, later.end)}</span></div>
      <h2>${esc(readable(later.subject))}</h2>
      ${later.instructor ? `<p class="who">${ICON.user}${esc(readable(later.instructor))}</p>` : ""}
      <div class="focus-foot">${roomPill(later)}<span class="left">بعد <b id="count">${softLeft(start - now)}</b></span></div></article>`;
  }
  const title = holiday ? `إجازة: ${esc(holiday.name)}` : slots.length ? "يومك خلص، ربنا يقويك" : dayName ? "مفيش محاضرات النهاردة" : "النهاردة جمعة";
  const nx = info?.slot;
  return `<article class="focus calm"><span class="soft-chip">${slots.length ? `خلصت ${done} من ${slots.length}` : "راحة"}</span>
    <h2>${title}</h2>
    ${nx ? `<p class="who">الجاية: ${esc(nx.day)} · ${esc(readable(nx.subject))}</p><div class="focus-foot">${roomPill(nx)}<span class="left">${range(nx.start, nx.end)}</span></div>` : ""}</article>`;
}
function weekStrip(saved, now, focus) {
  const todayIdx = WEEK_ORDER.indexOf(weekdayName(now));
  const shift = todayIdx === 6 ? 7 : 0;
  return `<div class="days" role="tablist">${DAYS.map((day, i) => {
    const date = shiftCairo(now, i - todayIdx + shift, 12 * 60);
    const count = openDay(saved.schedule, day).length;
    const off = holidayOn(date);
    const isToday = cairoKey(date) === cairoKey(now);
    return `<button type="button" role="tab" class="${focus === day ? "on" : ""} ${isToday ? "today" : ""} ${off ? "off" : ""}" data-day="${day}"><small>${DAY_SHORT[day]}</small><b>${cairoFields(date).day}</b><i class="dots">${off ? "إجازة" : count ? `${count} ${count === 1 ? "محاضرة" : "محاضرات"}` : "فاضي"}</i></button>`;
  }).join("")}</div>`;
}
function slotRow(schedule, slot, status) {
  const label = lectureOf(schedule.slots, slot);
  const cancelled = slot.status === "cancelled";
  const moved = slot.status === "moved";
  const st = cancelled ? "cancelled" : status || "";
  const tag = cancelled ? "اتلغت" : moved ? "اتأجلت" : st === "live" ? "دلوقتي" : st === "next" ? "الجاية" : st === "done" ? "خلصت" : "";
  const tagClass = cancelled ? "cancelled" : moved ? "moved" : st;
  return `<div class="tl-row ${esc(st)}"><div class="tl-time"><b dir="ltr">${esc(clock(slot.start))}</b><small dir="ltr">${esc(clock(slot.end))}</small></div>
    <article class="tl-card"><span class="mark" style="background:${colorOf(slot.subject)}"></span>
      <div class="between"><span class="kind">${esc(label.ar)}</span>${tag ? `<span class="tag ${esc(tagClass)}">${tag}</span>` : ""}</div>
      <h3 class="${cancelled || st === "done" ? "strike" : ""}">${esc(readable(slot.subject))}</h3>
      ${slot.instructor ? `<p class="who">${ICON.user}${esc(readable(slot.instructor))}</p>` : ""}
      <div class="meta">${roomPill(slot)}${slot.was ? `<span class="pill soft">كانت ${esc(slot.was)}</span>` : ""}</div>
      ${slot.note ? `<p class="muted note">${esc(slot.note)}</p>` : ""}</article></div>`;
}
function timelineHtml(saved, slots, now, showingToday, nextStart) {
  return `<div class="timeline">${slots.map((slot, i) => {
    const prev = slots[i - 1];
    let gap = "";
    if (prev && prev.status !== "cancelled" && slot.status !== "cancelled") {
      const minutes = slotMinutes(slot.start) - slotMinutes(prev.end);
      if (minutes >= 15) gap = `<div class="tl-gap"><span>فاضي ${softLeft(minutes * 60000)}</span></div>`;
    }
    return gap + slotRow(saved.schedule, slot, showingToday ? slotStatus(slot, now, nextStart) : "");
  }).join("")}</div>`;
}
function daySig() {
  const saved = current();
  if (!saved || ui.view !== "day") return "";
  const now = new Date();
  const name = jsDay(now);
  return cairoKey(now) + (name ? openDay(saved.schedule, name).map((slot) => slotStatus(slot, now)).join(",") : "");
}
function drawTabs(saved) {
  const bar = document.getElementById("tabbar");
  if (!bar) return;
  const show = !!saved && ui.view !== "setup" && ui.view !== "start";
  bar.hidden = !show;
  document.body.classList.toggle("has-tabs", show);
  if (!show) return;
  const tabs = EXAM_MODE
    ? [["exams", "امتحاناتك", ICON.exam], ["alerts", "الإشعارات", ICON.bell]]
    : [["day", "يومك", ICON.home], ["table", "الجدول", ICON.table], ["exams", "الامتحانات", ICON.exam], ["alerts", "الإشعارات", ICON.bell]];
  const dayGroup = ["day", "today", "tomorrow", "free"];
  bar.innerHTML = tabs.map(([id, label, icon]) => `<button type="button" class="${ui.view === id || (id === "day" && dayGroup.includes(ui.view)) ? "on" : ""}" data-go="${id}">${icon}<span>${label}</span></button>`).join("") + `<button type="button" data-more>${ICON.more}<span>المزيد</span></button>`;
}

// <start-view>
const CRUMB_ARROW = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg>';
const STEP_CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const SEARCH_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>';
function startView() {
  const section = sectionById(ui.sectionId);
  const sections = SECTIONS.filter((item) => item.year === ui.year);
  const classes = ui.sectionId ? classesIn(ui.sectionId) : [];
  const needle = digits(ui.classQuery);
  const visible = needle ? classes.filter((item) => item.classNumber.startsWith(needle)) : classes;
  const ready = !!(ui.sectionId && ui.classPick);
  const yearLabel = ui.year === "1" ? "الفرقة الأولى" : ui.year === "2" ? "الفرقة الثانية" : "";
  const next = !ui.year ? "اختار فرقتك عشان نبدأ" : !ui.sectionId ? "الجاي: اختار شعبتك" : !ui.classPick ? "الجاي: اختار رقم فصلك" : "";
  const crumbs = [yearLabel, section ? section.title : "", ui.classPick ? `فصل ${ui.classPick}` : ""].filter(Boolean);
  const count = (id) => { const n = classesIn(id).length; return `${n} ${n >= 3 && n <= 10 ? "فصول" : "فصل"}`; };
  const step = (n, done, locked, title, body) => `<section class="step${done ? " done" : ""}${locked ? " locked" : ""}"><span class="node" aria-hidden="true">${done ? STEP_CHECK : n}</span><div class="step-body"><h2>${title}</h2>${body}</div></section>`;
  const years = `<div class="years">${["1", "2"].map((year) => `<button type="button" class="year${ui.year === year ? " on" : ""}" data-year="${year}" aria-pressed="${ui.year === year}">${year === "1" ? "الفرقة الأولى" : "الفرقة الثانية"}</button>`).join("")}</div>`;
  const secs = ui.year
    ? `<div class="sec-grid">${sections.map((item) => `<button type="button" class="sec${ui.sectionId === item.id ? " on" : ""}" data-section="${item.id}" aria-pressed="${ui.sectionId === item.id}"><b>${esc(item.title)}</b><span>${esc(item.major)}</span><em>${count(item.id)}</em></button>`).join("")}</div>`
    : `<p class="locked-note">اختار فرقتك الأول وهتظهرلك الشعب.</p>`;
  const nums = ui.sectionId
    ? `<div class="search">${SEARCH_ICON}<input id="class-query" type="text" inputmode="numeric" autocomplete="off" placeholder="اكتب رقم فصلك" aria-label="رقم الفصل" value="${esc(ui.classQuery)}" /></div>${visible.length ? `<div class="nums">${visible.map((item) => `<button type="button" class="${ui.classPick === item.classNumber ? "on" : ""}" data-class="${esc(item.classNumber)}">${esc(item.classNumber)}</button>`).join("")}</div>` : `<p class="locked-note">مفيش فصل بالرقم ده في ${esc(section.title)}. راجع الرقم وجرّب تاني.</p>`}`
    : `<p class="locked-note">اختار شعبتك الأول وهتظهرلك أرقام الفصول.</p>`;
  return `<div class="start">
    <h1>اختار فصلك</h1>
    <p class="lead muted">مرة واحدة، والصفحة الجاية تبقى يومك.</p>
    <div class="rail">
      ${step(1, !!ui.year, false, "فرقتك", years)}
      ${step(2, !!ui.sectionId, !ui.year, "شعبتك", secs)}
      ${step(3, ready, !ui.sectionId, "رقم فصلك", nums)}
    </div>
    <div class="dock"><div class="dock-sum" aria-live="polite">${crumbs.length ? `<div class="crumbs">${crumbs.map((item) => `<span>${esc(item)}</span>`).join(CRUMB_ARROW)}</div>` : ""}${next ? `<small>${next}</small>` : ""}</div>
      <button type="button" class="btn" id="save-class" ${ready ? "" : "disabled"}>احفظ وابدأ يومي</button></div>
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
const SITE_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.3 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.3-3.5-8.5s1.1-6 3.5-8.5z"/></svg>';
function aboutView() {
  const wa = safeHttpUrl(WHATSAPP);
  const site = safeHttpUrl(PORTFOLIO);
  const facts = [["العام الدراسي", `<span dir="ltr">${esc(YEAR)}</span>`], ["الترم", esc(TERM)], ["آخر مراجعة", esc(LAST_REVIEW)]];
  return `<section class="about-page">
    <div class="about-hero"><span class="about-ring"><img src="jadwali-logo.jpg" alt="شعار جدولي" /></span>
      <h1>جدولي</h1>
      <p class="lead muted">${esc(ABOUT.lead)} <span dir="ltr">${esc(YEAR)}</span>.</p></div>
    ${ABOUT.why ? `<article class="why"><h2>ليه الفرقة الأولى والتانية بس؟</h2><p>${esc(ABOUT.why)}</p></article>` : ""}
    <article class="maker">
      <div class="maker-id"><span class="avatar" aria-hidden="true">${USER_ICON}</span><div><p class="name"><span>${esc(ABOUT.name)}</span>${VERIFIED_ICON}</p><p class="role" dir="ltr">Software Engineer</p></div></div>
      ${wa || site ? `<div class="maker-actions">${wa ? `<a class="btn" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${WA_ICON}<span>تواصل واتساب</span></a>` : ""}${site ? `<a class="ghost" href="${esc(site)}" target="_blank" rel="noopener noreferrer">${SITE_ICON}<span>البورتفوليو</span></a>` : ""}</div>` : ""}
    </article>
    <dl class="facts">${facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>
  </section>`;
}
// </about-view>

const views = {
  setup() {
    return hero();
  },
  start() {
    return startView();
  },
  day(saved) {
    if (EXAM_MODE) return examBoard(saved);
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
    const title = evening ? `${upcoming.label} · ${esc(viewing)}` : showingToday ? "محاضرات النهاردة" : esc(viewing);
    const empty = evening && upcoming.holiday ? `${upcoming.label} إجازة: ${esc(upcoming.holiday.name)}.` : showingToday && holiday ? `إجازة: ${esc(holiday.name)}.` : `مفيش محاضرات يوم ${esc(viewing)}.`;
    const quick = [["table", "الجدول الكامل", ICON.table], ["tomorrow", "بكرة", ICON.sun], ["free", "فاضي امتى", ICON.clock], ["alerts", "الإشعارات", ICON.bell]];
    return `<div class="day-page">
      <section class="greet"><div><p class="hello">${greeting(now)}</p><h1>${esc(weekdayName(now))}<span>${esc(dateLine(now))}</span></h1></div>
        <button type="button" class="mini-btn" id="change-class">تغيير الفصل</button></section>
      <p class="classline">${esc(saved.section.yearLabel)} · ${esc(saved.section.title)} · فصل ${esc(saved.schedule.classNumber)}</p>
      ${updateBanner(saved)}
      ${focusCard(saved, now)}
      ${newsBlock(saved)}
      <nav class="quick" aria-label="اختصارات">${quick.map(([id, label, icon]) => `<button type="button" data-go="${id}">${icon}<span>${label}</span></button>`).join("")}</nav>
      <button type="button" class="ask-open" data-go="assistant">اسأل جدولي</button>
      <div id="today-board">
        ${weekStrip(saved, now, evening ? viewing : ui.pickedDay || (dayName && !holiday ? dayName : viewing))}
        <div class="between sec-head"><h2>${title}</h2>${showingToday && open.length ? `<span class="muted count-line">خلصت ${doneCount} من ${open.length}</span>` : ""}</div>
        ${slots.length ? timelineHtml(saved, slots, now, showingToday, nextStart) : `<p class="card muted">${empty}</p>`}
      </div>
      <div class="share-row"><button type="button" class="ghost" id="share-today">${ICON.image}<span>صورة النهاردة</span></button><button type="button" class="ghost" id="share-week">${ICON.image}<span>صورة الأسبوع</span></button></div>
      ${alertAsk()}
      ${groupInvite(saved)}
    </div>`;
  },
  today(saved) {
    if (EXAM_MODE) return examBoard(saved);
    return dayList(saved, new Date(), "محاضراتي النهاردة");
  },
  tomorrow(saved) {
    if (EXAM_MODE) return examBoard(saved);
    return dayList(saved, shiftCairo(new Date(), 1, 12 * 60), "بكرة");
  },
  free(saved) {
    if (EXAM_MODE) return examBoard(saved);
    const blocks = DAYS.map((day) => {
      const slots = slotsOn(saved.schedule, day);
      const gaps = [];
      for (let i = 0; i < slots.length - 1; i += 1) {
        const minutes = slotMinutes(slots[i + 1].start) - slotMinutes(slots[i].end);
        if (minutes >= 15) gaps.push({ start: slots[i].end, end: slots[i + 1].start, minutes });
      }
      return `<section><h2>${day}</h2>${gaps.length ? gaps.map((gap) => `<p class="card">فاضي ${range(gap.start, gap.end)} · ${gap.minutes} دقيقة</p>`).join("") : `<p class="muted">مفيش فراغ بين المحاضرات.</p>`}</section>`;
    }).join("");
    return `<p class="kicker">جدولي</p><h1>فاضي امتى</h1><p class="muted">الفراغات بين محاضرات فصلك طول الأسبوع.</p>${blocks}`;
  },
  table(saved) {
    if (EXAM_MODE) return examBoard(saved);
    const today = jsDay(new Date());
    const times = [...TIMES];
    saved.schedule.slots.forEach((slot) => {
      if (slot.start && !times.some((row) => row[0] === slot.start)) times.push([slot.start, slot.end || ""]);
    });
    times.sort((a, b) => slotMinutes(a[0]) - slotMinutes(b[0]));
    const grid = `<div class="table-wrap"><table><thead><tr><th>الوقت</th>${DAYS.map((day) => `<th>${day}</th>`).join("")}</tr></thead><tbody>${times.map(([start, end]) => `<tr><td class="time-col">${range(start, end)}</td>${DAYS.map((day) => {
      const slot = saved.schedule.slots.find((item) => item.day === day && item.start === start && item.status !== "cancelled");
      if (!slot) return `<td class="muted">فاضي</td>`;
      const label = lectureOf(saved.schedule.slots, slot);
      const mark = slot.status === "moved" ? " · اتأجلت" : "";
      return `<td class="cell ${day === today ? "hit" : ""}"><b>${esc(slot.subject)}${mark}</b><br><span class="muted">${esc(label.ar)}</span><br>${range(slot.start, slot.end)}<br><span dir="ltr">${esc(slot.room)}</span></td>`;
    }).join("")}</tr>`).join("")}</tbody></table></div>`;
    const list = `<div class="stack">${DAYS.map((day) => {
      const slots = slotsOn(saved.schedule, day);
      return `<section><h2>${day}</h2>${slots.length ? slots.map((slot) => lectureCard(saved.schedule, slot)).join("") : `<p class="muted">مفيش محاضرات.</p>`}</section>`;
    }).join("")}</div>`;
    return `<p class="kicker">${esc(saved.section.yearLabel)} · ${esc(saved.section.title)} · العام الدراسي <span dir="ltr">${esc(YEAR)}</span></p>
      <h1>فصل ${esc(saved.schedule.classNumber)}</h1>
      <div class="tools"><button type="button" class="${ui.mode === "grid" ? "on" : ""}" data-mode="grid">شبكة</button><button type="button" class="${ui.mode === "list" ? "on" : ""}" data-mode="list">قائمة</button></div>
      ${ui.mode === "grid" ? grid : list}
      <div class="row"><button type="button" class="ghost" id="download">تحميل الجدول كصورة</button></div>`;
  },
  exams() {
    const saved = current();
    const rows = myExams(saved);
    if (rows.length) {
      return `<p class="kicker">جدولي</p><h1>الامتحانات</h1><div class="stack" style="margin-top:16px">${rows.map((item) => `<article class="lecture"><span class="mark" style="background:var(--bronze)"></span><div class="between"><p class="kicker" style="margin:0">${esc(item.exam_date || "ميعاد")}</p><b class="exam-left">${esc(examCountdown(item.exam_date))}</b></div><p style="margin:8px 0 0;font-weight:650;overflow-wrap:anywhere">${esc(readable(item.title || item.subject))}</p>${item.start_time ? `<p style="margin:10px 0 0">الوقت ${esc(item.start_time)}${item.end_time ? ` – ${esc(item.end_time)}` : ""}</p>` : ""}${item.room ? `<p class="between" style="margin:8px 0 0"><span class="muted">القاعة</span><span dir="ltr">${esc(item.room)}</span></p>` : ""}${item.class_number ? "" : `<p class="muted">لكل فصول الشعبة</p>`}${item.notes ? `<p class="muted">${esc(readable(item.notes))}</p>` : ""}</article>`).join("")}</div>`;
    }
    return `<p class="kicker">جدولي</p><h1>الامتحانات</h1><p class="lead muted">الميدتيرم والنهائي هيظهروا هنا أول ما الأكاديمية تنزّل الجدول الرسمي. مش هنحط معاد متخمّن. لما المعاد يتنزل، التنبيه هيشتغل قبله بنفس المدة.</p><p class="card muted">لسه مفيش جدول امتحانات رسمي.</p>`;
  },
  alerts(saved) {
    const on = localStorage.getItem("jadwali-reminders") === "1";
    const pushOn = pushActive();
    const lead = Number(localStorage.getItem("jadwali-lead") || DEFAULT_LEAD);
    return `<p class="kicker">جدولي</p><h1>إشعار جدولي</h1>
      <p class="lead muted">اختار قبلها بكام دقيقة. الإشعار بيوصلك حتى والتطبيق مقفول، وبنبعتلك كمان لو محاضرة اتلغت أو اتأجلت أو قاعتها اتغيرت، ولو نزل إعلان لفصلك.</p>
      <p class="muted">${esc(saved.section.yearLabel)} · ${esc(saved.section.title)} · فصل ${esc(saved.schedule.classNumber)} · العام الدراسي <span dir="ltr">${esc(YEAR)}</span></p>
      <div class="row">${[5, 10, 15, 30].map((minutes) => `<button type="button" class="choice ${lead === minutes ? "on" : ""}" data-lead="${minutes}">${minutes} د</button>`).join("")}</div>
      <p class="muted">${on ? (pushOn ? "الإشعار شغّال حتى والتطبيق مقفول. أيام الإجازة الرسمية مفيش تنبيه." : "الإشعار شغّال والصفحة مفتوحة بس. فعّله تاني عشان يوصلك والتطبيق مقفول.") : "التفعيل مرة واحدة من المتصفح، وبعدها بيوصلك من غير ما تفتح جدولي."}</p>
      <div class="row">${on ? `<button type="button" class="ghost" id="alert-off">إيقاف الإشعار</button>` : `<button type="button" class="btn" id="alert-on">تفعيل التنبيه</button>`}</div>
      <p id="alert-note" class="muted">${esc(alertNote)}</p>
      <div class="card about-card"><p class="kicker">تقويم الآيفون</p><h2>الإشعار يوصل وجدولي مقفول</h2><p>الزر يفتح شاشة إضافة المواعيد في سفاري. من فوق اختار تقويم جديد اسمه جدولي، مش التقويم الشخصي. التنبيه قبل كل محاضرة بـ ${lead} دقيقة، وأيام الإجازة مش داخلة.</p><div class="row"><button type="button" class="btn" id="add-calendar">أضف محاضراتي للتقويم</button></div><p id="calendar-note" class="muted"></p><p class="kicker">مسح الكل مرة واحدة</p><p>من تطبيق التقويم اضغط التقاويم تحت، ثم علامة المعلومات جنب تقويم جدولي، وانزل لآخر الصفحة واضغط حذف التقويم. كده كل المحاضرات تتشال مع بعض.</p></div>
      <div class="card about-card"><p class="kicker">الشاشة الرئيسية</p><h2>ثبّت جدولي كتطبيق</h2><p>اعمل الخطوات دي من سفاري، مش من جوه تطبيق تاني:</p><ol class="steps"><li>افتح جدولي في سفاري.</li><li>اضغط زر المشاركة، المربع والسهم، تحت الشاشة.</li><li>اختار إضافة إلى الشاشة الرئيسية.</li><li>اضغط إضافة. الأيقونة هتظهر مع تطبيقاتك.</li></ol><p class="muted">على أندرويد: من قائمة المتصفح اختار تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.</p></div>`;
  },
  about() {
    return aboutView();
  },
  assistant(saved) {
    return assistantView(saved);
  },
  sections() {
    return `<p class="kicker">جدولي · العام الدراسي <span dir="ltr">${esc(YEAR)}</span></p><h1>الشعب</h1><div class="stack" style="margin-top:16px">${SECTIONS.map((item) => `<button type="button" class="section-card" data-open-section="${esc(item.id)}"><b>${esc(item.yearLabel)} · ${esc(item.title)}</b><small>${classesIn(item.id).length} فصل</small></button>`).join("")}</div>
      ${ui.sectionId ? `<h2>فصول ${esc(sectionById(ui.sectionId)?.title || "")}</h2><div class="nums">${classesIn(ui.sectionId).map((item) => `<button type="button" data-open-class="${esc(item.classNumber)}">${esc(item.classNumber)}</button>`).join("")}</div>` : ""}`;
  },
};

function hero() {
  const saved = current();
  const action = EXAM_MODE
    ? `<button type="button" class="btn" data-go="exams">امتحاناتي</button>`
    : saved
    ? `<button type="button" class="btn" data-go="day">اعرض جدولي</button><button type="button" class="ghost" data-go="table">الجدول الكامل</button>`
    : `<button type="button" class="btn" data-go="start">ابدأ الآن</button><button type="button" class="ghost" data-go="sections">تصفح الشعب</button>`;
  const line = saved
    ? `${weekdayName(new Date())} · ${esc(saved.section.yearLabel)} · ${esc(saved.section.title)} · فصل ${esc(saved.schedule.classNumber)}`
    : "مرة واحدة بس، والصفحة دي تبقى يومك.";
  return `<section class="hero full" aria-label="مقدمة جدولي">
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="geo" aria-hidden="true">
        <i class="g g-ring"></i>
        <i class="g g-diamond"></i>
        <i class="g g-square"></i>
        <i class="g g-dot a"></i>
        <i class="g g-dot b"></i>
        <i class="g g-line"></i>
        <i class="g g-hex"></i>
      </div>
      <img class="hero-logo" src="jadwali-logo.jpg" alt="شعار جدولي" />
      <p class="kicker">العام الدراسي <span dir="ltr">${esc(YEAR)}</span> · آخر مراجعة ${esc(LAST_REVIEW)}</p>
      <h1>جدولك. يومك.<br>من غير لف.</h1>
      <p class="hero-sub">${EXAM_MODE ? "وضع الامتحانات شغّال. المحاضرات راجعة أول ما الإدارة تقفل الوضع." : "محاضرات الفرقة الأولى والتانية في مكان واحد. اختار فصلك مرة، وجدولي يوريك يومك من غير ملفات."}</p>
      <p class="hero-line">${line}</p>
      ${EXAM_MODE ? "" : `<form id="search-form" class="hero-search" role="search">
        <input id="search" type="search" placeholder="رقم الفصل، المادة، الدكتور أو القاعة" value="${esc(ui.search)}" />
        <button class="btn" type="submit">بحث</button>
      </form>
      <div id="search-out"></div>`}
      <div class="hero-actions">${action}</div>
    </section>
    ${newsBlock(saved)}`;
}
function seenKey(saved) {
  return `jadwali-rev-${saved.schedule.sectionId}-${saved.schedule.classNumber}`;
}
function updateBanner(saved) {
  const revision = saved.schedule.revisedAt;
  if (!revision || localStorage.getItem(seenKey(saved)) === revision) return "";
  return `<article class="card update-card"><p class="kicker">جدولك اتحدث</p><p>في تعديل جديد على فصل ${esc(saved.schedule.classNumber)}. راجع محاضراتك قبل ما تتحرك.</p><button type="button" class="btn" id="seen-update">تمام، شفت التحديث</button></article>`;
}
function myExams(saved) {
  return EXAMS.filter((item) => {
    if (!saved) return true;
    if (item.section_id && item.section_id !== saved.schedule.sectionId) return false;
    if (item.class_number && String(item.class_number) !== String(saved.schedule.classNumber)) return false;
    return true;
  });
}
function examBoard(saved) {
  const rows = myExams(saved);
  const cards = rows.length
    ? rows.map((item) => `<article class="lecture"><span class="mark" style="background:var(--bronze)"></span><div class="between"><p class="kicker" style="margin:0">${esc(item.exam_date || "ميعاد")}</p><b class="exam-left">${esc(examCountdown(item.exam_date))}</b></div><p style="margin:8px 0 0;font-weight:650;overflow-wrap:anywhere">${esc(readable(item.title || item.subject))}</p>${item.start_time ? `<p style="margin:10px 0 0">الوقت ${esc(item.start_time)}${item.end_time ? ` – ${esc(item.end_time)}` : ""}</p>` : ""}${item.room ? `<p class="between" style="margin:8px 0 0"><span class="muted">القاعة</span><span dir="ltr">${esc(item.room)}</span></p>` : ""}${!item.class_number ? `<p class="muted">لكل فصول الشعبة</p>` : ""}${item.notes ? `<p class="muted">${esc(readable(item.notes))}</p>` : ""}</article>`).join("")
    : `<p class="card muted">لسه مفيش جدول امتحانات.</p>`;
  return `<p class="kicker">وضع الامتحانات</p><h1>امتحاناتك</h1><p class="lead muted">المحاضرات متقفلة دلوقتي، وهترجع أول ما الإدارة تقفل الوضع.</p><div class="stack" style="margin-top:16px">${cards}</div>${newsBlock(saved)}`;
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
  return `<article class="card wa-card"><p class="kicker">واتساب</p><h2>جروب فصلك</h2><p>${esc(group.label)}</p><a class="btn" id="join-group" href="${esc(link)}" target="_blank" rel="noopener noreferrer">انضم لجروب</a></article>`;
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
function dayBrief(saved, now) {
  const holiday = holidayOn(now);
  if (holiday) return { kicker: "النهاردة", text: `إجازة ${esc(holiday.name)}.` };
  const dayName = jsDay(now);
  if (!dayName) return { kicker: "النهاردة", text: "جمعة. مفيش محاضرات." };
  const slots = openDay(saved.schedule, dayName);
  if (!slots.length) return { kicker: "النهاردة", text: "مفيش محاضرات النهاردة." };
  const live = slots.find((slot) => slotStatus(slot, now) === "live");
  const later = slots.find((slot) => slotStatus(slot, now) === "later");
  const done = slots.filter((slot) => slotStatus(slot, now) === "done").length;
  if (live) {
    const info = nextInfo(saved.schedule, now);
    const place = live.room ? `المفروض تكون في <span dir="ltr">${esc(live.room)}</span>` : "المحاضرة شغالة دلوقتي";
    return { kicker: "أنت هنا", text: `${place}. ${esc(readable(live.subject))}. فاضل <span id="count">${softLeft(info ? info.end - now : 0)}</span>.` };
  }
  if (done === slots.length) {
    const upcoming = nextStudyDay(now);
    if (upcoming.holiday) return { kicker: "يومك خلص", text: `${upcoming.label} إجازة ${esc(upcoming.holiday.name)}.` };
    const nextSlots = openDay(saved.schedule, upcoming.name);
    const first = nextSlots[0];
    if (!first) return { kicker: "يومك خلص", text: `${upcoming.label} ${esc(upcoming.name)} فاضي.` };
    return { kicker: upcoming.label, text: `${esc(upcoming.name)}، ${countLabel(nextSlots.length)}. الأولى ${range(first.start, first.end)}${roomPhrase(first)}.` };
  }
  if (later && done === 0) {
    const start = nextInfo(saved.schedule, now)?.start || now;
    return { kicker: "صباحك", text: `نهاردك ${countLabel(slots.length)}. الأولى ${range(later.start, later.end)}${roomPhrase(later)}، فاضل <span id="count">${softLeft(start - now)}</span>.` };
  }
  if (later) {
    const start = nextInfo(saved.schedule, now)?.start || now;
    return { kicker: "بعدها", text: `خلصت ${done} من ${slots.length}. الجاية ${range(later.start, later.end)}${roomPhrase(later)}، فاضل <span id="count">${softLeft(start - now)}</span>.` };
  }
  return { kicker: "النهاردة", text: `نهاردك ${countLabel(slots.length)}.` };
}
function briefCard(saved, now) {
  const brief = dayBrief(saved, now);
  return `<article class="day-line"><small>${brief.kicker}</small><p>${brief.text}</p></article>`;
}
function alertAsk() {
  if (localStorage.getItem("jadwali-reminders") === "1" || localStorage.getItem("jadwali-alert-ask") === "1") return "";
  return `<article class="card ask-card"><p class="kicker">أول خطوة</p><h2>فعّل إشعار جدولي</h2><p>هننبّهك قبل محاضرتك حتى والتطبيق مقفول، ولو القاعة اتغيرت أو المحاضرة اتلغت.</p>${alertNote ? `<p class="muted">${esc(alertNote)}</p>` : ""}<div class="row"><button type="button" class="btn" id="ask-alert">تفعيل الإشعار</button><button type="button" class="ghost" id="ask-later">بعدين</button></div></article>`;
}
function dayList(saved, date, title) {
  const day = jsDay(date);
  const holiday = holidayOn(date);
  const slots = holiday ? [] : slotsOn(saved.schedule, day);
  const now = new Date();
  const showingToday = cairoKey(date) === cairoKey(now);
  const nextStart = showingToday ? slots.find((slot) => slotStatus(slot, now) === "later")?.start : "";
  return `<p class="kicker">جدولي</p><h1>${esc(title)}</h1><p class="muted">${weekdayName(date)} · فصل ${esc(saved.schedule.classNumber)}</p>
    <div class="stack" style="margin-top:16px">${slots.length ? timelineHtml(saved, slots, now, showingToday, nextStart) : `<p class="card muted">${holiday ? `إجازة: ${esc(holiday.name)}` : day ? "مفيش محاضرات." : "الجمعة، مفيش محاضرات."}</p>`}</div>`;
}

function navIcon(d) {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}
const NAV_PATH = {
  day: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z",
  today: "M6.5 4.5h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2zM4.5 9.5h15M8 3v3M16 3v3M9 14.5l2 2 4-4",
  tomorrow: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4",
  free: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2",
  table: "M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2zM3.5 9.5h17M9 9.5v10M15 9.5v10",
  exams: "M7 3.5h8l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1zM14.5 3.5V8H19M9 13h6M9 17h4",
  alerts: "M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15zM10 21h4",
  sections: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  about: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 11v5M12 8v.01",
  assistant: "M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4zM18 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z",
  channel: "M4 13v-2a1 1 0 0 1 1-1h3l7-4v12l-7-4H5a1 1 0 0 1-1-1zM18 9.5a3.5 3.5 0 0 1 0 5",
  image: "M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2zM4 17l5-4.5 4 3.5 3-2.5 4 3.5",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  flag: "M6 21V4M6 5h11l-2 4 2 4H6",
  swap: "M7 8h12l-3-3M17 16H5l3 3",
  trash: "M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10.5 11v5M13.5 11v5",
};
const CHEVRON = '<svg class="nav-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 6l-6 6 6 6"/></svg>';
function drawNav(saved) {
  const row = (key, label, attrs, cls = "") => `<button type="button" class="nav-item ${cls}" ${attrs}><span class="ni">${navIcon(NAV_PATH[key])}</span><span class="nl">${label}</span>${CHEVRON}</button>`;
  const goBtn = (id, label, key = id) => row(key, label, `data-go="${id}"`, ui.view === id ? "on" : "");
  const act = (id, label, key, cls = "") => row(key, label, `id="${id}"`, cls);
  const group = (title, items) => `<section class="nav-group"><p class="nav-label">${title}</p>${items}</section>`;
  const chip = document.getElementById("drawer-class");
  if (saved) {
    chip.hidden = false;
    chip.innerHTML = `<span class="dc-kicker">فصلك</span><span class="dc-num">فصل ${esc(saved.schedule.classNumber)}</span><span class="dc-sub">${esc(saved.section.yearLabel)} · ${esc(saved.section.title)}</span>`;
  } else {
    chip.hidden = true;
    chip.innerHTML = "";
  }
  const channel = `<a class="nav-item nav-link" href="https://whatsapp.com/channel/0029VbDlzPv4dTnT0xECBk1B" target="_blank" rel="noopener noreferrer"><span class="ni">${navIcon(NAV_PATH.channel)}</span><span class="nl">قناة تحديثات جدولي</span><svg class="nav-arrow" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg></a>`;
  const aboutGroup = group("عن جدولي", goBtn("about", "من نحن", "about") + channel);
  const classGroup = saved
    ? group("فصلك", act("report", "في غلطة؟ بلّغنا", "flag") + act("change-class", "تغيير الفصل", "swap") + act("clear-class", "إزالة الفصل", "trash", "danger"))
    : "";
  const shareGroup = saved
    ? group("شارك جدولك", act("share-today", "صورة جدول النهاردة", "image") + act("share-week", "صورة الأسبوع", "image") + act("share-class", "ابعت لينك الفصل", "link"))
    : "";
  const foot = `<p class="drawer-foot">جدولي · العام الدراسي <span dir="ltr">${esc(YEAR)}</span><br>آخر مراجعة ${esc(LAST_REVIEW)}</p>`;
  document.getElementById("drawer-nav").innerHTML = (EXAM_MODE
    ? group("الامتحانات", goBtn("exams", "امتحاناتك") + goBtn("assistant", "اسأل جدولي", "assistant") + goBtn("alerts", "إشعار جدولي")) + aboutGroup + classGroup
    : group("اليوم", goBtn("day", "يومك") + goBtn("assistant", "اسأل جدولي", "assistant") + goBtn("today", "محاضراتي النهاردة", "today") + goBtn("tomorrow", "بكرة") + goBtn("free", "فاضي امتى"))
      + group("الجدول", goBtn("exams", "الامتحانات") + goBtn("alerts", "إشعار جدولي") + (saved ? goBtn("table", "الجدول الكامل") : "") + goBtn("sections", "تصفح الشعب"))
      + shareGroup + aboutGroup + classGroup) + foot;
}

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
function go(view) {
  ui.view = view;
  if (view === "day") ui.pickedDay = null;
  const next = view === "setup" ? "#/" : `#/${view}`;
  document.getElementById("drawer").hidden = true;
  if ((location.hash || "#/") !== next) {
    routing = true;
    location.hash = next;
    routing = false;
  }
  render();
  window.scrollTo(0, 0);
}

// <chat-ui-a>
const CHAT_LOGO = "jadwali-logo.jpg";
const CHAT_ICON = {
  send: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>',
  stop: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6.5" y="6.5" width="11" height="11" rx="2.6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  fresh: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5H7.5A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5V12M16.6 4.6l2.8 2.8L11 15.8l-3.6.8.8-3.6z"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5.5 12.5 12 19l6.5-6.5"/></svg>',
};
const CHAT_SUGGEST = [
  ["المحاضرة الجاية", "أقرب محاضرة ومكانها", ICON.clock],
  ["بكرة عندي إيه؟", "جدول بكرة كله", ICON.sun],
  ["فاضي امتى؟", "اللي فاضل من يومك", ICON.table],
  ["الامتحانات", "المواعيد والقاعات", ICON.exam],
];
// <assistant-brain>
const NOTES_KEY = "jadwali-student-notes";
const QUIZ_KEY = "jadwali-quiz";
const AI_DOWN = "مش قادر أرد بالنموذج دلوقتي، بس أنا معاك. ابدأ بحاجة صغيرة وخد نفس، وجرّب تسألني تاني بعد شوية.";
const AI_FIRST = /اسالني|اختبرني|امتحني|كويز|quiz|مراجعه|خطه|ازاي (?:اذاكر|ذاكر)|اذاكر ازاي|مخنوق|زهقان|زهقت|تعبان|تعبت|قلقان|قلق|متوتر|توتر|خايف|مضغوط|محبط|احباط|حزين|زعلان|مش هلحق|مش قادر|هسقط|محتاج تشجيع|تشجيع|ياست|يئست/;
let ASSISTANT_KB = [];
function studentNotes() {
  try {
    const list = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
    return Array.isArray(list) ? list.filter((item) => typeof item === "string").slice(-8) : [];
  } catch {
    return [];
  }
}
function applyRemember(remember) {
  const incoming = Array.isArray(remember?.notes) ? remember.notes : [];
  const clean = incoming.map((item) => String(item || "").replace(/\s+/g, " ").trim().slice(0, 60)).filter((item) => item.length >= 4 && !/https?:|\d{6,}/i.test(item));
  if (!clean.length) return;
  const merged = [...studentNotes().filter((old) => !clean.includes(old)), ...clean].slice(-8);
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(merged)); } catch { /* private mode */ }
}
function forgetNotes() {
  try { localStorage.removeItem(NOTES_KEY); } catch { /* private mode */ }
}
function quizOn() {
  try { return sessionStorage.getItem(QUIZ_KEY) === "1"; } catch { return false; }
}
function setQuiz(on) {
  try { if (on) sessionStorage.setItem(QUIZ_KEY, "1"); else sessionStorage.removeItem(QUIZ_KEY); } catch { /* private mode */ }
}
function needsAI(text) {
  return quizOn() || AI_FIRST.test(fold(text));
}
function parseKb(text) {
  return String(text || "").split("\n").map((line) => line.split("|")).filter((part) => part.length >= 2 && part[0].trim() && part.slice(1).join("|").trim()).slice(0, 40)
    .map((part) => ({ q: part[0].trim().slice(0, 120), a: part.slice(1).join("|").trim().slice(0, 300) }));
}
function upcomingExams(saved, now) {
  const today = cairoKey(now);
  return myExams(saved).filter((item) => item.exam_date && item.exam_date >= today).map((item) => ({
    title: readable(item.title || item.subject || ""),
    date: item.exam_date,
    daysLeft: Math.round((Date.parse(`${item.exam_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000),
    start: item.start_time || "",
    room: item.room || "",
  })).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 4);
}
function subjectList(saved) {
  return [...new Set((saved.schedule.slots || []).map((slot) => readable(slot.subject)).filter(Boolean))].slice(0, 12);
}
function cairoHour(now) {
  return Math.floor(cairoFields(now).minutes / 60);
}
function daysWord(days) {
  return days <= 0 ? "النهاردة" : days === 1 ? "بكرة" : `فاضل ${days} ${days >= 3 && days <= 10 ? "أيام" : "يوم"}`;
}
function smartChips(saved) {
  const now = new Date();
  const hour = cairoHour(now);
  const exam = nearestExam(saved, now);
  const chips = [hour < 14 ? "عندي إيه النهاردة؟" : hour < 20 ? "المحاضرة الجاية" : "جهزلي بكرة"];
  if (exam && exam.title && exam.daysLeft <= 30) chips.push(`خطة لامتحان ${exam.title}`);
  chips.push("اسألني في مادة", "محتاج تشجيع", "فاضي امتى؟", "الإشعار", "مين المبرمج؟");
  return [...new Set(chips)].slice(0, 6);
}
function smartSuggest(saved) {
  const now = new Date();
  const exam = nearestExam(saved, now);
  return [
    cairoHour(now) < 14 ? ["عندي إيه النهاردة؟", "جدول يومك كله", ICON.clock] : ["جهزلي بكرة", "جدول بكرة وتجهيزك", ICON.sun],
    exam && exam.title && exam.daysLeft <= 30 ? [`خطة لامتحان ${exam.title}`, daysWord(exam.daysLeft), ICON.exam] : ["الامتحانات", "المواعيد والقاعات", ICON.exam],
    ["اسألني في مادة", "مراجعة سريعة بأسئلة", ICON.table],
    ["محتاج تشجيع", "كلمتين تسندك", ICON.sun],
  ];
}
// </assistant-brain>

function assistantHtml(value) {
  const clean = String(value || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`+/g, "")
    .replace(/^\s*#+\s*/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "• ");
  return esc(clean)
    .replace(/https?:\/\/[^\s<]+/g, (raw) => {
      const tail = (raw.match(/[).,،؛:!؟]+$/) || [""])[0];
      const href = safeHttpUrl(raw.slice(0, raw.length - tail.length).replace(/&amp;/g, "&"));
      if (!href) return raw;
      const label = href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      return `<a class="ask-link" dir="ltr" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label.length > 30 ? `${label.slice(0, 29)}…` : label)}</a>${tail}`;
    })
    .replaceAll("\n", "<br>");
}
function assistantIntent(text) {
  const query = fold(text);
  const cards = [];
  if (/قناه|تحديثات/.test(query)) cards.push("channel");
  if (/مبرمج|عامل التطبيق|عمل التطبيق|صاحب جدولي/.test(query)) cards.push("maker");
  return cards;
}
function assistantCard(kind) {
  if (kind === "channel") {
    return `<article class="ask-card"><p class="kicker">قناة جدولي</p><h2>تحديثات جدولي</h2><p>أخبار الجدول والإعلانات أول بأول.</p><a class="btn" href="https://whatsapp.com/channel/0029VbDlzPv4dTnT0xECBk1B" target="_blank" rel="noopener noreferrer">انضم الآن</a></article>`;
  }
  const wa = safeHttpUrl(WHATSAPP);
  const site = safeHttpUrl(PORTFOLIO);
  return `<article class="ask-card"><p class="kicker">المبرمج</p><h2>${esc(ABOUT.name)}</h2><p class="role" dir="ltr">Software Engineer</p><div class="ask-actions">${wa ? `<a class="btn" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">واتساب</a>` : ""}${site ? `<a class="ghost" href="${esc(site)}" target="_blank" rel="noopener noreferrer">البورتفوليو</a>` : ""}</div></article>`;
}
function botMessage(html, streaming) {
  return `<div class="msg bot"><span class="c-avatar" aria-hidden="true"><img src="${CHAT_LOGO}" alt="" /></span><div class="body"><div class="txt${streaming ? " streaming" : ""}">${html}</div><div class="msg-tools"><button type="button" class="msg-tool" data-chat-copy aria-label="نسخ الرد" title="نسخ">${CHAT_ICON.copy}</button></div></div></div>`;
}
function chatTyping() {
  return `<div class="msg bot" id="ask-typing" role="status" aria-label="جدولي بيكتب"><span class="c-avatar thinking" aria-hidden="true"><img src="${CHAT_LOGO}" alt="" /></span><div class="body"><div class="typing-dots"><i></i><i></i><i></i></div></div></div>`;
}
function assistantBubble(item) {
  if (item.role === "card") return `<div class="msg bot slim">${assistantCard(item.kind)}</div>`;
  if (item.role === "user") return `<div class="msg me"><p class="bub">${assistantHtml(item.text || "")}</p></div>`;
  return botMessage(assistantHtml(item.text || ""));
}
const CHAT_KEY = "jadwali-chat";
function cairoDayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function chatItems(items) {
  return items.filter((item) => item && ((item.role === "user" || item.role === "assistant") ? item.text : item.role === "card" && item.kind)).slice(-40);
}
function loadChat() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_KEY) || "");
    if (!saved || saved.day !== cairoDayKey() || !Array.isArray(saved.items)) return [];
    return chatItems(saved.items);
  } catch {
    return [];
  }
}
function saveChat() {
  try {
    const items = chatItems(assistantThread);
    if (!items.length) localStorage.removeItem(CHAT_KEY);
    else localStorage.setItem(CHAT_KEY, JSON.stringify({ day: cairoDayKey(), items }));
  } catch { /* storage full or private mode */ }
}
function expireChat() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_KEY) || "null");
    if (saved?.day === cairoDayKey()) return;
  } catch { /* unreadable chat */ }
  if (!assistantThread.length && !localStorage.getItem(CHAT_KEY)) return;
  assistantThread = [];
  try { localStorage.removeItem(CHAT_KEY); } catch { /* private mode */ }
}
let assistantThread = loadChat();
try {
  if (localStorage.getItem("jadwali-ai-reset") !== "groq") {
    localStorage.removeItem("jadwali-ai-off");
    localStorage.setItem("jadwali-ai-reset", "groq");
  }
} catch { /* private mode */ }
let assistantPending = false;
let chatRevealing = null;
let chatAbort = null;
let chatRun = 0;
function studentName() {
  let name = "";
  try { name = localStorage.getItem("jadwali-student-name") || ""; } catch { return ""; }
  if (!name || /^(ايه|اي|اية|مين|اسمي)$/.test(fold(name))) {
    try { localStorage.removeItem("jadwali-student-name"); } catch { /* private mode */ }
    return "";
  }
  return name;
}
function isNameQuestion(text) {
  const query = fold(text).replace(/[؟?]/g, "").replace(/\s+/g, " ").trim();
  return /^(اسمي|اسمى)(\s+(ايه|اي|اية))?$/.test(query) || /مين انا|انا مين|تعرف اسمي|فاكر اسمي|ما اسمي|قولي اسمي|تعرفني|عارفني/.test(query);
}
function waitingName() {
  try { return localStorage.getItem("jadwali-ask-name") === "1"; } catch { return false; }
}
function askForName() {
  try { localStorage.setItem("jadwali-ask-name", "1"); } catch { /* private mode */ }
}
function clearNameAsk() {
  try { localStorage.removeItem("jadwali-ask-name"); } catch { /* private mode */ }
}
function saveStudentName(name) {
  try { localStorage.setItem("jadwali-student-name", name); } catch { /* private mode */ }
  clearNameAsk();
  return name;
}
function nameWords(text) {
  const parts = [];
  for (const bit of String(text || "").split(/\s+/)) {
    const word = bit.replace(/[^\u0600-\u06FF]/g, "");
    if (!word) continue;
    if (/^(و|عايز|عاوز|محتاج|عندي|في|من|مش|لو|بس|عشان|مين|طالب|طالبه|طالبة|سلام|السلام|عليكم|اهلا|عامل|ايه|اي|اية|ازيك|صباح|مساء|شكرا|محاضره|امتحان|جدول|بكره|فضى|فاضي|جدولاوي|نعم|لا|تمام|حاضر|تعبان|تعبانه|مخنوق|مخنوقه|زهقان|زهقانه|قلقان|قلقانه|متوتر|متوتره|خايف|خايفه|مضغوط|مضغوطه|محبط|محبطه|حزين|زعلان|زعلانه|كويس|كويسه|الحمدلله|بخير|مبسوط|مبسوطه|جعان|نعسان|معاك|فين|ازاي|امتي|ليه|كام)$/.test(fold(word))) {
      return parts.length ? parts : [];
    }
    parts.push(word);
    if (parts.length === 3) break;
  }
  if (!parts.length || parts[0].length < 2) return [];
  return parts;
}
function rememberStudentName(question) {
  const raw = String(question || "").replace(/\s+/g, " ").trim();
  const query = fold(raw);
  if (isNameQuestion(raw)) return studentName();
  const hit = raw.match(/(?:^|\s)(?:أنا اسمي|انا اسمي|اسمي|اسمى|ناديني)\s+(.+)$/i) || (waitingName() ? raw.match(/^(?:أنا|انا)\s+(.+)$/i) : null);
  const source = hit ? hit[1] : raw;
  const words = query.split(/\s+/).length;
  if (!hit && (studentName() || words > 3 || !waitingName())) return studentName();
  const parts = nameWords(source);
  if (!parts.length) return studentName();
  if (!hit && words > 3) return studentName();
  return saveStudentName(parts.join(" "));
}
function whoAmI(saved) {
  const name = studentName();
  if (!name) {
    askForName();
    return "لسه ما عرفتش اسمك. اسمك إيه؟";
  }
  return `اسمك ${name}. أنت ${name}، في ${saved.section.yearLabel}، ${saved.section.title}، فصل ${saved.schedule.classNumber}.`;
}
function isNameIntro(question) {
  const query = fold(question);
  if (/مين انا|انا مين|اسمي ايه/.test(query)) return false;
  return /(?:^|\s)(انا اسمي|اسمي|اسمى|ناديني)\s+\S/.test(query) || /^انا\s+[\u0600-\u06FF]{2,}/.test(query);
}
function chatChipButtons(saved) {
  return smartChips(saved).map((item) => `<button type="button" data-ask="${esc(item)}">${esc(item)}</button>`).join("");
}
function chatIntro() {
  const name = studentName();
  return `أهلاً بيك${name ? ` ${name}` : ""}، أنا جدولاوي صاحبك في جدولي.${name ? "" : " اسمك إيه؟"}`;
}
function chatWelcome(who, nudge, saved) {
  const name = studentName();
  if (!name) askForName();
  const hello = `أهلاً بيك${name ? ` ${esc(name)}` : ""}<br />أنا جدولاوي، صاحبك في جدولي.${name ? "" : "<br />اسمك إيه؟"}`;
  return `<div class="welcome"><span class="c-avatar xl" aria-hidden="true"><img src="${CHAT_LOGO}" alt="" /></span><h1>اسأل جدولي</h1><p class="lead">${hello}<br />${who}</p><p class="nudge">${nudge}</p><div class="sugg">${smartSuggest(saved).map(([q, sub, icon]) => `<button type="button" data-ask="${esc(q)}"><i aria-hidden="true">${icon}</i><b>${esc(q)}</b><small>${esc(sub)}</small></button>`).join("")}</div></div>`;
}
function assistantView(saved) {
  expireChat();
  const empty = !assistantThread.length && !assistantPending;
  const who = `${esc(saved.section.yearLabel)} · ${esc(saved.section.title)} · فصل ${esc(saved.schedule.classNumber)}`;
  const log = empty ? chatWelcome(who, esc(friendNudge(saved)), saved) : assistantThread.map(assistantBubble).join("") + (assistantPending ? chatTyping() : "");
  return `<section class="chat${empty ? " is-empty" : ""}" id="chat">
    <div class="chat-bar"><p class="chat-who"><span class="dot" aria-hidden="true"></span><span class="ellipsis">${who}</span></p><button type="button" class="msg-tool" data-chat-new aria-label="محادثة جديدة">${CHAT_ICON.fresh}<span>محادثة جديدة</span></button></div>
    <div class="chat-log" id="ask-log" aria-live="polite">${log}</div>
    <div class="composer-wrap">
      <button type="button" class="to-bottom" data-chat-bottom aria-label="انزل لآخر المحادثة" hidden>${CHAT_ICON.down}</button>
      <div class="chips-strip" id="ask-chips"${assistantPending ? " hidden" : ""}>${chatChipButtons(saved)}</div>
      <form id="ask-form" class="composer" autocomplete="off">
        <textarea name="q" rows="1" maxlength="400" enterkeyhint="send" aria-label="اكتب سؤالك" placeholder="اسأل جدولي أي حاجة…"></textarea>
        <button class="send" type="submit" aria-label="إرسال" disabled>${CHAT_ICON.send}</button>
      </form>
      <p class="fine">أسئلة الجدول من غير حد. مع جدولاوي ${asksLeft()} سؤال حر لحد آخر اليوم.</p>
    </div>
  </section>`;
}
// </chat-ui-a>
function friendNudge(saved) {
  const now = new Date();
  const info = nextInfo(saved.schedule, now);
  if (!info) return "لو عايز ترتب مذاكرتك، اسألني.";
  const subject = readable(info.slot.subject);
  if (info.live) {
    const left = Math.max(1, Math.round((info.end - now) / 60000));
    return `أنت في ${subject} دلوقتي. ركّز، فاضل ${left} دقيقة.`;
  }
  const mins = Math.max(0, Math.round((info.start - now) / 60000));
  if (mins > 10 * 60) return `أول محاضرة ${info.slot.day} الساعة ${clock(info.slot.start)}، نام بدري.`;
  if (mins >= 60) return `${subject} كمان ${Math.floor(mins / 60)} ساعة. جهّز نفسك بهدوء.`;
  return `${subject} كمان ${mins} دقيقة${info.slot.room ? `، في ${info.slot.room}` : ""}.`;
}
function freeGaps(saved, now) {
  const day = jsDay(now);
  if (!day) return [];
  const nowMin = cairoFields(now).minutes;
  const slots = openDay(saved.schedule, day);
  const gaps = [];
  for (let index = 0; index < slots.length - 1; index += 1) {
    const end = slotMinutes(slots[index].end);
    const start = slotMinutes(slots[index + 1].start);
    if (start - end < 20 || nowMin >= start) continue;
    gaps.push({ after: readable(slots[index].subject), before: readable(slots[index + 1].subject), minutes: start - end });
  }
  return gaps.slice(0, 4);
}
function nearestExam(saved, now) {
  const today = cairoKey(now);
  let best = null;
  for (const item of myExams(saved)) {
    if (!item.exam_date || item.exam_date < today) continue;
    const daysLeft = Math.round((Date.parse(`${item.exam_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
    if (best && daysLeft >= best.daysLeft) continue;
    best = { title: readable(item.title || item.subject || ""), date: item.exam_date, daysLeft, start: item.start_time || "", room: item.room || "" };
  }
  return best;
}
function assistantReady(saved, now) {
  const info = nextInfo(saved.schedule, now);
  const fields = cairoFields(now);
  return {
    date: fields.key,
    weekday: fields.weekday,
    nudge: friendNudge(saved),
    nextLecture: info ? {
      subject: readable(info.slot.subject),
      day: info.slot.day,
      start: info.slot.start,
      end: info.slot.end,
      room: info.slot.room || "",
      instructor: readable(info.slot.instructor || ""),
      live: !!info.live,
      minutesUntil: Math.max(0, Math.round((info.start - now) / 60000)),
      minutesLeft: info.live ? Math.max(0, Math.round((info.end - now) / 60000)) : 0,
    } : null,
    freeGaps: freeGaps(saved, now),
    nextExam: nearestExam(saved, now),
    upcomingExams: upcomingExams(saved, now),
    subjects: subjectList(saved),
    tomorrow: tomorrowReady(saved, now),
  };
}
function tomorrowReady(saved, now) {
  const next = nextStudyDay(now);
  const slots = next.name ? openDay(saved.schedule, next.name) : [];
  return {
    label: next.label,
    day: next.name || "",
    holiday: next.holiday?.name || "",
    free: !next.holiday && slots.length === 0,
    lectures: slots.map((slot) => ({ subject: readable(slot.subject), start: slot.start, end: slot.end, room: slot.room || "" })),
  };
}
function studyPlan(saved, now) {
  const name = studentName();
  const hi = name ? `${name}، ` : "";
  const day = tomorrowReady(saved, now);
  if (day.holiday) return `${hi}${day.label} إجازة ${day.holiday}. مفيش محاضرة، ذاكر براحتك.`;
  if (day.free) {
    const info = nextInfo(saved.schedule, now);
    const nextLine = info ? `أقرب محاضرة ${info.slot.day} الساعة ${clock(info.slot.start)}، ${readable(info.slot.subject)}.` : "";
    return `${hi}${day.label} فاضي، مفيش محاضرات.\n${nextLine}\nلو هتذاكر، راجع المادة دي بس بهدوء، ونام بدري.`.trim();
  }
  const subjects = [...new Set(day.lectures.map((slot) => slot.subject))];
  return `${hi}${day.label} ${day.day} عندك:\n${day.lectures.map((slot) => `${slot.subject}، ${clock(slot.start)} لـ ${clock(slot.end)}${slot.room ? ` في ${slot.room}` : ""}`).join("\n")}\nذاكر المواد دي بس: ${subjects.join("، ")}.`;
}
const ASK_LIMIT = 20;
function askUsage() {
  try {
    const saved = JSON.parse(localStorage.getItem("jadwali-ask-count") || "null");
    if (!saved || saved.day !== cairoDayKey()) return { day: cairoDayKey(), n: 0 };
    return { day: saved.day, n: Number(saved.n) || 0 };
  } catch {
    return { day: cairoDayKey(), n: 0 };
  }
}
function asksLeft() {
  return Math.max(0, ASK_LIMIT - askUsage().n);
}
function spendAsk() {
  const usage = askUsage();
  try { localStorage.setItem("jadwali-ask-count", JSON.stringify({ day: usage.day, n: usage.n + 1 })); } catch { /* private mode */ }
}
function assistantContext(saved) {
  const now = new Date();
  const upcoming = nextStudyDay(now);
  return {
    now: now.toLocaleString("ar-EG", { timeZone: "Africa/Cairo", weekday: "long", hour: "numeric", minute: "2-digit" }),
    year: YEAR,
    term: TERM,
    section: `${saved.section.yearLabel} · ${saved.section.title}`,
    classNumber: String(saved.schedule.classNumber),
    studentName: studentName(),
    studentNotes: studentNotes(),
    today: jsDay(now) || "",
    nextDay: upcoming?.name || "",
    lectures: (saved.schedule.slots || []).slice(0, 48).map((slot) => ({
      day: slot.day,
      start: slot.start,
      end: slot.end || "",
      subject: readable(slot.subject),
      instructor: readable(slot.instructor || ""),
      room: slot.room || "",
      status: slot.status || "active",
      note: readable(slot.note || ""),
    })),
    exams: myExams(saved).slice(0, 16).map((item) => ({
      title: readable(item.title || item.subject || ""),
      date: item.exam_date || "",
      start: item.start_time || "",
      end: item.end_time || "",
      room: item.room || "",
      notes: readable(item.notes || ""),
    })),
    news: visibleNews(saved).slice(0, 5).map((item) => ({ title: item.title || "", body: item.body || "" })),
    holidays: (EXTRA_HOLIDAYS || []).slice(0, 12),
    kb: ASSISTANT_KB,
    ready: assistantReady(saved, now),
    guide: {
      programmer: ABOUT.name,
      role: "Software Engineer",
      whatsapp: WHATSAPP,
      portfolio: PORTFOLIO,
      channel: "https://whatsapp.com/channel/0029VbDlzPv4dTnT0xECBk1B",
    },
  };
}
function slotLine(slot) {
  const who = slot.instructor ? ` مع ${readable(slot.instructor)}` : "";
  const where = slot.room ? ` في ${slot.room}` : "";
  return `${readable(slot.subject)}${who}، ${clock(slot.start)} لـ ${clock(slot.end)}${where}`;
}
function localAnswer(saved, question) {
  const query = fold(question);
  const now = new Date();
  if (/مين انت|انت مين|انت اسمك|اسمك ايه|اسمك اي|انت ايه|عرفني بنفسك/.test(query)) return "أنا جدولاوي، صاحبك في جدولي. بساعدك في محاضراتك وامتحاناتك ومذاكرتك.";
  if (/(?:انسي|امسح|احذف).*(?:ملاحظاتي|كل حاجه|اللي قلته)/.test(query)) { forgetNotes(); return "تمام، مسحت ملاحظاتك. هنبدأ من جديد."; }
  if (/ملاحظاتي|فاكر عني|عارف عني/.test(query)) {
    const notes = studentNotes();
    return notes.length ? `فاكر عنك:\n${notes.join("\n")}` : "لسه معنديش ملاحظات عنك. قولي حاجة تهمني زي أصعب مادة عندك.";
  }
  if (/(?:ايه|اي).*(?:انهارده|النهارده|نهارده)|محاضراتي (?:انهارده|النهارده)/.test(query)) {
    const day = jsDay(now);
    if (!day) return "النهاردة جمعة، مفيش محاضرات.";
    const slots = openDay(saved.schedule, day);
    return slots.length ? `النهاردة ${day}:\n${slots.map(slotLine).join("\n")}` : `النهاردة ${day} مفيش محاضرات.`;
  }
  if (/مبرمج|عامل التطبيق|عمل التطبيق|صاحب جدولي/.test(query)) {
    return `المبرمج ${ABOUT.name}، Software Engineer. تقدر تكلمه من الأزرار تحت.`;
  }
  if (/قناه|تحديثات/.test(query)) return "قناة تحديثات جدولي على واتساب. اضغط انضم الآن تحت.";
  if (/اشعار|تنبيه/.test(query)) return "فعّل الإشعار من جرس الإشعارات. لو التطبيق مثبت على الشاشة، التذكير يوصلك حتى وهو مقفول.";
  if (/تقويم/.test(query)) return "من صفحة الجدول اضغط إضافة محاضراتي للتقويم. هتتحفظ باسم جدولي.";
  if (/جروب|واتس/.test(query) && !/قناه/.test(query)) return "جروب فصلك يظهر في يومك لو الإدارة ضافت الرابط. لو مش ظاهر، لسه متضافش.";
  if (/تثبيت|الشاشه الرئيسيه/.test(query)) return "على الآيفون: من سفاري زر المشاركة ثم إضافة إلى الشاشة الرئيسية. على أندرويد: من قائمة المتصفح تثبيت التطبيق.";
  if (/امتحان/.test(query)) {
    const rows = myExams(saved);
    if (!rows.length) return "لسه مفيش امتحانات متسجلة لفصلك.";
    return rows.slice(0, 6).map((item) => `${readable(item.title || item.subject)}${item.exam_date ? `، ${item.exam_date}` : ""}${item.start_time ? ` ${clock(String(item.start_time).slice(0, 5))}` : ""}${item.room ? `، ${item.room}` : ""}`).join("\n");
  }
  if (/مذاكر|رتب/.test(query)) return studyPlan(saved, now);
  if (/بكره|بكرا|غدا/.test(query)) {
    const next = nextStudyDay(now);
    if (next.holiday) return `${next.label} إجازة: ${next.holiday.name}.`;
    const slots = openDay(saved.schedule, next.name);
    if (!slots.length) return `${next.label} ${next.name} مفيش محاضرات.`;
    return `${next.label} ${next.name}:\n${slots.map(slotLine).join("\n")}`;
  }
  if (/فاضي|فضى/.test(query)) {
    const day = jsDay(now);
    if (!day) return "النهاردة جمعة، مفيش محاضرات.";
    const left = openDay(saved.schedule, day).filter((slot) => slotStatus(slot, now) !== "done");
    if (!left.length) return "النهاردة فاضية، مفيش محاضرات باقية.";
    return `لسه قدامك:\n${left.map(slotLine).join("\n")}`;
  }
  if (isNameQuestion(question)) return whoAmI(saved);
  if (/^(السلام عليكم|سلام|اهلا|أهلا|عامل ايه|ازيك|صباح الخير|مساء الخير)$/.test(query.replace(/[؟?]/g, "").trim())) {
    const name = studentName();
    return `أهلاً بيك${name ? ` يا ${name}` : ""}. تحب أساعدك في إيه؟`;
  }
  const before = studentName();
  const named = rememberStudentName(question);
  if (named && named !== before) return whoAmI(saved);
  if (/محاضره|الجاي|جايه|انهارده|نهارد|جدول/.test(query)) {
    const info = nextInfo(saved.schedule, now);
    if (!info) return "مش لاقي محاضرة جاية في جدولك.";
    const when = info.live ? "دلوقتي" : `يوم ${info.slot.day}`;
    return `المحاضرة الجاية ${when}: ${slotLine(info.slot)}.`;
  }
  return "";
}
function quotaUntil() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", hourCycle: "h23", hour: "2-digit" }).format(new Date()));
  let add = (10 - hour + 24) % 24;
  if (add === 0) add = 24;
  return Date.now() + add * 60 * 60 * 1000;
}
function quotaBlocked() {
  return Number(localStorage.getItem("jadwali-ai-off") || 0) > Date.now();
}
function blockQuota() {
  try { localStorage.setItem("jadwali-ai-off", String(quotaUntil())); } catch { /* private mode */ }
}
function savedReply(saved, text) {
  return localAnswer(saved, text) || "الحد اليومي للنموذج خلّص. اسألني عن محاضرتك أو امتحانك أو بكرة، وأرد من جدولك فورًا.";
}
// <chat-ui-b>
function chatReduced() {
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
function chatLog() {
  return document.getElementById("ask-log");
}
function chatNearBottom(gap) {
  const doc = document.documentElement;
  return doc.scrollHeight - (window.scrollY + window.innerHeight) < gap;
}
function chatScroll(smooth) {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: smooth && !chatReduced() ? "smooth" : "auto" });
}
function chatSyncComposer() {
  const input = document.querySelector("#ask-form textarea");
  const send = document.querySelector("#ask-form .send");
  if (!input || !send) return;
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 132)}px`;
  const busy = assistantPending || !!chatRevealing;
  const mode = busy ? "stop" : "send";
  if (send.dataset.mode !== mode) {
    send.dataset.mode = mode;
    send.innerHTML = busy ? CHAT_ICON.stop : CHAT_ICON.send;
    send.setAttribute("aria-label", busy ? "إيقاف" : "إرسال");
  }
  send.classList.toggle("stop", busy);
  send.disabled = !busy && !input.value.trim();
}
function chatSyncBottom() {
  const button = document.querySelector(".to-bottom");
  if (button) button.hidden = !assistantThread.length || chatNearBottom(260);
}
function mountChat() {
  chatSyncComposer();
  if (assistantThread.length || assistantPending) requestAnimationFrame(() => { chatScroll(false); chatSyncBottom(); });
  else if (window.matchMedia?.("(pointer: fine)").matches) document.querySelector("#ask-form textarea")?.focus({ preventScroll: true });
}
function chatEnterThread() {
  const chat = document.getElementById("chat");
  if (!chat?.classList.contains("is-empty")) return;
  chat.classList.remove("is-empty");
  chatLog().innerHTML = "";
}
function chatReveal(node, text, onDone) {
  const target = node.querySelector(".txt");
  const tokens = String(text).split(/(\s+)/);
  const per = chatReduced() ? tokens.length : Math.max(2, 2 * Math.ceil(tokens.length / 110));
  let shown = 0;
  let timer = 0;
  const state = {
    finish() {
      clearInterval(timer);
      if (chatRevealing === state) chatRevealing = null;
      if (target.isConnected) {
        target.classList.remove("streaming");
        target.innerHTML = assistantHtml(text);
      }
      chatSyncComposer();
      onDone();
    },
  };
  chatRevealing = state;
  timer = setInterval(() => {
    if (!target.isConnected) {
      clearInterval(timer);
      if (chatRevealing === state) chatRevealing = null;
      return;
    }
    shown += per;
    if (shown >= tokens.length) return state.finish();
    target.innerHTML = assistantHtml(tokens.slice(0, shown).join(""));
    if (chatNearBottom(240)) chatScroll(false);
  }, 34);
  chatSyncComposer();
}
function chatStop() {
  if (chatRevealing) return chatRevealing.finish();
  if (!assistantPending) return;
  chatRun += 1;
  chatAbort?.abort();
  assistantPending = false;
  document.getElementById("ask-typing")?.remove();
  document.getElementById("ask-chips")?.removeAttribute("hidden");
  chatSyncComposer();
}
function chatReset() {
  if (chatRevealing) chatRevealing.finish();
  chatRun += 1;
  chatAbort?.abort();
  assistantPending = false;
  assistantThread = [];
  saveChat();
  render();
}
async function askAssistant(question) {
  const text = String(question || "").replace(/\s+/g, " ").trim().slice(0, 400);
  const saved = current();
  if (!text || assistantPending || !saved) return;
  if (chatRevealing) chatRevealing.finish();
  expireChat();
  const intro = assistantThread.length ? "" : chatIntro();
  if (intro) assistantThread.push({ role: "assistant", text: intro });
  assistantThread.push({ role: "user", text });
  saveChat();
  assistantPending = true;
  const run = ++chatRun;
  if (ui.view !== "assistant") go("assistant");
  else {
    chatEnterThread();
    chatLog().insertAdjacentHTML("beforeend", (intro ? assistantBubble({ role: "assistant", text: intro }) : "") + assistantBubble({ role: "user", text }) + chatTyping());
    const input = document.querySelector("#ask-form textarea");
    if (input) input.value = "";
    document.getElementById("ask-chips")?.setAttribute("hidden", "");
    chatSyncComposer();
    chatScroll(true);
  }
  const history = assistantThread.filter((item) => item.text && !item.text.includes("أنا جدولاوي صاحبك في جدولي")).slice(0, -1).slice(-10).map((item) => ({ role: item.role === "assistant" ? "model" : "user", text: item.text }));
  const started = Date.now();
  let reply = "";
  const aiFirst = needsAI(text);
  const known = aiFirst ? "" : localAnswer(saved, text);
  try {
    if (known) {
      reply = known;
    } else if (asksLeft() <= 0) {
      reply = `خلّصت أسئلتك (${ASK_LIMIT}) مع جدولاوي النهارده. نكمل بكرة، وأسئلة الجدول لسه مفتوحة.`;
    } else if (quotaBlocked()) {
      reply = savedReply(saved, text);
    } else {
      spendAsk();
      const config = window.JADWALI_SUPABASE;
      chatAbort = new AbortController();
      const timer = setTimeout(() => chatAbort.abort(), 25000);
      let response;
      try {
        response = await fetch(`${config.url}/functions/v1/${window.JADWALI_ASSISTANT_FN || "jadwali-assistant"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: config.key, Authorization: `Bearer ${config.key}` },
          body: JSON.stringify({ question: text, history, context: assistantContext(saved) }),
          signal: chatAbort.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      const out = await response.json().catch(() => ({}));
      const detail = `${out.error || ""} ${out.detail || ""}`;
      if (!response.ok || !out.reply) {
        if (response.status === 429 || /quota|rate limit|exhausted/i.test(detail)) blockQuota();
        throw new Error(/quota|rate limit|exhausted/i.test(detail) ? "quota" : "failed");
      }
      reply = String(out.reply).slice(0, 1200);
      applyRemember(out.remember);
      setQuiz(out.mode === "quiz");
    }
  } catch (error) {
    if (run !== chatRun) return;
    reply = aiFirst ? AI_DOWN : error?.message === "quota" ? savedReply(saved, text) : (localAnswer(saved, text) || "مش قادر أوصل للنموذج دلوقتي. اسألني عن محاضرتك أو امتحانك أو بكرة.");
  }
  if (run !== chatRun) return;
  const wait = 520 - (Date.now() - started);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  if (run !== chatRun) return;
  assistantPending = false;
  chatAbort = null;
  document.getElementById("ask-typing")?.remove();
  const kinds = [];
  try { kinds.push(...assistantIntent(text)); } catch { /* card is optional */ }
  assistantThread.push({ role: "assistant", text: reply });
  kinds.forEach((kind) => assistantThread.push({ role: "card", kind }));
  saveChat();
  const log = chatLog();
  if (ui.view !== "assistant" || !log) return;
  log.insertAdjacentHTML("beforeend", botMessage("", true));
  chatReveal(log.lastElementChild, reply, () => {
    const cards = kinds.map((kind) => assistantBubble({ role: "card", kind })).join("");
    if (cards) chatLog()?.insertAdjacentHTML("beforeend", cards);
    document.getElementById("ask-chips")?.removeAttribute("hidden");
    if (chatNearBottom(320)) chatScroll(true);
    chatSyncBottom();
  });
  if (chatNearBottom(320)) chatScroll(true);
}
async function chatCopy(button) {
  const text = button.closest(".body")?.querySelector(".txt")?.innerText?.trim() || "";
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;opacity:0;top:0";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); } catch { /* copy blocked */ }
    area.remove();
  }
  button.innerHTML = CHAT_ICON.check;
  button.classList.add("ok");
  setTimeout(() => { button.innerHTML = CHAT_ICON.copy; button.classList.remove("ok"); }, 1400);
}

function submitAsk(form) {
  if (!form || form.dataset.sent === "1") return;
  form.dataset.sent = "1";
  setTimeout(() => { form.dataset.sent = ""; }, 350);
  if (assistantPending || chatRevealing) return chatStop();
  askAssistant(form.elements.q.value);
}
document.body.addEventListener("submit", (event) => {
  if (event.target?.id !== "ask-form") return;
  event.preventDefault();
  submitAsk(event.target);
});
document.body.addEventListener("input", (event) => {
  if (event.target?.matches?.("#ask-form textarea")) chatSyncComposer();
});
document.body.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing || !event.target?.matches?.("#ask-form textarea")) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;
  event.preventDefault();
  if (assistantPending || chatRevealing) return;
  const form = event.target.form;
  if (typeof form.requestSubmit === "function") form.requestSubmit();
  else form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
});
document.body.addEventListener("mousedown", (event) => {
  if (event.target?.closest?.("#ask-form .send")) event.preventDefault();
});
document.body.addEventListener("pointerup", (event) => {
  const send = event.target.closest?.("#ask-form .send");
  if (!send) return;
  submitAsk(send.closest("form"));
});
document.body.addEventListener("click", (event) => {
  const send = event.target.closest?.("#ask-form .send");
  if (!send) return;
  event.preventDefault();
  submitAsk(send.closest("form"));
});
document.body.addEventListener("focusin", (event) => {
  if (event.target?.matches?.("#ask-form textarea") && window.matchMedia("(pointer: coarse)").matches) document.body.classList.add("chat-typing");
});
document.body.addEventListener("focusout", (event) => {
  if (event.target?.matches?.("#ask-form textarea")) setTimeout(() => document.body.classList.remove("chat-typing"), 80);
});
document.body.addEventListener("click", (event) => {
  const button = event.target.closest?.("[data-chat-copy],[data-chat-new],[data-chat-bottom]");
  if (!button) return;
  if ("chatBottom" in button.dataset) chatScroll(true);
  else if ("chatNew" in button.dataset) chatReset();
  else chatCopy(button);
});
let chatScrollQueued = false;
window.addEventListener("scroll", () => {
  if (ui.view !== "assistant" || chatScrollQueued) return;
  chatScrollQueued = true;
  requestAnimationFrame(() => { chatScrollQueued = false; chatSyncBottom(); });
}, { passive: true });
// </chat-ui-b>

document.body.addEventListener("click", async (event) => {
  const dismiss = event.target.closest("[data-dismiss-news]");
  if (dismiss) {
    rememberNews(dismiss.dataset.dismissNews);
    const card = dismiss.closest(".announce");
    const news = card?.parentElement;
    card?.remove();
    if (news && !news.querySelector(".announce")) news.remove();
  }
  const askChip = event.target.closest("[data-ask]");
  if (askChip) return askAssistant(askChip.dataset.ask);
  const target = event.target.closest("[data-go],[data-year],[data-section],[data-class],[data-day],[data-mode],[data-lead],[data-open-section],[data-open-class],#save-class,#menu-open,#menu-close,#menu-x,#hide-install,#install-now,#download,#alert-on,#alert-off,#ask-alert,#ask-later,#share-today,#share-week,#share-class,#add-calendar,#join-group,#report,#change-class,#clear-class,#hero-open,#seen-update");
  if (!target) return;
  if (target.dataset.go) {
    event.preventDefault();
    if (target.dataset.go === "setup" && current()) return go("day");
    return go(target.dataset.go);
  }
  if (target.id === "hero-open") document.getElementById("today-board")?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (target.id === "seen-update") {
    const savedNow = current();
    if (savedNow?.schedule.revisedAt) localStorage.setItem(seenKey(savedNow), savedNow.schedule.revisedAt);
    render();
  }
  if (target.id === "menu-open") document.getElementById("drawer").hidden = false;
  if (target.id === "menu-close" || target.id === "menu-x") document.getElementById("drawer").hidden = true;
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
    writeSaved(getClass(ui.sectionId, ui.classPick));
    go("day");
  }
  if (target.dataset.day) {
    ui.pickedDay = target.dataset.day;
    render();
  }
  if (target.dataset.mode) {
    ui.mode = target.dataset.mode;
    render();
  }
  if (target.dataset.lead) {
    localStorage.setItem("jadwali-lead", target.dataset.lead);
    schedulePushSync();
    render();
  }
  if (target.id === "hide-install") {
    localStorage.setItem("jadwali-install-hide", "1");
    render();
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
    writeSaved(null);
    ui.year = null;
    ui.sectionId = null;
    ui.classPick = null;
    ui.classQuery = "";
    go("setup");
  }
  if (target.dataset.openSection) {
    ui.sectionId = target.dataset.openSection;
    render();
  }
  if (target.dataset.openClass && ui.sectionId) {
    writeSaved(getClass(ui.sectionId, target.dataset.openClass));
    go("table");
  }
  if (target.id === "alert-on" || target.id === "ask-alert") enableAlerts();
  if (target.id === "ask-later") {
    localStorage.setItem("jadwali-alert-ask", "1");
    render();
  }
  if (target.id === "alert-off") {
    localStorage.removeItem("jadwali-reminders");
    alertNote = "";
    if (pushActive() || localStorage.getItem("jadwali-push") === "1") trackEvent("push_off");
    void disablePush();
    render();
  }
  const saved = current();
  if (!saved) return;
  if (target.id === "share-today") { trackEvent("share_today"); shareToday(saved); }
  if (target.id === "share-week") { trackEvent("share_week"); shareWeek(saved); }
  if (target.id === "share-class") { trackEvent("share_class"); shareClass(saved); }
  if (target.id === "report") { trackEvent("report"); report(saved); }
  if (target.id === "download") downloadTable(saved);
  if (target.id === "add-calendar") { trackEvent("calendar"); addCalendar(saved); }
  if (target.id === "join-group" && saved) {
    localStorage.setItem(groupKey(saved), "1");
    target.closest(".wa-card")?.remove();
  }
});

document.getElementById("drawer-nav")?.addEventListener("click", (event) => {
  if (event.target.closest(".nav-item")) setTimeout(() => { document.getElementById("drawer").hidden = true; }, 0);
});
document.getElementById("tabbar")?.addEventListener("click", (event) => {
  if (event.target.closest("[data-more]")) document.getElementById("drawer").hidden = false;
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
  if (event.target.id === "search") ui.search = event.target.value;
});
document.body.addEventListener("submit", (event) => {
  if (event.target.id !== "search-form") return;
  event.preventDefault();
  const box = document.getElementById("search-out");
  const result = smartSearch(ui.search);
  if (!box) return;
  if (result.tooShort) {
    box.innerHTML = `<p class="muted">اكتب حرفين على الأقل.</p>`;
    return;
  }
  const classes = result.classes.map((schedule) => {
    const section = sectionById(schedule.sectionId);
    return `<button type="button" class="section-card search-hit" data-jump="${esc(schedule.sectionId)}|${esc(schedule.classNumber)}">فصل ${esc(schedule.classNumber)} · ${esc(section?.title || "")}</button>`;
  }).join("");
  const lectures = result.lectures.map((hit) => `<button type="button" class="section-card search-hit" data-jump="${esc(hit.schedule.sectionId)}|${esc(hit.schedule.classNumber)}">${esc(hit.slot.subject)} · ${esc(hit.via)} · ${esc(hit.slot.day)} ${range(hit.slot.start, hit.slot.end)}</button>`).join("");
  box.className = "search-pop";
  box.innerHTML = `<div class="stack" style="margin-top:10px">${classes || lectures ? classes + lectures : `<p class="muted">مفيش نتيجة.</p>`}</div>`;
});
document.body.addEventListener("click", (event) => {
  const jump = event.target.closest("[data-jump]");
  if (!jump) return;
  const [sectionId, classNumber] = jump.dataset.jump.split("|");
  writeSaved(getClass(sectionId, classNumber));
  go("table");
});

async function drawTodayCard(saved) {
  await document.fonts.ready;
  const now = new Date();
  const holiday = holidayOn(now);
  const day = weekdayName(now);
  const slots = holiday ? [] : slotsOn(saved.schedule, jsDay(now)).filter((slot) => slot.status !== "cancelled");
  const width = 1080;
  const head = 280;
  const rowH = slots.length ? 168 : 140;
  const height = head + Math.max(1, slots.length) * rowH + 120;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#100e0c";
  ctx.fillRect(0, 0, width, height);
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.fillStyle = "#d4b08c";
  ctx.font = "600 28px \"IBM Plex Sans Arabic\", sans-serif";
  ctx.fillText("جدولي", width - 56, 78);
  ctx.fillStyle = "#f7f3ee";
  ctx.font = "700 54px \"IBM Plex Sans Arabic\", sans-serif";
  ctx.fillText(holiday ? `إجازة ${holiday.name}` : `جدول ${day}`, width - 56, 150);
  ctx.fillStyle = "#b7aea4";
  ctx.font = "500 28px \"IBM Plex Sans Arabic\", sans-serif";
  ctx.fillText(`${saved.section.yearLabel} · ${saved.section.title} · فصل ${saved.schedule.classNumber}`, width - 56, 210);
  if (!slots.length && !holiday) {
    ctx.fillStyle = "#f7f3ee";
    ctx.font = "600 34px \"IBM Plex Sans Arabic\", sans-serif";
    ctx.fillText("مفيش محاضرات النهاردة.", width - 56, head + 70);
  }
  slots.forEach((slot, index) => {
    const y = head + index * rowH;
    ctx.fillStyle = "#1a1613";
    ctx.beginPath();
    ctx.roundRect(48, y, width - 96, rowH - 18, 22);
    ctx.fill();
    ctx.fillStyle = "#d4b08c";
    ctx.font = "600 24px \"IBM Plex Sans Arabic\", sans-serif";
    ctx.fillText(`${clock(slot.start)} – ${clock(slot.end)}`, width - 80, y + 48);
    ctx.fillStyle = "#f7f3ee";
    ctx.font = "700 34px \"IBM Plex Sans Arabic\", sans-serif";
    ctx.fillText(slot.subject, width - 80, y + 96);
    ctx.fillStyle = "#b7aea4";
    ctx.font = "500 24px \"IBM Plex Sans Arabic\", sans-serif";
    ctx.fillText([slot.instructor, slot.room].filter(Boolean).join(" · "), width - 80, y + 134);
  });
  ctx.textAlign = "center";
  ctx.fillStyle = "#d4b08c";
  ctx.font = "600 24px \"IBM Plex Sans Arabic\", sans-serif";
  ctx.fillText("جدولي", width / 2, height - 42);
  return canvas;
}
function shareCanvas(canvas, filename, text) {
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "جدولي", text }); return; } catch { return; }
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  });
}
async function drawWeekCard(saved) {
  await document.fonts.ready;
  const blocks = DAYS.map((day) => ({
    day,
    slots: slotsOn(saved.schedule, day).filter((slot) => slot.status !== "cancelled"),
  }));
  const width = 1080;
  const rowH = 118;
  const height = 230 + blocks.reduce((sum, block) => sum + 64 + Math.max(1, block.slots.length) * rowH, 0) + 80;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#100e0c";
  ctx.fillRect(0, 0, width, height);
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.fillStyle = "#d4b08c";
  ctx.font = "600 28px \"IBM Plex Sans Arabic\", sans-serif";
  ctx.fillText("جدولي", width - 56, 72);
  ctx.fillStyle = "#f7f3ee";
  ctx.font = "700 52px \"IBM Plex Sans Arabic\", sans-serif";
  ctx.fillText("جدول الأسبوع", width - 56, 140);
  ctx.fillStyle = "#b7aea4";
  ctx.font = "500 28px \"IBM Plex Sans Arabic\", sans-serif";
  ctx.fillText(`${saved.section.yearLabel} · ${saved.section.title} · فصل ${saved.schedule.classNumber}`, width - 56, 190);
  let y = 230;
  blocks.forEach((block) => {
    ctx.fillStyle = "#d4b08c";
    ctx.font = "700 32px \"IBM Plex Sans Arabic\", sans-serif";
    ctx.fillText(block.day, width - 56, y + 36);
    y += 64;
    if (!block.slots.length) {
      ctx.fillStyle = "#b7aea4";
      ctx.font = "500 26px \"IBM Plex Sans Arabic\", sans-serif";
      ctx.fillText("فاضي", width - 80, y + 28);
      y += rowH;
      return;
    }
    block.slots.forEach((slot) => {
      ctx.fillStyle = "#1a1613";
      ctx.beginPath();
      ctx.roundRect(48, y, width - 96, rowH - 16, 18);
      ctx.fill();
      ctx.fillStyle = "#d4b08c";
      ctx.font = "600 22px \"IBM Plex Sans Arabic\", sans-serif";
      ctx.fillText(`${clock(slot.start)} – ${clock(slot.end)}`, width - 76, y + 36);
      ctx.fillStyle = "#f7f3ee";
      ctx.font = "700 30px \"IBM Plex Sans Arabic\", sans-serif";
      ctx.fillText(slot.subject, width - 76, y + 74);
      y += rowH;
    });
  });
  ctx.textAlign = "center";
  ctx.fillStyle = "#d4b08c";
  ctx.font = "600 24px \"IBM Plex Sans Arabic\", sans-serif";
  ctx.fillText("جدولي", width / 2, height - 36);
  return canvas;
}
function shareWeek(saved) {
  drawWeekCard(saved).then((canvas) => shareCanvas(canvas, "jadwali-week.png", `جدول الأسبوع · فصل ${saved.schedule.classNumber}`));
}
function shareToday(saved) {
  drawTodayCard(saved).then((canvas) => shareCanvas(canvas, "jadwali-today.png", `جدول ${weekdayName(new Date())} · فصل ${saved.schedule.classNumber}`));
}
function shareClass(saved) {
  const url = `${location.origin}${location.pathname}${location.search}#/c/${encodeURIComponent(saved.schedule.sectionId)}/${encodeURIComponent(saved.schedule.classNumber)}`;
  const text = `جدول فصل ${saved.schedule.classNumber}\n${saved.section.yearLabel} · ${saved.section.title}\nافتحه من هنا:\n${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}
function report(saved) {
  const text = `في غلطة في جدول جدولي\n${saved.section.yearLabel} · ${saved.section.title} · فصل ${saved.schedule.classNumber}\nالغلطة:`;
  const link = safeHttpUrl(WHATSAPP);
  if (!link) return;
  window.open(`${link}${link.includes("?") ? "&" : "?"}text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}
function icsEscape(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
function wallStamp(hhmm) {
  const [hourText, minuteText] = hhmm.split(":");
  const hour = Number(hourText);
  const shown = hour <= 7 ? hour + 12 : hour;
  return `${String(shown).padStart(2, "0")}${String(minuteText).padStart(2, "0")}00`;
}
function firstDayStamp(dayName) {
  for (let offset = 0; offset < 14; offset += 1) {
    const fields = cairoFields(cairoInstant(2026, 10, 3 + offset, 12 * 60));
    if (fields.weekday === dayName) return `${fields.year}${String(fields.month).padStart(2, "0")}${String(fields.day).padStart(2, "0")}`;
  }
  return "20261003";
}
function holidayStamps(dayName, hhmm) {
  return allHolidays().flatMap((holiday) => {
    const [year, month, day] = holiday.date.split("-").map(Number);
    const fields = cairoFields(cairoInstant(year, month, day, 12 * 60));
    if (fields.weekday !== dayName) return [];
    return [`${holiday.date.replaceAll("-", "")}T${wallStamp(hhmm)}`];
  });
}
function buildCalendar(saved) {
  const lead = Number(localStorage.getItem("jadwali-lead") || DEFAULT_LEAD);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Jadwali//Modern Academy//AR", "CALSCALE:GREGORIAN", "X-WR-CALNAME:جدولي", "X-WR-TIMEZONE:Africa/Cairo"];
  const seen = new Set();
  for (const slot of sortSlots(saved.schedule.slots)) {
    const key = `${slot.day}|${slot.start}|${slot.end}|${slot.subject}|${slot.room}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (slot.status === "cancelled") continue;
    if (slotMinutes(slot.end) - slotMinutes(slot.start) <= 0) continue;
    const dayCode = { السبت: "sa", الأحد: "su", الإثنين: "mo", الثلاثاء: "tu", الأربعاء: "we", الخميس: "th" }[slot.day] || "day";
    const startDate = firstDayStamp(slot.day);
    const title = slot.subject;
    const details = [saved.section.yearLabel, saved.section.title, `فصل ${saved.schedule.classNumber}`, slot.instructor].filter(Boolean).join(" · ");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:jadwali-${saved.schedule.sectionId}-${saved.schedule.classNumber}-${dayCode}-${slot.start.replace(":", "")}@jadwali`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`);
    lines.push(`DTSTART;TZID=Africa/Cairo:${startDate}T${wallStamp(slot.start)}`);
    lines.push(`DTEND;TZID=Africa/Cairo:${startDate}T${wallStamp(slot.end)}`);
    lines.push("RRULE:FREQ=WEEKLY;UNTIL=20270121T205959Z");
    const skipped = holidayStamps(slot.day, slot.start);
    if (skipped.length) lines.push(`EXDATE;TZID=Africa/Cairo:${skipped.join(",")}`);
    lines.push(`SUMMARY:${icsEscape(title)}`);
    lines.push(`DESCRIPTION:${icsEscape(details)}`);
    if (slot.room) lines.push(`LOCATION:${icsEscape(slot.room)}`);
    lines.push("BEGIN:VALARM");
    lines.push(`TRIGGER:-PT${lead}M`);
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:${icsEscape(title)}`);
    lines.push("END:VALARM");
    lines.push("END:VEVENT");
  }
  myExams(saved).forEach((exam) => {
    if (!exam.exam_date || !exam.start_time) return;
    const stamp = String(exam.exam_date).replaceAll("-", "");
    const end = exam.end_time || exam.start_time;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:jadwali-exam-${saved.schedule.sectionId}-${saved.schedule.classNumber}-${stamp}-${exam.start_time.replace(":", "")}@jadwali`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`);
    lines.push(`DTSTART;TZID=Africa/Cairo:${stamp}T${wallStamp(exam.start_time)}`);
    lines.push(`DTEND;TZID=Africa/Cairo:${stamp}T${wallStamp(end)}`);
    lines.push(`SUMMARY:${icsEscape(exam.title || exam.subject || "امتحان")}`);
    lines.push(`DESCRIPTION:${icsEscape(`امتحان فصل ${saved.schedule.classNumber}`)}`);
    if (exam.room) lines.push(`LOCATION:${icsEscape(exam.room)}`);
    lines.push("BEGIN:VALARM");
    lines.push(`TRIGGER:-PT${lead}M`);
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:${icsEscape(exam.title || "امتحان")}`);
    lines.push("END:VALARM");
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
async function flushPendingCalendar() {
  const pending = sessionStorage.getItem("jadwali-open-ics");
  if (!pending) return;
  await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller;
  if (!worker) return;
  sessionStorage.removeItem("jadwali-open-ics");
  await postCalendar(worker, pending);
  location.assign(new URL("calendar.ics", location.href).href);
}
function postCalendar(worker, ics) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => reject(new Error("calendar-timeout")), 2000);
    channel.port1.onmessage = () => {
      clearTimeout(timer);
      resolve();
    };
    worker.postMessage({ type: "ics", body: ics }, [channel.port2]);
  });
}
async function openInIphoneCalendar(ics) {
  const registration = await navigator.serviceWorker.register("sw.js");
  await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller || registration.active;
  if (!navigator.serviceWorker.controller) {
    sessionStorage.setItem("jadwali-open-ics", ics);
    location.reload();
    return;
  }
  await postCalendar(worker, ics);
  location.assign(new URL("calendar.ics", location.href).href);
}
async function addCalendar(saved) {
  const note = document.getElementById("calendar-note");
  const ics = buildCalendar(saved);
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  try {
    if (ios && "serviceWorker" in navigator) {
      if (note) note.textContent = "هتفتح شاشة المواعيد. اختار التقويم وبعدين إضافة الكل.";
      await openInIphoneCalendar(ics);
      return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    link.download = "jadwali.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (note) note.textContent = "افتح ملف jadwali.ics عشان المواعيد تتنزل في التقويم.";
  } catch (error) {
    if (note) note.textContent = "افتح جدولي من سفاري، مش من تطبيق تاني، وبعدين اضغط الزر تاني.";
  }
}

// ---------- إشعارات حقيقية من الخادم (Web Push) ----------
const PUSH_KEY = window.JADWALI_PUSH_KEY || "";
let pushTimer = null;
let alertNote = "";
function pushSupported() {
  return Boolean(PUSH_KEY) && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}
function pushActive() {
  return localStorage.getItem("jadwali-push") === "1" && "Notification" in window && Notification.permission === "granted";
}
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}
function keyBytes(base64) {
  const raw = atob((base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}
async function supabaseRpc(name, body) {
  const config = window.JADWALI_SUPABASE;
  if (!config?.url || !config?.key) return false;
  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}
function trackEvent(kind) {
  const saved = current();
  void supabaseRpc("track_event", { p_kind: kind, p_section: saved?.schedule.sectionId || "", p_class: saved?.schedule.classNumber || "" });
}
function trackClassVisit() {
  const key = `jadwali-cv-${cairoKey(new Date())}`;
  if (localStorage.getItem(key) === "1" || !current()) return;
  localStorage.setItem(key, "1");
  trackEvent("visit");
}
async function pushRegister(subscription) {
  const saved = current();
  const json = subscription.toJSON();
  const lead = Number(localStorage.getItem("jadwali-lead") || DEFAULT_LEAD);
  return supabaseRpc("register_push", {
    p_endpoint: json.endpoint,
    p_p256dh: json.keys?.p256dh || "",
    p_auth: json.keys?.auth || "",
    p_section: saved?.schedule.sectionId || null,
    p_class: saved?.schedule.classNumber || "",
    p_lead: lead,
  });
}
async function pushSubscription(registration) {
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUSH_KEY) });
}
async function subscribePush() {
  if (!pushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;
    let subscription;
    try {
      subscription = await pushSubscription(registration);
    } catch {
      // اشتراك قديم بمفتاح مختلف
      const old = await registration.pushManager.getSubscription();
      if (old) await old.unsubscribe();
      subscription = await pushSubscription(registration);
    }
    if (!(await pushRegister(subscription))) return false;
    localStorage.setItem("jadwali-push", "1");
    return true;
  } catch {
    return false;
  }
}
function schedulePushSync() {
  if (!pushActive()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(syncPush, 600);
}
async function syncPush() {
  if (!pushActive() || !pushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await pushRegister(await pushSubscription(registration));
  } catch {
    /* هنحاول تاني في الفتحة الجاية */
  }
}
async function disablePush() {
  localStorage.removeItem("jadwali-push");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await supabaseRpc("unregister_push", { p_endpoint: endpoint });
    }
  } catch {
    /* مش مشكلة */
  }
}
// اللي كان مفعّل التنبيه القديم والإذن موجود: نرقّيه لإشعار حقيقي من غير ما نسأله تاني
async function upgradePush() {
  if (!pushSupported() || Notification.permission !== "granted") return;
  if (localStorage.getItem("jadwali-push") === "1") return syncPush();
  if (localStorage.getItem("jadwali-reminders") === "1" && current() && (await subscribePush())) trackEvent("push_on");
}

async function enableAlerts() {
  if (isIOS() && !isStandalone()) {
    alertNote = "على الآيفون: ثبّت جدولي على الشاشة الرئيسية الأول (زر المشاركة ثم إضافة إلى الشاشة الرئيسية)، وافتحه من الأيقونة وفعّل التنبيه.";
    render();
    return;
  }
  if (!("Notification" in window)) {
    alertNote = "المتصفح ده مش بيدعم الإشعارات.";
    render();
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alertNote = "اسمح بالإشعارات لما المتصفح يسألك.";
    render();
    return;
  }
  localStorage.setItem("jadwali-reminders", "1");
  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("sw.js"); } catch { /* optional */ }
  }
  if (await subscribePush()) {
    trackEvent("push_on");
    alertNote = "";
  } else {
    alertNote = "التنبيه اشتغل والصفحة مفتوحة بس. جرّب تفعّله تاني بعد شوية عشان يوصلك والتطبيق مقفول.";
  }
  render();
}

const sent = new Set(JSON.parse(localStorage.getItem("jadwali-sent") || "[]"));
function remember(id) {
  sent.add(id);
  localStorage.setItem("jadwali-sent", JSON.stringify([...sent].slice(-80)));
}
async function notify(id, body) {
  if (sent.has(id) || Notification.permission !== "granted") return;
  remember(id);
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
  if (registration?.active) registration.active.postMessage({ type: "notify", title: "جدولي", body, tag: id });
  else new Notification("جدولي", { body, lang: "ar", dir: "rtl" });
}
function checkAlerts() {
  if (localStorage.getItem("jadwali-reminders") !== "1" || pushActive()) return;
  const saved = current();
  if (!saved || holidayOn(new Date())) return;
  const now = new Date();
  const day = jsDay(now);
  const slots = slotsOn(saved.schedule, day).filter((slot) => slot.status !== "cancelled");
  const lead = Number(localStorage.getItem("jadwali-lead") || DEFAULT_LEAD);
  const minute = cairoMinutes(now);
  if (slots[0]) {
    const first = slotMinutes(slots[0].start);
    if (minute >= first - 60 && minute < first - 57) {
      const count = slots.length === 1 ? "محاضرة واحدة" : slots.length === 2 ? "محاضرتين" : `${slots.length} محاضرات`;
      void notify(`morning-${cairoKey(now)}`, `نهاردك ${count}. الأولى ${clock(slots[0].start)}`);
    }
  }
  for (const slot of slots) {
    const start = slotMinutes(slot.start);
    if (minute >= start - lead && minute < start - lead + 3) {
      void notify(`${cairoKey(now)}-${slot.start}`, `بعد ${lead} دقايق\n${slot.subject}\n${clock(slot.start)} · ${slot.room || ""}`);
    }
  }
  myExams(saved).forEach((exam) => {
    if (exam.exam_date !== cairoKey(now) || !exam.start_time) return;
    const start = slotMinutes(exam.start_time);
    if (minute >= start - lead && minute < start - lead + 3) {
      void notify(`exam-${exam.exam_date}-${exam.start_time}`, `امتحان بعد ${lead} دقايق\n${exam.title || exam.subject}\n${clock(exam.start_time)}`);
    }
  });
}

const POSTER_FONT = "\"IBM Plex Sans Arabic\", \"Segoe UI\", sans-serif";

function posterLines(ctx, text, maxWidth, maxLines) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) return lines;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function loadPosterLogo() {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = "jadwali-logo.jpg";
  });
}

async function drawPoster(saved) {
  await document.fonts.ready;
  await document.fonts.load(`700 72px ${POSTER_FONT}`);
  const logo = await loadPosterLogo();
  const width = 2400;
  const rowH = 228;
  const headH = 250;
  const dayH = 74;
  const footH = 120;
  const height = headH + dayH + TIMES.length * rowH + footH;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const pad = 40;
  const timeW = 176;
  const tableW = width - pad * 2;
  const dayW = (tableW - timeW) / DAYS.length;
  const tableY = headH;
  const ink = "#f7f3ee";
  const muted = "#b7aea4";
  const gold = "#d4b08c";
  const line = "#5a4b3e";
  const cell = "#1a1613";

  ctx.fillStyle = "#100e0c";
  ctx.fillRect(0, 0, width, height);

  const logoSize = 108;
  const logoX = width - pad - logoSize;
  const logoY = 42;
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    ctx.restore();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }

  const textRight = logoX - 28;
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.fillStyle = "#f3e6d4";
  ctx.font = `700 78px ${POSTER_FONT}`;
  ctx.fillText("جدولي", textRight, 92);
  ctx.fillStyle = muted;
  ctx.font = `500 26px ${POSTER_FONT}`;
  ctx.fillText("الأكاديمية الحديثة بالمعادي", textRight, 134);
  ctx.fillText(`${saved.section.yearLabel} · ${saved.section.major} · ${saved.section.language}`, textRight, 174);
  ctx.fillStyle = ink;
  ctx.font = `700 34px ${POSTER_FONT}`;
  const group = saved.schedule.group ? `المجموعة ${saved.schedule.group}` : "";
  ctx.fillText(`فصل ${saved.schedule.classNumber}${group ? ` · ${group}` : ""}`, textRight, 220);

  ctx.strokeStyle = "#8a6a45";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, headH - 18);
  ctx.lineTo(width - pad, headH - 18);
  ctx.stroke();

  const tableH = dayH + TIMES.length * rowH;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(pad, tableY, tableW, tableH, 18);
  ctx.clip();
  ctx.fillStyle = cell;
  ctx.fillRect(pad, tableY, tableW, tableH);

  const dayX = (index) => pad + (DAYS.length - 1 - index) * dayW;
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.5;
  ctx.font = `700 26px ${POSTER_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  ctx.direction = "rtl";
  ctx.fillText("الوقت", pad + tableW - timeW / 2, tableY + dayH / 2);
  DAYS.forEach((day, index) => {
    ctx.fillText(day, dayX(index) + dayW / 2, tableY + dayH / 2);
  });
  ctx.beginPath();
  ctx.moveTo(pad, tableY + dayH);
  ctx.lineTo(pad + tableW, tableY + dayH);
  for (let row = 1; row < TIMES.length; row += 1) {
    const y = tableY + dayH + row * rowH;
    ctx.moveTo(pad, y);
    ctx.lineTo(pad + tableW, y);
  }
  ctx.moveTo(pad + tableW - timeW, tableY);
  ctx.lineTo(pad + tableW - timeW, tableY + tableH);
  for (let index = 1; index < DAYS.length; index += 1) {
    const x = pad + index * dayW;
    ctx.moveTo(x, tableY);
    ctx.lineTo(x, tableY + tableH);
  }
  ctx.stroke();

  TIMES.forEach((time, row) => {
    const y = tableY + dayH + row * rowH;
    ctx.fillStyle = ink;
    ctx.font = `600 24px ${POSTER_FONT}`;
    ctx.direction = "rtl";
    ctx.fillText(clock(time[0]), pad + tableW - timeW / 2, y + rowH / 2 - 18);
    ctx.fillText(clock(time[1]), pad + tableW - timeW / 2, y + rowH / 2 + 18);
    DAYS.forEach((day, index) => {
      const slot = saved.schedule.slots.find((item) => item.day === day && item.start === time[0]);
      if (!slot) return;
      const label = lectureOf(saved.schedule.slots, slot);
      const center = dayX(index) + dayW / 2;
      const maxWidth = dayW - 28;
      ctx.font = `700 24px ${POSTER_FONT}`;
      ctx.direction = "rtl";
      const subject = posterLines(ctx, slot.subject, maxWidth, 2);
      ctx.font = `400 18px ${POSTER_FONT}`;
      const teacher = posterLines(ctx, slot.instructor, maxWidth, 2);
      const scriptDir = (text) => (/[\u0600-\u06FF]/.test(text) ? "rtl" : "ltr");
      const pieces = [
        { text: label.ar, font: `400 18px ${POSTER_FONT}`, color: muted, dir: "rtl" },
        { text: label.en, font: `500 16px ${POSTER_FONT}`, color: "#ddd6ce", dir: "ltr" },
        ...subject.map((text) => ({ text, font: `700 24px ${POSTER_FONT}`, color: ink, dir: scriptDir(text) })),
        { text: clock(slot.start), font: `500 18px ${POSTER_FONT}`, color: "#ece7e1", dir: "rtl" },
        { text: clock(slot.end), font: `500 18px ${POSTER_FONT}`, color: "#ece7e1", dir: "rtl" },
        ...teacher.map((text) => ({ text, font: `400 17px ${POSTER_FONT}`, color: muted, dir: scriptDir(text) })),
      ];
      if (slot.room) {
        pieces.push({ text: "القاعة", font: `400 15px ${POSTER_FONT}`, color: muted, dir: "rtl" });
        pieces.push({ text: slot.room, font: `700 22px ${POSTER_FONT}`, color: ink, dir: scriptDir(slot.room) });
      }
      const gap = 24;
      const top = y + (rowH - pieces.length * gap) / 2 + 8;
      pieces.forEach((piece, pieceIndex) => {
        ctx.font = piece.font;
        ctx.fillStyle = piece.color;
        ctx.direction = piece.dir;
        ctx.fillText(piece.text, center, top + pieceIndex * gap);
      });
    });
  });
  ctx.restore();
  ctx.strokeStyle = "#8a6a45";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(pad, tableY, tableW, tableH, 18);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "rtl";
  ctx.fillStyle = gold;
  ctx.font = `700 32px ${POSTER_FONT}`;
  ctx.fillText("جدولي", width / 2, height - 62);
  ctx.fillStyle = muted;
  ctx.font = `400 20px ${POSTER_FONT}`;
  ctx.fillText("جدول المحاضرات الأسبوعي · الأكاديمية الحديثة بالمعادي", width / 2, height - 28);
  return canvas;
}

async function downloadTable(saved) {
  const canvas = await drawPoster(saved);
  canvas.toBlob(async (blob) => {
    const file = new File([blob], "jadwali.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "جدولي" }); return; } catch { /* cancelled */ }
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "jadwali.png";
    link.click();
  });
}

async function publicRows(config, path) {
  const rows = [];
  for (let from = 0; from < 8000; from += 1000) {
    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Range: `${from}-${from + 999}`,
      },
      cache: "no-store",
    });
    if (response.headers.get("x-jadwali-cache") === "hit") DATA_STALE = true;
    if (response.status === 416) break;
    if (!response.ok) throw new Error("تعذر تحديث البيانات");
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}
async function loadPublishedTimetable(config, ignoreBundle) {
  const [sectionRows, classRows, lectureRows] = await Promise.all([
    publicRows(config, "sections?select=*&order=sort.asc"),
    publicRows(config, "classes?select=*"),
    publicRows(config, "lectures?select=*"),
  ]);
  if (!ignoreBundle && !sectionRows.length && !classRows.length) return;
  const sections = ignoreBundle ? [] : SECTIONS.map((item) => ({ ...item }));
  sectionRows.forEach((item) => {
    const next = {
      id: item.id,
      title: item.title,
      major: item.major,
      language: item.language,
      year: String(item.year),
      yearLabel: item.year_label,
    };
    const index = sections.findIndex((section) => section.id === next.id);
    if (index >= 0) sections[index] = { ...sections[index], ...next };
    else sections.push(next);
  });
  const classes = ignoreBundle ? [] : CLASSES.map((item) => ({ ...item, slots: [...(item.slots || [])] }));
  classRows.forEach((item) => {
    const slots = lectureRows.filter((lecture) => lecture.class_id === item.id).map((lecture) => {
      const status = lecture.status || "active";
      const moved = status === "moved" && lecture.moved_day && lecture.moved_start;
      const start = moved ? lecture.moved_start : lecture.start_time;
      const end = moved ? (TIMES.find((row) => row[0] === lecture.moved_start)?.[1] || lecture.end_time) : lecture.end_time;
      return {
        day: moved ? lecture.moved_day : lecture.day,
        start,
        end,
        subject: lecture.subject,
        instructor: lecture.instructor || "",
        room: lecture.room || "",
        status,
        note: lecture.note || "",
        was: moved ? `${lecture.day} ${lecture.start_time}` : "",
      };
    });
    const classNumber = String(item.class_number);
    const existing = classes.find((row) => row.sectionId === item.section_id && String(row.classNumber) === classNumber);
    if (existing) {
      if (ignoreBundle || slots.length) existing.slots = slots;
      if (item.group_name) existing.group = item.group_name;
      if (item.revised_at) existing.revisedAt = item.revised_at;
    } else {
      classes.push({ sectionId: item.section_id, classNumber, group: item.group_name || "", slots, revisedAt: item.revised_at || "" });
    }
  });
  SECTIONS = sections;
  CLASSES = classes;
}
async function loadPublicExtras(config) {
  const previousNews = ANNOUNCEMENTS;
  const previousExams = EXAMS;
  const previousGroups = GROUPS;
  const previousHolidays = EXTRA_HOLIDAYS;
  try {
    ANNOUNCEMENTS = await publicRows(config, "announcements?select=id,created_at,title,body,image_url,link_label,link_url,audience,section_id,class_number&published=eq.true&order=created_at.desc&limit=30");
    if (!ANNOUNCEMENTS.length) ANNOUNCEMENTS = await publicRows(config, "announcements?select=title,body,image_url,link_label,link_url&published=eq.true&order=created_at.desc&limit=12");
    if (!ANNOUNCEMENTS.length) ANNOUNCEMENTS = await publicRows(config, "announcements?select=title,body&published=eq.true&order=created_at.desc&limit=12");
    EXAMS = await publicRows(config, "exams?select=title,subject,exam_date,start_time,end_time,room,notes,section_id,class_number&order=exam_date");
    GROUPS = await publicRows(config, "class_groups?select=section_id,class_number,label,url");
    const holidays = await publicRows(config, "holidays?select=holiday_date,name&order=holiday_date");
    EXTRA_HOLIDAYS = holidays.map((item) => ({ date: item.holiday_date, name: item.name })).filter((item) => item.date && item.name);
  } catch {
    ANNOUNCEMENTS = previousNews;
    EXAMS = previousExams;
    GROUPS = previousGroups;
    EXTRA_HOLIDAYS = previousHolidays;
  }
}

function drawSyncNote() {
  const node = document.getElementById("sync-note");
  if (!node) return;
  if (DATA_STALE || !navigator.onLine) {
    const when = LAST_SYNC ? new Date(LAST_SYNC).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", weekday: "long", hour: "numeric", minute: "2-digit" }) : "";
    node.textContent = when ? `مفيش اتصال دلوقتي. بتشوف آخر نسخة اتحدّثت ${when}.` : "مفيش اتصال دلوقتي. بتشوف آخر نسخة محفوظة.";
    node.hidden = false;
  } else {
    node.hidden = true;
  }
}
async function loadPublicSettings() {
  const config = window.JADWALI_SUPABASE;
  if (!config) return;
  DATA_STALE = false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${config.url}/rest/v1/settings?id=eq.public&select=*`, {
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return;
    if (response.headers.get("x-jadwali-cache") === "hit") DATA_STALE = true;
    const row = (await response.json())[0];
    if (!row) return;
    if (row.updated_at) SITE_REV = row.updated_at;
    if (row.academic_year) {
      YEAR = row.academic_year;
      const yearNode = document.getElementById("academic-year");
      if (yearNode) yearNode.textContent = row.academic_year;
    }
    if (row.term) {
      TERM = row.term;
      const termNode = document.getElementById("site-term");
      if (termNode) termNode.textContent = row.term;
    }
    if (row.last_review) {
      LAST_REVIEW = row.last_review;
      const review = document.getElementById("last-review");
      if (review) review.textContent = row.last_review;
    }
    if (row.about_lead) ABOUT.lead = row.about_lead;
    if (row.about_why) ABOUT.why = row.about_why;
    ASSISTANT_KB = parseKb(row.assistant_kb || "");
    if (row.programmer_name) ABOUT.name = row.programmer_name;
    if (row.whatsapp) WHATSAPP = row.whatsapp;
    if (row.portfolio) PORTFOLIO = row.portfolio;
    if (row.lead_minutes) DEFAULT_LEAD = Number(row.lead_minutes) || DEFAULT_LEAD;
    EXAM_MODE = !!row.exam_mode;
    await loadPublishedTimetable(config, !!row.ignore_bundle);
    await loadPublicExtras(config);
    if (!DATA_STALE) {
      LAST_SYNC = Date.now();
      localStorage.setItem("jadwali-last-sync", String(LAST_SYNC));
    }
  } catch {
    /* الإعدادات الحالية تفضل ظاهرة لو القاعدة لسه مش جاهزة */
  } finally {
    clearTimeout(timer);
    drawSyncNote();
  }
}

function liveStamp() {
  return JSON.stringify([YEAR, TERM, EXAM_MODE, LAST_REVIEW, DEFAULT_LEAD, ABOUT, WHATSAPP, PORTFOLIO, SECTIONS, CLASSES, ANNOUNCEMENTS, EXAMS, GROUPS, EXTRA_HOLIDAYS]);
}
let refreshing = false;
let refreshQueued = false;
let liveChannel = null;
const LIVE_TABLES = ["settings", "sections", "classes", "lectures", "exams", "announcements", "holidays", "class_groups"];
async function peekRevision() {
  const config = window.JADWALI_SUPABASE;
  if (!config?.url || !config?.key) return "";
  const response = await fetch(`${config.url}/rest/v1/settings?id=eq.public&select=updated_at`, {
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
    cache: "no-store",
  });
  if (!response.ok) return "";
  const row = (await response.json())[0];
  return row?.updated_at || "";
}
async function refreshQuiet(force) {
  if (!navigator.onLine || document.visibilityState === "hidden") return;
  if (refreshing) {
    refreshQueued = true;
    return;
  }
  refreshing = true;
  try {
    if (!force) {
      const revision = await peekRevision();
      if (!revision || revision === SITE_REV) return;
    }
    const before = liveStamp();
    await loadPublicSettings();
    const busy = document.activeElement && document.activeElement.closest("input, textarea, select");
    if (!busy && liveStamp() !== before) render(true);
  } catch {
    /* النسخة الظاهرة تفضل لحد ما الشبكة ترجع */
  } finally {
    refreshing = false;
    if (refreshQueued) {
      refreshQueued = false;
      refreshQuiet(true);
    }
  }
}
function scheduleLive() {
  clearTimeout(scheduleLive.timer);
  scheduleLive.timer = setTimeout(() => refreshQuiet(true), 600);
}
function connectRealtime() {
  const config = window.JADWALI_SUPABASE;
  if (!config?.url || !window.supabase || liveChannel || document.visibilityState === "hidden") return;
  if (!connectRealtime.client) {
    connectRealtime.client = window.supabase.createClient(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  let channel = connectRealtime.client.channel("jadwali-student");
  LIVE_TABLES.forEach((table) => {
    channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, () => scheduleLive());
  });
  liveChannel = channel.subscribe();
}
function disconnectRealtime() {
  const client = connectRealtime.client;
  if (client && liveChannel) client.removeChannel(liveChannel);
  liveChannel = null;
}
function ensureRealtime() {
  if (window.supabase) {
    connectRealtime();
    return;
  }
  if (ensureRealtime.loading) return;
  ensureRealtime.loading = true;
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/dist/umd/supabase.js";
  script.onload = () => connectRealtime();
  script.onerror = () => { ensureRealtime.loading = false; };
  document.head.appendChild(script);
}
async function trackVisit() {
  const config = window.JADWALI_SUPABASE;
  if (!config?.url || !config?.key) return;
  const key = `jadwali-visit-${cairoKey(new Date())}`;
  if (localStorage.getItem(key) === "1") return;
  localStorage.setItem(key, "1");
  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/track_visit`, {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (!response.ok) localStorage.removeItem(key);
  } catch {
    localStorage.removeItem(key);
  }
}
async function boot() {
  await loadPublicSettings();
  trackVisit();
  trackClassVisit();
  readRoute();
  render();
  void upgradePush();
  setTimeout(() => {
    const splash = document.getElementById("splash");
    splash.classList.add("hide");
    setTimeout(() => { splash.style.display = "none"; }, 280);
  }, 700);
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
  setInterval(() => {
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
      if (sig !== lastSig && !document.activeElement?.closest("input, textarea")) render();
    }
    checkAlerts();
  }, 1000);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(() => flushPendingCalendar()).catch(() => {});
  }
}
window.addEventListener("hashchange", () => {
  if (routing) return;
  readRoute();
  document.getElementById("drawer").hidden = true;
  render();
});
window.addEventListener("online", async () => {
  await loadPublicSettings();
  render();
});
window.addEventListener("offline", drawSyncNote);
window.addEventListener("appinstalled", () => trackEvent("install"));
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installEvent = event;
  if (ui.view === "day") render();
});
boot();
