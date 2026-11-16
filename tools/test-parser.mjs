// اختبارات محرك فهم الجداول على جداول متلخبطة عمدًا. التشغيل: npm test
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ console });
vm.runInContext(`
  const DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
  const TIMES = ["08:30", "09:45", "11:00", "12:15", "01:30", "02:45", "04:00", "05:15"];
  const TIME_END = { "08:30": "09:40", "09:45": "10:55", "11:00": "12:10", "12:15": "01:25", "01:30": "02:40", "02:45": "03:55", "04:00": "05:10", "05:15": "06:25" };
  ${readFileSync(join(root, "admin/parser.js"), "utf8")}
  globalThis.api = { parseTimetable, formatSlot, slotIssues, normalizeVisualLine, cleanTime, timeRange, findDay, dayHeader, detectType, findRoom, periodIndex, cleanText, unifySubjects, subjectColor };
`, context);
const { api } = context;

let failed = 0;
const check = (name, condition, detail = "") => {
  if (!condition) failed += 1;
  console.log(`${condition ? "PASS" : "FAIL"} ${name}${condition ? "" : `  →  ${detail}`}`);
};
const pick = (slots, day, start) => slots.find((slot) => slot.day === day && slot.start === start);
const show = (value) => JSON.stringify(value);

// ---- أدوات التنسيق ----
check("وقت 24 ساعة", api.cleanTime("13:30") === "01:30", api.cleanTime("13:30"));
check("وقت بنقطة وأرقام عربية", api.cleanTime("٨.٣٠") === "08:30", api.cleanTime("٨.٣٠"));
check("وقت بـ PM", api.cleanTime("2:45 PM") === "02:45");
check("وقت بـ م", api.cleanTime("1:30 م") === "01:30");
check("ساعة لوحدها", api.cleanTime("9 ص") === "09:00", api.cleanTime("9 ص"));
check("مدى ملزوق", show(api.timeRange("0830-0940")) === show({ start: "08:30", end: "09:40" }), show(api.timeRange("0830-0940")));
check("مدى معكوس بصريًا", show(api.timeRange("9:40 - 8:30")) === show({ start: "08:30", end: "09:40" }) && api.timeRange("12:15 - 1:25").end === "01:25", show(api.timeRange("9:40 - 8:30")));
check("نهاية تلقائية", api.timeRange("11:00").end === "12:10");
check("فترة بالترتيب", api.periodIndex("المحاضرة الثالثة") === 3 && api.periodIndex("Period 2") === 2 && api.periodIndex("5") === 5);
check("أيام مختصرة", api.findDay("Sun") === "الأحد" && api.findDay("الاتنين") === "الإثنين" && api.findDay("Thurs.") === "الخميس" && api.findDay("التلات") === "الثلاثاء");
check("«حد» مش بتتلقط من «محمد»", api.findDay("د/ محمد حسن") === "", api.findDay("د/ محمد حسن"));
check("عربي معكوس الحروف", api.normalizeVisualLine("ةبساحملا ئدابم") === "مبادئ المحاسبة", api.normalizeVisualLine("ةبساحملا ئدابم"));
check("عربي سليم ما يتعكسش", api.normalizeVisualLine("الرياضة البحتة") === "الرياضة البحتة");
check("تنظيف رموز وتشكيل", api.cleanText("  مُحَاسَبـــة |  مالية •• ") === "محاسبة مالية", api.cleanText("  مُحَاسَبـــة |  مالية •• "));
check("نوع من الكلمة", api.detectType({ subject: "رياضة (سكشن)" }) === "سكشن" && api.detectType({ subject: "Physics Lab" }) === "معمل");
check("نوع من القاعة واللقب", api.detectType({ subject: "Math", room: "Lect 3" }) === "محاضرة" && api.detectType({ subject: "Math", instructor: "م.م/ علي" }) === "سكشن");
check("قاعة", api.findRoom("قاعة 12") === "قاعة 12" && api.findRoom("lect 7") === "Lect 7" && api.findRoom("r21") === "R21", `${api.findRoom("قاعة 12")}|${api.findRoom("lect 7")}|${api.findRoom("r21")}`);

// ---- 1) شبكة: الأيام صفوف، خانات متعددة السطور، عنوان وتذييل وصفوف فاضية ----
{
  const rows = [
    ["الأكاديمية الحديثة — جدول الفرقة الأولى"],
    [],
    ["الفصل: 5"],
    ["اليوم", "8:30 - 9:40", "9:45 - 10:55", "11:00 - 12:10", "12:15 - 1:25"],
    ["السبت", "Business Mathematics\nد/ دينا محمد\nLect 3", "", "مبادئ المحاسبة\nم.م/ علي حسن\nR14", "-"],
    ["", "", "", "", ""],
    ["Sun", "", "Principles of Economics\nا.م.د/ مروة جابر\nLect 2", "", "English Language\nR21"],
    ["يعتمد، عميد الأكاديمية"],
  ];
  const { slots, strategy } = api.parseTimetable(rows, "lectures");
  check("شبكة صفوف: 4 محاضرات", slots.length === 4, `${slots.length} ${strategy}`);
  const math = pick(slots, "السبت", "08:30");
  check("شبكة صفوف: مادة/دكتور/قاعة", math?.subject === "Business Mathematics" && math.instructor === "د/ دينا محمد" && math.room === "Lect 3" && math.end === "09:40", show(math));
  check("شبكة صفوف: رقم الفصل من فوق", slots.every((slot) => slot.classNumber === "5"), show(slots.map((slot) => slot.classNumber)));
  check("شبكة صفوف: سكشن من اللقب", pick(slots, "السبت", "11:00")?.type === "سكشن", show(pick(slots, "السبت", "11:00")));
  check("شبكة صفوف: يوم إنجليزي مختصر و1:25 مسائي", pick(slots, "الأحد", "12:15")?.end === "01:25", show(pick(slots, "الأحد", "12:15")));
  check("شبكة صفوف: مفيش مشاكل", slots.every((slot) => !Object.keys(api.slotIssues(slot, "lectures", slots)).length), show(slots.map((slot) => api.slotIssues(slot, "lectures", slots))));
}

// ---- 2) شبكة: الأيام أعمدة، والمواعيد أرقام فترات ----
{
  const rows = [
    ["الفترة", "السبت", "الأحد", "الإثنين"],
    ["الأولى", "تسويق / د. سارة / قاعة 4", "", "قانون"],
    ["الثانية", "", "محاسبة", ""],
    ["3", "اقتصاد", "", ""],
  ];
  const { slots } = api.parseTimetable(rows, "lectures");
  check("شبكة أعمدة: 4 محاضرات", slots.length === 4, show(slots));
  check("شبكة أعمدة: الفترة الثالثة = 11:00", pick(slots, "السبت", "11:00")?.subject === "اقتصاد", show(slots));
  const first = pick(slots, "السبت", "08:30");
  check("شبكة أعمدة: خانة بفواصل /", first?.subject === "تسويق" && /سارة/.test(first.instructor) && first.room === "قاعة 4", show(first));
  check("شبكة أعمدة: الوقت المتخمَّن متعلّم للمراجعة", !!api.slotIssues(first, "lectures").start);
}

// ---- 3) قائمة بعناوين: أعمدة متلخبطة، يوم مدموج، 24 ساعة و AM/PM، قاعة ناقصة ----
{
  const rows = [
    ["القاعة", "المحاضر", "إلى", "من", "اسم المقرر", "اليوم", "المجموعة"],
    ["مدرج 2", "د/ أحمد علي", "10:00", "08:30", "إدارة أعمال", "الاحد", "3"],
    ["", "م/ منى", "13:25", "12:15", "ادارة أعمال (سكشن)", "", "3"],
    ["R7", "", "3:55 PM", "2:45 PM", "Statistics", "Tues", "3"],
    ["اليوم", "x", "x", "x", "x", "x", "x"],
    ["Lab 2", "Eng. Omar", "17:00", "16:00", "Computer Lab", "thursday", "4"],
  ];
  const { slots, strategy } = api.parseTimetable(rows, "lectures");
  check("قائمة: 4 صفوف", slots.length === 4, `${slots.length} ${strategy} ${show(slots)}`);
  const merged = pick(slots, "الأحد", "12:15");
  check("قائمة: اليوم المدموج بيكمّل + 13:25 ← 01:25", merged?.end === "01:25" && merged.type === "سكشن", show(merged));
  check("قائمة: كلمة النوع اتشالت والمادة اتوحّدت", merged?.subject === "إدارة أعمال", show(merged?.subject));
  check("قائمة: PM", pick(slots, "الثلاثاء", "02:45")?.end === "03:55");
  const lab = pick(slots, "الخميس", "04:00");
  check("قائمة: معمل وفصل مختلف", lab?.type === "معمل" && lab.classNumber === "4" && lab.end === "05:00", show(lab));
}

// ---- 4) صفوف من غير عناوين وبترتيب مختلف في كل صف ----
{
  const rows = [
    ["السبت"],
    ["9:45-10:55", "Principles of Marketing", "د/ هبة سعيد", "R12"],
    ["R3", "Business Law", "11:00 – 12:10"],
    ["الاثنين", "1:30 م", "لغة إنجليزية", "Lect 5"],
    ["ملاحظة: الجدول قابل للتعديل"],
  ];
  const { slots } = api.parseTimetable(rows, "lectures");
  check("حرة: 3 محاضرات", slots.length === 3, show(slots));
  check("حرة: اليوم بيتورّث", pick(slots, "السبت", "11:00")?.room === "R3", show(slots));
  check("حرة: نهاية تلقائية", pick(slots, "الإثنين", "01:30")?.end === "02:40", show(pick(slots, "الإثنين", "01:30")));
}

// ---- 5) صف ناقص بيفضل ومتعلّم بدل ما يتشال ----
{
  const rows = [["اليوم", "الوقت", "المادة"], ["السبت", "08:30", "Math"], ["الجمعة", "09:45", "Physics"], ["الأحد", "", "Chemistry"]];
  const { slots } = api.parseTimetable(rows, "lectures");
  check("ناقص: 3 صفوف محفوظة", slots.length === 3, show(slots));
  const physics = slots.find((slot) => slot.subject === "Physics");
  check("ناقص: يوم مش معروف متعلّم", !!api.slotIssues(physics || {}, "lectures").day, show(slots));
  check("ناقص: وقت ناقص متعلّم", !!api.slotIssues(slots.find((slot) => slot.subject === "Chemistry") || {}, "lectures").start, show(slots));
}

// ---- 6) امتحانات ----
{
  const rows = [
    ["المادة", "التاريخ", "الوقت", "اللجنة / القاعة"],
    ["Business Mathematics", "20/11/2026", "10:00 - 12:00", "Lect 2"],
    ["مبادئ الاقتصاد", "22 نوفمبر 2026", "1:00 م", "مدرج 1"],
    ["English", "", "", ""],
  ];
  const { slots } = api.parseTimetable(rows, "exams");
  check("امتحانات: 3 صفوف", slots.length === 3, show(slots));
  check("امتحانات: تاريخ رقمي واسم شهر", slots[0].date === "2026-11-20" && slots[1].date === "2026-11-22", show(slots.map((slot) => slot.date)));
  check("امتحانات: الناقص متعلّم", !!api.slotIssues(slots.find((slot) => slot.subject === "English"), "exams").date);
}

// ---- 7) تعارض ومعاد غلط ----
{
  const a = api.formatSlot({ classNumber: "1", day: "السبت", start: "08:30", subject: "A" }, "lectures");
  const b = api.formatSlot({ classNumber: "1", day: "sat", start: "8.30", subject: "B" }, "lectures");
  check("تعارض نفس الميعاد", !!api.slotIssues(a, "lectures", [a, b]).start);
  check("لون ثابت لنفس المادة", api.subjectColor("Math") === api.subjectColor("Math") && /^var\(--sub-[1-8]\)$/.test(api.subjectColor("Math")));
}

console.log(failed ? `\n${failed} اختبار فشل` : "\nكل الاختبارات نجحت");
process.exit(failed ? 1 : 0);
