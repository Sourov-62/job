const DailyChallenge = {
  translations: {
    bn: {
      title: "🔥 ডেইলি চ্যালেঞ্জ ও স্ট্রিক হিস্টোরি",
      todayTarget: "📅 আজকের লক্ষ্য (Today's Tasks)",
      historyTitle: "📜 দৈনিক হিস্টোরি রেকর্ড (Day by Day)",
      submitBtn: "আজকের চ্যালেঞ্জ সাবমিট করুন",
      submitBtnLocked: "আজকের জন্য সাবমিট হয়ে গেছে ✓",
      completedMsg: "🎉 আজকের সব চ্যালেঞ্জ সম্পন্ন হয়েছে!",
      lockedMsg: "✅ আজকের চ্যালেঞ্জ সাবমিট হয়ে গেছে। রাত ১২টার পর (আগামীকাল) আবার সাবমিট করতে পারবেন।",
      noHistory: "এখনো কোনো ডাটা সেভ হয়নি।",
      colDate: "তারিখ",
      colProgress: "অগ্রগতি",
      colStatus: "স্ট্যাটাস",
      statusDone: "সম্পন্ন",
      statusPending: "আংশিক",
      streakText: "দিন স্ট্রিক 🔥",
      alertSelect: "অনুগ্রহ করে অন্তত একটি লক্ষ্য সিলেক্ট করুন!",
      alertDoneAll: "অসাধারণ! আজকের সব চ্যালেঞ্জ সম্পন্ন হয়েছে! 🔥",
      alertSaved: "আজকের অগ্রগতি সেভ করা হয়েছে!",
      alertAlready: "আজকের চ্যালেঞ্জ ইতিমধ্যে সাবমিট করা হয়েছে। রাত ১২টার পর (আগামীকাল) আবার সাবমিট করা যাবে।",
      tasks: [
        "কমপক্ষে ৫০টি MCQ প্রশ্ন সমাধান করুন",
        "আজকের দৈনিক কারেন্ট অ্যাফেয়ার্স পড়ুন",
        "কমপক্ষে ১ ঘণ্টা ফোকাস সেশনে মনোযোগ দিন",
        "স্টিকি নোট বা অভিধানে নতুন ৫টি তথ্য যুক্ত করুন"
      ]
    },
    en: {
      title: "🔥 Daily Challenge & Streak History",
      todayTarget: "📅 Today's Target",
      historyTitle: "📜 Daily History Logs (Day by Day)",
      submitBtn: "Submit Today's Challenge",
      submitBtnLocked: "Submitted for today ✓",
      completedMsg: "🎉 All targets for today are completed!",
      lockedMsg: "✅ Today's challenge is already submitted. You can submit again after midnight (tomorrow).",
      noHistory: "No history record found.",
      colDate: "Date",
      colProgress: "Progress",
      colStatus: "Status",
      statusDone: "Completed",
      statusPending: "Partial",
      streakText: "Days Streak 🔥",
      alertSelect: "Please select at least one task!",
      alertDoneAll: "Awesome! You completed today's challenge! 🔥",
      alertSaved: "Progress saved for today!",
      alertAlready: "Today's challenge is already submitted. You can submit again after midnight (tomorrow).",
      tasks: [
        "Solve at least 50 MCQ questions",
        "Read today's current affairs",
        "Focus on study for at least 1 hour",
        "Add 5 new items to Sticky Notes or Dictionary"
      ]
    }
  },

  getCurrentLang() {
    // মূল অ্যাপ ভাষা 'jobprep_lang' কী-তে সেভ থাকে (দেখুন js/i18n.js এর LangState)।
    // আগে এখানে ভুল কী ('app_lang') পড়া হতো, তাই ভাষা বদলালেও এই সেকশন আপডেট হতো না — এখন ঠিক করা হয়েছে।
    return (typeof LangState !== "undefined" && LangState.current)
      || localStorage.getItem("jobprep_lang")
      || "bn";
  },

  // স্থানীয় (ডিভাইসের) তারিখ — UTC না। UTC ব্যবহার করলে বাংলাদেশ সময়ে ভোর ৬টাতেই
  // "নতুন দিন" শুরু হয়ে যেত; এখন ঠিক স্থানীয় মধ্যরাতে (রাত ১২টা/১১:৫৯ এর পর) দিন বদলায়।
  todayKey() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  },

  init() {
    this.renderView("modal-");
    this.renderView("page-");
  },

  renderView(prefix) {
    const lang = this.getCurrentLang();
    const t = this.translations[lang] || this.translations.bn;

    // সেফটি চেক: প্রিফিক্স ছাড়াই বা প্রিফিক্স সহ এলিমেন্ট খোঁজার ব্যবস্থা
    const getEl = (id) => document.getElementById(prefix + id) || document.getElementById(id);

    const titleEl = getEl("challenge-title");
    const targetTitleEl = getEl("today-title");
    const historyTitleEl = getEl("history-title");
    const streakEl = getEl("streak-count");
    const textEl = getEl("challenge-text");
    const historyEl = getEl("challenge-history-list");
    const submitBtnEl = getEl("challenge-btn");

    const history = JSON.parse(localStorage.getItem("challenge_history") || "{}");
    const streak = localStorage.getItem("challenge_streak") || 0;
    const today = this.todayKey();
    const todayData = history[today] || null;
    const isLocked = !!todayData; // আজকে একবার সাবমিট হয়ে গেলে লক থাকবে

    if (titleEl) titleEl.innerText = t.title;
    if (targetTitleEl) targetTitleEl.innerText = t.todayTarget;
    if (historyTitleEl) historyTitleEl.innerText = t.historyTitle;

    if (submitBtnEl) {
      submitBtnEl.innerText = isLocked ? t.submitBtnLocked : t.submitBtn;
      submitBtnEl.disabled = isLocked;
      submitBtnEl.style.opacity = isLocked ? "0.6" : "1";
      submitBtnEl.style.cursor = isLocked ? "not-allowed" : "pointer";
    }

    if (streakEl) {
      streakEl.innerText = `${streak} ${t.streakText}`;
    }

    if (textEl) {
      const checked = todayData ? todayData.checked || [] : [];
      let html = '<ul style="list-style: none; padding: 0; margin: 0;">';

      t.tasks.forEach((taskText, index) => {
        const isChecked = checked.includes(index) ? "checked" : "";
        const isDisabled = isLocked ? "disabled" : "";
        html += `
          <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="${prefix}task-${index}" ${isChecked} ${isDisabled} style="width: 18px; height: 18px; cursor: pointer;">
            <label for="${prefix}task-${index}" style="cursor: pointer;">${taskText}</label>
          </li>
        `;
      });
      html += "</ul>";

      if (isLocked) {
        const msg = todayData.completed ? t.completedMsg : t.lockedMsg;
        html += `<p style="color: var(--success, #4fa88f); font-weight: bold; margin-top: 10px;">${msg}</p>`;
      }

      textEl.innerHTML = html;
    }

    if (historyEl) {
      const dates = Object.keys(history).sort().reverse();

      if (dates.length === 0) {
        historyEl.innerHTML = `<p style="opacity: 0.7; text-align: center; padding: 10px;">${t.noHistory}</p>`;
      } else {
        let tableHtml = `
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color, rgba(148,163,184,.25)); opacity: 0.8;">
                <th style="padding: 10px 8px;">${t.colDate}</th>
                <th style="padding: 10px 8px; text-align: center;">${t.colProgress}</th>
                <th style="padding: 10px 8px; text-align: right;">${t.colStatus}</th>
              </tr>
            </thead>
            <tbody>
        `;

        dates.forEach((date) => {
          const item = history[date];
          const completedCount = item.checked ? item.checked.length : 0;
          const totalTasks = t.tasks.length;
          const isCompleted = item.completed;
          const statusBadge = isCompleted
            ? `<span style="background: var(--success-soft, rgba(34,197,94,.2)); color: var(--success, #22c55e); padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 0.8rem;">${t.statusDone}</span>`
            : `<span style="background: var(--urgent-soft, rgba(239,68,68,.2)); color: var(--urgent, #ef4444); padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 0.8rem;">${t.statusPending}</span>`;

          tableHtml += `
            <tr style="border-bottom: 1px solid var(--border-color, rgba(148,163,184,.12));">
              <td style="padding: 12px 8px; font-weight: 500;">${date}</td>
              <td style="padding: 12px 8px; text-align: center;">${completedCount} / ${totalTasks}</td>
              <td style="padding: 12px 8px; text-align: right;">${statusBadge}</td>
            </tr>
          `;
        });

        tableHtml += `</tbody></table>`;
        historyEl.innerHTML = tableHtml;
      }
    }
  },

  submitToday() {
    const lang = this.getCurrentLang();
    const t = this.translations[lang] || this.translations.bn;

    const today = this.todayKey();
    const history = JSON.parse(localStorage.getItem("challenge_history") || "{}");
    let streak = parseInt(localStorage.getItem("challenge_streak") || "0", 10);

    // একবার সাবমিট করার পর, একই দিনে (রাত ১২টার আগে) আর সাবমিট করা যাবে না।
    if (history[today]) {
      alert(t.alertAlready);
      this.init();
      return;
    }

    const isModalOpen = document.getElementById("challengeModal") && !document.getElementById("challengeModal").classList.contains("hidden");
    const prefix = isModalOpen ? "modal-" : "page-";

    const checkedIndexes = [];
    t.tasks.forEach((_, index) => {
      const chk = document.getElementById(`${prefix}task-${index}`);
      if (chk && chk.checked) {
        checkedIndexes.push(index);
      }
    });

    if (checkedIndexes.length === 0) {
      alert(t.alertSelect);
      return;
    }

    const isAllCompleted = checkedIndexes.length === t.tasks.length;
    if (isAllCompleted) streak += 1;

    history[today] = {
      completed: isAllCompleted,
      checked: checkedIndexes,
      submittedAt: Date.now(),
    };

    localStorage.setItem("challenge_history", JSON.stringify(history));
    localStorage.setItem("challenge_streak", streak.toString());

    alert(isAllCompleted ? t.alertDoneAll : t.alertSaved);
    this.init();
  },
};

window.DailyChallenge = DailyChallenge;
