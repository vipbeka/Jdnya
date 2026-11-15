// الإشعارات: Web Push من الخادم، والتنبيهات المحلية قبل المحاضرات والامتحانات.
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
