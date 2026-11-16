// لوحة الإدارة — عمليات الحفظ والحذف والنشر.
function valueOf(form, name) {
  return String(new FormData(form).get(name) ?? "").trim();
}

async function saveSection(form) {
  const payload = {
    id: valueOf(form, "id"),
    title: valueOf(form, "title"),
    major: valueOf(form, "major"),
    language: valueOf(form, "language"),
    year: valueOf(form, "year"),
    year_label: valueOf(form, "year_label"),
  };
  if (!owns(payload.id)) return;
  const exists = state.sections.some((item) => item.id === payload.id);
  const saved = await write(exists
    ? client.from("sections").update(payload).eq("id", payload.id)
    : client.from("sections").insert(payload));
  if (!saved) return;
  await markPublished();
  await log(exists ? "تعديل" : "إضافة", "شعبة", payload.title);
  await reload("الشعبة اتحفظت وظهرت على الموقع.");
}
async function saveClass(form) {
  const id = valueOf(form, "id");
  const payload = { section_id: valueOf(form, "section_id"), class_number: clip(valueOf(form, "class_number"), 12), group_name: clip(valueOf(form, "group_name"), 40) };
  if (!owns(payload.section_id)) return;
  const saved = await write(id
    ? client.from("classes").update(payload).eq("id", id)
    : client.from("classes").insert(payload));
  if (!saved) return;
  await markPublished();
  await log(id ? "تعديل" : "إضافة", "فصل", `${payload.class_number}`);
  await reload("الفصل اتحفظ وظهر على الموقع.");
}
async function touchClass(classId) {
  if (!classId) return;
  await client.from("classes").update({ revised_at: new Date().toISOString() }).eq("id", classId);
}
async function saveLecture(form) {
  const id = valueOf(form, "id");
  const start = valueOf(form, "start_time");
  const payload = {
    class_id: valueOf(form, "class_id"),
    day: valueOf(form, "day"),
    start_time: start,
    end_time: TIME_END[start] || "",
    subject: clip(valueOf(form, "subject"), 120),
    instructor: clip(valueOf(form, "instructor"), 80),
    room: clip(valueOf(form, "room"), 40),
    status: ["active", "cancelled", "moved"].includes(valueOf(form, "status")) ? valueOf(form, "status") : "active",
    note: clip(valueOf(form, "note"), 160),
    moved_day: valueOf(form, "status") === "moved" ? valueOf(form, "moved_day") : "",
    moved_start: valueOf(form, "status") === "moved" ? valueOf(form, "moved_start") : "",
  };
  const sectionId = state.classes.find((item) => item.id === payload.class_id)?.section_id;
  if (!owns(sectionId)) return;
  const saved = await write(id ? client.from("lectures").update(payload).eq("id", id) : client.from("lectures").insert(payload));
  if (!saved) return;
  await touchClass(payload.class_id);
  await markPublished();
  await log(id ? "تعديل" : "إضافة", "محاضرة", payload.subject);
  await reload("المحاضرة اتحفظت وظهرت في جدول الفصل.");
}
async function saveHoliday(form) {
  if (!canSettings()) return;
  const payload = { holiday_date: valueOf(form, "holiday_date"), name: clip(valueOf(form, "name"), 80) };
  const saved = await write(client.from("holidays").insert(payload));
  if (!saved) return;
  await log("إضافة", "إجازة", `${payload.holiday_date} ${payload.name}`);
  await reload("الإجازة اتضافت وهتختفي من يوم الطلبة.");
}
async function saveExam(form) {
  const id = valueOf(form, "id");
  const payload = {
    title: clip(valueOf(form, "title"), 120),
    subject: clip(valueOf(form, "subject"), 120),
    section_id: valueOf(form, "section_id") || null,
    class_number: clip(valueOf(form, "class_number"), 12),
    exam_date: valueOf(form, "exam_date") || null,
    start_time: valueOf(form, "start_time"),
    end_time: valueOf(form, "end_time"),
    room: clip(valueOf(form, "room"), 40),
    notes: clip(valueOf(form, "notes"), 200),
  };
  if (payload.section_id && !owns(payload.section_id)) return;
  const saved = await write(id ? client.from("exams").update(payload).eq("id", id) : client.from("exams").insert(payload));
  if (!saved) return;
  await markPublished();
  await log(id ? "تعديل" : "إضافة", "امتحان", payload.title);
  await reload("الامتحان اتحفظ وظهر في صفحة الامتحانات.");
}
async function writeKb(entries, message) {
  const text = entries.map((item) => `${item.q.replace(/\|/g, "/")} | ${item.a}`).join("\n");
  const result = await client.from("settings").update({ assistant_kb: text, updated_at: new Date().toISOString() }).eq("id", "public");
  if (result.error) return fail(/assistant_kb/.test(result.error.message || "") ? { message: "شغّل ملف sql/assistant_kb.sql مرة واحدة من محرر SQL في سوبا بيس، وبعدين جرّب تاني." } : result.error);
  await log("تعديل", "اسأل جدولي", message);
  await reload(message);
}
async function saveKb(form) {
  if (!isSuper()) return;
  const q = clip(valueOf(form, "q"), 120);
  const a = clip(valueOf(form, "a"), 300);
  if (!q || !a) return;
  const entries = kbEntries();
  const at = valueOf(form, "index");
  if (at !== "" && entries[Number(at)]) {
    entries[Number(at)] = { q, a };
    return writeKb(entries, "السؤال اتعدّل.");
  }
  if (entries.length >= 40) return fail({ message: "وصلت للحد الأقصى 40 سؤال. احذف سؤال قبل ما تضيف." });
  entries.push({ q, a });
  return writeKb(entries, "السؤال اتضاف.");
}
async function removeKb(id) {
  if (!isSuper()) return;
  const entries = kbEntries();
  if (!entries[Number(id)]) return;
  entries.splice(Number(id), 1);
  return writeKb(entries, "السؤال اتحذف.");
}
async function saveAbout(form) {
  if (!isSuper()) return;
  const payload = {
    about_lead: valueOf(form, "about_lead"),
    about_why: valueOf(form, "about_why"),
    programmer_name: valueOf(form, "programmer_name"),
    whatsapp: valueOf(form, "whatsapp"),
    portfolio: valueOf(form, "portfolio"),
    updated_at: new Date().toISOString(),
  };
  const result = await client.from("settings").update(payload).eq("id", "public");
  if (result.error) return fail(result.error);
  await log("تعديل", "من نحن", "تحديث صفحة من نحن");
  await reload("صفحة من نحن اتحفظت.");
}
function safeLink(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (url.username || url.password) return "";
    return url.href;
  } catch {
    return "";
  }
}
async function uploadAnnouncementImage(file) {
  if (!file) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("الصورة لازم تكون JPG أو PNG أو WebP");
  if (file.size > 1500000) throw new Error("الصورة أكبر من 1.5 ميجا");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const uploaded = await client.storage.from("announcements").upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) throw new Error("رفع الصورة ما تمش. شغّل sql/announce.sql مرة واحدة.");
  return client.storage.from("announcements").getPublicUrl(path).data.publicUrl;
}
async function saveGroup(form) {
  if (!canSettings()) return;
  const sectionId = valueOf(form, "section_id");
  const classNumber = valueOf(form, "class_number").replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit)).trim();
  const label = valueOf(form, "label");
  const url = valueOf(form, "url").trim();
  let host = "";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { host = ""; }
  if (!["chat.whatsapp.com", "wa.me", "whatsapp.com"].includes(host)) {
    state.note = "حط رابط جروب واتساب، زي https://chat.whatsapp.com/…";
    state.bad = true;
    draw();
    return;
  }
  const saved = await write(client.from("class_groups").upsert({
    section_id: sectionId,
    class_number: classNumber,
    label,
    url,
  }, { onConflict: "section_id,class_number" }));
  if (!saved) return;
  await log("حفظ", "جروب", `${sectionId} · فصل ${classNumber}`);
  await reload("الجروب ظهر في يوم الطالب.");
}
async function saveNotice(form) {
  if (!isSuper()) return;
  const id = valueOf(form, "id");
  const linkLabel = valueOf(form, "link_label");
  const linkUrl = safeLink(valueOf(form, "link_url"));
  if (valueOf(form, "link_url") && !linkUrl) {
    state.note = "الرابط لازم يبدأ بـ http أو https.";
    state.bad = true;
    draw();
    return;
  }
  if ((linkLabel && !linkUrl) || (!linkLabel && linkUrl)) {
    state.note = "اكتب نص الزر والرابط مع بعض.";
    state.bad = true;
    draw();
    return;
  }
  let imageUrl = form.querySelector("[name=remove_image]")?.checked ? "" : safeLink(valueOf(form, "image_url"));
  const file = form.querySelector("[name=image]")?.files?.[0];
  if (file) {
    try { imageUrl = await uploadAnnouncementImage(file); }
    catch (error) { return fail(error); }
  }
  const payload = {
    title: clip(valueOf(form, "title"), 120),
    body: clip(valueOf(form, "body"), 600),
    published: form.querySelector("[name=published]").checked,
    image_url: imageUrl,
    link_label: linkLabel,
    link_url: linkUrl,
    audience: ["all", "section", "class"].includes(valueOf(form, "audience")) ? valueOf(form, "audience") : "all",
    section_id: valueOf(form, "audience") === "all" ? null : (valueOf(form, "section_id") || null),
    class_number: valueOf(form, "audience") === "class" ? clip(valueOf(form, "class_number"), 12) : "",
  };
  if (payload.audience !== "all" && !payload.section_id) {
    state.note = "اختار الشعبة، أو خلّي الإعلان لكل الطلبة.";
    state.bad = true;
    draw();
    return;
  }
  if (payload.audience === "class" && !payload.class_number) {
    state.note = "اكتب رقم الفصل، أو خلّي الإعلان للشعبة كلها.";
    state.bad = true;
    draw();
    return;
  }
  const saved = await write(id ? client.from("announcements").update(payload).eq("id", id) : client.from("announcements").insert(payload));
  if (!saved) return;
  await log(id ? "تعديل" : "إضافة", "إعلان", payload.title);
  let message = "الإعلان ظهر في صفحة الطلبة.";
  if (form.querySelector("[name=push]")?.checked && payload.published) {
    const out = await callPush({ mode: "announcement", id: id || saved[0].id });
    message += out?.ok ? ` وبعتنا إشعار لـ ${out.sent} جهاز.` : ` لكن الإشعار ما اتبعتش: ${pushError(out)}`;
  }
  await reload(message);
}
async function wipeRows(table) {
  for (let round = 0; round < 50; round += 1) {
    const page = await client.from(table).select("id").limit(200);
    if (page.error) return page.error;
    const ids = (page.data || []).map((row) => row.id);
    if (!ids.length) return null;
    const removed = await client.from(table).delete().in("id", ids);
    if (removed.error) return removed.error;
  }
  return { message: `مسح ${table} ما اكتملش.` };
}
async function archiveTerm(nextTerm) {
  const term = state.settings.term || "الترم الأول";
  const year = state.settings.academic_year || "";
  const lectures = state.lectures.map((item) => {
    const klass = state.classes.find((row) => row.id === item.class_id);
    return {
      section: sectionTitle(klass?.section_id),
      section_id: klass?.section_id || "",
      class_number: klass?.class_number || "",
      day: item.day,
      start_time: item.start_time,
      end_time: item.end_time,
      subject: item.subject,
      instructor: item.instructor || "",
      room: item.room || "",
      status: item.status || "active",
      note: item.note || "",
      moved_day: item.moved_day || "",
      moved_start: item.moved_start || "",
    };
  });
  const exams = state.exams.map((item) => ({
    title: item.title,
    subject: item.subject || "",
    exam_date: item.exam_date || "",
    start_time: item.start_time || "",
    end_time: item.end_time || "",
    room: item.room || "",
    notes: item.notes || "",
    section: item.section_id ? sectionTitle(item.section_id) : "كل الشعب",
    section_id: item.section_id || "",
    class_number: item.class_number || "",
  }));
  const announcements = state.announcements.map((item) => ({
    title: item.title,
    body: item.body || "",
    audience: item.audience || "all",
    section_id: item.section_id || "",
    class_number: item.class_number || "",
    link_url: item.link_url || "",
    image_url: item.image_url || "",
  }));
  const holidays = (state.holidays || []).map((item) => ({ holiday_date: item.holiday_date, name: item.name }));
  state.note = "جارٍ أرشفة الترم…";
  state.bad = false;
  draw();
  const saved = await client.from("term_archives").insert({
    academic_year: year,
    term,
    label: `${term} · ${year}`.trim(),
    snapshot: { lectures, exams, announcements, holidays },
    lecture_count: lectures.length,
    exam_count: exams.length,
    announcement_count: announcements.length,
    holiday_count: holidays.length,
    archived_by: state.profile?.email || "",
  });
  if (saved.error) {
    state.archiveMissing = /schema cache|does not exist|PGRST205|42P01|ignore_bundle/i.test(saved.error.message || "");
    return fail(saved.error.message ? { message: `${saved.error.message} — شغّل sql/archive.sql الأول.` } : saved.error);
  }
  const wiped = await wipeRows("exams") || await wipeRows("announcements") || await wipeRows("holidays") || await wipeRows("lectures");
  if (wiped) return fail(wiped);
  await client.from("push_queue").delete().not("id", "is", null);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  const settings = await client.from("settings").update({
    term: nextTerm,
    exam_mode: false,
    ignore_bundle: true,
    publish_timetables: true,
    last_review: today,
    updated_at: new Date().toISOString(),
  }).eq("id", "public");
  if (settings.error) return fail({ message: `${settings.error.message} — شغّل sql/archive.sql عشان عمود الترم الجديد.` });
  await log("أرشفة", "ترم", `${term} ← ${nextTerm}`);
  state.archiveView = null;
  await reload(`اتأرشف ${term}. موقع الطلبة بقى على ${nextTerm} ومن غير جدول ولا امتحانات لحد ما ترفع الجديد.`);
}
function askArchive() {
  const nextTerm = document.getElementById("next-term")?.value.trim();
  if (!nextTerm) return fail({ message: "اكتب اسم الترم الجديد قبل الأرشفة." });
  const current = state.settings.term || "الترم الأول";
  state.pendingDelete = { kind: "archive", id: nextTerm };
  document.getElementById("confirm-title").textContent = "أرشفة الترم";
  document.getElementById("confirm-text").textContent = `هيتحفظ ${current}: ${state.lectures.length} محاضرة، ${state.exams.length} امتحان، ${state.announcements.length} إعلان، و${(state.holidays || []).length} إجازة. بعد كده يختفوا من موقع الطلبة، والترم يبقى «${nextTerm}».`;
  document.getElementById("confirm-yes").textContent = "نعم، أرشف الترم";
  document.getElementById("confirm").hidden = false;
}
async function saveSettings(form) {
  const payload = {
    academic_year: valueOf(form, "academic_year"),
    term: valueOf(form, "term") || "الترم الأول",
    last_review: valueOf(form, "last_review"),
    lead_minutes: Math.min(60, Math.max(1, Number(valueOf(form, "lead_minutes")) || 10)),
    publish_timetables: canSettings() ? !!form.querySelector("[name=publish_timetables]")?.checked : !!state.settings.publish_timetables,
    exam_mode: canSettings() ? !!form.querySelector("[name=exam_mode]")?.checked : !!state.settings.exam_mode,
    updated_at: new Date().toISOString(),
  };
  const result = await client.from("settings").update(payload).eq("id", "public");
  if (result.error) return fail(result.error);
  await log("تعديل", "إعدادات", `العام ${payload.academic_year}`);
  await reload("الإعدادات اتحفظت.");
}

async function createUser(form) {
  const email = valueOf(form, "email");
  const password = valueOf(form, "password");
  const nextRole = valueOf(form, "role");
  const sectionId = nextRole === "section_manager" ? (valueOf(form, "section_id") || null) : null;
  if (nextRole === "section_manager" && !sectionId) return fail({ message: "مسؤول الشعبة لازم تختار له شعبة. غير كده الحساب يشوف كل الشعب." });
  const memory = {};
  const maker = supabase.createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => memory[key] ?? null,
        setItem: (key, value) => { memory[key] = value; },
        removeItem: (key) => { delete memory[key]; },
      },
    },
    global: { fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }) },
  });
  const created = await maker.auth.signUp({ email, password });
  if (created.error || !created.data.user) return fail(created.error || { message: "تعذر إنشاء المستخدم" });
  const id = created.data.user.id;
  let saved = false;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const result = await client.from("profiles").update({ role: nextRole, section_id: nextRole === "section_manager" ? sectionId : null, email, active: true }).eq("id", id).select("id");
    if (!result.error && result.data?.length) { saved = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  if (!saved) return fail({ message: "المستخدم اتعمل لكن الدور ما ترتّبش. جرّب الحفظ من الجدول." });
  await log("إضافة", "مستخدم", email);
  await reload("المستخدم اتضاف. لو تفعيل البريد شغّال في سوبا بيس لازم يأكده.");
}

async function remove(kind, id) {
  if (kind === "kb") return removeKb(id);
  if (kind === "groups" && !canSettings()) return;
  if (!canRemove() && kind !== "groups") return;
  if (kind === "users") {
    if (id === state.profile.id) return;
    const result = await client.rpc("delete_user", { target: id });
    if (result.error) return fail(result.error);
    await log("حذف", "مستخدم", id);
    return reload("المستخدم اتحذف.");
  }
  if (kind === "class-lectures") {
    const removed = await client.from("lectures").delete().eq("class_id", id);
    if (removed.error) return fail(removed.error);
    await touchClass(id);
    await log("حذف", "محاضرات فصل", id);
    return reload("محاضرات الفصل اتحذفت.");
  }
  const classId = kind === "lectures" ? state.lectures.find((item) => item.id === id)?.class_id : "";
  const tableName = { sections: "sections", classes: "classes", lectures: "lectures", exams: "exams", announcements: "announcements", groups: "class_groups", holidays: "holidays" }[kind];
  if (!tableName) return;
  const result = await client.from(tableName).delete().eq("id", id);
  if (result.error) return fail(result.error);
  if (classId) await touchClass(classId);
  await log("حذف", kind, id);
  await reload("اتحذف.");
}

function cleanSlot(slot) {
  const day = DAYS.includes(slot.day) ? slot.day : "";
  const start = String(slot.start || "");
  const end = String(slot.end || "");
  const subject = String(slot.subject || "").replace(/\s+/g, " ").trim();
  const time = /^\d{2}:\d{2}$/;
  if (!day || !time.test(start) || !time.test(end)) return null;
  if (subject.length < 2 || subject.length > 80) return null;
  if (/^(lect|r|gr)\s*\d+$/i.test(subject)) return null;
  return {
    day,
    start_time: start,
    end_time: end,
    subject,
    instructor: String(slot.instructor || "").replace(/\s+/g, " ").trim(),
    room: String(slot.room || "").replace(/\s+/g, " ").trim(),
  };
}
async function importCurrent() {
  if (!window.JADWALI_CLASSES) return fail({ message: "ملف الجداول مش متحمّل" });
  state.note = "جارٍ الاستيراد…";
  state.bad = false;
  draw();
  const sections = await client.from("sections").upsert(BASE_SECTIONS);
  if (sections.error) return fail(sections.error);
  const classRows = window.JADWALI_CLASSES.map((item) => ({
    section_id: item.sectionId,
    class_number: String(item.classNumber),
    group_name: item.group || "",
  }));
  for (let index = 0; index < classRows.length; index += 200) {
    const saved = await client.from("classes").upsert(classRows.slice(index, index + 200), { onConflict: "section_id,class_number" });
    if (saved.error) return fail(saved.error);
  }
  const stored = await fetchAll("classes", "class_number");
  const byKey = new Map(stored.map((item) => [`${item.section_id}:${item.class_number}`, item.id]));
  const ids = [...new Set(classRows.map((item) => byKey.get(`${item.section_id}:${item.class_number}`)).filter(Boolean))];
  for (let index = 0; index < ids.length; index += 80) {
    const cleared = await client.from("lectures").delete().in("class_id", ids.slice(index, index + 80));
    if (cleared.error) return fail(cleared.error);
  }
  const lectures = [];
  const seen = new Set();
  window.JADWALI_CLASSES.forEach((item) => {
    const classId = byKey.get(`${item.sectionId}:${String(item.classNumber)}`);
    if (!classId) return;
    (item.slots || []).forEach((slot) => {
      const clean = cleanSlot(slot);
      if (!clean) return;
      const key = `${classId}|${clean.day}|${clean.start_time}`;
      if (seen.has(key)) return;
      seen.add(key);
      lectures.push({ class_id: classId, ...clean });
    });
  });
  for (let index = 0; index < lectures.length; index += 400) {
    const part = await client.from("lectures").insert(lectures.slice(index, index + 400));
    if (part.error) return fail(part.error);
  }
  await log("استيراد", "جداول", `${classRows.length} فصل · ${lectures.length} محاضرة`);
  await reload(`اتستورد ${classRows.length} فصل و${lectures.length} محاضرة، من غير تكرار. موقع الطلبة مش هيتغير غير بعد تفعيل النشر.`);
}

// نشر الصفوف المؤكَّدة من شاشة المراجعة. بيستبدل جدول كل فصل ظاهر في الصفوف، بنفس أعمدة القاعدة الحالية.
async function publishReview(review, section) {
  const kind = review.kind;
  const numbers = [...new Set(review.rows.map((row) => String(row.classNumber || "")))];
  const groups = numbers.map((number) => ({ classNumber: number, slots: review.rows.filter((row) => String(row.classNumber || "") === number) }));
  const savedSection = await write(client.from("sections").upsert({
    id: section.id,
    title: section.title,
    major: section.major || "—",
    language: section.language || "—",
    year: String(section.year || "1"),
    year_label: section.year_label || "الفرقة",
    sort: section.sort || 0,
  }));
  if (!savedSection) return false;
  for (const group of groups) {
    if (kind === "lectures") {
      const savedClass = await write(client.from("classes").upsert({
        section_id: section.id,
        class_number: group.classNumber,
        group_name: "",
      }, { onConflict: "section_id,class_number" }));
      if (!savedClass) return false;
      const classId = savedClass[0].id;
      const cleared = await client.from("lectures").delete().eq("class_id", classId);
      if (cleared.error) { fail(cleared.error); return false; }
      const inserted = await write(client.from("lectures").insert(group.slots.map((slot) => ({
        class_id: classId,
        day: slot.day,
        start_time: slot.start,
        end_time: slot.end || TIME_END[slot.start] || "",
        subject: slot.subject,
        instructor: slot.instructor || "",
        room: slot.room || "",
        note: review.noteType && slot.type && slot.type !== "محاضرة" ? slot.type : "",
      }))));
      if (!inserted) return false;
      await touchClass(classId);
    } else {
      const removed = await client.from("exams").delete().eq("section_id", section.id).eq("class_number", group.classNumber);
      if (removed.error) { fail(removed.error); return false; }
      const inserted = await write(client.from("exams").insert(group.slots.map((slot) => ({
        section_id: section.id,
        class_number: group.classNumber,
        title: slot.subject,
        subject: slot.subject,
        exam_date: /^\d{4}-\d{2}-\d{2}$/.test(String(slot.date || "")) ? slot.date : null,
        start_time: slot.start || "",
        end_time: slot.end || "",
        room: slot.room || "",
        notes: slot.notes || "",
      }))));
      if (!inserted) return false;
    }
  }
  const published = await markPublished();
  await log("نشر", kind === "lectures" ? "محاضرات" : "امتحانات", `${section.title} · ${groups.map((group) => group.classNumber || "كل الشعبة").join("، ")}`);
  if (!published) {
    await reload("");
    UI.toast("الجدول اتحفظ، لكن تفعيله على الموقع محتاج حساب سوبر أدمن.", "warn", { id: "admin-note", duration: 8000 });
    return true;
  }
  await reload(`اتنشر ${review.rows.length} ${kind === "lectures" ? "محاضرة" : "امتحان"}. حدّث موقع الطلبة وافتح نفس الشعبة والفصل.`);
  return true;
}
