// بيتحمّل في أول الصفحة قبل الرسم عشان الوضع الداكن ما يومضش.
(function () {
  var KEY = "jadwali-theme";
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (error) { /* التخزين مقفول */ }
  var system = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  var theme = saved === "light" || saved === "dark" ? saved : system;
  var root = document.documentElement;
  function paint(next) {
    root.setAttribute("data-theme", next);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "dark" ? "#0b0f19" : "#f6f7fb");
  }
  paint(theme);
  // لو الطالب حافظ فصله، نجهّز هيكل التطبيق من أول لحظة عشان الصفحة ما تتنططش.
  var shell = "guest";
  try { if (localStorage.getItem("jadwali-my-class")) shell = "app"; } catch (error) { /* التخزين مقفول */ }
  if (!root.hasAttribute("data-shell")) root.setAttribute("data-shell", shell);
  try { if (localStorage.getItem("jadwali-rail") === "1") root.setAttribute("data-rail", "1"); } catch (error) { /* التخزين مقفول */ }
  window.JadwaliTheme = {
    get: function () { return root.getAttribute("data-theme") || "dark"; },
    set: function (next) {
      paint(next);
      try { localStorage.setItem(KEY, next); } catch (error) { /* التخزين مقفول */ }
    },
    toggle: function () {
      var next = this.get() === "dark" ? "light" : "dark";
      this.set(next);
      return next;
    },
  };
  document.addEventListener("DOMContentLoaded", function () { paint(root.getAttribute("data-theme")); });
})();
