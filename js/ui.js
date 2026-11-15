// عناصر الواجهة المشتركة بين موقع الطلبة ولوحة الإدارة: الإشعارات المنبثقة، نافذة التأكيد، مفتاح الوضع، والحالات الفارغة.
window.UI = (function () {
  const SVG = (body, size = 18, width = 2) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const ICONS = {
    success: SVG('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 16, 2.4),
    error: SVG('<path d="M12 8v5M12 16.5v.01"/><circle cx="12" cy="12" r="9"/>', 16),
    warn: SVG('<path d="M12 9v4M12 16.5v.01"/><path d="M10.3 4.2L2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/>', 16),
    info: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>', 16),
    close: SVG('<path d="M6 6l12 12M18 6L6 18"/>', 16),
    sun: SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 20, 1.8),
    moon: SVG('<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/>', 20, 1.8),
    trash: SVG('<path d="M4 7h16M10 7V4.5h4V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>', 22, 1.8),
    question: SVG('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.9M12 16.8v.01"/>', 22, 1.8),
  };
  const ART = {
    calendar: '<svg class="empty-art" viewBox="0 0 112 88" fill="none" aria-hidden="true"><rect x="18" y="14" width="76" height="62" rx="12" fill="currentColor" opacity=".08"/><rect x="18" y="14" width="76" height="62" rx="12" stroke="currentColor" stroke-width="2" opacity=".5"/><path d="M18 32h76" stroke="currentColor" stroke-width="2" opacity=".5"/><path d="M38 8v12M74 8v12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><rect x="30" y="42" width="14" height="10" rx="3" fill="currentColor" opacity=".25"/><rect x="49" y="42" width="14" height="10" rx="3" fill="currentColor"/><rect x="68" y="42" width="14" height="10" rx="3" fill="currentColor" opacity=".25"/><rect x="30" y="57" width="14" height="10" rx="3" fill="currentColor" opacity=".25"/><rect x="49" y="57" width="14" height="10" rx="3" fill="currentColor" opacity=".25"/></svg>',
    search: '<svg class="empty-art" viewBox="0 0 112 88" fill="none" aria-hidden="true"><circle cx="50" cy="40" r="24" fill="currentColor" opacity=".08"/><circle cx="50" cy="40" r="24" stroke="currentColor" stroke-width="2.5" opacity=".6"/><path d="M68 58l16 16" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M41 40h18M50 31v18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".5" transform="rotate(45 50 40)"/></svg>',
    exam: '<svg class="empty-art" viewBox="0 0 112 88" fill="none" aria-hidden="true"><path d="M32 10h36l16 16v48a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6z" fill="currentColor" opacity=".08"/><path d="M32 10h36l16 16v48a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6z" stroke="currentColor" stroke-width="2" opacity=".5"/><path d="M68 10v16h16" stroke="currentColor" stroke-width="2" opacity=".5"/><path d="M38 42h24M38 54h34M38 66h18" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".35"/><circle cx="82" cy="66" r="14" fill="var(--surface)" stroke="currentColor" stroke-width="2.5"/><path d="M82 59v7l4.5 3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
    rest: '<svg class="empty-art" viewBox="0 0 112 88" fill="none" aria-hidden="true"><circle cx="56" cy="46" r="30" fill="currentColor" opacity=".08"/><path d="M30 60c8-4 12-4 18 0s12 4 18 0 10-4 16 0" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".5"/><circle cx="56" cy="36" r="13" fill="currentColor"/><path d="M56 12v6M34 22l4 4M78 22l-4 4M24 40h6M82 40h6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></svg>',
    inbox: '<svg class="empty-art" viewBox="0 0 112 88" fill="none" aria-hidden="true"><path d="M20 48l12-28a6 6 0 0 1 5.5-3.6h37A6 6 0 0 1 80 20l12 28v20a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6z" fill="currentColor" opacity=".08"/><path d="M20 48l12-28a6 6 0 0 1 5.5-3.6h37A6 6 0 0 1 80 20l12 28v20a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6z" stroke="currentColor" stroke-width="2" opacity=".5"/><path d="M20 48h20l4 9h24l4-9h20" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>',
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  }

  function host() {
    let node = document.getElementById("toasts");
    if (!node) {
      node = document.createElement("div");
      node.id = "toasts";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      document.body.appendChild(node);
    }
    return node;
  }
  function dismiss(node) {
    if (!node || node.dataset.leaving) return;
    node.dataset.leaving = "1";
    clearTimeout(node._timer);
    node.classList.add("out");
    setTimeout(() => node.remove(), 200);
  }
  // toast("اتحفظ", "success") — لو اتبعت id، الرسالة الجديدة بتستبدل القديمة بدل ما تتراكم.
  function toast(message, type = "info", options = {}) {
    const text = String(message || "").trim();
    if (!text) return null;
    const box = host();
    const existing = options.id ? box.querySelector(`[data-toast-id="${options.id}"]`) : null;
    const node = existing || document.createElement("div");
    node.className = `toast ${type}`;
    if (options.id) node.dataset.toastId = options.id;
    delete node.dataset.leaving;
    node.innerHTML = `<span class="toast-ico">${ICONS[type] || ICONS.info}</span><span class="toast-msg">${escapeHtml(text)}</span><button type="button" class="toast-x" aria-label="إغلاق">${ICONS.close}</button>`;
    if (!existing) box.prepend(node);
    while (box.children.length > 3) box.lastElementChild.remove();
    clearTimeout(node._timer);
    const duration = options.duration ?? (type === "error" ? 6000 : 3200);
    if (duration > 0) node._timer = setTimeout(() => dismiss(node), duration);
    return node;
  }
  document.addEventListener("click", (event) => {
    const close = event.target.closest?.(".toast-x");
    if (close) dismiss(close.closest(".toast"));
  });

  // نافذة تأكيد بترجّع Promise<boolean> بدل confirm() بتاعة المتصفح.
  function confirmDialog({ title, text = "", confirmLabel = "تأكيد", cancelLabel = "إلغاء", danger = false } = {}) {
    return new Promise((resolve) => {
      const last = document.activeElement;
      const wrap = document.createElement("div");
      wrap.className = "modal";
      wrap.innerHTML = `<div class="modal-card${danger ? " danger" : ""}" role="alertdialog" aria-modal="true" aria-labelledby="ui-confirm-title">
        <span class="modal-ico">${danger ? ICONS.trash : ICONS.question}</span>
        <h2 id="ui-confirm-title">${escapeHtml(title)}</h2>
        ${text ? `<p>${escapeHtml(text)}</p>` : ""}
        <div class="row"><button type="button" class="ghost" data-no>${escapeHtml(cancelLabel)}</button><button type="button" class="btn${danger ? " danger-btn" : ""}" data-yes>${escapeHtml(confirmLabel)}</button></div>
      </div>`;
      const done = (answer) => {
        document.removeEventListener("keydown", onKey, true);
        wrap.remove();
        last?.focus?.();
        resolve(answer);
      };
      const onKey = (event) => {
        if (event.key === "Escape") { event.stopPropagation(); done(false); }
        if (event.key === "Tab") {
          const buttons = [...wrap.querySelectorAll("button")];
          const index = buttons.indexOf(document.activeElement);
          event.preventDefault();
          buttons[(index + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length].focus();
        }
      };
      wrap.addEventListener("click", (event) => {
        if (event.target === wrap || event.target.closest("[data-no]")) done(false);
        else if (event.target.closest("[data-yes]")) done(true);
      });
      document.addEventListener("keydown", onKey, true);
      document.body.appendChild(wrap);
      wrap.querySelector("[data-no]").focus();
    });
  }

  function themeButton(extraClass = "") {
    return `<button type="button" class="icon-btn theme-toggle ${extraClass}" data-theme-toggle aria-label="تبديل الوضع الداكن والفاتح" title="تبديل الوضع">${ICONS.moon.replace("<svg", '<svg class="i-moon"')}${ICONS.sun.replace("<svg", '<svg class="i-sun"')}</button>`;
  }
  document.addEventListener("click", (event) => {
    if (!event.target.closest?.("[data-theme-toggle]")) return;
    const next = window.JadwaliTheme?.toggle();
    toast(next === "dark" ? "الوضع الداكن شغّال" : "الوضع الفاتح شغّال", "info", { id: "theme", duration: 1600 });
  });
  document.querySelectorAll("[data-theme-slot]").forEach((slot) => { slot.outerHTML = themeButton(slot.dataset.themeSlot); });

  // حالة فارغة برسمة وزر. actions عبارة عن HTML جاهز.
  function empty({ art = "calendar", title, text = "", actions = "" }) {
    return `<div class="empty">${ART[art] || ART.calendar}<h3>${title}</h3>${text ? `<p>${text}</p>` : ""}${actions ? `<div class="row">${actions}</div>` : ""}</div>`;
  }

  function download(filename, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.cssText = "position:fixed;opacity:0;top:0";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { /* النسخ ممنوع */ }
      area.remove();
      return ok;
    }
  }

  return { toast, confirm: confirmDialog, themeButton, empty, download, copy, svg: SVG, escapeHtml };
})();
