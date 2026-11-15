// فحص سريع قبل النشر (المشروع من غير خطوة build):
// 1) كل ملفات JS سليمة نحويًا  2) كل ملف مذكور في الصفحات أو في الـ service worker موجود فعلًا
// 3) مفيش خصائص CSS اتجاهية (left/right) تكسر الـ RTL في ملفات التصميم.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const walk = (dir) => readdirSync(join(root, dir)).flatMap((name) => {
  const path = join(dir, name);
  return statSync(join(root, path)).isDirectory() ? walk(path) : [path];
});

const scripts = [...walk("js"), ...walk("admin"), "sw.js"].filter((file) => file.endsWith(".js"));
for (const file of scripts) {
  try {
    execFileSync(process.execPath, ["--check", join(root, file)], { stdio: "pipe" });
  } catch (error) {
    problems.push(`خطأ نحوي في ${file}\n${String(error.stderr).trim()}`);
  }
}

const pages = ["index.html", "admin.html", "dashboard.html"];
for (const page of pages) {
  const html = readFileSync(join(root, page), "utf8");
  for (const match of html.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css|svg|png|jpg|webmanifest))"/g)) {
    if (!existsSync(join(root, match[1]))) problems.push(`${page} بيشاور على ملف مش موجود: ${match[1]}`);
  }
}

const sw = readFileSync(join(root, "sw.js"), "utf8");
const cached = JSON.parse(sw.match(/const FILES = (\[[^\]]+\]);/)[1]);
for (const file of cached) {
  if (file !== "./" && !existsSync(join(root, file))) problems.push(`sw.js بيخزّن ملف مش موجود: ${file}`);
}
const indexHtml = readFileSync(join(root, "index.html"), "utf8");
for (const match of indexHtml.matchAll(/<script[^>]*src="([^"]+)"/g)) {
  if (!cached.includes(`./${match[1]}`)) problems.push(`sw.js ناقصه ملف مطلوب للعمل بدون إنترنت: ${match[1]}`);
}

const physical = /(?:^|[\s;{])(?:margin|padding|border)-(?:left|right)\b|(?:^|[\s;{])(?:left|right)\s*:|text-align\s*:\s*(?:left|right)/;
for (const file of ["css/tokens.css", "css/styles.css", "admin/admin.css", "admin/login.css"]) {
  readFileSync(join(root, file), "utf8").split("\n").forEach((line, index) => {
    if (physical.test(line) && !/rtl-ok/.test(line)) problems.push(`${file}:${index + 1} فيه خاصية اتجاهية. استخدم inline-start / inline-end، أو علّم السطر بـ rtl-ok لو مقصودة.`);
  });
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`تمام: ${scripts.length} ملف JS سليم، ${pages.length} صفحات، ${cached.length} ملف في الكاش، والـ CSS منطقي الاتجاه.`);
