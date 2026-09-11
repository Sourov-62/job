/**
 * exam.js — Exam Center: অভিধানের শব্দ থেকে অটোমেটিক MCQ প্র্যাকটিস এক্সাম তৈরি,
 * নেওয়া এবং মূল্যায়ন (evaluation) করার ফিচার।
 *
 * - "Exam" = ব্যবহারকারীর তৈরি করা একটা কুইজ কনফিগারেশন (নাম, প্রশ্ন সংখ্যা, দিক)।
 * - প্রতিবার "শুরু করুন" চাপলে অভিধান (বিল্ট-ইন + কাস্টম শব্দ) থেকে র‍্যান্ডমভাবে
 *   নতুন প্রশ্ন তৈরি হয়, তাই একই exam বারবার নিলেও প্রতিবার ভিন্ন প্রশ্ন আসবে।
 * - সব ডেটা (exams + attempts/history) IndexedDB-তে থাকে, তাই Settings-এর
 *   ব্যাকআপ/এক্সপোর্ট ফিচারেও এগুলো সাথেই এক্সপোর্ট হবে।
 */
const ExamCenter = (() => {
  const STR = {
    bn: {
      createBtn: "➕ নতুন Exam তৈরি করুন",
      titleLabel: "Exam এর নাম",
      titlePh: "যেমন: Vocabulary Test 1",
      countLabel: "প্রশ্ন সংখ্যা",
      dirLabel: "প্রশ্নের ধরন",
      dirWord2Bn: "শব্দ দেখাবে → অর্থ বাছাই করুন",
      dirBn2Word: "অর্থ দেখাবে → শব্দ বাছাই করুন",
      dirMixed: "মিশ্র (দুটোই)",
      sourceLabel: "প্রশ্নের উৎস",
      sourceDictionary: "📖 অভিধান (শব্দ ও অর্থ)",
      sourcePyq: "🗂️ প্রশ্নব্যাংক (PYQ)",
      sourceAffairs: "📰 কারেন্ট অ্যাফেয়ার্স",
      cancel: "বাতিল",
      save: "তৈরি করুন",
      empty: "এখনো কোনো Exam তৈরি করা হয়নি। অভিধান, প্রশ্নব্যাংক বা কারেন্ট অ্যাফেয়ার্স থেকে অটোমেটিক প্রশ্ন সহ একটা Exam বানান!",
      start: "▶️ শুরু করুন",
      delete: "মুছুন",
      needWords: (n) => `অভিধানে আরও শব্দ দরকার (কমপক্ষে ${n}টি অপশন বানানোর জন্য)।`,
      needPyq: (n) => `প্রশ্নব্যাংকে উত্তরসহ আরও প্রশ্ন দরকার (কমপক্ষে ${n}টি)। আগে "কারেন্ট অ্যাফেয়ার্স ও প্রশ্নব্যাংক" থেকে প্রশ্ন যোগ করুন।`,
      needAffairs: (n) => `কারেন্ট অ্যাফেয়ার্সে আরও এন্ট্রি দরকার (কমপক্ষে ${n}টি)। আগে "কারেন্ট অ্যাফেয়ার্স ও প্রশ্নব্যাংক" থেকে এন্ট্রি যোগ করুন।`,
      question: "প্রশ্ন",
      of: "এর মধ্যে",
      next: "পরবর্তী",
      finish: "জমা দিন ও ফলাফল দেখুন",
      resultTitle: "🎯 ফলাফল",
      scoreLabel: "স্কোর",
      correctLabel: "সঠিক",
      wrongLabel: "ভুল",
      yourAnswer: "তোমার উত্তর",
      correctAnswer: "সঠিক উত্তর",
      backToList: "Exam Center-এ ফিরুন",
      retake: "🔁 আবার দিন",
      recentAttempts: "সাম্প্রতিক ফলাফল",
      noAttempts: "এখনো কোনো Exam দেওয়া হয়নি।",
      selectAnswer: "অনুগ্রহ করে একটা উত্তর বাছাই করুন।",
      confirmDelete: "এই Exam-টা মুছে ফেলতে চান?",
      affairsPromptLabel: "কোন শিরোনামের খবর এটা?",
    },
    en: {
      createBtn: "➕ Create New Exam",
      titleLabel: "Exam name",
      titlePh: "e.g. Vocabulary Test 1",
      countLabel: "Number of questions",
      dirLabel: "Question type",
      dirWord2Bn: "Show word → pick meaning",
      dirBn2Word: "Show meaning → pick word",
      dirMixed: "Mixed (both)",
      sourceLabel: "Question source",
      sourceDictionary: "📖 Dictionary (word & meaning)",
      sourcePyq: "🗂️ Question Bank (PYQ)",
      sourceAffairs: "📰 Current Affairs",
      cancel: "Cancel",
      save: "Create",
      empty: "No exams yet. Create one with auto-generated questions from your dictionary, question bank or current affairs!",
      start: "▶️ Start",
      delete: "Delete",
      needWords: (n) => `Need more dictionary words (at least ${n} to build options).`,
      needPyq: (n) => `Need more questions with answers in the Question Bank (at least ${n}). Add some from "Current Affairs & Question Bank" first.`,
      needAffairs: (n) => `Need more entries in Current Affairs (at least ${n}). Add some from "Current Affairs & Question Bank" first.`,
      question: "Question",
      of: "of",
      next: "Next",
      finish: "Submit & See Result",
      resultTitle: "🎯 Result",
      scoreLabel: "Score",
      correctLabel: "Correct",
      wrongLabel: "Wrong",
      yourAnswer: "Your answer",
      correctAnswer: "Correct answer",
      backToList: "Back to Exam Center",
      retake: "🔁 Retake",
      recentAttempts: "Recent Results",
      noAttempts: "No exams taken yet.",
      selectAnswer: "Please select an answer.",
      confirmDelete: "Delete this exam?",
      affairsPromptLabel: "Which headline does this belong to?",
    },
  };

  function lang() {
    return (typeof LangState !== "undefined" && LangState.current) || localStorage.getItem("jobprep_lang") || "bn";
  }
  function s() { return STR[lang()] || STR.bn; }
  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function shuffle(items) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function truncate(str, n) {
    const clean = String(str || "").trim();
    return clean.length > n ? clean.slice(0, n).trim() + "…" : clean;
  }

  // ---- state ----
  let view = "list"; // list | create | quiz | result
  let quizState = null; // { exam, questions, current, answers }

  async function getDictionaryPool() {
    const builtin = (typeof BUILTIN_DICTIONARY !== "undefined" ? BUILTIN_DICTIONARY : []).map(
      ([word, pos, bnMeaning, enMeaning]) => ({ word, pos, meaning: bnMeaning || enMeaning })
    );
    let custom = [];
    try {
      custom = typeof Dictionary !== "undefined" && Dictionary.listCustom ? await Dictionary.listCustom() : [];
    } catch (_) { custom = []; }
    custom = custom
      .filter((c) => c.word && (c.bnMeaning || c.enMeaning))
      .map((c) => ({ word: c.word, pos: c.pos || "", meaning: c.bnMeaning || c.enMeaning }));
    // ডুপ্লিকেট শব্দ বাদ (কাস্টম শব্দ বিল্ট-ইনকে override করবে)
    const map = new Map();
    [...builtin, ...custom].forEach((e) => map.set(e.word.toLowerCase(), e));
    return [...map.values()];
  }

  async function getPyqPool() {
    let items = [];
    try { items = await DB.all(DB.STORES.pyq); } catch (_) { items = []; }
    return items
      .filter((it) => (it.question || "").trim() && (it.answer || "").trim())
      .map((it) => ({ prompt: it.question.trim(), answer: it.answer.trim(), pos: [it.examName, it.subject].filter(Boolean).join(" · ") }));
  }

  async function getAffairsPool() {
    let items = [];
    try { items = await DB.all(DB.STORES.currentAffairs); } catch (_) { items = []; }
    return items
      .filter((it) => (it.title || "").trim())
      .map((it) => ({
        prompt: (it.content || "").trim() ? truncate(it.content, 220) : it.title.trim(),
        answer: it.title.trim(),
        pos: it.date || "",
      }));
  }

  // অভিধান ছাড়া (PYQ / Current Affairs) কনটেন্ট থেকে সাধারণ MCQ প্রশ্ন বানানোর
  // যৌক্তিক ধাপ — vocabulary quiz-এর মতোই একই কাঠামো: prompt → সঠিক উত্তর + ৩টা distractor।
  function buildContentQuestions(pool, count) {
    // একই prompt/answer জোড়া দুইবার না আসার জন্য answer অনুযায়ী ডিডুপ করা হলো।
    const seen = new Set();
    const usable = pool.filter((it) => {
      const key = it.prompt + "||" + it.answer;
      if (seen.has(key) || !it.prompt || !it.answer) return false;
      seen.add(key);
      return true;
    });
    const n = Math.min(count, usable.length);
    const targets = shuffle(usable).slice(0, n);
    return targets.map((target) => {
      const distractorPool = usable.filter((it) => it.answer !== target.answer);
      const distractors = shuffle(distractorPool).slice(0, 3).map((it) => truncate(it.answer, 70));
      const correctAnswer = truncate(target.answer, 70);
      const options = shuffle([correctAnswer, ...distractors]);
      return {
        prompt: target.prompt,
        pos: target.pos || "",
        direction: "content",
        options,
        correctIndex: options.indexOf(correctAnswer),
      };
    });
  }

  function buildQuestions(pool, count, direction) {
    const usable = pool.filter((w) => w.word && w.meaning);
    const n = Math.min(count, usable.length);
    const targets = shuffle(usable).slice(0, n);
    return targets.map((target) => {
      const dir = direction === "mixed" ? (Math.random() < 0.5 ? "word2bn" : "bn2word") : direction;
      const isWord2Bn = dir === "word2bn";
      const correctAnswer = isWord2Bn ? target.meaning : target.word;
      const distractorPool = usable.filter((w) => w.word !== target.word);
      const distractors = shuffle(distractorPool)
        .slice(0, 3)
        .map((w) => (isWord2Bn ? w.meaning : w.word));
      const options = shuffle([correctAnswer, ...distractors]);
      return {
        prompt: isWord2Bn ? target.word : target.meaning,
        pos: target.pos,
        direction: dir,
        options,
        correctIndex: options.indexOf(correctAnswer),
      };
    });
  }

  async function init() {
    view = "list";
    quizState = null;
    await render();
  }

  async function render() {
    const el = document.getElementById("examCenterBody");
    if (!el) return;
    const t = s();
    if (view === "create") return renderCreate(el, t);
    if (view === "quiz") return renderQuiz(el, t);
    if (view === "result") return renderResult(el, t);
    return renderList(el, t);
  }

  async function renderList(el, t) {
    const exams = (await DB.all(DB.STORES.exams)).sort((a, b) => b.createdAt - a.createdAt);
    const attempts = (await DB.all(DB.STORES.examAttempts)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

    el.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
        <button class="btn btn-accent" id="examCreateBtn">${t.createBtn}</button>
      </div>
      <div id="examListWrap" class="quick-exam-list">
        ${exams.length ? "" : `<div class="empty-state">${t.empty}</div>`}
      </div>
      ${attempts.length ? `
        <h4 style="margin:18px 0 8px;font-size:0.9rem;">${t.recentAttempts}</h4>
        <div class="exam-attempt-list">
          ${attempts.map((a) => `
            <div class="exam-attempt-row">
              <span>${esc(a.examTitle)}</span>
              <b class="${a.score / a.total >= 0.6 ? "exam-score-good" : "exam-score-bad"}">${a.score}/${a.total}</b>
            </div>
          `).join("")}
        </div>
      ` : ""}
    `;

    const listWrap = document.getElementById("examListWrap");
    exams.forEach((exam) => {
      const row = document.createElement("div");
      row.className = "quick-exam-item";
      row.innerHTML = `
        <div>
          <strong>${esc(exam.title)}</strong>
          <div class="muted">${exam.count} ${t.question.toLowerCase()} · ${sourceLabel(exam, t)}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-accent" data-act="start">${t.start}</button>
          <button class="btn btn-sm btn-danger" data-act="del">✕</button>
        </div>
      `;
      row.querySelector('[data-act="start"]').addEventListener("click", () => startExam(exam));
      row.querySelector('[data-act="del"]').addEventListener("click", async () => {
        if (!confirm(t.confirmDelete)) return;
        await DB.delete(DB.STORES.exams, exam.id);
        render();
      });
      listWrap.appendChild(row);
    });

    document.getElementById("examCreateBtn").addEventListener("click", () => { view = "create"; render(); });
  }

  function sourceLabel(exam, t) {
    const src = exam.source || "dictionary";
    if (src === "pyq") return t.sourcePyq;
    if (src === "affairs") return t.sourceAffairs;
    return exam.direction === "word2bn" ? t.dirWord2Bn : exam.direction === "bn2word" ? t.dirBn2Word : t.dirMixed;
  }

  function renderCreate(el, t) {
    el.innerHTML = `
      <div class="exam-create-form">
        <div class="form-row">
          <label>${t.titleLabel}</label>
          <input type="text" id="examTitleInput" placeholder="${t.titlePh}" />
        </div>
        <div class="form-row">
          <label>${t.countLabel}</label>
          <select id="examCountInput">
            <option value="5">5</option>
            <option value="10" selected>10</option>
            <option value="15">15</option>
            <option value="20">20</option>
          </select>
        </div>
        <div class="form-row">
          <label>${t.sourceLabel}</label>
          <select id="examSourceInput">
            <option value="dictionary" selected>${t.sourceDictionary}</option>
            <option value="pyq">${t.sourcePyq}</option>
            <option value="affairs">${t.sourceAffairs}</option>
          </select>
        </div>
        <div class="form-row" id="examDirRow">
          <label>${t.dirLabel}</label>
          <select id="examDirInput">
            <option value="word2bn">${t.dirWord2Bn}</option>
            <option value="bn2word">${t.dirBn2Word}</option>
            <option value="mixed" selected>${t.dirMixed}</option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn btn-ghost" id="examCancelBtn">${t.cancel}</button>
          <button class="btn btn-accent" id="examSaveBtn">${t.save}</button>
        </div>
      </div>
    `;
    const dirRow = document.getElementById("examDirRow");
    const sourceInput = document.getElementById("examSourceInput");
    sourceInput.addEventListener("change", () => {
      dirRow.style.display = sourceInput.value === "dictionary" ? "" : "none";
    });
    document.getElementById("examCancelBtn").addEventListener("click", () => { view = "list"; render(); });
    document.getElementById("examSaveBtn").addEventListener("click", async () => {
      const title = document.getElementById("examTitleInput").value.trim() || (lang() === "bn" ? "Vocabulary Test" : "Vocabulary Test");
      const count = parseInt(document.getElementById("examCountInput").value, 10);
      const source = sourceInput.value;
      const direction = document.getElementById("examDirInput").value;
      const exam = { id: uid(), title, count, source, direction, createdAt: Date.now() };
      await DB.put(DB.STORES.exams, exam);
      view = "list";
      render();
    });
  }

  async function startExam(exam) {
    const t = s();
    const source = exam.source || "dictionary";

    if (source === "pyq") {
      const pool = await getPyqPool();
      if (pool.length < 4) { alert(t.needPyq(4)); return; }
      const questions = buildContentQuestions(pool, exam.count);
      quizState = { exam, questions, current: 0, answers: new Array(questions.length).fill(null) };
      view = "quiz"; render();
      return;
    }

    if (source === "affairs") {
      const pool = await getAffairsPool();
      if (pool.length < 4) { alert(t.needAffairs(4)); return; }
      const questions = buildContentQuestions(pool, exam.count);
      quizState = { exam, questions, current: 0, answers: new Array(questions.length).fill(null) };
      view = "quiz"; render();
      return;
    }

    const pool = await getDictionaryPool();
    if (pool.length < 4) {
      alert(t.needWords(4));
      return;
    }
    const questions = buildQuestions(pool, exam.count, exam.direction);
    quizState = { exam, questions, current: 0, answers: new Array(questions.length).fill(null) };
    view = "quiz";
    render();
  }

  function renderQuiz(el, t) {
    const { exam, questions, current, answers } = quizState;
    const q = questions[current];
    const chosen = answers[current];

    el.innerHTML = `
      <div class="exam-progress">
        <span>${esc(exam.title)}</span>
        <span>${t.question} ${current + 1} ${t.of} ${questions.length}</span>
      </div>
      <div class="exam-progress-bar"><div class="exam-progress-fill" style="width:${((current + 1) / questions.length) * 100}%"></div></div>
      <div class="exam-question-card">
        ${q.pos ? `<div class="exam-question-pos">${esc(q.pos)}</div>` : ""}
        <div class="exam-question-prompt">${esc(q.prompt)}</div>
      </div>
      <div class="exam-options" id="examOptions">
        ${q.options.map((opt, idx) => `
          <button class="exam-option-btn ${chosen === idx ? "selected" : ""}" data-idx="${idx}">${esc(opt)}</button>
        `).join("")}
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" id="examBackBtn">${t.backToList}</button>
        <button class="btn btn-accent" id="examNextBtn">${current === questions.length - 1 ? t.finish : t.next}</button>
      </div>
    `;

    document.querySelectorAll("#examOptions .exam-option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        answers[current] = parseInt(btn.dataset.idx, 10);
        document.querySelectorAll("#examOptions .exam-option-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });

    document.getElementById("examBackBtn").addEventListener("click", () => {
      if (confirm(lang() === "bn" ? "এই Exam বাতিল করে ফিরে যাবেন?" : "Exit this exam and go back?")) {
        quizState = null; view = "list"; render();
      }
    });

    document.getElementById("examNextBtn").addEventListener("click", async () => {
      if (answers[current] === null) { alert(t.selectAnswer); return; }
      if (current < questions.length - 1) {
        quizState.current += 1;
        render();
      } else {
        await finishExam();
      }
    });
  }

  async function finishExam() {
    const { exam, questions, answers } = quizState;
    const details = questions.map((q, i) => ({
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      chosenIndex: answers[i],
      isCorrect: answers[i] === q.correctIndex,
    }));
    const score = details.filter((d) => d.isCorrect).length;
    const attempt = {
      id: uid(),
      examId: exam.id,
      examTitle: exam.title,
      score,
      total: questions.length,
      details,
      createdAt: Date.now(),
    };
    await DB.put(DB.STORES.examAttempts, attempt);
    quizState.attempt = attempt;
    view = "result";
    render();
  }

  function renderResult(el, t) {
    const { attempt, exam } = quizState;
    const pct = Math.round((attempt.score / attempt.total) * 100);
    el.innerHTML = `
      <div class="exam-result-summary">
        <h3>${t.resultTitle}</h3>
        <div class="exam-result-score">${attempt.score} / ${attempt.total}</div>
        <div class="exam-result-pct">${pct}%</div>
      </div>
      <div class="exam-result-list">
        ${attempt.details.map((d, i) => `
          <div class="exam-result-row ${d.isCorrect ? "correct" : "wrong"}">
            <div class="exam-result-q">${i + 1}. ${esc(d.prompt)}</div>
            <div class="exam-result-a">${t.yourAnswer}: <b>${esc(d.chosenIndex !== null ? d.options[d.chosenIndex] : "—")}</b></div>
            ${!d.isCorrect ? `<div class="exam-result-a correct-line">${t.correctAnswer}: <b>${esc(d.options[d.correctIndex])}</b></div>` : ""}
          </div>
        `).join("")}
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" id="examBackBtn2">${t.backToList}</button>
        <button class="btn btn-accent" id="examRetakeBtn">${t.retake}</button>
      </div>
    `;
    document.getElementById("examBackBtn2").addEventListener("click", () => { quizState = null; view = "list"; render(); });
    document.getElementById("examRetakeBtn").addEventListener("click", () => startExam(exam));
  }

  return { init };
})();

window.ExamCenter = ExamCenter;
