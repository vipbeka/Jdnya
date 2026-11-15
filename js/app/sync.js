// المزامنة مع Supabase: الإعدادات العامة، الجداول المنشورة، والتحديث اللحظي.
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
