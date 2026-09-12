/**
 * gamification.js — লেভেল ও ব্যাজ সিস্টেম। কোনো নতুন ডেটা তৈরি করে না —
 * বিদ্যমান স্টোরগুলো (challenge streak, exam attempts, focus logs, dictionary,
 * diary, sectors) থেকে পরিসংখ্যান বের করে XP/লেভেল/ব্যাজ হিসাব করে, তাই সবসময়
 * আসল অগ্রগতির সাথে সিঙ্কে থাকে।
 */
const Gamification = (() => {
  const STR = {
    bn: {
      pageTitle: "🏅 ব্যাজ ও লেভেল",
      levelLabel: "লেভেল",
      xpToNext: (xp, need) => `পরবর্তী লেভেলের জন্য আর ${need - xp} XP দরকার`,
      maxLevel: "সর্বোচ্চ লেভেলে পৌঁছেছেন! 🎉",
      statsTitle: "📊 তোমার অগ্রগতি",
      statStreak: "দিন স্ট্রিক",
      statExams: "Exam সম্পন্ন",
      statBestScore: "সেরা স্কোর",
      statFocus: "ফোকাস ঘণ্টা",
      statWords: "নতুন শব্দ",
      statDiary: "ডায়েরি এন্ট্রি",
      badgesTitle: "🏆 ব্যাজসমূহ",
      locked: "🔒 লক করা",
    },
    en: {
      pageTitle: "🏅 Badges & Level",
      levelLabel: "Level",
      xpToNext: (xp, need) => `${need - xp} more XP needed for next level`,
      maxLevel: "You've reached the max level! 🎉",
      statsTitle: "📊 Your Progress",
      statStreak: "Day Streak",
      statExams: "Exams Done",
      statBestScore: "Best Score",
      statFocus: "Focus Hours",
      statWords: "New Words",
      statDiary: "Diary Entries",
      badgesTitle: "🏆 Badges",
      locked: "🔒 Locked",
    },
  };

  function lang() {
    return (typeof LangState !== "undefined" && LangState.current) || localStorage.getItem("jobprep_lang") || "bn";
  }
  function s() { return STR[lang()] || STR.bn; }

  const LEVEL_TITLES = {
    bn: ["নতুন শিক্ষার্থী", "নিয়মিত পাঠক", "মনোযোগী প্রস্তুতিকারী", "সিরিয়াস প্রতিযোগী", "অভিজ্ঞ যোদ্ধা", "চ্যাম্পিয়ন প্রার্থী"],
    en: ["New Learner", "Regular Reader", "Focused Preparer", "Serious Competitor", "Seasoned Fighter", "Champion Candidate"],
  };

  const BADGES = [
    { id: "streak7", icon: "🔥", bn: "৭ দিন স্ট্রিক", en: "7-Day Streak", check: (d) => d.streak >= 7 },
    { id: "streak30", icon: "🔥", bn: "৩০ দিন স্ট্রিক", en: "30-Day Streak", check: (d) => d.streak >= 30 },
    { id: "firstExam", icon: "📝", bn: "প্রথম Exam", en: "First Exam", check: (d) => d.examCount >= 1 },
    { id: "tenExams", icon: "🎯", bn: "১০টি Exam সম্পন্ন", en: "10 Exams Done", check: (d) => d.examCount >= 10 },
    { id: "perfectScore", icon: "💯", bn: "১০০% স্কোর", en: "100% Score", check: (d) => d.bestPct >= 100 },
    { id: "words50", icon: "📚", bn: "৫০টি নতুন শব্দ", en: "50 New Words", check: (d) => d.wordCount >= 50 },
    { id: "focus10h", icon: "⏱️", bn: "১০ ঘণ্টা ফোকাস", en: "10 Focus Hours", check: (d) => d.focusMinutes >= 600 },
    { id: "diary20", icon: "📔", bn: "২০টি ডায়েরি এন্ট্রি", en: "20 Diary Entries", check: (d) => d.diaryCount >= 20 },
    { id: "firstSector", icon: "🏗️", bn: "প্রথম সেক্টর", en: "First Sector", check: (d) => d.sectorCount >= 1 },
  ];

  async function computeStats() {
    const streak = parseInt(localStorage.getItem("challenge_streak") || "0", 10);

    let examCount = 0, bestPct = 0;
    try {
      const attempts = await DB.all(DB.STORES.examAttempts);
      examCount = attempts.length;
      attempts.forEach((a) => {
        const pct = a.total ? (a.score / a.total) * 100 : 0;
        if (pct > bestPct) bestPct = pct;
      });
    } catch (_) { /* store may not exist yet */ }

    let focusMinutes = 0;
    try {
      const logs = await DB.all(DB.STORES.focusLogs);
      focusMinutes = logs.reduce((sum, l) => sum + (l.minutes || 0), 0);
    } catch (_) { /* ignore */ }

    let wordCount = 0;
    try {
      wordCount = (await DB.all(DB.STORES.customDict)).length;
    } catch (_) { /* ignore */ }

    let diaryCount = 0;
    try {
      diaryCount = (await DB.all(DB.STORES.studyLog)).length;
    } catch (_) { /* ignore */ }

    let sectorCount = 0;
    try {
      sectorCount = (await DB.all(DB.STORES.sectors)).length;
    } catch (_) { /* ignore */ }

    const xp = Math.round(
      streak * 10 +
      examCount * 15 +
      bestPct * 0.5 +
      (focusMinutes / 5) +
      wordCount * 5 +
      diaryCount * 8 +
      sectorCount * 20
    );

    return { streak, examCount, bestPct: Math.round(bestPct), focusMinutes, wordCount, diaryCount, sectorCount, xp };
  }

  // প্রতি লেভেলে দরকারি XP ক্রমশ বাড়তে থাকে (সহজ curve)।
  function levelFromXp(xp) {
    const thresholds = [0, 50, 150, 350, 700, 1300, 2200];
    let level = 1;
    for (let i = 1; i < thresholds.length; i++) {
      if (xp >= thresholds[i]) level = i + 1;
    }
    const idx = Math.min(level, thresholds.length) - 1;
    const nextThreshold = thresholds[idx + 1] ?? null;
    const curThreshold = thresholds[idx];
    return { level, curThreshold, nextThreshold };
  }

  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function render(container) {
    if (!container) return;
    const t = s();
    const L = lang();
    const stats = await computeStats();
    const { level, curThreshold, nextThreshold } = levelFromXp(stats.xp);
    const titles = LEVEL_TITLES[L] || LEVEL_TITLES.bn;
    const levelTitle = titles[Math.min(level - 1, titles.length - 1)];

    const progressPct = nextThreshold
      ? Math.min(100, Math.round(((stats.xp - curThreshold) / (nextThreshold - curThreshold)) * 100))
      : 100;

    container.innerHTML = `
      <div class="level-card">
        <div class="level-badge-circle">Lv ${level}</div>
        <div class="level-info">
          <div class="level-title">${esc(levelTitle)}</div>
          <div class="level-xp-bar"><div class="level-xp-fill" style="width:${progressPct}%"></div></div>
          <div class="level-xp-text">${nextThreshold ? t.xpToNext(stats.xp, nextThreshold) : t.maxLevel}</div>
        </div>
      </div>

      <h4 class="archive-section-heading">${t.statsTitle}</h4>
      <div class="stat-grid">
        <div class="stat-chip"><b>${stats.streak}</b><span>${t.statStreak}</span></div>
        <div class="stat-chip"><b>${stats.examCount}</b><span>${t.statExams}</span></div>
        <div class="stat-chip"><b>${stats.bestPct}%</b><span>${t.statBestScore}</span></div>
        <div class="stat-chip"><b>${(stats.focusMinutes / 60).toFixed(1)}</b><span>${t.statFocus}</span></div>
        <div class="stat-chip"><b>${stats.wordCount}</b><span>${t.statWords}</span></div>
        <div class="stat-chip"><b>${stats.diaryCount}</b><span>${t.statDiary}</span></div>
      </div>

      <h4 class="archive-section-heading">${t.badgesTitle}</h4>
      <div class="badge-grid">
        ${BADGES.map((b) => {
          const unlocked = b.check(stats);
          return `
            <div class="badge-tile ${unlocked ? "unlocked" : "locked"}">
              <div class="badge-icon">${b.icon}</div>
              <div class="badge-name">${esc(L === "en" ? b.en : b.bn)}</div>
              ${!unlocked ? `<div class="badge-lock">${t.locked}</div>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  // ড্যাশবোর্ডে ছোট্ট একটা "Level X" চিপ দেখানোর জন্য (ঐচ্ছিক)।
  async function renderMiniChip(container) {
    if (!container) return;
    const stats = await computeStats();
    const { level } = levelFromXp(stats.xp);
    container.innerHTML = `<span class="level-mini-chip">🏅 Lv ${level}</span>`;
  }

  return { render, renderMiniChip, computeStats, levelFromXp, BADGES };
})();

window.Gamification = Gamification;
