/**
 * archive.js — কারেন্ট অ্যাফেয়ার্স ও প্রশ্নব্যাংক (Previous Year Questions) আর্কাইভ।
 * দুটো আলাদা IndexedDB store (currentAffairs, pyq) ব্যবহার করে, তাই Settings-এর
 * ব্যাকআপ/এক্সপোর্টেও এমনিতেই যোগ হয়ে যায়। প্রতিটা এন্ট্রিতে ছবি/PDF সংযুক্তি
 * (attachments) যোগ করা যায় — Blob হিসেবে সরাসরি IndexedDB-তে জমা থাকে
 * (রিসোর্স আপলোড ফিচারের মতোই একই পদ্ধতি)।
 */
const ArchiveView = (() => {
  const STR = {
    bn: {
      affairsTab: "📰 কারেন্ট অ্যাফেয়ার্স",
      pyqTab: "🗂️ প্রশ্নব্যাংক (PYQ)",
      addAffairs: "➕ নতুন এন্ট্রি যোগ করুন",
      addPyq: "➕ নতুন প্রশ্ন যোগ করুন",
      dateLabel: "তারিখ",
      titleLabel: "শিরোনাম",
      contentLabel: "বিস্তারিত",
      contentPh: "কারেন্ট অ্যাফেয়ার্সের বিস্তারিত লিখুন…",
      cancel: "বাতিল",
      save: "সেভ করুন",
      searchPh: "খুঁজুন (শিরোনাম/মাস)…",
      emptyAffairs: "এখনো কোনো কারেন্ট অ্যাফেয়ার্স যোগ করা হয়নি।",
      delConfirm: "এই এন্ট্রি মুছে ফেলতে চান?",
      examNameLabel: "পরীক্ষার নাম",
      examNamePh: "যেমন: 41তম BCS",
      yearLabel: "সাল",
      subjectLabel: "বিষয়",
      subjectPh: "যেমন: বাংলা / গণিত / সাধারণ জ্ঞান",
      questionLabel: "প্রশ্ন",
      questionPh: "প্রশ্নটি লিখুন…",
      answerLabel: "উত্তর / ব্যাখ্যা",
      answerPh: "সঠিক উত্তর বা ব্যাখ্যা লিখুন…",
      searchPyqPh: "খুঁজুন (পরীক্ষা/বিষয়/প্রশ্ন)…",
      emptyPyq: "এখনো কোনো প্রশ্ন যোগ করা হয়নি।",
      showAnswer: "উত্তর দেখুন",
      hideAnswer: "উত্তর লুকান",
      titleRequired: "শিরোনাম আবশ্যক।",
      questionRequired: "প্রশ্ন আবশ্যক।",
      attachLabel: "ছবি বা PDF সংযুক্ত করুন (ঐচ্ছিক)",
      attachHint: "একাধিক ছবি বা PDF ফাইল একসাথে বাছাই করা যাবে।",
      addAttachBtn: "📎 আরও সংযুক্তি যোগ করুন",
      delAttachConfirm: "এই সংযুক্তিটি মুছে ফেলতে চান?",
      viewPdf: "📄 PDF দেখুন",
    },
    en: {
      affairsTab: "📰 Current Affairs",
      pyqTab: "🗂️ Question Bank (PYQ)",
      addAffairs: "➕ Add New Entry",
      addPyq: "➕ Add New Question",
      dateLabel: "Date",
      titleLabel: "Title",
      contentLabel: "Details",
      contentPh: "Write the current affairs details…",
      cancel: "Cancel",
      save: "Save",
      searchPh: "Search (title/month)…",
      emptyAffairs: "No current affairs entries yet.",
      delConfirm: "Delete this entry?",
      examNameLabel: "Exam name",
      examNamePh: "e.g. 41st BCS",
      yearLabel: "Year",
      subjectLabel: "Subject",
      subjectPh: "e.g. Bangla / Math / General Knowledge",
      questionLabel: "Question",
      questionPh: "Write the question…",
      answerLabel: "Answer / Explanation",
      answerPh: "Write the correct answer or explanation…",
      searchPyqPh: "Search (exam/subject/question)…",
      emptyPyq: "No questions added yet.",
      showAnswer: "Show answer",
      hideAnswer: "Hide answer",
      titleRequired: "Title is required.",
      questionRequired: "Question is required.",
      attachLabel: "Attach picture or PDF (optional)",
      attachHint: "You can select multiple images or PDF files at once.",
      addAttachBtn: "📎 Add more attachments",
      delAttachConfirm: "Delete this attachment?",
      viewPdf: "📄 View PDF",
    },
  };

  function lang() {
    return (typeof LangState !== "undefined" && LangState.current) || localStorage.getItem("jobprep_lang") || "bn";
  }
  function s() { return STR[lang()] || STR.bn; }
  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function uidLocal() {
    return (typeof uid === "function") ? uid() : Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  let affairsQuery = "";
  let pyqQuery = "";

  function render(tab, container) {
    if (!container) return;
    if (tab === "pyq") return renderPyq(container);
    return renderAffairs(container);
  }

  /* ফাইল ইনপুট থেকে বাছাই করা ফাইলগুলোকে {id, mime, name, blob} আকারে রূপান্তর করে। */
  async function filesToAttachments(fileList) {
    const files = Array.from(fileList || []);
    return files.map((file) => ({
      id: uidLocal(),
      mime: file.type || "application/octet-stream",
      name: file.name,
      blob: file,
    }));
  }

  /* একটা attachment-কে ছবি/PDF অনুযায়ী কার্ডে রেন্ডার করার HTML + ইভেন্ট বসানো। */
  function renderAttachments(wrapEl, attachments, onDelete) {
    const t = s();
    if (!attachments || attachments.length === 0) { wrapEl.innerHTML = ""; return; }
    wrapEl.innerHTML = attachments.map((a) => {
      const isImage = (a.mime || "").startsWith("image/");
      return `<div class="archive-attach-chip" data-id="${a.id}">
        ${isImage
          ? `<img class="archive-attach-thumb" data-id="${a.id}" alt="${esc(a.name || "")}" />`
          : `<button class="archive-attach-pdf" data-id="${a.id}">${t.viewPdf}${a.name ? `: ${esc(a.name)}` : ""}</button>`
        }
        <button class="archive-attach-del" data-id="${a.id}" title="${t.delAttachConfirm}">✕</button>
      </div>`;
    }).join("");

    attachments.forEach((a) => {
      const url = URL.createObjectURL(a.blob);
      const isImage = (a.mime || "").startsWith("image/");
      if (isImage) {
        const img = wrapEl.querySelector(`img.archive-attach-thumb[data-id="${a.id}"]`);
        if (img) {
          img.src = url;
          img.addEventListener("click", () => window.open(url, "_blank"));
        }
      } else {
        const btn = wrapEl.querySelector(`button.archive-attach-pdf[data-id="${a.id}"]`);
        if (btn) btn.addEventListener("click", () => window.open(url, "_blank"));
      }
    });

    wrapEl.querySelectorAll(".archive-attach-del").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(t.delAttachConfirm)) return;
        onDelete(btn.dataset.id);
      });
    });
  }

  /* ===================== Current Affairs ===================== */
  async function renderAffairs(el) {
    const t = s();
    el.innerHTML = `
      <div class="archive-toolbar">
        <input type="text" id="affairsSearch" placeholder="${t.searchPh}" value="${esc(affairsQuery)}" />
        <button class="btn btn-accent" id="affairsAddBtn">${t.addAffairs}</button>
      </div>
      <div id="affairsList" class="archive-list"></div>
    `;
    qs("#affairsSearch").addEventListener("input", (e) => { affairsQuery = e.target.value; renderAffairsList(); });
    qs("#affairsAddBtn").addEventListener("click", () => openAffairsForm());
    await renderAffairsList();
  }

  async function renderAffairsList() {
    const t = s();
    const listEl = document.getElementById("affairsList");
    if (!listEl) return;
    let items = (await DB.all(DB.STORES.currentAffairs)).sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.createdAt - a.createdAt);
    const q = affairsQuery.trim().toLowerCase();
    if (q) items = items.filter((it) => (it.title || "").toLowerCase().includes(q) || (it.date || "").includes(q));

    if (items.length === 0) {
      listEl.innerHTML = `<div class="empty-state">${t.emptyAffairs}</div>`;
      return;
    }
    listEl.innerHTML = "";
    items.forEach((it) => {
      const card = document.createElement("div");
      card.className = "archive-card";
      card.innerHTML = `
        <div class="archive-card-head">
          <span class="archive-date-chip">${esc(fmtArchiveDate(it.date))}</span>
          <button class="archive-del-btn" title="${t.delConfirm}">✕</button>
        </div>
        <div class="archive-card-title">${esc(it.title)}</div>
        ${it.content ? `<div class="archive-card-body">${esc(it.content).replace(/\n/g, "<br>")}</div>` : ""}
        <div class="archive-attach-wrap"></div>
        <button class="btn btn-sm btn-ghost archive-add-attach-btn">${t.addAttachBtn}</button>
        <input type="file" class="archive-attach-input hidden" accept="image/*,.pdf,application/pdf" multiple />
      `;
      card.querySelector(".archive-del-btn").addEventListener("click", async () => {
        if (!confirm(t.delConfirm)) return;
        await DB.delete(DB.STORES.currentAffairs, it.id);
        renderAffairsList();
      });

      const attachWrap = card.querySelector(".archive-attach-wrap");
      const onAttachDelete = async (attachId) => {
        it.attachments = (it.attachments || []).filter((a) => a.id !== attachId);
        await DB.put(DB.STORES.currentAffairs, it);
        renderAttachments(attachWrap, it.attachments, onAttachDelete);
      };
      renderAttachments(attachWrap, it.attachments, onAttachDelete);

      const fileInput = card.querySelector(".archive-attach-input");
      card.querySelector(".archive-add-attach-btn").addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", async (e) => {
        const newOnes = await filesToAttachments(e.target.files);
        it.attachments = [...(it.attachments || []), ...newOnes];
        await DB.put(DB.STORES.currentAffairs, it);
        renderAffairsList();
      });

      listEl.appendChild(card);
    });
  }

  function fmtArchiveDate(dateStr) {
    if (!dateStr) return "—";
    if (typeof fmtDate === "function") {
      try { return fmtDate(dateStr); } catch (_) { /* fallthrough */ }
    }
    return dateStr;
  }

  function openAffairsForm() {
    const t = s();
    const today = new Date().toISOString().slice(0, 10);
    openModal(`
      <h3 class="modal-title">${t.addAffairs}</h3>
      <div class="form-row">
        <label>${t.dateLabel}</label>
        <input type="date" id="caDateInput" value="${today}" />
      </div>
      <div class="form-row">
        <label>${t.titleLabel}</label>
        <input type="text" id="caTitleInput" placeholder="${t.titleLabel}" />
      </div>
      <div class="form-row">
        <label>${t.contentLabel}</label>
        <textarea id="caContentInput" rows="5" placeholder="${t.contentPh}"></textarea>
      </div>
      <div class="form-row">
        <label>${t.attachLabel}</label>
        <input type="file" id="caAttachInput" accept="image/*,.pdf,application/pdf" multiple />
        <div class="field-hint">${t.attachHint}</div>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" id="caCancelBtn">${t.cancel}</button>
        <button class="btn btn-accent" id="caSaveBtn">${t.save}</button>
      </div>
    `, { wide: true });
    qs("#caCancelBtn").addEventListener("click", closeModal);
    qs("#caSaveBtn").addEventListener("click", async () => {
      const title = qs("#caTitleInput").value.trim();
      if (!title) { toast(t.titleRequired); return; }
      const attachments = await filesToAttachments(qs("#caAttachInput").files);
      await DB.put(DB.STORES.currentAffairs, {
        id: uidLocal(),
        date: qs("#caDateInput").value || today,
        title,
        content: qs("#caContentInput").value.trim(),
        attachments,
        createdAt: Date.now(),
      });
      closeModal();
      renderAffairsList();
    });
  }

  /* ===================== PYQ (Previous Year Questions) ===================== */
  async function renderPyq(el) {
    const t = s();
    el.innerHTML = `
      <div class="archive-toolbar">
        <input type="text" id="pyqSearch" placeholder="${t.searchPyqPh}" value="${esc(pyqQuery)}" />
        <button class="btn btn-accent" id="pyqAddBtn">${t.addPyq}</button>
      </div>
      <div id="pyqList" class="archive-list"></div>
    `;
    qs("#pyqSearch").addEventListener("input", (e) => { pyqQuery = e.target.value; renderPyqList(); });
    qs("#pyqAddBtn").addEventListener("click", () => openPyqForm());
    await renderPyqList();
  }

  async function renderPyqList() {
    const t = s();
    const listEl = document.getElementById("pyqList");
    if (!listEl) return;
    let items = (await DB.all(DB.STORES.pyq)).sort((a, b) => b.createdAt - a.createdAt);
    const q = pyqQuery.trim().toLowerCase();
    if (q) {
      items = items.filter((it) =>
        (it.examName || "").toLowerCase().includes(q) ||
        (it.subject || "").toLowerCase().includes(q) ||
        (it.question || "").toLowerCase().includes(q)
      );
    }

    if (items.length === 0) {
      listEl.innerHTML = `<div class="empty-state">${t.emptyPyq}</div>`;
      return;
    }
    listEl.innerHTML = "";
    items.forEach((it) => {
      const card = document.createElement("div");
      card.className = "archive-card";
      const metaBits = [it.examName, it.year, it.subject].filter(Boolean).map(esc).join(" · ");
      card.innerHTML = `
        <div class="archive-card-head">
          <span class="archive-date-chip">${metaBits || "—"}</span>
          <button class="archive-del-btn" title="${t.delConfirm}">✕</button>
        </div>
        <div class="archive-card-title">${esc(it.question)}</div>
        ${it.answer ? `
          <button class="btn btn-sm archive-toggle-ans" data-open="0">${t.showAnswer}</button>
          <div class="archive-card-body archive-answer hidden">${esc(it.answer).replace(/\n/g, "<br>")}</div>
        ` : ""}
        <div class="archive-attach-wrap"></div>
        <button class="btn btn-sm btn-ghost archive-add-attach-btn">${t.addAttachBtn}</button>
        <input type="file" class="archive-attach-input hidden" accept="image/*,.pdf,application/pdf" multiple />
      `;
      card.querySelector(".archive-del-btn").addEventListener("click", async () => {
        if (!confirm(t.delConfirm)) return;
        await DB.delete(DB.STORES.pyq, it.id);
        renderPyqList();
      });
      const toggleBtn = card.querySelector(".archive-toggle-ans");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          const ansEl = card.querySelector(".archive-answer");
          const isOpen = toggleBtn.dataset.open === "1";
          ansEl.classList.toggle("hidden", isOpen);
          toggleBtn.dataset.open = isOpen ? "0" : "1";
          toggleBtn.textContent = isOpen ? t.showAnswer : t.hideAnswer;
        });
      }

      const attachWrap = card.querySelector(".archive-attach-wrap");
      renderAttachments(attachWrap, it.attachments, async (attachId) => {
        it.attachments = (it.attachments || []).filter((a) => a.id !== attachId);
        await DB.put(DB.STORES.pyq, it);
        renderPyqList();
      });

      const fileInput = card.querySelector(".archive-attach-input");
      card.querySelector(".archive-add-attach-btn").addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", async (e) => {
        const newOnes = await filesToAttachments(e.target.files);
        it.attachments = [...(it.attachments || []), ...newOnes];
        await DB.put(DB.STORES.pyq, it);
        renderPyqList();
      });

      listEl.appendChild(card);
    });
  }

  function openPyqForm() {
    const t = s();
    openModal(`
      <h3 class="modal-title">${t.addPyq}</h3>
      <div class="form-grid2">
        <div class="form-row">
          <label>${t.examNameLabel}</label>
          <input type="text" id="pqExamInput" placeholder="${t.examNamePh}" />
        </div>
        <div class="form-row">
          <label>${t.yearLabel}</label>
          <input type="number" id="pqYearInput" placeholder="${new Date().getFullYear()}" />
        </div>
      </div>
      <div class="form-row">
        <label>${t.subjectLabel}</label>
        <input type="text" id="pqSubjectInput" placeholder="${t.subjectPh}" />
      </div>
      <div class="form-row">
        <label>${t.questionLabel}</label>
        <textarea id="pqQuestionInput" rows="3" placeholder="${t.questionPh}"></textarea>
      </div>
      <div class="form-row">
        <label>${t.answerLabel}</label>
        <textarea id="pqAnswerInput" rows="3" placeholder="${t.answerPh}"></textarea>
      </div>
      <div class="form-row">
        <label>${t.attachLabel}</label>
        <input type="file" id="pqAttachInput" accept="image/*,.pdf,application/pdf" multiple />
        <div class="field-hint">${t.attachHint}</div>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" id="pqCancelBtn">${t.cancel}</button>
        <button class="btn btn-accent" id="pqSaveBtn">${t.save}</button>
      </div>
    `, { wide: true });
    qs("#pqCancelBtn").addEventListener("click", closeModal);
    qs("#pqSaveBtn").addEventListener("click", async () => {
      const question = qs("#pqQuestionInput").value.trim();
      if (!question) { toast(t.questionRequired); return; }
      const attachments = await filesToAttachments(qs("#pqAttachInput").files);
      await DB.put(DB.STORES.pyq, {
        id: uidLocal(),
        examName: qs("#pqExamInput").value.trim(),
        year: qs("#pqYearInput").value.trim(),
        subject: qs("#pqSubjectInput").value.trim(),
        question,
        answer: qs("#pqAnswerInput").value.trim(),
        attachments,
        createdAt: Date.now(),
      });
      closeModal();
      renderPyqList();
    });
  }

  return { render, STR };
})();

window.ArchiveView = ArchiveView;
