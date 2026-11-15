// المشاركة والتصدير: صور الجدول (Canvas)، لينك الفصل، وتقويم ICS.
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
    if (!blob) return UI.toast("معرفناش نجهّز الصورة. جرّب تاني.", "error");
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "جدولي", text }); return; } catch { return; }
    }
    UI.download(filename, blob);
    UI.toast("الصورة اتنزّلت", "success");
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
    UI.download("jadwali.png", blob);
    UI.toast("صورة الجدول اتنزّلت", "success");
  });
}

// ---------- تصدير إضافي: لينك، CSV، تقويم، وطباعة ----------
function classUrl(saved) {
  return `${location.origin}${location.pathname}${location.search}#/c/${encodeURIComponent(saved.schedule.sectionId)}/${encodeURIComponent(saved.schedule.classNumber)}`;
}
async function copyClassLink(saved) {
  const ok = await UI.copy(classUrl(saved));
  UI.toast(ok ? "لينك الفصل اتنسخ" : "معرفناش ننسخ اللينك. جرّب «ابعت لينك الفصل».", ok ? "success" : "error");
}
function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function exportCsv(saved) {
  const head = ["اليوم", "من", "إلى", "المادة", "المحاضر", "القاعة", "الحالة"];
  const rows = sortSlots(saved.schedule.slots).map((slot) => [
    slot.day,
    clock(slot.start),
    clock(slot.end),
    readable(slot.subject),
    readable(slot.instructor),
    slot.room,
    slot.status === "cancelled" ? "اتلغت" : slot.status === "moved" ? "اتأجلت" : "في معادها",
  ]);
  const csv = [head, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  // BOM عشان Excel يقرأ العربي صح
  UI.download(`jadwali-class-${saved.schedule.classNumber}.csv`, `\ufeff${csv}`, "text/csv;charset=utf-8");
  UI.toast("ملف CSV اتنزّل", "success");
}
function exportIcs(saved) {
  UI.download("jadwali.ics", buildCalendar(saved), "text/calendar;charset=utf-8");
  UI.toast("ملف التقويم اتنزّل. افتحه عشان المواعيد تتضاف.", "success");
}
function printTable() {
  // الطباعة دايمًا بعرض الشبكة: ده الشكل اللي بيتقري على ورقة
  const previous = ui.mode;
  const restore = () => {
    window.removeEventListener("afterprint", restore);
    if (ui.mode !== previous) { ui.mode = previous; render(true); }
  };
  if (ui.mode !== "grid") {
    ui.mode = "grid";
    render(true);
    window.addEventListener("afterprint", restore);
  }
  setTimeout(() => window.print(), 60);
}
