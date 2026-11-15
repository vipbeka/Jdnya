// لوحة الإدارة — قراءة الجداول المرفوعة (Excel / PDF / صور) وتحويلها لمحاضرات وامتحانات.
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
