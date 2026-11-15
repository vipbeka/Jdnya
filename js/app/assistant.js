// مساعد «اسأل جدولي»: واجهة المحادثة، الردود المحلية، والاتصال بالنموذج.
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
