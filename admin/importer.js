// لوحة الإدارة — استخراج الجداول من الملفات المرفوعة (PDF / صور / Excel / CSV).
// الملف ده بيطلّع «صفوف نص» من الملف، ومحرك admin/parser.js هو اللي بيفهمها ويحوّلها لمحاضرات وامتحانات.

// ---------- المكتبات (بتتحمّل وقت الحاجة بس) ----------
const LIB = {
  pdf: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  pdfWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  pdfMaps: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
  pdfFonts: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/",
  ocr: "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js",
  ocrWorker: "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js",
  ocrCore: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1",
  xlsx: "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
};
const libLoads = new Map();
function loadLib(url, label) {
  if (!libLoads.has(url)) {
    libLoads.set(url, new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timer = setTimeout(() => fail(), 30000);
      const fail = () => {
        clearTimeout(timer);
        libLoads.delete(url);
        script.remove();
        reject(new Error(`${label} ما اتحمّلش. اتأكد إن النت شغال وجرّب تاني.`));
      };
      script.src = url;
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = fail;
      document.head.appendChild(script);
    }));
  }
  return libLoads.get(url);
}

// ---------- التحقق من الملف ----------
const UPLOAD_MAX = 20 * 1024 * 1024;
function fileKind(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  if (/\.pdf$/.test(name) || type === "application/pdf") return "pdf";
  if (/\.(png|jpe?g|webp)$/.test(name) || /^image\/(png|jpeg|webp)$/.test(type)) return "image";
  if (/\.(xlsx|xls)$/.test(name) || /spreadsheet|ms-excel/.test(type)) return "sheet";
  if (/\.csv$/.test(name) || type === "text/csv") return "csv";
  return "";
}
function validateUpload(file) {
  if (!file) return "اختار ملف الأول.";
  if (!fileKind(file)) return "نوع الملف مش مدعوم. ارفع PDF أو صورة (PNG / JPG / WEBP) أو Excel / CSV.";
  if (!file.size) return "الملف فاضي.";
  if (file.size > UPLOAD_MAX) return "الملف أكبر من 20 ميجا. صغّره أو ارفع صفحة الجدول بس.";
  return "";
}
function fileSizeLabel(bytes) {
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} ميجا` : `${Math.max(1, Math.round(bytes / 1024))} ك.ب`;
}

// ---------- من «كلمات بمواضعها» لصفوف وأعمدة ----------
// tokens: [{ text, x, y, w, h }] والـ y بيزيد لتحت. بتشتغل لنص الـ PDF ولكلمات الـ OCR.
function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
}
function joinTokens(tokens, height) {
  const arabic = tokens.filter((token) => /[؀-ۿﭐ-﷿ﹰ-﻿]/.test(token.text)).length >= tokens.length / 2;
  const ordered = tokens.slice().sort((a, b) => (arabic ? b.x - a.x : a.x - b.x));
  let text = "";
  ordered.forEach((token, index) => {
    if (index) {
      const previous = ordered[index - 1];
      const gap = arabic ? previous.x - (token.x + token.w) : token.x - (previous.x + previous.w);
      // الحروف المتقطعة (كل حرف token) بتتلزق من غير مسافة
      // أجزاء الكلمة الواحدة (حروف متقطعة أو كلمة اتقسمت عند «لا») بتتلزق من غير مسافة
      text += gap < height * (previous.text.length === 1 || token.text.length === 1 ? 0.18 : 0.1) ? "" : " ";
    }
    text += token.text;
  });
  return text.replace(/\s+/g, " ").trim();
}
function tableFromTokens(raw) {
  const tokens = raw.filter((token) => token && String(token.text || "").trim()).map((token) => ({ ...token, text: String(token.text).normalize("NFKC").trim() }));
  if (!tokens.length) return [];
  const height = median(tokens.map((token) => token.h)) || 10;
  // 1) السطور
  const lines = [];
  tokens.slice().sort((a, b) => a.y - b.y || a.x - b.x).forEach((token) => {
    const line = lines.find((row) => Math.abs(row.y - token.y) < Math.max(3, height * 0.55));
    if (line) {
      line.tokens.push(token);
      line.y = (line.y * (line.tokens.length - 1) + token.y) / line.tokens.length;
    } else lines.push({ y: token.y, tokens: [token] });
  });
  lines.sort((a, b) => a.y - b.y);
  const left = Math.min(...tokens.map((token) => token.x));
  const right = Math.max(...tokens.map((token) => token.x + token.w));
  const width = Math.max(1, right - left);
  lines.forEach((line) => {
    const ordered = line.tokens.slice().sort((a, b) => a.x - b.x);
    let span = 0;
    let runStart = ordered[0].x;
    let runEnd = ordered[0].x + ordered[0].w;
    ordered.slice(1).forEach((token) => {
      if (token.x - runEnd > height * 1.2) { span = Math.max(span, runEnd - runStart); runStart = token.x; }
      runEnd = Math.max(runEnd, token.x + token.w);
    });
    // سطر عنوان: كلام متصل واخد أغلب عرض الصفحة
    line.wide = Math.max(span, runEnd - runStart) > width * 0.5;
  });
  // 2) الأعمدة: فراغات رأسية محدش بيعدّيها في أغلب السطور
  const body = lines.filter((line) => !line.wide);
  const step = Math.max(1, height / 5);
  const bins = Math.ceil(width / step) + 1;
  const cover = new Array(bins).fill(0);
  body.forEach((line) => {
    const seen = new Set();
    line.tokens.forEach((token) => {
      for (let bin = Math.max(0, Math.floor((token.x - left) / step)); bin <= Math.min(bins - 1, Math.floor((token.x + token.w - left) / step)); bin += 1) seen.add(bin);
    });
    seen.forEach((bin) => { cover[bin] += 1; });
  });
  const allowed = Math.floor(body.length * 0.1);
  const cuts = [];
  let open = -1;
  for (let bin = 0; bin <= bins; bin += 1) {
    const free = bin < bins && cover[bin] <= allowed;
    if (free && open < 0) open = bin;
    if (!free && open >= 0) {
      if ((bin - open) * step >= height * 0.9 && open > 0 && bin < bins) cuts.push(left + ((open + bin) / 2) * step);
      open = -1;
    }
  }
  const columnOf = (token) => {
    const mid = token.x + token.w / 2;
    let index = 0;
    while (index < cuts.length && mid > cuts[index]) index += 1;
    return index;
  };
  const rtl = tokens.filter((token) => /[؀-ۿﭐ-﷿ﹰ-﻿]/.test(token.text)).length > tokens.length * 0.3;
  const rows = lines.map((line) => {
    if (line.wide || !cuts.length) return { y: line.y, cells: [joinTokens(line.tokens, height)], wide: true };
    const cells = Array.from({ length: cuts.length + 1 }, () => []);
    line.tokens.forEach((token) => cells[columnOf(token)].push(token));
    const texts = cells.map((list) => (list.length ? joinTokens(list, height) : ""));
    return { y: line.y, cells: rtl ? texts.reverse() : texts };
  });
  // 3) السطور المتقاربة جوه نفس الخانة (مادة / دكتور / قاعة) بتتلم في صف واحد
  const gaps = rows.slice(1).map((row, index) => row.y - rows[index].y).filter((gap) => gap > 0);
  const small = Math.min(...gaps);
  const big = Math.max(...gaps);
  const merged = [];
  const threshold = gaps.length >= 3 && big / small > 1.35 ? (small + big) / 2 : 0;
  rows.forEach((row, index) => {
    const previous = merged[merged.length - 1];
    const gap = index ? row.y - rows[index - 1].y : Infinity;
    if (previous && threshold && gap < threshold && !row.wide && !previous.wide && row.cells.length === previous.cells.length) {
      previous.cells = previous.cells.map((cell, column) => [cell, row.cells[column]].filter(Boolean).join("\n"));
    } else merged.push({ cells: row.cells.slice(), wide: row.wide });
  });
  return merged.map((row) => row.cells).filter((cells) => cells.some(Boolean));
}

// ---------- PDF ----------
async function openPdf(data) {
  await loadLib(LIB.pdf, "قارئ PDF");
  if (!window.pdfjsLib) throw new Error("قارئ PDF مش متحمّل. حدّث الصفحة وجرّب تاني.");
  pdfjsLib.GlobalWorkerOptions.workerSrc = LIB.pdfWorker;
  const task = pdfjsLib.getDocument({ data, isEvalSupported: false, useWorkerFetch: false, cMapUrl: LIB.pdfMaps, cMapPacked: true, standardFontDataUrl: LIB.pdfFonts });
  const timeout = new Promise((_, reject) => setTimeout(() => {
    try { task.destroy(); } catch { /* الملف اتأخر */ }
    reject(new Error("قراءة الملف اتأخرت. اتأكد إن الملف سليم ومش محمي بكلمة سر، وارفعه تاني."));
  }, 30000));
  try {
    return await Promise.race([task.promise, timeout]);
  } catch (error) {
    if (/password/i.test(error?.name || "") || /password/i.test(error?.message || "")) throw new Error("الملف محمي بكلمة سر. شيل الحماية وارفعه تاني.");
    if (/invalid|corrupt|missing/i.test(error?.message || "")) throw new Error("ملف الـ PDF تالف أو مش مكتمل.");
    throw error;
  }
}
function pdfTokens(items, pageHeight) {
  return items.filter((item) => String(item.str || "").trim()).map((item) => {
    const h = Math.abs(item.transform[3]) || item.height || 10;
    return { text: item.str, x: item.transform[4], y: pageHeight - item.transform[5], w: item.width || String(item.str).length * h * 0.5, h };
  });
}
// ملف PDF نصي فيه جدول مرسوم بخطوط: بناخد شكل الخانات (بالدمج) من الخطوط، والنص من الملف نفسه. أدق من الاتنين لوحدهم.
function matrixFromPdfText(grid, tokens, scale) {
  const placed = tokens.map((token) => ({ ...token, x: token.x * scale, w: token.w * scale, h: token.h * scale, y: (token.y - token.h * 0.35) * scale }));
  const height = median(placed.map((token) => token.h)) || 10;
  const linesOf = (list) => {
    const lines = [];
    list.slice().sort((a, b) => a.y - b.y).forEach((token) => {
      const line = lines.find((row) => Math.abs(row.y - token.y) < height * 0.55);
      if (line) line.tokens.push(token);
      else lines.push({ y: token.y, tokens: [token] });
    });
    return lines.sort((a, b) => a.y - b.y).map((line) => joinTokens(line.tokens, height)).filter(Boolean);
  };
  const matrix = Array.from({ length: grid.rowCount }, () => new Array(grid.colCount).fill(""));
  const spans = new Map();
  const used = new Set();
  grid.cells.forEach((cell) => {
    const inside = placed.filter((token) => {
      const mid = token.x + token.w / 2;
      return mid >= cell.x0 - 3 && mid <= cell.x1 + 3 && token.y >= cell.y0 - 3 && token.y <= cell.y1 + 3;
    });
    if (!inside.length) return;
    inside.forEach((token) => used.add(token));
    matrix[cell.row][cell.column] = linesOf(inside).join("\n");
    if (cell.lastColumn > cell.column) spans.set(`${cell.row}:${cell.column}`, cell.lastColumn - cell.column + 1);
  });
  if (used.size < placed.length * 0.5) return null;
  const head = linesOf(placed.filter((token) => !used.has(token) && token.y < grid.top)).map((line) => [line]);
  return { rows: [...head, ...matrix], spans: shiftSpans(spans, head.length) };
}
async function renderPdfPage(page) {
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: Math.min(3, Math.max(1.6, 2200 / Math.max(base.width, base.height))) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

// قارئ مخصوص لشكل جدول الأكاديمية الرسمي (صف مواعيد فوق، وعمود أيام على الجنب). بيتجرّب جنب المحرك العام.
function cellText(tokens) {
  const letters = tokens.filter((token) => token.text.length === 1).length > tokens.length * 0.6;
  return normalizeVisualLine(tokens.map((token) => token.text).join(letters ? "" : " "));
}
function tidyLine(value) {
  return String(value || "").replace(/[()]/g, " ").replace(/\s*([./])\s*/g, "$1").replace(/^[./]+/, "").replace(/\s+/g, " ").trim();
}
function academyRange(value) {
  const times = allTimes(value);
  const start = times.find((time) => TIMES.includes(time));
  if (!start) return { start: "", end: "" };
  return { start, end: times.find((time) => time !== start) || TIME_END[start] || "" };
}
function academySlotsFromItems(raw) {
  const tokens = raw.map((item) => {
    const text = String(item.str || item.text || "").normalize("NFKC").replace(/\s+/g, " ").trim();
    if (!text) return null;
    return { text, x: item.x ?? item.transform?.[4] ?? 0, y: item.y ?? item.transform?.[5] ?? 0, w: item.w || item.width || Math.max(8, text.length * 4) };
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
      slots.push({ day: mark.day, start: band.start, end: band.end, subject: subject.slice(0, 80), instructor, room, classNumber: "" });
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
  const inline = tokens.map((token) => findClass(token.text)).find(Boolean);
  if (inline) return inline;
  const label = tokens.find((token) => /الفصل|المجموعه/.test(normalizeHeader(normalizeVisualLine(token.text))) && !/الدراسي/.test(normalizeHeader(normalizeVisualLine(token.text))));
  if (!label) return "";
  const near = tokens.filter((token) => Math.abs(token.y - label.y) < 14 && /^\d{1,3}$/.test(latin(token.text)));
  near.sort((a, b) => Math.abs(a.x - label.x) - Math.abs(b.x - label.x) || Math.abs(a.y - label.y) - Math.abs(b.y - label.y));
  return near[0] ? String(Number(latin(near[0].text))) : "";
}

// ---------- الصور: اكتشاف خطوط الجدول ثم قراءة كل خانة ----------
// قارئين مع بعض: واحد للعربي وواحد للإنجليزي والأرقام. كل سطر بناخده من القارئ الأوثق فيه،
// لأن القارئ المزدوج بيلخبط العربي باللاتيني وبيغلط في المواعيد.
async function openReader(onProgress) {
  await loadLib(LIB.ocr, "قارئ الصور");
  if (!window.Tesseract) throw new Error("قارئ الصور مش متحمّل. حدّث الصفحة وجرّب تاني.");
  onProgress?.({ text: "جارٍ تجهيز قارئ العربي والإنجليزي (أول مرة بس بتاخد وقت)…", ratio: 0.08 });
  const make = (lang) => Tesseract.createWorker(lang, 1, {
    // من غير langPath: المكتبة بتجيب ملفات اللغة من jsDelivr، وده المسموح في سياسة الأمان بتاعة الموقع
    workerPath: LIB.ocrWorker,
    corePath: LIB.ocrCore,
    logger: (message) => {
      if (/loading language|initializing/.test(message.status || "")) onProgress?.({ text: "جارٍ تجهيز قارئ العربي والإنجليزي…", ratio: 0.08 + (message.progress || 0) * 0.1 });
    },
  });
  let workers;
  try {
    workers = await Promise.all([make("ara"), make("eng")]);
  } catch (error) {
    throw new Error("قارئ الصور ما اشتغلش. اتأكد من النت وجرّب تاني، أو ارفع الجدول PDF نصي أو Excel.");
  }
  const [ara, eng] = workers;
  const mode = async (psm) => { await Promise.all(workers.map((worker) => worker.setParameters({ tessedit_pageseg_mode: psm }))); };
  await mode("6");
  return {
    mode,
    // بيرجّع قراءة العربي وقراءة الإنجليزي لنفس الصورة
    read: (source) => Promise.all([ara.recognize(source), eng.recognize(source)]).then(([a, e]) => [a.data, e.data]),
    terminate: () => Promise.all(workers.map((worker) => worker.terminate().catch(() => {}))),
  };
}
const OCR_MARKS = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
function ocrLines(data) {
  return (data?.lines || []).map((line) => ({
    text: String(line.text || "").replace(OCR_MARKS, "").replace(/[|¦]+/g, " ").replace(/\s+/g, " ").trim(),
    conf: line.confidence || 0,
    y: line.bbox ? (line.bbox.y0 + line.bbox.y1) / 2 : 0,
    h: line.bbox ? line.bbox.y1 - line.bbox.y0 : 0,
  })).filter((line) => line.text.replace(/[^\p{L}\p{N}]/gu, "").length >= 1);
}
// بيختار لكل سطر القراءة الأصدق، وبيرجّع { text, conf }.
function pickReading(arabic, english) {
  const none = { text: "", conf: 0 };
  const arabicLetters = arabic ? (arabic.text.match(/[\u0600-\u06FF]/g) || []).length : 0;
  // أرقام لازقة في حروف عربي = القارئ العربي بيحاول يقرا كلام لاتيني
  const arabicJunk = arabic ? /[\u0600-\u06FF]\d|\d[\u0600-\u06FF]/.test(arabic.text) || arabicLetters < 2 : true;
  if (!english) return arabic && !arabicJunk ? arabic : none;
  if (!arabic) return /[A-Za-z]{2}|\d/.test(english.text) ? english : none;
  // سطر أرقام ومواعيد، أو كلام لاتيني نضيف: القارئ الإنجليزي أدق فيه بكتير
  if (/^(?:[\d\s:.,\-–—/]|[AaPp]\.?[Mm]\b\.?)+$/.test(english.text) && /\d/.test(english.text) && english.conf > 55) return english;
  if (/^[A-Za-z][A-Za-z0-9 .&'()\/-]+$/.test(english.text) && english.conf >= 85 && (arabicJunk || arabic.conf < english.conf)) return english;
  const arabicScore = arabic.conf + (arabicJunk ? -40 : 8);
  const englishScore = english.conf + (/[A-Za-z]{3}|\d/.test(english.text) ? 0 : -15);
  return arabicScore >= englishScore ? arabic : english;
}
function mergeReadings(arabicData, englishData) {
  const arabic = ocrLines(arabicData);
  const english = ocrLines(englishData);
  let picked;
  if (arabic.length === english.length) picked = arabic.map((line, index) => pickReading(line, english[index]));
  else {
    // عدد السطور مختلف: بنطابق كل سطر بأقرب سطر ليه رأسيًا
    const height = median([...arabic, ...english].map((line) => line.h).filter(Boolean)) || 20;
    const slots = [];
    [...arabic.map((line) => ({ line, from: "a" })), ...english.map((line) => ({ line, from: "e" }))].sort((x, y) => x.line.y - y.line.y).forEach((item) => {
      const slot = slots.find((entry) => Math.abs(entry.y - item.line.y) < height * 0.6 && !entry[item.from]);
      if (slot) slot[item.from] = item.line;
      else slots.push({ y: item.line.y, [item.from]: item.line });
    });
    picked = slots.map((slot) => pickReading(slot.a, slot.e));
  }
  picked = picked.filter((line) => line.text);
  return { text: picked.map((line) => line.text).join("\n"), conf: picked.length ? Math.min(...picked.map((line) => line.conf)) : 0 };
}
// بيقرا الخانة بحجم الكتابة اللي القارئ بيحبه، ولو مش واثق بيجرّب حجم تاني وياخد الأوثق.
async function readRegion(reader, canvas, box, lineHeight) {
  const at = async (target) => mergeReadings(...await reader.read(cropCanvas(canvas, box.x0, box.y0, box.x1, box.y1, Math.min(3.5, Math.max(0.6, target / (lineHeight || 24))))));
  let best = await at(24);
  if (best.conf < 72) {
    const second = await at(33);
    if (second.text && second.conf > best.conf) best = second;
  }
  // كلمة واحدة أو رقم واحد أحيانًا ما بيتقروش كـ«فقرة»، فبنجرّبهم كسطر ثم ككلمة ثم كحرف
  for (const mode of ["7", "8", "10"]) {
    if (best.text) break;
    await reader.mode(mode);
    best = await at(30);
  }
  await reader.mode("6");
  return best.text;
}
async function canvasFromImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("الصورة ما اتفتحتش. اتأكد إنها PNG أو JPG أو WEBP سليمة."));
      element.src = url;
    });
    const longSide = Math.max(image.naturalWidth, image.naturalHeight);
    if (longSide < 400) throw new Error("الصورة صغيرة قوي. ارفع صورة أوضح للجدول.");
    const scale = Math.min(2.4, Math.max(0.5, 2200 / longSide));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
function clusterLines(hits) {
  const lines = [];
  hits.forEach((hit) => {
    const last = lines[lines.length - 1];
    if (last && hit - last.end <= 4) last.end = hit;
    else lines.push({ start: hit, end: hit });
  });
  return lines.map((line) => Math.round((line.start + line.end) / 2));
}
// بيرجّع شبكة الخانات من خطوط الجدول المرسومة، مع دمج الخانات اللي مفيش بينها خط (merged cells).
function detectGrid(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const pixels = canvas.getContext("2d").getImageData(0, 0, width, height).data;
  const gray = new Uint8Array(width * height);
  const histogram = new Uint32Array(256);
  for (let index = 0; index < gray.length; index += 1) {
    const value = (pixels[index * 4] * 77 + pixels[index * 4 + 1] * 150 + pixels[index * 4 + 2] * 29) >> 8;
    gray[index] = value;
    histogram[value] += 1;
  }
  // عتبة أوتسو: بتفصل الحبر عن الورق حتى لو الصورة باهتة أو رمادي
  let sum = 0;
  for (let level = 0; level < 256; level += 1) sum += level * histogram[level];
  let sumBack = 0;
  let weightBack = 0;
  let best = 0;
  let cutoff = 128;
  for (let level = 0; level < 256; level += 1) {
    weightBack += histogram[level];
    if (!weightBack) continue;
    const weightFront = gray.length - weightBack;
    if (!weightFront) break;
    sumBack += level * histogram[level];
    const between = weightBack * weightFront * ((sumBack / weightBack) - ((sum - sumBack) / weightFront)) ** 2;
    if (between > best) { best = between; cutoff = level; }
  }
  cutoff = Math.min(190, Math.max(70, cutoff));
  const dark = (x, y) => gray[y * width + x] < cutoff;
  // الخط = أطول سلسلة متصلة من البكسلات الغامقة. النص عمره ما بيعمل سلسلة طويلة.
  const longestRow = (y, from, to) => {
    let bestRun = 0;
    let run = 0;
    let gap = 0;
    for (let x = from; x < to; x += 1) {
      if (dark(x, y)) { run += 1 + gap; gap = 0; if (run > bestRun) bestRun = run; }
      else if (run && gap < 3) gap += 1;
      else { run = 0; gap = 0; }
    }
    return bestRun;
  };
  const longestColumn = (x, from, to) => {
    let bestRun = 0;
    let run = 0;
    let gap = 0;
    for (let y = from; y < to; y += 1) {
      if (dark(x, y)) { run += 1 + gap; gap = 0; if (run > bestRun) bestRun = run; }
      else if (run && gap < 3) gap += 1;
      else { run = 0; gap = 0; }
    }
    return bestRun;
  };
  const rowHits = [];
  for (let y = 0; y < height; y += 1) if (longestRow(y, 0, width) > width * 0.3) rowHits.push(y);
  const ys = clusterLines(rowHits);
  if (ys.length < 3) return null;
  const top = ys[0];
  const bottom = ys[ys.length - 1];
  const colHits = [];
  for (let x = 0; x < width; x += 1) if (longestColumn(x, top, bottom + 1) > (bottom - top) * 0.3) colHits.push(x);
  const xs = clusterLines(colHits);
  if (xs.length < 3) return null;
  const rowCount = ys.length - 1;
  const colCount = xs.length - 1;
  if (rowCount * colCount > 900) return null;
  // هل الخط الفاصل بين خانتين موجود فعلًا؟
  const verticalWall = (row, column) => {
    let hits = 0;
    let seen = 0;
    for (let y = ys[row] + 4; y < ys[row + 1] - 4; y += 2) {
      seen += 1;
      for (let dx = -3; dx <= 3; dx += 1) if (dark(Math.min(width - 1, Math.max(0, xs[column] + dx)), y)) { hits += 1; break; }
    }
    return seen < 3 || hits / seen > 0.6;
  };
  const horizontalWall = (row, column) => {
    let hits = 0;
    let seen = 0;
    for (let x = xs[column] + 4; x < xs[column + 1] - 4; x += 2) {
      seen += 1;
      for (let dy = -3; dy <= 3; dy += 1) if (dark(x, Math.min(height - 1, Math.max(0, ys[row] + dy)))) { hits += 1; break; }
    }
    return seen < 3 || hits / seen > 0.6;
  };
  const parent = Array.from({ length: rowCount * colCount }, (_, index) => index);
  const find = (index) => (parent[index] === index ? index : (parent[index] = find(parent[index])));
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < colCount; column += 1) {
      if (column + 1 < colCount && !verticalWall(row, column + 1)) parent[find(row * colCount + column + 1)] = find(row * colCount + column);
      if (row + 1 < rowCount && !horizontalWall(row + 1, column)) parent[find((row + 1) * colCount + column)] = find(row * colCount + column);
    }
  }
  const regions = new Map();
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < colCount; column += 1) {
      const key = find(row * colCount + column);
      const region = regions.get(key) || { row, column, lastRow: row, lastColumn: column };
      region.row = Math.min(region.row, row);
      region.column = Math.min(region.column, column);
      region.lastRow = Math.max(region.lastRow, row);
      region.lastColumn = Math.max(region.lastColumn, column);
      regions.set(key, region);
    }
  }
  const cells = [...regions.values()].map((region) => {
    const cell = { ...region, x0: xs[region.column] + 3, y0: ys[region.row] + 3, x1: xs[region.lastColumn + 1] - 3, y1: ys[region.lastRow + 1] - 3 };
    let inked = 0;
    let seen = 0;
    for (let y = cell.y0 + 3; y < cell.y1 - 3; y += 3) {
      for (let x = cell.x0 + 3; x < cell.x1 - 3; x += 3) { seen += 1; if (dark(x, y)) inked += 1; }
    }
    // رقم واحد أو كلمة صغيرة في خانة واسعة حبرها قليل كنسبة، فبنعدّ النقط الغامقة نفسها كمان
    cell.ink = cell.x1 - cell.x0 > 14 && cell.y1 - cell.y0 > 10 && seen > 4 && (inked / seen > 0.012 || (inked >= 6 && inked / seen > 0.0015));
    return cell;
  });
  // ارتفاع سطر الكتابة جوه الخانة، عشان نكبّر أو نصغّر الخانة للحجم اللي القارئ بيقراه أحسن
  const lineHeight = (cell) => {
    const runs = [];
    let run = 0;
    for (let y = cell.y0 + 2; y <= cell.y1 - 2; y += 1) {
      let inked = 0;
      for (let x = cell.x0 + 2; x < cell.x1 - 2 && inked < 2; x += 1) if (dark(x, y)) inked += 1;
      if (inked >= 2) run += 1;
      else { if (run >= 5) runs.push(run); run = 0; }
    }
    if (run >= 5) runs.push(run);
    return median(runs);
  };
  return { rowCount, colCount, cells, top, bottom, left: xs[0], right: xs[xs.length - 1], lineHeight };
}
function cropCanvas(canvas, x0, y0, x1, y1, scale) {
  const w = Math.max(8, x1 - x0);
  const h = Math.max(8, y1 - y0);
  const pad = 10;
  const copy = document.createElement("canvas");
  copy.width = Math.ceil(w * scale + pad * 2);
  copy.height = Math.ceil(h * scale + pad * 2);
  const context = copy.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, copy.width, copy.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(canvas, x0, y0, w, h, pad, pad, w * scale, h * scale);
  return copy;
}
async function matrixFromCanvas(reader, canvas, onProgress, base = 0.2, share = 0.7) {
  const grid = detectGrid(canvas);
  if (!grid) return null;
  const jobs = grid.cells.filter((cell) => cell.ink);
  const matrix = Array.from({ length: grid.rowCount }, () => new Array(grid.colCount).fill(""));
  const spans = new Map();
  for (let index = 0; index < jobs.length; index += 1) {
    const cell = jobs[index];
    onProgress?.({ text: `جارٍ قراءة خانات الجدول ${index + 1} من ${jobs.length}`, ratio: base + ((index + 1) / jobs.length) * share });
    const text = await readRegion(reader, canvas, cell, grid.lineHeight(cell));
    matrix[cell.row][cell.column] = text;
    if (cell.lastColumn > cell.column) spans.set(`${cell.row}:${cell.column}`, cell.lastColumn - cell.column + 1);
  }
  // الشريط اللي فوق الجدول غالبًا فيه رقم الفصل
  let headText = "";
  if (grid.top > 40) {
    try { headText = await readRegion(reader, canvas, { x0: 0, y0: 0, x1: canvas.width, y1: grid.top - 2 }, grid.lineHeight({ x0: 0, y0: 0, x1: canvas.width, y1: grid.top - 2 })); } catch { headText = ""; }
  }
  return { matrix, spans, headText };
}
function wordsToTokens(data, wanted) {
  return (data?.words || []).map((word) => {
    const box = word.bbox || {};
    const text = String(word.text || "").replace(OCR_MARKS, "").trim();
    if (!text || box.x1 == null || !wanted(text, word.confidence ?? 0)) return null;
    return { text, x: box.x0, y: (box.y0 + box.y1) / 2, w: Math.max(4, box.x1 - box.x0), h: Math.max(8, box.y1 - box.y0) };
  }).filter(Boolean);
}
async function slotsFromCanvas(reader, canvas, kind, onProgress, base, share) {
  const candidates = [];
  let classHint = "";
  let rowsText = "";
  const found = await matrixFromCanvas(reader, canvas, onProgress, base, share);
  if (found) {
    classHint = findClass(found.headText) || "";
    const head = found.headText.split("\n").filter(Boolean).map((line) => [line]);
    candidates.push({ ...parseTimetable([...head, ...found.matrix], kind, { spans: shiftSpans(found.spans, head.length) }), source: "خطوط الجدول" });
    rowsText = rowsToText([...head, ...found.matrix]);
  }
  const top = candidates[0];
  if (!top || top.slots.length < 2) {
    // مفيش خطوط واضحة: بنقرا الصفحة كلها ونرتّب الكلمات بمواضعها
    onProgress?.({ text: "الجدول من غير خطوط واضحة، جارٍ قراءة الصفحة كلها…", ratio: base + share * 0.9 });
    const [arabicData, englishData] = await reader.read(canvas);
    const english = wordsToTokens(englishData, (text, conf) => conf >= 55 && /[A-Za-z]{2}|\d/.test(text) && !/[\u0600-\u06FF]/.test(text));
    const overlaps = (word) => english.some((other) => Math.abs(other.y - word.y) < word.h * 0.5 && Math.min(other.x + other.w, word.x + word.w) - Math.max(other.x, word.x) > Math.min(other.w, word.w) * 0.5);
    const arabic = wordsToTokens(arabicData, (text, conf) => conf >= 35 && (text.match(/[\u0600-\u06FF]/g) || []).length >= 2).filter((word) => !overlaps(word));
    const tokens = [...english, ...arabic];
    const rows = tokens.length >= 4 ? tableFromTokens(tokens) : [];
    if (!classHint) classHint = rows.map((row) => findClass(row.join(" "))).find(Boolean) || "";
    candidates.push({ ...parseTimetable(rows, kind), source: "قراءة الصفحة" });
    if (!rowsText) rowsText = rowsToText(rows);
  }
  candidates.sort((a, b) => b.score - a.score);
  return { ...(candidates[0] || { slots: [], strategy: "", score: -Infinity }), classHint, rowsText };
}
function shiftSpans(spans, offset) {
  if (!offset) return spans;
  const moved = new Map();
  spans.forEach((value, key) => {
    const [row, column] = key.split(":").map(Number);
    moved.set(`${row + offset}:${column}`, value);
  });
  return moved;
}

// ---------- Excel / CSV ----------
async function rowsFromSheet(file, type) {
  await loadLib(LIB.xlsx, "قارئ Excel");
  let book;
  if (type === "csv") {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (text.includes("�")) text = new TextDecoder("windows-1256").decode(bytes); // ملفات CSV العربي القديمة من Excel
    book = XLSX.read(text.replace(/^﻿/, ""), { type: "string", raw: true });
  } else {
    book = XLSX.read(await file.arrayBuffer(), { type: "array" });
  }
  const tables = [];
  book.SheetNames.forEach((name) => {
    const sheet = book.Sheets[name];
    if (!sheet || !sheet["!ref"]) return;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" }).map((row) => row.map((cell) => String(cell ?? "").trim()));
    const origin = XLSX.utils.decode_range(sheet["!ref"]).s;
    // الخانات المدموجة: القيمة بتتكرر في كل خانات الدمج
    (sheet["!merges"] || []).forEach((merge) => {
      const value = rows[merge.s.r - origin.r]?.[merge.s.c - origin.c] || "";
      if (!value) return;
      for (let row = merge.s.r; row <= merge.e.r; row += 1) {
        for (let column = merge.s.c; column <= merge.e.c; column += 1) {
          const target = rows[row - origin.r];
          if (target) target[column - origin.c] = value;
        }
      }
    });
    if (rows.some((row) => row.some(Boolean))) tables.push({ name, rows });
  });
  return tables;
}

// ---------- الذكاء الاصطناعي ----------
// بنبعت للدالة نص الجدول المستخرج (وصورته لو صورة)، وهي بترجّع صفوف منظمة. النتيجة بتعدّي على نفس المنسّق وشاشة المراجعة.
function rowsToText(rows) {
  return (rows || []).map((row) => (Array.isArray(row) ? row : [row]).map((cell) => String(cell ?? "").replace(/\s*\n\s*/g, " / ").trim()).join(" | ")).filter((line) => line.replace(/[|\s]/g, "")).join("\n");
}
function canvasDataUrl(canvas) {
  const scale = Math.min(1, 1700 / Math.max(canvas.width, canvas.height));
  const copy = document.createElement("canvas");
  copy.width = Math.round(canvas.width * scale);
  copy.height = Math.round(canvas.height * scale);
  const context = copy.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, copy.width, copy.height);
  context.drawImage(canvas, 0, 0, copy.width, copy.height);
  return copy.toDataURL("image/jpeg", 0.82);
}
const AI_ERRORS = {
  unauthorized: "الجلسة انتهت أو الحساب من غير صلاحية. سجّل دخولك تاني.",
  forbidden: "الدالة مش مسموح تتنادى من العنوان ده.",
  not_configured: "مفتاح Groq مش متضاف في أسرار الدوال.",
  not_deployed: "دالة الذكاء الاصطناعي (jadwali-import) مش منشورة.",
  bad_key: "مفتاح Groq مرفوض. راجعه في أسرار الدوال.",
  too_large: "الصورة كبيرة على النموذج.",
  network: "الاتصال بالنموذج قطع.",
};
function aiErrorText(out) {
  if (out.error === "busy") return `النموذج عليه ضغط. جرّب بعد ${out.retry || 20} ثانية.`;
  if (out.error === "quota") return "حد النموذج اليومي خلص. جرّب بعدين.";
  return AI_ERRORS[out.error] || "النموذج ما قدرش يقرا الجدول.";
}
async function aiExtract({ kind, text = "", image = "", classNumber = "" }) {
  const { data } = await client.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return { ok: false, error: "unauthorized" };
  let response;
  try {
    response = await fetch(`${config.url}/functions/v1/${window.JADWALI_IMPORT_FN || "jadwali-import"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: config.key },
      body: JSON.stringify({ kind, text: String(text).slice(0, 24000), image, classNumber }),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  if (response.status === 404) return { ok: false, error: "not_deployed" };
  let out = {};
  try { out = await response.json(); } catch { /* رد فاضي */ }
  if (!response.ok || !Array.isArray(out.rows)) return { ok: false, error: out.error || "failed", retry: out.retry };
  // رقم الفصل: من الصف نفسه، وإلا من عنوان الجدول في النص، وإلا اللي الأدمن كتبه
  const fallback = classNumber || String(text).split("\n").slice(0, 12).map(findClass).find(Boolean) || "";
  const slots = formatSlots(out.rows.map((row) => ({ ...row, classNumber: row.classNumber || fallback })), kind);
  return { ok: slots.length > 0, error: slots.length ? "" : "failed", slots, model: out.model || "", via: out.via || "" };
}
// نسبة الصفوف اللي فيها مشكلة غير رقم الفصل
function weakShare(slots, kind) {
  if (!slots.length) return 1;
  return slots.filter((slot) => {
    const issues = slotIssues(slot, kind);
    delete issues.classNumber;
    return Object.keys(issues).length > 0;
  }).length / slots.length;
}

// ---------- القراءة الكاملة ----------
// بيرجّع { slots, strategy, source, classHint, pages, warnings }.
async function extractTimetable(file, kind, onProgress) {
  const type = fileKind(file);
  const warnings = [];
  // عند التعادل بنفضّل المرشّح الأول (الأدق في البنية)
  const pickBest = (candidates) => candidates.filter((item) => item && item.slots.length).reduce((best, item) => (item.score > best.score + 0.01 ? item : best), { slots: [], strategy: "", score: -Infinity });
  const withClass = (slots, number) => slots.map((slot) => (slot.classNumber || !number ? slot : { ...slot, classNumber: number }));

  if (type === "sheet" || type === "csv") {
    onProgress?.({ text: "جارٍ قراءة الملف…", ratio: 0.3 });
    const tables = await rowsFromSheet(file, type);
    const parts = tables.map((table) => {
      const result = parseTimetable(table.rows, kind);
      const sheetClass = findClass(table.name) || (/^\d{1,3}$/.test(table.name.trim()) ? table.name.trim() : "");
      return { ...result, slots: withClass(result.slots, sheetClass) };
    }).filter((part) => part.slots.length);
    const text = tables.map((table) => `${tables.length > 1 ? `ورقة: ${table.name}\n` : ""}${rowsToText(table.rows)}`).join("\n\n");
    return { slots: parts.flatMap((part) => part.slots), strategy: parts[0]?.strategy || "", source: type === "csv" ? "CSV" : "Excel", classHint: "", pages: tables.length, warnings, ai: { text } };
  }

  if (type === "pdf") {
    onProgress?.({ text: "جارٍ فتح ملف الـ PDF…", ratio: 0.05 });
    const pdf = await openPdf(await file.arrayBuffer());
    const limit = Math.min(pdf.numPages, 40);
    if (pdf.numPages > limit) warnings.push(`الملف ${pdf.numPages} صفحة، اتقرا أول ${limit} بس.`);
    const all = [];
    const scanned = [];
    const pageTexts = [];
    let aiImage = "";
    let hint = "";
    let strategy = "";
    for (let number = 1; number <= limit; number += 1) {
      onProgress?.({ text: `جارٍ قراءة صفحة ${number} من ${limit}`, ratio: 0.1 + (number / limit) * 0.4 });
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      const items = content.items.filter((item) => String(item.str || "").trim());
      if (items.length < 12) { scanned.push(number); continue; }
      const pageClass = classNumberNear(items);
      if (!hint) hint = pageClass;
      const viewport = page.getViewport({ scale: 1 });
      const tokens = pdfTokens(items, viewport.height);
      const candidates = [];
      if (number <= 15) {
        try {
          const canvas = await renderPdfPage(page);
          const grid = detectGrid(canvas);
          const table = grid && matrixFromPdfText(grid, tokens, canvas.width / viewport.width);
          if (table) {
            candidates.push({ ...parseTimetable(table.rows, kind, { spans: table.spans }), source: "خطوط الجدول" });
            pageTexts.push(rowsToText(table.rows));
          }
        } catch { /* الصفحة ما اترسمتش، نكمّل بالنص */ }
      }
      const plainRows = tableFromTokens(tokens);
      if (pageTexts.length < number) pageTexts.push(rowsToText(plainRows));
      candidates.push({ ...parseTimetable(plainRows, kind), source: "نص الملف" });
      if (kind === "lectures") {
        const tuned = formatSlots(academySlotsFromItems(items), kind);
        if (tuned.length) candidates.push({ slots: tuned, strategy: "جدول الأكاديمية", score: scoreSlots(tuned, kind), source: "نص الملف" });
      }
      const best = pickBest(candidates);
      if (!best.slots.length) { if (items.length < 60) scanned.push(number); continue; }
      strategy = strategy || best.strategy;
      all.push(...withClass(best.slots, pageClass));
    }
    if (scanned.length && (!all.length || scanned.length >= limit / 2)) {
      // صفحات متصورة (سكانر): بنرسمها ونقراها بالـ OCR
      const pages = scanned.slice(0, 6);
      if (scanned.length > pages.length) warnings.push(`في ${scanned.length} صفحة متصورة، اتقرا أول ${pages.length} بس.`);
      const reader = await openReader(onProgress);
      try {
        for (let index = 0; index < pages.length; index += 1) {
          const page = await pdf.getPage(pages[index]);
          const canvas = await renderPdfPage(page);
          if (!aiImage) aiImage = canvasDataUrl(canvas);
          const result = await slotsFromCanvas(reader, canvas, kind, onProgress, 0.2 + (index / pages.length) * 0.75, 0.75 / pages.length);
          pageTexts.push(result.rowsText || "");
          if (!hint) hint = result.classHint;
          strategy = strategy || result.strategy;
          all.push(...withClass(result.slots, result.classHint));
        }
      } finally {
        await reader.terminate();
      }
      return { slots: all, strategy, source: "PDF متصوّر (OCR)", classHint: hint, pages: limit, warnings, ai: { text: pageTexts.filter(Boolean).join("\n\n"), image: pages.length === 1 ? aiImage : "" } };
    }
    return { slots: all, strategy, source: "PDF نصي", classHint: hint, pages: limit, warnings, ai: { text: pageTexts.filter(Boolean).join("\n\n") } };
  }

  // صورة
  onProgress?.({ text: "جارٍ تجهيز الصورة…", ratio: 0.04 });
  const canvas = await canvasFromImage(file);
  const reader = await openReader(onProgress);
  try {
    const result = await slotsFromCanvas(reader, canvas, kind, onProgress, 0.2, 0.75);
    return { slots: result.slots, strategy: result.strategy, source: "صورة (OCR)", classHint: result.classHint, pages: 1, warnings, ai: { text: result.rowsText || "", image: canvasDataUrl(canvas) } };
  } finally {
    await reader.terminate();
  }
}

// ---------- ربط الواجهة ----------
function uploadProgress(update) {
  const box = document.getElementById("upload-status");
  if (!box) return;
  if (!update) { box.hidden = true; box.innerHTML = ""; return; }
  const ratio = Math.round(Math.min(1, Math.max(0, update.ratio ?? 0)) * 100);
  box.hidden = false;
  box.className = `upload-status${update.error ? " bad" : update.done ? " ok" : ""}`;
  box.innerHTML = `<div class="upload-status-row"><span class="upload-file">${icon(update.error ? "close" : "export", 18)}<b>${esc(update.name || "")}</b>${update.size ? `<small>${esc(update.size)}</small>` : ""}</span><span class="upload-pct">${update.error || update.done ? "" : `${ratio}%`}</span></div>
    <p class="upload-text">${esc(update.text || "")}</p>
    ${update.error || update.done ? "" : `<div class="upload-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${ratio}"><span style="width:${ratio}%"></span></div>`}
    ${update.tips ? `<ul class="upload-tips">${update.tips.map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>` : ""}
    ${update.error ? `<div class="row"><button type="button" class="ghost sm" id="upload-manual">افتح جدول فاضي واكتب يدوي</button></div>` : ""}`;
}
let uploadBusy = false;
async function readUpload(file) {
  if (uploadBusy) return UI.toast("في ملف بيتقرا دلوقتي. استنى لما يخلص.", "warn");
  const kind = document.querySelector("[name=upload-kind]:checked")?.value || "lectures";
  const meta = { name: file?.name || "", size: file ? fileSizeLabel(file.size) : "" };
  const problem = validateUpload(file);
  if (problem) {
    uploadProgress({ ...meta, error: true, text: problem });
    UI.toast(problem, "error");
    return;
  }
  uploadBusy = true;
  document.getElementById("upload-drop")?.classList.add("busy");
  uploadProgress({ ...meta, text: "جارٍ قراءة الملف…", ratio: 0.02 });
  try {
    const result = await extractTimetable(file, kind, (update) => uploadProgress({ ...meta, ...update }));
    const sectionId = document.getElementById("upload-section")?.value || state.uploadSection || "";
    const typedClass = latin(document.getElementById("upload-class")?.value || "").replace(/\D/g, "");
    const withClass = (list) => list.map((slot) => ({ ...slot, classNumber: typedClass || slot.classNumber || result.classHint || "" }));
    const variants = { local: withClass(result.slots) };
    const aiSource = result.ai && (result.ai.image || (result.ai.text || "").trim().length >= 20) ? { ...result.ai, kind, classNumber: typedClass || result.classHint || (new Set(variants.local.map((slot) => slot.classNumber).filter(Boolean)).size === 1 ? variants.local[0].classNumber : "") } : null;
    let variant = "local";
    let aiModel = "";
    // الذكاء الاصطناعي بيشتغل لوحده لما القراءة المحلية ضعيفة أو المصدر صورة، وممكن يتطلب يدوي من شاشة المراجعة
    const useAi = document.getElementById("upload-ai")?.checked !== false;
    const weak = !variants.local.length || weakShare(variants.local, kind) > 0.25 || /OCR/.test(result.source || "");
    if (aiSource && useAi && weak) {
      uploadProgress({ ...meta, text: "جارٍ التحليل بالذكاء الاصطناعي…", ratio: 0.96 });
      const ai = await aiExtract(aiSource);
      if (ai.ok) {
        variants.ai = withClass(ai.slots);
        aiModel = ai.model;
        // الأنضف يكسب: صفوف أكتر مكتملة ومشاكل أقل
        if (!variants.local.length || scoreSlots(variants.ai, kind) > scoreSlots(variants.local, kind)) variant = "ai";
      } else if (!variants.local.length) {
        result.warnings.push(`الذكاء الاصطناعي: ${aiErrorText(ai)}`);
      } else {
        UI.toast(`الذكاء الاصطناعي ما اشتغلش (${aiErrorText(ai)}) فكملنا بالقراءة العادية.`, "warn", { duration: 6000 });
      }
    }
    const slots = variants[variant];
    if (!slots.length) {
      uploadProgress({
        ...meta,
        error: true,
        text: "ما قدرناش نطلّع محاضرات من الملف ده.",
        tips: [...result.warnings, ...(fileKind(file) === "image" || /OCR/.test(result.source || "")
          ? ["صوّر الجدول كامل ومفرود ومن غير ميل.", "خلّي الإضاءة كويسة والكلام واضح ومش مهزوز.", "لو عندك نسخة PDF أو Excel من الجدول ارفعها، قراءتها أدق."]
          : ["اتأكد إن الملف فيه جدول فيه أيام ومواعيد ومواد.", kind === "exams" ? "لو ده جدول محاضرات اختار «جدول محاضرات» فوق." : "لو ده جدول امتحانات اختار «جدول امتحانات» فوق.", "تقدر تفتح جدول فاضي وتكتب الصفوف يدوي."])],
      });
      UI.toast("ما قدرناش نقرا الجدول من الملف.", "error");
      return;
    }
    uploadProgress({ ...meta, done: true, text: `اتقرا ${slots.length} صف${variant === "ai" ? " بالذكاء الاصطناعي" : ""}. راجعهم قبل النشر.` });
    openReview({ kind, sectionId, slots, fileName: file.name, source: result.source, strategy: result.strategy, warnings: result.warnings, variants, variant, aiSource, aiModel });
  } catch (error) {
    console.error(error);
    uploadProgress({ ...meta, error: true, text: error?.message || "الملف ما اتقراش." });
    UI.toast(error?.message || "الملف ما اتقراش.", "error");
  } finally {
    uploadBusy = false;
    document.getElementById("upload-drop")?.classList.remove("busy");
    const input = document.getElementById("upload-file");
    if (input) input.value = "";
  }
}

// معاينة بشكل موقع الطلبة
function previewLectures(slots) {
  const times = [...new Set(slots.map((slot) => slot.start).filter(Boolean))].sort((a, b) => timeMinutes(a) - timeMinutes(b));
  if (!times.length) return `<p class="muted">مفيش مواعيد سليمة للمعاينة.</p>`;
  return `<div class="site-preview"><div class="table-wrap"><table><thead><tr><th>الوقت</th>${DAYS.map((day) => `<th>${day}</th>`).join("")}</tr></thead><tbody>${times.map((start) => `<tr><td class="time-col" dir="ltr">${esc(start)}</td>${DAYS.map((day) => {
    const slot = slots.find((item) => item.day === day && item.start === start);
    return `<td>${slot ? `<div class="pv-cell" style="--c:${subjectColor(slot.subject)}"><b>${esc(slot.subject)}</b>${slot.instructor ? `<span class="muted">${esc(slot.instructor)}</span>` : ""}${slot.room ? `<span dir="ltr">${esc(slot.room)}</span>` : ""}</div>` : ""}</td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div></div>`;
}
