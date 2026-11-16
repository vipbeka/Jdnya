// لوحة الإدارة — محرك فهم الجداول.
// دوال صافية (من غير DOM ولا شبكة): بتاخد صفوف نص بأي ترتيب أو شكل، وبترجّع محاضرات/امتحانات بصيغة جدولي.
// بتتجرّب من Node بـ tools/test-parser.mjs.

// ---------- تنظيف النص ----------
const ARABIC_RUN = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]+/g;
const PARSER_WORDS = ["محاضرة", "امتحان", "مادة", "قاعة", "مدرج", "إدارة", "ادارة", "السبت", "الأحد", "الاحد", "الإثنين", "الاثنين", "الثلاثاء", "الأربعاء", "الاربعاء", "الخميس", "دكتور", "الفصل", "شعبة", "أعمال", "مبادئ", "محاسبة", "تسويق", "اقتصاد", "قانون", "نهائي", "ميدتيرم", "معمل", "سكشن", "اليوم", "الوقت", "رياضة", "لغة", "نظم", "معلومات"];

// مفتاح للمقارنة فقط: بيوحّد الهمزات والتاء المربوطة. النص المعروض بيفضل بإملائه الصح.
function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[یى]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function latin(value) {
  return String(value || "").replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit)).replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
}
// تنظيف نص معروض: شكل موحّد للحروف، من غير تشكيل ولا تطويل ولا رموز غريبة ولا مسافات زيادة.
function cleanText(value) {
  return latin(String(value ?? "").normalize("NFKC"))
    .replace(/[​-‏‪-‮⁦-⁩﻿]/g, "")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[|¦•·▪■□●○◦★☆✓✔✗✘~^`_=<>{}\[\]\\]+/g, " ")
    .replace(/[“”«»"]+/g, "")
    .replace(/\)([^()]*)\(/g, "($1)") // أقواس معكوسة من استخراج الـ PDF
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+([.,،:;])/g, "$1")
    .replace(/[ \t ]+/g, " ")
    .replace(/^[\s\-–—.,،:;/]+|[\s\-–—,،:;/]+$/g, "")
    .trim();
}
function reverseArabicRuns(value) {
  return String(value || "").replace(ARABIC_RUN, (run) => [...run].reverse().join(""));
}
// كل ما الرقم أعلى، النص أقرب للعربي المكتوب صح (مش معكوس).
function arabicScore(value) {
  const text = String(value || "");
  let score = PARSER_WORDS.reduce((total, word) => total + (text.includes(word) ? 3 : 0), 0);
  for (const word of text.match(ARABIC_RUN) || []) {
    if (word.length < 3) continue;
    if (/^ال/.test(word)) score += 2;
    if (/[ةى]$/.test(word)) score += 2;
    // التاء المربوطة والألف المقصورة عمرهم ما ييجوا في أول الكلمة، و«لا» في آخرها علامة على «ال» معكوسة
    if (/^[ةى]/.test(word)) score -= 3;
    if (/لا$/.test(word) && word.length > 3) score -= 2;
  }
  return score;
}
// ملفات PDF كتير بتطلّع العربي معكوس الحروف أو معكوس ترتيب الكلمات. بنجرّب الاحتمالات وناخد الأقرب للعربي الصح.
function normalizeVisualLine(value) {
  const visual = String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim();
  if (!/[؀-ۿ]/.test(visual)) return visual;
  const reversedRuns = reverseArabicRuns(visual);
  const reversedWords = visual.split(" ").reverse().join(" ");
  // عند التعادل: النص زي ما هو، وبعده المعكوس بالكامل (حروف وترتيب كلمات) لأنه الأشهر في ملفات PDF
  const options = [visual, reverseArabicRuns(reversedWords), reversedRuns, reversedWords];
  const scores = options.map(arabicScore);
  let best = 0;
  scores.forEach((score, index) => { if (score > scores[best]) best = index; });
  return options[best];
}

// ---------- الأيام ----------
const DAY_KEYS = [
  ["السبت", ["السبت", "سبت", "saturday", "sat"]],
  ["الأحد", ["الاحد", "احد", "الحد", "حد", "sunday", "sun"]],
  ["الإثنين", ["الاثنين", "اثنين", "الاتنين", "اتنين", "monday", "mon"]],
  ["الثلاثاء", ["الثلاثاء", "ثلاثاء", "الثلاثا", "الثلاث", "التلات", "تلات", "tuesday", "tues", "tue"]],
  ["الأربعاء", ["الاربعاء", "اربعاء", "الاربعا", "الاربع", "اربع", "wednesday", "wed"]],
  ["الخميس", ["الخميس", "خميس", "thursday", "thurs", "thur", "thu"]],
];
function dayFrom(value) {
  const text = normalizeHeader(value);
  if (!text) return "";
  const words = text.split(/[^a-z؀-ۿ]+/).filter(Boolean);
  const compact = text.replace(/\s/g, "");
  for (const [day, keys] of DAY_KEYS) {
    for (const key of keys) {
      // الصيغ القصيرة لازم تبقى كلمة لوحدها عشان «حد» ما تتلقطش من جوه «محمد»
      if (key.length <= 4 ? words.includes(key) : compact.includes(key)) return day;
    }
  }
  return "";
}
function findDay(value) {
  return dayFrom(value) || dayFrom(reverseArabicRuns(value));
}
function normalizeDay(value) {
  return findDay(value);
}
const DAY_WORDS = /السبت|الاحد|الحد|الاثنين|الاتنين|اثنين|اتنين|الثلاثاء|ثلاثاء|الثلاثا|التلات|تلات|الاربعاء|اربعاء|الاربعا|الخميس|خميس|سبت|احد|saturday|sunday|monday|tuesday|wednesday|thursday|thurs|tues|sat|sun|mon|tue|wed|thur|thu/g;
// خانة «يوم»: فيها اسم يوم ومفيش معاها كلام تاني يذكر.
function dayHeader(value) {
  const day = findDay(value);
  if (!day) return "";
  const forward = normalizeHeader(value).replace(DAY_WORDS, "").replace(/يوم|day|[\s\d:.\-/]/g, "");
  const backward = normalizeHeader(reverseArabicRuns(value)).replace(DAY_WORDS, "").replace(/يوم|day|[\s\d:.\-/]/g, "");
  return Math.min(forward.length, backward.length) <= 3 ? day : "";
}

// ---------- المواعيد ----------
// جدولي بيخزّن الوقت HH:MM بنظام 12 ساعة من غير ص/م: من 08 لـ 12 صباحًا، ومن 01 لـ 07 بعد الظهر.
const CLOCK = /(\d{1,2})\s*[:.٫]\s*(\d{2})(?!\d)\s*(a\.?m\.?|p\.?m\.?|صباحا|مساء|ص|م)?/gi;
const HOUR_ONLY = /(?:^|[^\d:.])(\d{1,2})\s*(a\.?m\.?|p\.?m\.?|صباحا|مساء|ص|م)(?![؀-ۿa-z])/gi;
function clockValue(hourText, minuteText) {
  let hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute > 59 || hour > 23) return "";
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
function allTimes(value) {
  const text = normalizeHeader(latin(value));
  const found = [];
  for (const match of text.matchAll(CLOCK)) {
    const time = clockValue(match[1], match[2]);
    if (time) found.push({ at: match.index, time });
  }
  if (!found.length) {
    for (const match of text.matchAll(HOUR_ONLY)) {
      const time = clockValue(match[1], "00");
      if (time) found.push({ at: match.index, time });
    }
  }
  if (!found.length) {
    // صيغة ملزوقة زي 0830-0940
    for (const match of text.matchAll(/(?:^|\D)([01]\d|2[0-3])([0-5]\d)(?=\D|$)/g)) {
      const time = clockValue(match[1], match[2]);
      if (time && Number(match[1]) >= 7 && Number(match[1]) <= 21) found.push({ at: match.index, time });
    }
    if (found.length < 2) found.length = 0;
  }
  return found.sort((a, b) => a.at - b.at).map((item) => item.time);
}
function cleanTime(value) {
  return allTimes(value)[0] || "";
}
function timeMinutes(time) {
  const [hour, minute] = String(time || "").split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return NaN;
  return (hour <= 7 ? hour + 12 : hour) * 60 + minute;
}
function minutesToTime(total) {
  const hour24 = Math.floor(total / 60) % 24;
  return clockValue(hour24, total % 60);
}
function defaultEnd(start) {
  if (!start) return "";
  if (TIME_END[start]) return TIME_END[start];
  const minutes = timeMinutes(start);
  return Number.isFinite(minutes) ? minutesToTime(minutes + 70) : "";
}
const ORDINAL_KEYS = [["اولي", 1], ["اول", 1], ["ثانيه", 2], ["ثاني", 2], ["تانيه", 2], ["ثالثه", 3], ["ثالث", 3], ["تالته", 3], ["رابعه", 4], ["رابع", 4], ["خامسه", 5], ["خامس", 5], ["سادسه", 6], ["سادس", 6], ["سابعه", 7], ["سابع", 7], ["ثامنه", 8], ["ثامن", 8], ["first", 1], ["second", 2], ["third", 3], ["fourth", 4], ["fifth", 5], ["sixth", 6], ["seventh", 7], ["eighth", 8]];
// رقم الفترة: «المحاضرة الثالثة»، «Period 3»، «الفترة 2»، «3rd»، أو رقم لوحده من 1 لـ 8.
function periodIndex(value) {
  const text = normalizeHeader(latin(value));
  if (!text || allTimes(text).length) return 0;
  const labelled = /محاضره|فتره|حصه|period|lecture|slot|lect/.test(text);
  for (const [key, number] of ORDINAL_KEYS) {
    if (new RegExp(`(^|[^a-z؀-ۿ])ال?${key}($|[^a-z؀-ۿ])`).test(text) && (labelled || text.replace(/\s/g, "").length <= key.length + 3)) return number;
  }
  const digits = text.match(/^(?:محاضره|فتره|حصه|period|lecture|slot|lect|p)?\s*#?\s*([1-8])\s*(?:st|nd|rd|th)?$/);
  return digits ? Number(digits[1]) : 0;
}
function timeRange(value) {
  const times = allTimes(value);
  if (!times.length) return { start: "", end: "" };
  // في الجداول العربي المدى بيتكتب أحيانًا معكوس بصريًا «9:40 - 8:30»، فالأصغر هو البداية
  if (times[1] && timeMinutes(times[1]) < timeMinutes(times[0])) return { start: times[1], end: times[0] };
  return { start: times[0], end: times[1] || defaultEnd(times[0]) };
}
// زي timeRange لكن بيقبل كمان رقم الفترة (للعناوين بس).
function axisRange(value) {
  const range = timeRange(value);
  // عنوان فيه وقت واحد بس وهو نهاية فترة معروفة (القارئ فوّت البداية): بنكمّل الفترة من جدول المواعيد الرسمي
  if (range.start && allTimes(value).length === 1 && !TIMES.includes(range.start)) {
    const known = TIMES.find((time) => TIME_END[time] === range.start);
    if (known) return { start: known, end: range.start };
  }
  if (range.start) return range;
  const period = periodIndex(value);
  if (period && TIMES[period - 1]) return { start: TIMES[period - 1], end: TIME_END[TIMES[period - 1]] || "", period: true };
  return { start: "", end: "" };
}

// ---------- الفصل، التاريخ، القاعة، المحاضر، النوع ----------
function findClass(value) {
  const match = normalizeHeader(latin(value)).match(/(?:فصل|مجموعه|class|group|grp|gr)\s*(?:رقم|no\.?|number)?\s*[:#.\-(]?\s*(\d{1,3})(?!\d)/i);
  return match ? String(Number(match[1])) : "";
}
function findDate(value) {
  const text = normalizeHeader(latin(value));
  const iso = (year, month, day) => (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31 ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "");
  let match = text.match(/(20\d{2})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*(\d{1,2})/);
  if (match) return iso(match[1], match[2], match[3]);
  match = text.match(/(\d{1,2})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*(20\d{2})/);
  if (match) return iso(match[3], match[2], match[1]);
  const months = { يناير: 1, فبراير: 2, مارس: 3, ابريل: 4, مايو: 5, يونيو: 6, يونيه: 6, يوليو: 7, يوليه: 7, اغسطس: 8, سبتمبر: 9, اكتوبر: 10, نوفمبر: 11, ديسمبر: 12, january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12, jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const named = Object.keys(months).find((name) => new RegExp(`(^|[^a-z؀-ۿ])${name}($|[^a-z؀-ۿ])`).test(text));
  if (!named) return "";
  const day = text.replace(/20\d{2}/, " ").replace(CLOCK, " ").match(/(\d{1,2})/);
  const year = text.match(/20\d{2}/);
  if (!day) return "";
  return iso(year ? year[0] : String(new Date().getFullYear()), months[named], day[1]);
}
const ROOM_CODE = /(?:^|[^a-z0-9])(lect(?:ure)?\s*(?:hall)?\s*\d{1,3}|lab\s*\d{1,3}|gr\s*\d{1,3}|hall\s*\d{1,3}|room\s*\d{1,3}|[rhlb]\s?\d{1,3}[a-z]?)(?![a-z0-9])/i;
function roomCode(value) {
  const match = latin(String(value || "")).match(ROOM_CODE);
  if (!match) return "";
  return match[1].replace(/\s+/g, " ").trim()
    .replace(/^lect(?:ure)?\s*(?:hall)?\s*/i, "Lect ")
    .replace(/^lab\s*/i, "Lab ")
    .replace(/^gr\s*/i, "Gr ")
    .replace(/^hall\s*/i, "Hall ")
    .replace(/^room\s*/i, "R")
    .replace(/^([rhlb])\s?(\d)/i, (_, letter, digit) => letter.toUpperCase() + digit);
}
function findRoom(value) {
  const text = latin(String(value || ""));
  const worded = text.match(/(?:قاع(?:ة|ه)|مدرج|معمل|ورش(?:ة|ه)|القاعة|المدرج|المعمل)\s*(?:رقم)?\s*[:#.\-(]?\s*([A-Za-z0-9؀-ۿ-]{1,14})/);
  if (worded) {
    const head = /مدرج/.test(worded[0]) ? "مدرج" : /معمل/.test(worded[0]) ? "معمل" : /ورش/.test(worded[0]) ? "ورشة" : "قاعة";
    return /^[؀-ۿ]/.test(worded[1]) || /^\d+$/.test(worded[1]) ? `${head} ${worded[1]}` : worded[1];
  }
  return roomCode(text);
}
const TITLE = /^(?:ا\.?\s?م\.?\s?د|أ\.?\s?م\.?\s?د|ا\.?\s?د|أ\.?\s?د|م\.?\s?م|د|م|أ|ا)\s*[\/.]\s*\S|^(?:dr|prof|eng|mr|mrs|ms|ta)\b\.?\s*\S/i;
function isInstructor(value) {
  const text = String(value || "").trim();
  return TITLE.test(text) || /دكتور|دكتوره|الدكتور|مهندس|استاذ|أستاذ|معيد|مدرس/.test(normalizeHeader(text));
}
function tidyInstructor(value) {
  return cleanText(value)
    // «م/» اللي قارئ الصور قراها «م أ»
    .replace(/^(د|م)\s+[أا|]\s+(?=\S)/, "$1/ ")
    .replace(/^(ا\.?\s?م\.?\s?د|أ\.?\s?م\.?\s?د|ا\.?\s?د|أ\.?\s?د|م\.?\s?م|د|م|أ|ا)\s*[\/.]\s*/, (_, title) => `${title.replace(/\s/g, "")}/ `);
}
const TYPE_KEYS = [
  ["معمل", /معمل|عملي|lab(?:oratory)?\b|practical/],
  ["سكشن", /سكشن|سيكشن|تمارين|تمرين|section\b|sec\b|tutorial|tut\b/],
  ["محاضرة", /محاضره|نظري|lecture\b|theory/],
];
// نوع الحصة من الكلمات الصريحة، وبعدها من القاعة أو لقب المحاضر لو مفيش كلمة صريحة.
function detectType(slot) {
  const text = normalizeHeader(`${slot.type || ""} ${slot.subject || ""} ${slot.notes || ""}`);
  for (const [type, pattern] of TYPE_KEYS) if (pattern.test(text)) return type;
  const room = normalizeHeader(slot.room || "");
  if (/^lab|معمل/.test(room)) return "معمل";
  if (/^lect|مدرج/.test(room)) return "محاضرة";
  if (/^(?:م\.?\s?م|م)\s*[\/.]|^(?:eng|ta)\b/i.test(String(slot.instructor || "").trim())) return "سكشن";
  return "محاضرة";
}
// بيشيل كلمة النوع من اسم المادة: «رياضة (سكشن)» ← «رياضة».
function stripType(subject) {
  return String(subject || "")
    .replace(/[()\[\]-]?\s*(?:سكشن|سيكشن|معمل|عملي|نظري|محاضرة|محاضره|section|lecture|practical|tutorial)\s*[()\[\]]?\s*$/i, "")
    .replace(/^(?:سكشن|سيكشن|معمل|محاضرة|محاضره|section|lecture|practical|tutorial)\s*[:\-–]\s*/i, "")
    .trim();
}
function stripMeta(value) {
  return latin(String(value || ""))
    .replace(/(?:فصل|مجموعة|مجموعه|class|group)\s*(?:رقم)?\s*[:#.\-]?\s*\d{1,3}/ig, " ")
    .replace(/(?:قاع(?:ة|ه)|مدرج|معمل|القاعة|المدرج|hall|room)\s*(?:رقم)?\s*[:#.\-]?\s*[A-Za-z0-9؀-ۿ-]{1,14}/ig, " ")
    .replace(/20\d{2}\s*[-\/.]\s*\d{1,2}\s*[-\/.]\s*\d{1,2}/g, " ")
    .replace(/\d{1,2}\s*[-\/.]\s*\d{1,2}\s*[-\/.]\s*20\d{2}/g, " ")
    .replace(/\d{1,2}\s*[:.٫]\s*\d{2}\s*(?:a\.?m\.?|p\.?m\.?|صباحا|صباحًا|مساء|مساءً|ص|م)?(?![؀-ۿa-z])/gi, " ")
    .replace(/يوم\s+|السبت|الأحد|الاحد|الإثنين|الاثنين|الاتنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|\b(?:saturday|sunday|monday|tuesday|wednesday|thursday)\b/gi, " ")
    .replace(/(^|\s)(?:إلى|الى|من|to|from)(?=\s|$)/gi, " ")
    .replace(/[–—]|->/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function cleanSubject(value) {
  return cleanText(stripMeta(value).replace(new RegExp(ROOM_CODE.source, "ig"), " "));
}
function lineOf(row) {
  return (Array.isArray(row) ? row : [row]).map((cell) => String(cell ?? "").replace(/\s+/g, " ").trim()).filter(Boolean).join(" ");
}

// ---------- تفكيك خانة فيها أكتر من سطر ----------
// خانة الجدول غالبًا: مادة / دكتور / قاعة، بأي ترتيب وبأي فاصل.
function splitCell(value) {
  const lines = String(value || "").split(/\n+|\s+\/\s+|\s+\|\s+|،|\s{3,}|\s+-\s+/).map((line) => line.trim()).filter(Boolean);
  const out = { subject: "", instructor: "", room: "", type: "" };
  const rest = [];
  lines.forEach((line) => {
    const room = findRoom(line);
    const typeOnly = TYPE_KEYS.find(([, pattern]) => pattern.test(normalizeHeader(line)) && normalizeHeader(line).replace(/[()\s]/g, "").length <= 9);
    if (isInstructor(line) && !out.instructor) out.instructor = tidyInstructor(line);
    else if (room && cleanText(line.replace(/قاع(?:ة|ه)|مدرج|معمل|القاعة|المدرج|hall|room/gi, "")).length <= room.length + 4 && !out.room) out.room = room;
    else if (typeOnly && !out.type) out.type = typeOnly[0];
    else rest.push(line);
  });
  out.subject = rest.shift() || "";
  rest.forEach((line) => {
    if (!out.instructor && /^[؀-ۿ\s.]+$/.test(line) && line.trim().split(/\s+/).length >= 2 && out.subject) out.instructor = cleanText(line);
    else if (!out.room && line.length <= 14) out.room = cleanText(line);
    else out.subject = `${out.subject} ${line}`;
  });
  if (!out.room) out.room = findRoom(value);
  return out;
}

// ---------- عناوين الأعمدة ----------
const HEADER_KEYS = [
  ["day", ["اليوم", "يوم", "day", "days"]],
  ["start", ["من", "البدايه", "وقت البدايه", "بدايه", "start", "from", "start time", "بدء"]],
  ["end", ["الي", "النهايه", "وقت النهايه", "نهايه", "end", "to", "end time", "حتي"]],
  ["time", ["الوقت", "الموعد", "الميعاد", "التوقيت", "الساعه", "الزمن", "time", "timing", "hour", "الفتره", "period"]],
  ["subject", ["الماده", "ماده", "المقرر", "مقرر", "اسم الماده", "اسم المقرر", "subject", "course", "course name", "module", "الماده الدراسيه"]],
  ["code", ["الكود", "كود", "كود الماده", "كود المقرر", "code", "course code"]],
  ["instructor", ["الدكتور", "الدكتوره", "دكتور", "المحاضر", "محاضر", "الاستاذ", "عضو هيئه التدريس", "القائم بالتدريس", "المعيد", "instructor", "lecturer", "doctor", "teacher", "staff", "professor", "dr"]],
  ["room", ["القاعه", "قاعه", "المدرج", "مدرج", "المكان", "مكان", "المعمل", "room", "hall", "location", "place", "venue"]],
  ["type", ["النوع", "نوع", "type", "kind", "نوع المحاضره"]],
  ["classNumber", ["الفصل", "فصل", "رقم الفصل", "المجموعه", "مجموعه", "class", "group", "section", "الشعبه"]],
  ["date", ["التاريخ", "تاريخ", "date", "يوم الامتحان", "تاريخ الامتحان"]],
  ["notes", ["ملاحظه", "ملاحظات", "notes", "note", "remarks"]],
  ["title", ["العنوان", "title", "الامتحان", "exam"]],
];
function headerKey(value) {
  const text = normalizeHeader(value).replace(/[:：*#()]/g, "").trim();
  if (!text || text.length > 26) return "";
  for (const [key, names] of HEADER_KEYS) if (names.includes(text)) return key;
  for (const [key, names] of HEADER_KEYS) {
    if (names.some((name) => name.length >= 4 && text.includes(name))) return key;
  }
  return "";
}
// نسخة قديمة من الخريطة لسه مستخدمة في بعض القرّاء
const HEADER_MAP = new Proxy({}, { get: (_, name) => headerKey(name) || undefined });

// ---------- الاستراتيجيات ----------
function gridOf(rows) {
  return (rows || []).map((row) => (Array.isArray(row) ? row : [row]).map((cell) => String(cell ?? "").trim()));
}
function emptyCell(value) {
  return !value || /^[-–—.·xX×\s]+$/.test(value);
}
function slotFromCell(raw, base) {
  const bits = splitCell(raw);
  const subject = cleanSubject(bits.subject) || cleanText(bits.subject);
  if (!subject || dayHeader(subject)) return null;
  return { ...base, subject, instructor: bits.instructor, room: bits.room, type: bits.type, classNumber: base.classNumber || findClass(raw) };
}

// (أ) شبكة: الأيام أعمدة والمواعيد صفوف.
function parseDayColumns(rows) {
  const grid = gridOf(rows);
  const headerIndex = grid.findIndex((row) => row.filter((cell) => dayHeader(cell)).length >= 2);
  if (headerIndex < 0) return [];
  const dayCols = grid[headerIndex].map((cell, index) => ({ index, day: dayHeader(cell) })).filter((item) => item.day);
  const slots = [];
  let classNumber = "";
  let period = 0;
  let last = null;
  grid.forEach((row, index) => {
    const line = lineOf(row);
    const foundClass = findClass(line);
    if (foundClass && line.length < 40) classNumber = foundClass;
    if (index <= headerIndex) return;
    const others = row.filter((_, column) => !dayCols.some((item) => item.index === column));
    let range = others.map(axisRange).find((item) => item.start);
    if (!range && others.every(emptyCell) && row.some((cell) => !emptyCell(cell)) && last) range = last; // تكملة خانة مدموجة
    if (!range) {
      // مفيش عمود وقت: بنمشي بترتيب الفترات المعروف
      if (!row.some((cell, column) => dayCols.some((item) => item.index === column) && !emptyCell(cell))) return;
      range = TIMES[period] ? { start: TIMES[period], end: TIME_END[TIMES[period]] || "", guessed: true } : { start: "", end: "", guessed: true };
      period += 1;
    }
    last = range;
    dayCols.forEach(({ index: column, day }) => {
      const raw = row[column] || "";
      if (emptyCell(raw)) return;
      const slot = slotFromCell(raw, { day, start: range.start, end: range.end, classNumber, guessed: range.guessed || range.period });
      if (slot) slots.push(slot);
    });
  });
  return slots;
}

// (ب) شبكة: الأيام صفوف والمواعيد أعمدة، مع خانات يوم مدموجة وسطور متعددة لكل يوم.
function parseDayRows(rows, spans) {
  const grid = gridOf(rows);
  if (!grid.length) return [];
  const width = Math.max(...grid.map((row) => row.length));
  let dayColumn = -1;
  let dayScore = 0;
  for (let column = 0; column < width; column += 1) {
    const score = new Set(grid.map((row) => dayHeader(row[column] || "")).filter(Boolean)).size;
    if (score > dayScore) { dayScore = score; dayColumn = column; }
  }
  if (dayScore < 2) return [];
  let header = -1;
  let headerScore = 0;
  grid.forEach((row, index) => {
    const score = row.filter((cell, column) => column !== dayColumn && axisRange(cell).start).length;
    if (score > headerScore) { headerScore = score; header = index; }
  });
  const firstDay = grid.findIndex((row) => dayHeader(row[dayColumn] || ""));
  const columns = [];
  for (let column = 0; column < width; column += 1) if (column !== dayColumn) columns.push(column);
  const times = new Map();
  let guessed = false;
  if (headerScore >= 2 && header < firstDay) {
    columns.forEach((column) => times.set(column, axisRange(grid[header][column] || "")));
  } else {
    // جدول ليه عناوين أعمدة (مادة، دكتور، قاعة…) يبقى قائمة مش شبكة
    if (grid.some((row) => new Set(row.map(headerKey).filter((key) => key && key !== "day")).size >= 2)) return [];
    // مفيش صف مواعيد: الأعمدة بترتيب الفترات بداية من ناحية عمود اليوم
    guessed = true;
    header = -1;
    const used = columns.filter((column) => grid.some((row, index) => index >= firstDay && !emptyCell(row[column])));
    const ordered = dayColumn > (used[0] ?? 0) ? used.slice().reverse() : used;
    ordered.forEach((column, index) => { if (TIMES[index]) times.set(column, { start: TIMES[index], end: TIME_END[TIMES[index]] || "" }); });
  }
  const slots = [];
  let day = "";
  let classNumber = "";
  let band = null;
  const flush = () => {
    if (!band) return;
    columns.forEach((column) => {
      const range = times.get(column);
      const lines = band.rows.map((index) => grid[index][column] || "").filter((cell) => !emptyCell(cell));
      if (!lines.length) return;
      // خانة مدموجة على أكتر من عمود = محاضرة واخدة أكتر من فترة: من بداية أول فترة لنهاية آخر فترة
      const span = spans?.get(`${band.rows[0]}:${column}`) || 1;
      const covered = columns.slice(columns.indexOf(column), columns.indexOf(column) + span).map((item) => times.get(item)).filter((item) => item?.start);
      covered.sort((x, y) => timeMinutes(x.start) - timeMinutes(y.start));
      const start = covered[0]?.start || "";
      const end = covered[covered.length - 1]?.end || "";
      const slot = slotFromCell(lines.join("\n"), { day: band.day, start, end, classNumber, guessed: guessed || range?.period || !range?.start });
      if (slot) slots.push(slot);
    });
    band = null;
  };
  grid.forEach((row, index) => {
    const line = lineOf(row);
    const foundClass = findClass(line);
    if (foundClass && line.length < 40 && !dayHeader(row[dayColumn] || "")) { classNumber = foundClass; return; }
    if (index === header || index < firstDay) return;
    const found = dayHeader(row[dayColumn] || "");
    if (found && found !== day) {
      flush();
      day = found;
      band = { day, rows: [index] };
    } else if (band && row.some((cell, column) => column !== dayColumn && !emptyCell(cell))) {
      band.rows.push(index);
    }
  });
  flush();
  return slots;
}

// (ج) قائمة بعناوين أعمدة: الأعمدة بأي ترتيب، وأي عمود اختياري ممكن يغيب.
function parseByHeader(rows, requireDay = true) {
  const grid = gridOf(rows);
  const headerIndex = grid.findIndex((row) => new Set(row.map(headerKey).filter(Boolean)).size >= 2 && row.filter((cell) => cell.length > 30).length === 0);
  if (headerIndex < 0) return [];
  const keys = grid[headerIndex].map(headerKey);
  // رقم الفصل ممكن يكون مكتوب في عنوان فوق الجدول
  let classNumber = grid.slice(0, headerIndex).map((row) => findClass(lineOf(row))).find(Boolean) || "";
  let day = "";
  let date = "";
  const slots = [];
  grid.slice(headerIndex + 1).forEach((row) => {
    const line = lineOf(row);
    if (!line) return;
    const foundClass = findClass(line);
    const filled = row.filter((cell) => !emptyCell(cell)).length;
    if (foundClass && filled <= 2 && line.length < 40) { classNumber = foundClass; return; }
    if (new Set(row.map(headerKey).filter(Boolean)).size >= 2) return; // العنوان متكرر في صفحة جديدة
    const item = {};
    keys.forEach((key, index) => { if (key && !emptyCell(row[index]) && !item[key]) item[key] = row[index]; });
    const range = item.time ? axisRange(item.time) : { start: cleanTime(item.start) || axisRange(item.start || "").start, end: cleanTime(item.end) };
    if (!range.start && !item.time && !item.start) Object.assign(range, timeRange(line));
    // خانة اليوم المدموجة بتفضل فاضية في الصفوف اللي بعدها، فبنكمّل بآخر يوم
    const ownDay = findDay(item.day || "") || (keys.includes("day") ? "" : findDay(line));
    if (ownDay) day = ownDay;
    // خانة يوم فيها كلام مش مفهوم (زي الجمعة) ما تورّثش اليوم اللي قبلها
    const rowDay = item.day && !ownDay ? "" : day;
    const ownDate = findDate(item.date || "") || (keys.includes("date") ? "" : findDate(line));
    if (ownDate) date = ownDate;
    const inheritedDate = !ownDate && !!date;
    const rawSubject = item.subject || item.title || "";
    const bits = splitCell(rawSubject);
    const subject = cleanText([item.code && !String(rawSubject).includes(item.code) ? item.code : "", cleanSubject(bits.subject) || bits.subject].filter(Boolean).join(" "));
    if (!subject || dayHeader(subject)) return;
    if (requireDay && !rowDay && !item.day && !range.start) return;
    slots.push({
      day: rowDay,
      start: range.start || "",
      end: range.end || defaultEnd(range.start),
      subject,
      instructor: item.instructor ? tidyInstructor(item.instructor) : bits.instructor,
      room: item.room ? findRoom(item.room) || cleanText(item.room) : bits.room,
      type: item.type ? (TYPE_KEYS.find(([, pattern]) => pattern.test(normalizeHeader(item.type))) || [""])[0] : bits.type,
      date: date,
      notes: cleanText(item.notes || ""),
      classNumber: (item.classNumber && latin(item.classNumber).match(/\d{1,3}/)?.[0]) || findClass(line) || classNumber,
      guessed: !!range.period || (!requireDay && inheritedDate),
    });
  });
  return slots;
}

// (د) قائمة من غير عناوين: كل خانة بنعرف نوعها من محتواها.
function parseRowsLoose(rows, kind) {
  const grid = gridOf(rows);
  let day = "";
  let classNumber = "";
  let date = "";
  const slots = [];
  grid.forEach((row) => {
    const cells = row.filter((cell) => !emptyCell(cell));
    if (!cells.length) return;
    const line = cells.join(" ");
    const foundClass = findClass(line);
    if (foundClass && line.length < 40 && cells.length <= 2 && !allTimes(line).length) { classNumber = foundClass; return; }
    if (cells.length === 1 && dayHeader(cells[0])) { day = dayHeader(cells[0]); return; }
    const item = { times: [], texts: [] };
    cells.forEach((cell) => {
      const cellDay = dayHeader(cell);
      const times = allTimes(cell);
      const cellDate = kind === "exams" ? findDate(cell) : "";
      const room = findRoom(cell);
      if (cellDay && !item.day) { item.day = cellDay; if (times.length) item.times.push(...times); return; }
      if (cellDate && !item.date && stripMeta(cell).replace(/[\d\s/.-]/g, "").length < 12) { item.date = cellDate; return; }
      if (times.length && stripMeta(cell).length <= 3) { item.times.push(...times); return; }
      if (isInstructor(cell) && !item.instructor) { item.instructor = tidyInstructor(cell); return; }
      if (room && cell.length <= room.length + 8 && !item.room) { item.room = room; return; }
      if (findClass(cell) && cell.length < 16) { item.classNumber = findClass(cell); return; }
      if (times.length) item.times.push(...times);
      if (!item.date && cellDate) item.date = cellDate;
      item.texts.push(cell);
    });
    if (item.day) day = item.day;
    if (item.date) date = item.date;
    if (!item.texts.length) return;
    const bits = splitCell(item.texts[0]);
    const subject = cleanSubject(bits.subject) || cleanText(bits.subject);
    if (!subject || subject.length < 2) return;
    const extra = item.texts.slice(1).map(cleanText).filter(Boolean);
    const instructor = item.instructor || bits.instructor || extra.find((text) => /^[؀-ۿa-zA-Z\s.]+$/.test(text) && text.split(/\s+/).length >= 2) || "";
    const start = item.times[0] || "";
    if (kind !== "exams" && !start && !item.day) return;
    if (kind === "exams" && !start && !item.date && !date && !item.day) return;
    slots.push({
      day: item.day || day,
      start,
      end: item.times[1] || defaultEnd(start),
      subject,
      instructor,
      room: item.room || bits.room || extra.find((text) => text !== instructor && text.length <= 14) || "",
      type: bits.type,
      date: item.date || (kind === "exams" ? date : ""),
      notes: "",
      classNumber: item.classNumber || findClass(line) || classNumber,
      guessed: kind === "exams" && !item.date && !!date,
    });
  });
  return slots;
}

// (هـ) سطور حرة: يوم ← وقت ← مادة ← دكتور ← قاعة، كل واحدة في سطر.
function parseBlocks(rows) {
  const lines = gridOf(rows).map(lineOf).filter(Boolean);
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
    if (foundClass && line.length < 36 && !allTimes(line).length) { flush(); classNumber = foundClass; return; }
    const headerDay = dayHeader(line);
    if (headerDay && !cleanTime(line)) { flush(); day = headerDay; return; }
    const range = timeRange(line);
    const subject = cleanSubject(line);
    if (range.start && (headerDay || day || findDay(line))) {
      flush();
      current = { day: headerDay || findDay(line) || day, start: range.start, end: range.end, subject, instructor: "", room: findRoom(line), classNumber };
      return;
    }
    if (!current) return;
    if (isInstructor(line) && !current.instructor) current.instructor = tidyInstructor(line);
    else if (!current.subject && subject) current.subject = subject;
    else if (!current.room && findRoom(line)) current.room = findRoom(line);
    else if (!current.instructor && subject && /^[؀-ۿ\s.]+$/.test(subject) && subject.split(/\s+/).length >= 2) current.instructor = subject;
  });
  flush();
  return slots;
}

// ---------- التنسيق التلقائي ----------
function slotKey(slot) {
  return `${slot.classNumber || ""}|${slot.day || ""}|${slot.date || ""}|${slot.start || ""}|${normalizeHeader(slot.subject)}`;
}
function dedupeSlots(slots) {
  const seen = new Set();
  return slots.filter((slot) => {
    const key = slotKey(slot);
    if (!slot.subject || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
// صف واحد بصيغة جدولي النهائية.
function formatSlot(raw, kind) {
  const subjectRaw = cleanText(normalizeVisualLine(raw.subject || ""));
  const slot = {
    classNumber: latin(String(raw.classNumber ?? "")).replace(/\D/g, "").replace(/^0+(?=\d)/, ""),
    day: findDay(raw.day || "") || "",
    start: cleanTime(raw.start) || "",
    end: cleanTime(raw.end) || "",
    subject: "",
    instructor: raw.instructor ? tidyInstructor(normalizeVisualLine(raw.instructor)) : "",
    room: raw.room ? findRoom(raw.room) || cleanText(normalizeVisualLine(raw.room)) : "",
    type: "",
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.date || "")) ? raw.date : findDate(raw.date || ""),
    notes: cleanText(raw.notes || ""),
    guessed: !!raw.guessed,
  };
  if (slot.start && !slot.end) slot.end = defaultEnd(slot.start);
  slot.type = detectType({ ...raw, subject: subjectRaw, instructor: slot.instructor, room: slot.room });
  slot.subject = stripType(subjectRaw).replace(/\s+/g, " ").slice(0, 120) || subjectRaw;
  if (kind === "exams" && !slot.day && slot.date) slot.day = "";
  return slot;
}
// نفس المادة مكتوبة بأكتر من شكل (همزات، مسافات، حالة الحروف) بتتوحّد على أكتر شكل متكرر.
function unifySubjects(slots) {
  const groups = new Map();
  slots.forEach((slot) => {
    const key = normalizeHeader(slot.subject).replace(/[^a-z0-9؀-ۿ]/g, "");
    if (!key) return;
    if (!groups.has(key)) groups.set(key, new Map());
    const forms = groups.get(key);
    forms.set(slot.subject, (forms.get(slot.subject) || 0) + 1);
  });
  const hamza = (text) => (text.match(/[أإآ]/g) || []).length;
  slots.forEach((slot) => {
    const forms = groups.get(normalizeHeader(slot.subject).replace(/[^a-z0-9؀-ۿ]/g, ""));
    if (!forms || forms.size < 2) return;
    slot.subject = [...forms.entries()].sort((a, b) => b[1] - a[1] || hamza(b[0]) - hamza(a[0]) || b[0].length - a[0].length)[0][0];
  });
  return slots;
}
function sortSlots(slots, kind) {
  const dayIndex = (day) => { const index = DAYS.indexOf(day); return index < 0 ? 9 : index; };
  return slots.slice().sort((a, b) => Number(a.classNumber || 0) - Number(b.classNumber || 0)
    || (kind === "exams" ? String(a.date || "9").localeCompare(String(b.date || "9")) : dayIndex(a.day) - dayIndex(b.day))
    || (timeMinutes(a.start) || 9999) - (timeMinutes(b.start) || 9999));
}
function formatSlots(slots, kind) {
  return sortSlots(unifySubjects(dedupeSlots(slots.map((slot) => formatSlot(slot, kind)).filter((slot) => slot.subject.length >= 2))), kind);
}
// المشاكل اللي لازم الأدمن يراجعها. المفتاح هو اسم الحقل، والقيمة سبب التنبيه.
function slotIssues(slot, kind, all) {
  const issues = {};
  const time = /^(0[1-9]|1[0-2]):[0-5]\d$/;
  if (!slot.subject || slot.subject.trim().length < 2) issues.subject = "اسم المادة ناقص";
  else if (slot.subject.length > 70) issues.subject = "اسم المادة طويل، غالبًا خانتين اتلزقوا";
  else if (/\d{1,2}[:.]\d{2}/.test(slot.subject) || findDay(slot.subject) && slot.subject.length < 14) issues.subject = "اسم المادة فيه وقت أو يوم";
  if (kind === "lectures") {
    if (!slot.classNumber) issues.classNumber = "رقم الفصل ناقص";
    if (!DAYS.includes(slot.day)) issues.day = slot.day ? "اليوم مش معروف" : "اليوم ناقص";
    if (!time.test(slot.start || "")) issues.start = slot.start ? "صيغة الوقت غلط" : "وقت البداية ناقص";
    else if (slot.guessed) issues.start = "الوقت متخمَّن من ترتيب الأعمدة، راجعه";
    else if (timeMinutes(slot.start) < 7 * 60 + 30 || timeMinutes(slot.start) > 19 * 60 + 30) issues.start = "الوقت خارج اليوم الدراسي";
    if (slot.end && !time.test(slot.end)) issues.end = "صيغة الوقت غلط";
    else if (slot.end && time.test(slot.start || "") && timeMinutes(slot.end) <= timeMinutes(slot.start)) issues.end = "وقت النهاية قبل البداية";
    if (all && !issues.day && !issues.start && all.some((other) => other !== slot && other.classNumber === slot.classNumber && other.day === slot.day && other.start === slot.start)) issues.start = "في محاضرة تانية لنفس الفصل في نفس الميعاد";
  } else {
    if (slot.date && !/^\d{4}-\d{2}-\d{2}$/.test(slot.date)) issues.date = "صيغة التاريخ غلط";
    else if (!slot.date) issues.date = "التاريخ ناقص";
    else if (slot.guessed) issues.date = "التاريخ موروث من الصف اللي فوقه، راجعه";
    if (slot.start && !time.test(slot.start)) issues.start = "صيغة الوقت غلط";
    if (slot.end && !time.test(slot.end)) issues.end = "صيغة الوقت غلط";
  }
  return issues;
}
function scoreSlots(slots, kind) {
  return slots.reduce((total, slot) => {
    const issues = slotIssues(slot, kind);
    delete issues.classNumber;
    const count = Object.keys(issues).length;
    return total + (count === 0 ? 3 : count === 1 ? 1 : -1) + (slot.instructor ? 0.3 : 0) + (slot.room ? 0.3 : 0) - (slot.guessed ? 0.5 : 0);
  }, 0);
}

// ---------- الواجهة الرئيسية ----------
// rows: مصفوفة صفوف (كل صف مصفوفة خانات نصية). بيجرّب كل الاستراتيجيات وبيختار الأنضف.
function parseTimetable(rows, kind = "lectures", options = {}) {
  const fixed = gridOf(rows).map((row) => row.map((cell) => cell.split("\n").map(normalizeVisualLine).join("\n")));
  const attempts = kind === "exams"
    ? [["عناوين الأعمدة", () => parseByHeader(fixed, false)], ["صفوف حرة", () => parseRowsLoose(fixed, "exams")]]
    : [
      ["شبكة: الأيام صفوف", () => parseDayRows(fixed, options.spans)],
      ["شبكة: الأيام أعمدة", () => parseDayColumns(fixed)],
      ["عناوين الأعمدة", () => parseByHeader(fixed, true)],
      ["صفوف حرة", () => parseRowsLoose(fixed, "lectures")],
      ["سطور متتابعة", () => parseBlocks(fixed)],
    ];
  let best = { slots: [], strategy: "", score: -Infinity };
  attempts.forEach(([strategy, run]) => {
    let slots = [];
    try { slots = formatSlots(run(), kind); } catch { slots = []; }
    if (!slots.length) return;
    const score = scoreSlots(slots, kind);
    if (score > best.score) best = { slots, strategy, score };
  });
  return best;
}
// توافق مع الأسماء القديمة
function parseLectures(rows) {
  return parseTimetable(rows, "lectures").slots;
}
function parseExamsAny(rows) {
  return parseTimetable(rows, "exams").slots;
}
function bestSlots(rows, kind) {
  return parseTimetable(rows, kind).slots;
}

// لون ثابت لكل مادة، نفس معادلة موقع الطلبة عشان الألوان تطابق.
function subjectColor(subject) {
  let hash = 0;
  for (const char of String(subject || "")) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return `var(--sub-${(hash % 8) + 1})`;
}
