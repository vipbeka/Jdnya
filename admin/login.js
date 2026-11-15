const DASHBOARD = "dashboard.html";

const client = supabase.createClient(window.JADWALI_SUPABASE.url, window.JADWALI_SUPABASE.key, {
  global: { fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }) },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: localStorage,
    storageKey: "jadwali-admin-auth",
  },
});

const form = document.getElementById("login-form");
const note = document.getElementById("login-note");
const button = document.getElementById("login-btn");
const email = document.getElementById("email");
const password = document.getElementById("password");

function show(message, info = false) {
  note.textContent = message;
  note.classList.toggle("info", info);
  note.hidden = !message;
}

const REASONS = {
  expired: "الدخول انتهى. ادخل تاني.",
  noaccess: "الحساب من غير صلاحية.",
  disabled: "الحساب موقف.",
  setup: "شغّل sql/panel.sql من محرر سوبا بيس الأول.",
  offline: "الاتصال قطع. حاول تاني.",
};
const reason = new URLSearchParams(location.search).get("e");
if (reason && REASONS[reason]) {
  show(REASONS[reason]);
  history.replaceState(null, "", location.pathname);
}

document.getElementById("toggle-pw").addEventListener("click", (event) => {
  const showing = password.type === "password";
  password.type = showing ? "text" : "password";
  event.currentTarget.setAttribute("aria-pressed", String(showing));
  event.currentTarget.setAttribute("aria-label", showing ? "إخفاء كلمة السر" : "إظهار كلمة السر");
});

// تحقق لحظي: الحقل بيتعلّم بالأحمر أول ما المستخدم يسيبه وهو غلط، وبيرجع طبيعي أول ما يتصلّح
function checkField(input, bad) {
  input.closest(".field").classList.toggle("invalid", bad);
  input.setAttribute("aria-invalid", String(bad));
}
email.addEventListener("blur", () => checkField(email, !!email.value && !email.checkValidity()));
email.addEventListener("input", () => { if (email.checkValidity()) checkField(email, false); });
password.addEventListener("input", () => checkField(password, false));

// لو في جلسة محفوظة، روح للوحة التحكم على طول
if (!reason) {
  client.auth.getSession().then(({ data }) => {
    if (data?.session) location.replace(DASHBOARD);
  }).catch(() => {});
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  checkField(email, !email.value.trim() || !email.checkValidity());
  checkField(password, !password.value);
  if (!email.value.trim() || !password.value) {
    show("اكتب البريد وكلمة السر.");
    (email.value.trim() ? password : email).focus();
    return;
  }
  button.disabled = true;
  button.classList.add("busy");
  button.firstElementChild.textContent = "جارٍ الدخول…";
  show("");
  try {
    const result = await client.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
    if (result.error) {
      password.value = "";
      show(/invalid/i.test(result.error.message) ? "البريد أو كلمة السر غير صحيحة." : "الدخول ما تمش. حاول تاني.");
      return;
    }
    show("تم الدخول، جارٍ فتح لوحة التحكم…", true);
    location.replace(DASHBOARD);
  } catch {
    show("الاتصال قطع. تأكد من الإنترنت وحاول تاني.");
  } finally {
    button.disabled = false;
    button.classList.remove("busy");
    button.firstElementChild.textContent = "تسجيل الدخول";
  }
});
