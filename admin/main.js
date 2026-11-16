// لوحة الإدارة — ربط الأحداث، حماية الصفحة، وتسجيل الدخول.
document.getElementById("nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-panel]");
  if (!button) return;
  state.panel = button.dataset.panel;
  state.edit = null;
  state.note = "";
  draw();
});

document.getElementById("screen").addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-save]");
  if (!form) return;
  event.preventDefault();
  state.note = "";
  state.bad = false;
  UI.toast("جارٍ الحفظ…", "info", { id: "admin-note", duration: 5000 });
  const kind = form.dataset.save;
  if (kind === "sections") await saveSection(form);
  if (kind === "classes") await saveClass(form);
  if (kind === "lectures") await saveLecture(form);
  if (kind === "exams") await saveExam(form);
  if (kind === "about") await saveAbout(form);
  if (kind === "kb") await saveKb(form);
  if (kind === "groups") await saveGroup(form);
  if (kind === "holidays") await saveHoliday(form);
  if (kind === "announcements") await saveNotice(form);
  if (kind === "settings") await saveSettings(form);
  if (kind === "users") await createUser(form);
});

document.getElementById("screen").addEventListener("change", async (event) => {
  if (event.target.id === "upload-section") {
    state.uploadSection = event.target.value;
    const list = document.getElementById("class-list");
    if (list) list.innerHTML = catalogClasses(event.target.value).map((item) => `<option value="${esc(item)}"></option>`).join("");
  }
  if (event.target.name === "upload-kind") {
    state.uploadKind = event.target.value;
    const field = document.getElementById("upload-class");
    if (field) field.placeholder = event.target.value === "exams" ? "سيبه فاضي لو الامتحان لكل الشعبة" : "سيبه فاضي لو الملف فيه أرقام الفصول";
  }
  if (event.target.id === "upload-file" && event.target.files?.[0]) await readUpload(event.target.files[0]);
  if (event.target.id === "new-role") {
    const field = document.getElementById("new-section");
    if (field) field.style.display = event.target.value === "section_manager" ? "" : "none";
  }
  if (event.target.matches("[data-role]")) {
    const section = event.target.closest("tr")?.querySelector("[data-section]");
    if (!section) return;
    const manager = event.target.value === "section_manager";
    section.disabled = !manager;
    if (!manager) section.value = "";
  }
});

// السحب والإفلات: المنطقة بتنوّر والملف بيتقري، وإفلات ملف بره المنطقة ما بيفتحوش في المتصفح
const dropZone = (event) => event.target.closest?.("#upload-drop");
document.getElementById("screen").addEventListener("dragover", (event) => {
  const zone = dropZone(event);
  if (!zone) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  zone.classList.add("over");
});
document.getElementById("screen").addEventListener("dragleave", (event) => {
  const zone = dropZone(event);
  if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove("over");
});
document.getElementById("screen").addEventListener("drop", async (event) => {
  const zone = dropZone(event);
  if (!zone) return;
  event.preventDefault();
  zone.classList.remove("over");
  const files = event.dataTransfer?.files;
  if (files?.length > 1) UI.toast("هنقرا أول ملف بس. ارفع الباقي واحد واحد.", "warn");
  if (files?.[0]) await readUpload(files[0]);
});
window.addEventListener("dragover", (event) => { if (event.dataTransfer?.types?.includes("Files")) event.preventDefault(); });
window.addEventListener("drop", (event) => { if (event.dataTransfer?.types?.includes("Files")) event.preventDefault(); });
document.getElementById("screen").addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.id === "upload-drop") {
    event.preventDefault();
    document.getElementById("upload-file")?.click();
  }
});
// لصق صورة الجدول مباشرة (Ctrl+V) وانت في صفحة الرفع
document.addEventListener("paste", (event) => {
  if (state.panel !== "export" || state.review || event.target.closest?.("input, textarea")) return;
  const file = [...(event.clipboardData?.files || [])][0];
  if (file) { event.preventDefault(); readUpload(file); }
});

document.getElementById("screen").addEventListener("click", async (event) => {
  if (event.target.closest("[data-edit-cancel]")) {
    state.edit = null;
    draw();
    return;
  }
  const kbEdit = event.target.closest("[data-kb-edit]");
  if (kbEdit) {
    const index = Number(kbEdit.dataset.kbEdit);
    const row = kbEntries()[index];
    if (!row) return;
    state.edit = { kind: "kb", row: { index, q: row.q, a: row.a } };
    draw();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (event.target.closest("[data-kb-cancel]")) {
    state.edit = null;
    draw();
    return;
  }
  const edit = event.target.closest("[data-edit]");
  const removeButton = event.target.closest("[data-delete]");
  const saveUser = event.target.closest("[data-save-user]");
  if (event.target.id === "import-current") return importCurrent();
  if (event.target.closest("#upload-manual")) {
    const kind = document.querySelector("[name=upload-kind]:checked")?.value || "lectures";
    const number = latin(document.getElementById("upload-class")?.value || "").replace(/\D/g, "");
    return openReview({ kind, sectionId: document.getElementById("upload-section")?.value || "", slots: [{ classNumber: number }], source: "إدخال يدوي" });
  }
  if (event.target.id === "archive-term") return askArchive();
  const archiveButton = event.target.closest("[data-archive]");
  if (archiveButton) {
    const row = await client.from("term_archives").select("label,term,academic_year,snapshot").eq("id", archiveButton.dataset.archive).maybeSingle();
    if (row.error) return fail(row.error);
    state.archiveView = row.data;
    state.panel = "settings";
    draw();
    return;
  }
  if (edit) {
    const list = { sections: state.sections, classes: state.classes, lectures: state.lectures, exams: state.exams, announcements: state.announcements }[edit.dataset.edit];
    state.edit = { kind: edit.dataset.edit, row: list.find((item) => item.id === edit.dataset.id) };
    state.panel = edit.dataset.edit === "announcements" ? "notices" : edit.dataset.edit;
    draw();
    return;
  }
  const clearClass = event.target.closest("[data-clear-class]");
  if (clearClass) {
    event.preventDefault();
    event.stopPropagation();
    return askDelete("class-lectures", clearClass.dataset.clearClass);
  }
  if (removeButton) return askDelete(removeButton.dataset.delete, removeButton.dataset.id);
  if (saveUser) {
    const id = saveUser.dataset.saveUser;
    const nextRole = document.querySelector(`[data-role][data-id="${id}"]`).value;
    const sectionId = document.querySelector(`[data-section][data-id="${id}"]`).value || null;
    if (id === state.profile.id && nextRole !== "super_admin" && !state.users.some((user) => user.id !== id && user.role === "super_admin")) {
      state.note = "لازم يفضل سوبر أدمن واحد على الأقل.";
      state.bad = true;
      draw();
      return;
    }
    const result = await client.from("profiles").update({ role: nextRole, section_id: nextRole === "section_manager" ? sectionId : null }).eq("id", id);
    if (result.error) return fail(result.error);
    await log("تعديل", "مستخدم", id);
    await reload("الدور اتحدث.");
  }
});

document.getElementById("admin-search").addEventListener("input", renderHits);
document.getElementById("search-hits").addEventListener("click", (event) => {
  const hit = event.target.closest("[data-hit]");
  if (!hit) return;
  state.panel = hit.dataset.hit;
  state.openKeys = hit.dataset.open ? hit.dataset.open.split(",").filter(Boolean) : [];
  state.flash = hit.dataset.id || "";
  document.getElementById("admin-search").value = "";
  document.getElementById("search-hits").hidden = true;
  draw();
  document.querySelector(`[data-anchor="${CSS.escape(state.flash)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
});
document.getElementById("confirm-no").addEventListener("click", () => {
  state.pendingDelete = null;
  document.getElementById("confirm-yes").textContent = "نعم، احذف";
  document.getElementById("confirm-title").textContent = "هيتم حذف الآتي";
  document.getElementById("confirm").hidden = true;
});
document.getElementById("confirm-yes").addEventListener("click", async () => {
  const pending = state.pendingDelete;
  state.pendingDelete = null;
  document.getElementById("confirm-yes").textContent = "نعم، احذف";
  document.getElementById("confirm-title").textContent = "هيتم حذف الآتي";
  document.getElementById("confirm").hidden = true;
  if (!pending) return;
  if (pending.kind === "archive") return archiveTerm(pending.id);
  await remove(pending.kind, pending.id);
});
const LOGIN_URL = "admin.html";
function toLogin(reason) {
  location.replace(reason ? `${LOGIN_URL}?e=${reason}` : LOGIN_URL);
}
function showApp() {
  document.getElementById("boot").hidden = true;
  document.getElementById("app").hidden = false;
}

function closeMenu() {
  document.getElementById("side").classList.remove("open");
  document.getElementById("scrim").hidden = true;
}
document.getElementById("menu-btn").addEventListener("click", () => {
  document.getElementById("side").classList.add("open");
  document.getElementById("scrim").hidden = false;
});
document.getElementById("scrim").addEventListener("click", closeMenu);

// طيّ الشريط الجانبي على الديسكتوب
document.getElementById("rail-toggle").addEventListener("click", () => {
  const root = document.documentElement;
  const collapsed = root.dataset.rail !== "1";
  if (collapsed) root.dataset.rail = "1";
  else delete root.dataset.rail;
  localStorage.setItem("jadwali-rail", collapsed ? "1" : "0");
});

// فلتر سريع لصفوف أي جدول
document.getElementById("screen").addEventListener("input", (event) => {
  const input = event.target.closest("[data-table-filter]");
  if (!input) return;
  const block = input.closest(".table-block");
  const needle = norm(input.value);
  let shown = 0;
  block.querySelectorAll("tbody tr").forEach((row) => {
    const match = !needle || norm(row.textContent).includes(needle);
    row.hidden = !match;
    if (match) shown += 1;
  });
  block.querySelector("[data-table-count]").textContent = needle ? `${shown} صف` : "";
  block.querySelector(".table-none").hidden = shown > 0;
  block.querySelector(".table-wrap").hidden = shown === 0;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (state.review) { closeReview(); return; }
    if (state.edit) { state.edit = null; draw(); }
    closeMenu();
    document.getElementById("search-hits").hidden = true;
  }
  const typing = event.target.closest?.("input, textarea, select");
  if ((event.key === "/" && !typing) || (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey))) {
    event.preventDefault();
    document.getElementById("admin-search").focus();
  }
});

document.getElementById("logout").addEventListener("click", async () => {
  state.profile = null;
  try { await client.auth.signOut(); } catch { /* نكمل للخروج */ }
  toLogin();
});

let entering = false;
async function enter(session) {
  if (!session || entering || state.profile) return;
  entering = true;
  try {
    const profile = await client.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    if (profile.error && /schema cache|does not exist|PGRST205/i.test(profile.error.message || "")) {
      await client.auth.signOut();
      return toLogin("setup");
    }
    if (profile.error) {
      if (/JWT|401|unauthorized/i.test(profile.error.message || "")) {
        await client.auth.signOut();
        return toLogin("expired");
      }
      return toLogin("offline");
    }
    if (!profile.data) {
      await client.auth.signOut();
      return toLogin("noaccess");
    }
    if (profile.data.active === false) {
      await client.auth.signOut();
      return toLogin("disabled");
    }
    state.profile = profile.data;
    state.email = session.user.email || "";
    showApp();
    try { await loadAll(); } catch (error) { fail(error); }
    draw();
  } finally {
    entering = false;
  }
}

client.auth.onAuthStateChange((event, session) => {
  setTimeout(() => {
    if (event === "SIGNED_OUT") {
      state.profile = null;
      toLogin();
      return;
    }
    if (session && !state.profile && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) enter(session);
  }, 0);
});

// حماية الصفحة: من غير جلسة يرجع لصفحة الدخول
client.auth.getSession().then(({ data }) => {
  if (!data?.session) toLogin();
}).catch(() => toLogin("offline"));

wireReview();
