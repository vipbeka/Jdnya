// الأساس: البيانات، الحالة، أدوات الوقت (توقيت القاهرة)، والبحث الذكي.
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
  mode: window.innerWidth < 720 ? "list" : "grid",
  filter: "",
  dayFilter: "",
  demoDay: null,
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
  // كل وقت معزول لوحده عشان «ص/م» ما تلخبطش اتجاه النص
  return `<span class="range"><span dir="ltr">${esc(clock(start))}</span> – <span dir="ltr">${esc(clock(end))}</span></span>`;
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
  let hash = 0;
  for (const char of String(subject || "")) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return `var(--sub-${(hash % 8) + 1})`;
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
