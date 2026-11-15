const CACHE = "jadwali-html-59";
const DATA_CACHE = "jadwali-data-2";
const FILES = ["./", "./index.html", "./css/tokens.css", "./css/styles.css", "./js/theme.js", "./js/ui.js", "./js/supabase-config.js", "./js/data.js", "./js/app/core.js", "./js/app/views.js", "./js/app/assistant.js", "./js/app/share.js", "./js/app/push.js", "./js/app/sync.js", "./js/app/events.js", "./js/app/boot.js", "./js/firebase.js", "./jadwali-logo.jpg", "./favicon.svg", "./manifest.webmanifest", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];
let calendarIcs = "";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== DATA_CACHE && key !== "jadwali-ics").map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

// ---------- بيانات الجدول بدون إنترنت ----------
// طلبات القراءة العامة من سوبا بيس بتتحفظ، ولو النت وقع بنرجّع آخر نسخة ومعاها علامة x-jadwali-cache.
function isDataRequest(request, url) {
  return request.method === "GET" && url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/v1/") && !url.pathname.startsWith("/rest/v1/rpc/");
}
function dataKey(request, url) {
  return new Request(`${self.location.origin}/__jadwali_data__?u=${encodeURIComponent(url.href)}&r=${encodeURIComponent(request.headers.get("Range") || "")}`);
}
async function dataFirst(request, url) {
  const cache = await caches.open(DATA_CACHE);
  const key = dataKey(request, url);
  const saved = await cache.match(key);
  const controller = new AbortController();
  // لو في نسخة محفوظة والنت بطيء، ما نستناش أكتر من 6 ثواني
  const timer = saved ? setTimeout(() => controller.abort(), 6000) : null;
  try {
    const response = await fetch(new Request(request, { signal: controller.signal }));
    if (timer) clearTimeout(timer);
    if (response.ok || response.status === 206) {
      const body = await response.clone().text();
      const headers = new Headers({ "content-type": response.headers.get("content-type") || "application/json" });
      const range = response.headers.get("content-range");
      if (range) headers.set("content-range", range);
      headers.set("x-jadwali-saved", String(Date.now()));
      await cache.put(key, new Response(body, { status: 200, headers }));
    }
    return response;
  } catch (error) {
    if (timer) clearTimeout(timer);
    if (saved) {
      const headers = new Headers(saved.headers);
      headers.set("x-jadwali-cache", "hit");
      return new Response(await saved.text(), { status: 200, headers });
    }
    throw error;
  }
}

function sameOrigin(value) {
  try {
    const url = new URL(value || "./", self.registration.scope);
    if (url.origin !== self.location.origin) return new URL("./", self.registration.scope).href;
    return url.href;
  } catch {
    return new URL("./", self.registration.scope).href;
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const path = url.pathname;
  if (path.endsWith("/calendar.ics")) {
    event.respondWith(
      new Response(calendarIcs || "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Jadwali//AR\r\nEND:VCALENDAR\r\n", {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": "inline; filename=\"jadwali.ics\"",
        },
      }),
    );
    return;
  }
  if (isDataRequest(event.request, url)) {
    event.respondWith(dataFirst(event.request, url));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(new Request(event.request, { cache: "no-store" })).catch(() => caches.match(event.request).then((hit) => hit || caches.match("./index.html"))));
});

// ---------- إشعارات من الخادم (Web Push) ----------
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "جدولي", {
      body: data.body || "",
      icon: "icon-192.png",
      badge: "icon-192.png",
      lang: "ar",
      dir: "rtl",
      tag: data.tag || "jadwali",
      renotify: true,
      data: { url: sameOrigin(data.url || "./") },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = sameOrigin((event.notification.data && event.notification.data.url) || "./");
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.registration.scope) && "focus" in client) {
          if ("navigate" in client) client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.origin && event.origin !== self.location.origin) return;
  const data = event.data || {};
  if (data.type === "ics") {
    calendarIcs = String(data.body || "");
    event.ports[0]?.postMessage({ ok: true });
    return;
  }
  if (data.type !== "notify") return;
  event.waitUntil(
    self.registration.showNotification(data.title || "جدولي", {
      body: data.body || "",
      icon: "jadwali-logo.jpg",
      lang: "ar",
      dir: "rtl",
      tag: data.tag || "jadwali",
      renotify: true,
    }),
  );
});
