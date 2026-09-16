import { marked } from 'marked'
import './style.css'
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

const darkModeToggle = document.getElementById("darkModeToggle");
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
}
if (darkModeToggle) {
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
    const currentTheme = localStorage.getItem("accentTheme") || "taupe";
    applyTheme(currentTheme);
  });
}

function updateClock() {
  const now = new Date();
  setText("dockClock", now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
}
updateClock();
setInterval(updateClock, 1000);

window.showPage = function (pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.style.display = "none";
    page.classList.remove("animate-in");
  });
  const target = document.getElementById(pageId);
  target.style.display = "block";
  void target.offsetWidth;
  target.classList.add("animate-in");

  if (pageId === "uploadPage") loadNotesHistory();
};

const showAuthBtn = document.getElementById("showAuthBtn");
if (showAuthBtn) {
  showAuthBtn.addEventListener("click", () => {
    document.getElementById("authOverlay").classList.add("visible");
  });
}

window.toggleAuthForm = function (form) {
  document.getElementById("loginForm").style.display = form === "login" ? "block" : "none";
  document.getElementById("signupForm").style.display = form === "signup" ? "block" : "none";
  document.getElementById("loginTabBtn").classList.toggle("active", form === "login");
  document.getElementById("signupTabBtn").classList.toggle("active", form === "signup");
  document.getElementById("loginError").textContent = "";
  document.getElementById("signupError").textContent = "";
};

document.addEventListener('mousemove', (e) => {
  document.querySelectorAll('.bot-pupil').forEach(pupil => {
    const eye = pupil.parentElement;
    const rect = eye.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
    const dist = 4;
    pupil.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
  });
});

function setBotMood(mood) {
  const bot = document.getElementById("studyBot");
  if (!bot) return;
  bot.classList.remove("error", "happy");
  if (mood !== "neutral") bot.classList.add(mood);
  if (mood === "error") setTimeout(() => bot.classList.remove("error"), 1200);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const signupEmailInput = document.getElementById("signupEmail");
if (signupEmailInput) {
  signupEmailInput.addEventListener("blur", () => {
    if (signupEmailInput.value.trim() !== "" && !isValidEmail(signupEmailInput.value.trim())) {
      setBotMood("error");
    }
  });
}

const botTips = ["Hi there! 👋", "Ready to study?", "Take your time!", "You've got this!"];

function showBotSpeech(text, duration = 3000) {
  const bubble = document.getElementById("botSpeech");
  if (!bubble) return;
  bubble.textContent = text;
  bubble.classList.add("visible");
  setTimeout(() => bubble.classList.remove("visible"), duration);
}

const authOverlayEl = document.getElementById("authOverlay");
if (authOverlayEl) {
  const observer = new MutationObserver(() => {
    if (authOverlayEl.classList.contains("visible")) {
      showBotSpeech(botTips[Math.floor(Math.random() * botTips.length)]);
    }
  });
  observer.observe(authOverlayEl, { attributes: true, attributeFilter: ["class"] });
}

function completeLogin(username, email) {
  sessionStorage.setItem("userName", username);
  sessionStorage.setItem("userEmail", email || "");
  setBotMood("happy");
  showBotSpeech("Yay, welcome!", 1500);

  setTimeout(() => {
    document.getElementById("authOverlay").classList.remove("visible");
    document.getElementById("landingPage").style.display = "none";
    showPage("dashboardPage");

    setText("welcomeText", `Welcome, ${username}!`);
    setText("homeworkGreeting", `Hey ${username}, ready to tackle homework?`);
    setText("timetableGreeting", `${username}'s Weekly Schedule`);
    updateStreak();
    updateDashboardPreview();
    loadTimetable();
  }, 600);
}

const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const grade = document.getElementById("signupGrade").value;
    const password = document.getElementById("signupPassword").value;
    const errorEl = document.getElementById("signupError");

    if (username === "" || email === "" || password === "") {
      errorEl.textContent = "Fill in all fields.";
      setBotMood("error");
      return;
    }
    if (!isValidEmail(email)) {
      errorEl.textContent = "That doesn't look like a valid email.";
      setBotMood("error");
      return;
    }

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, grade })
      });
      const data = await res.json();

      if (data.error) {
        errorEl.textContent = data.error;
        setBotMood("error");
        return;
      }

      completeLogin(data.username, data.email);
    } catch (err) {
      errorEl.textContent = "Something went wrong. Try again.";
      setBotMood("error");
    }
  });
}

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const identifier = document.getElementById("loginIdentifier").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorEl = document.getElementById("loginError");

    if (identifier === "" || password === "") {
      errorEl.textContent = "Fill in both fields.";
      setBotMood("error");
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();

      if (data.error) {
        errorEl.textContent = data.error;
        setBotMood("error");
        return;
      }

      completeLogin(data.username, data.email);
    } catch (err) {
      errorEl.textContent = "Something went wrong. Try again.";
      setBotMood("error");
    }
  });
}

const addTaskBtn = document.getElementById("addTaskBtn");
if (addTaskBtn) {
  const taskInput = document.getElementById("taskInput");
  const taskList = document.getElementById("taskList");

  addTaskBtn.addEventListener("click", () => {
    const text = taskInput.value.trim();
    if (text === "") return;

    const li = document.createElement("li");
    li.textContent = text;
    li.addEventListener("click", () => {
      li.classList.toggle("done");
      updateDashboardPreview();
    });

    taskList.appendChild(li);
    taskInput.value = "";
    updateDashboardPreview();
  });
}

const startBtn = document.getElementById("startBtn");
if (startBtn) {
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const timeDisplay = document.getElementById("timeDisplay");
  let seconds = 0;
  let intervalId = null;

  function updateDisplay() {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    timeDisplay.textContent = `${mins}:${secs}`;
  }

  startBtn.addEventListener("click", () => {
    if (intervalId !== null) return;
    intervalId = setInterval(() => { seconds++; updateDisplay(); }, 1000);
  });
  pauseBtn.addEventListener("click", () => { clearInterval(intervalId); intervalId = null; });
  resetBtn.addEventListener("click", () => {
    clearInterval(intervalId); intervalId = null; seconds = 0; updateDisplay();
  });
}

async function saveTimetable() {
  const username = sessionStorage.getItem("userName");
  if (!username) return;

  const rows = Array.from(document.querySelectorAll("#timetableBody tr")).map(row =>
    Array.from(row.children).map(cell => cell.textContent)
  );

  await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, type: 'timetable', data: rows })
  });
}

async function loadTimetable() {
  const username = sessionStorage.getItem("userName");
  if (!username) return;

  try {
    const res = await fetch(`/api/data?username=${encodeURIComponent(username)}&type=timetable`);
    const { data } = await res.json();
    if (!data) return;

    const timetableBody = document.getElementById("timetableBody");
    timetableBody.innerHTML = "";
    data.forEach(rowData => {
      const newRow = document.createElement("tr");
      rowData.forEach(cellText => {
        const cell = document.createElement("td");
        cell.contentEditable = "true";
        cell.textContent = cellText;
        newRow.appendChild(cell);
      });
      timetableBody.appendChild(newRow);
    });
  } catch (err) {
    console.error("Failed to load timetable:", err);
  }
}

const addRowBtn = document.getElementById("addRowBtn");
if (addRowBtn) {
  const timetableBody = document.getElementById("timetableBody");
  addRowBtn.addEventListener("click", () => {
    const newRow = document.createElement("tr");
    const timeCell = document.createElement("td");
    timeCell.contentEditable = "true";
    timeCell.textContent = "New time";
    newRow.appendChild(timeCell);
    for (let i = 0; i < 7; i++) {
      const dayCell = document.createElement("td");
      dayCell.contentEditable = "true";
      newRow.appendChild(dayCell);
    }
    timetableBody.appendChild(newRow);
    saveTimetable();
  });

  timetableBody.addEventListener("blur", (e) => {
    if (e.target.tagName === "TD") saveTimetable();
  }, true);
}

const downloadTimetableBtn = document.getElementById("downloadTimetableBtn");
if (downloadTimetableBtn) {
  downloadTimetableBtn.addEventListener("click", () => {
    const headers = ["Time", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const rows = Array.from(document.querySelectorAll("#timetableBody tr")).map(row =>
      Array.from(row.children).map(cell => `"${cell.textContent.replace(/"/g, '""')}"`).join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "urstudybuddy-timetable.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

function updateDashboardPreview() {
  const taskListEl = document.getElementById("taskList");
  const preview = document.getElementById("homeworkPreview");
  const countText = document.getElementById("taskCountText");
  if (!taskListEl || !preview || !countText) return;

  const items = Array.from(taskListEl.children);
  preview.innerHTML = "";
  items.slice(0, 3).forEach(li => {
    const clone = li.cloneNode(true);
    clone.style.cursor = "default";
    preview.appendChild(clone);
  });

  const done = items.filter(li => li.classList.contains("done")).length;
  countText.textContent = `${done} of ${items.length} tasks done today`;
}
updateDashboardPreview();

function updateStreak() {
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem("lastVisitDate");
  let streak = parseInt(localStorage.getItem("studyStreak")) || 0;

  if (lastVisit !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    streak = (lastVisit === yesterday.toDateString()) ? streak + 1 : 1;
    localStorage.setItem("studyStreak", streak);
    localStorage.setItem("lastVisitDate", today);
  }
  setText("streakText", `${streak} day${streak === 1 ? "" : "s"} in a row!`);
}

async function loadGlobalMinutes() {
  try {
    const res = await fetch("https://countapi.mileshilliard.com/api/v1/get/urstudybuddy_minutesstudied");
    const data = await res.json();
    const total = data.value || 0;
    setText("globalCounter", `${Math.floor(total / 60)}h ${total % 60}m studied by students worldwide`);
  } catch (e) {
    setText("globalCounter", "Couldn't load global stats.");
  }
}
async function incrementGlobalMinutes() {
  try { await fetch("https://countapi.mileshilliard.com/api/v1/hit/urstudybuddy_minutesstudied"); } catch (e) {}
}
loadGlobalMinutes();
setInterval(incrementGlobalMinutes, 60000);
setInterval(loadGlobalMinutes, 65000);

const quotes = [
  "Small steps every day add up to big results.",
  "You don't have to be perfect, just consistent.",
  "Rest when you need to, but don't quit.",
  "Progress, not perfection.",
  "Every hour you put in counts, even the hard ones.",
  "Your future self is watching you right now.",
  "Done is better than perfect.",
  "You're closer than you think.",
  "One page at a time.",
  "Discipline is choosing what you want most over what you want now."
];
function showRandomQuote() {
  setText("quoteText", quotes[Math.floor(Math.random() * quotes.length)]);
  document.getElementById("quotePopup").classList.add("visible");
}
setInterval(showRandomQuote, 10 * 60 * 1000);

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(" ") + "\n";
  }
  return fullText;
}

window.showResultTab = function (tabId) {
  document.getElementById("notesTab").style.display = "none";
  document.getElementById("quizTab").style.display = "none";
  document.getElementById(tabId).style.display = "block";
};

async function saveNotesHistory(entry) {
  const username = sessionStorage.getItem("userName");
  if (!username) return;

  try {
    const res = await fetch(`/api/data?username=${encodeURIComponent(username)}&type=notes`);
    const { data } = await res.json();
    let history = data || [];

    history.unshift(entry);
    history = history.slice(0, 10);

    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, type: 'notes', data: history })
    });
  } catch (err) {
    console.error("Failed to save notes history:", err);
  }
}

async function loadNotesHistory() {
  const username = sessionStorage.getItem("userName");
  const section = document.getElementById("notesHistorySection");
  const list = document.getElementById("notesHistoryList");
  if (!username || !section || !list) return;

  try {
    const res = await fetch(`/api/data?username=${encodeURIComponent(username)}&type=notes`);
    const { data } = await res.json();

    list.innerHTML = "";
    if (!data || data.length === 0) {
      section.style.display = "none";
      return;
    }

    data.forEach((entry) => {
      const li = document.createElement("li");
      const dateStr = new Date(entry.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      li.textContent = `${dateStr} — ${entry.noteStyle} notes`;
      li.addEventListener("click", () => {
        document.getElementById("notesContent").innerHTML = marked.parse(entry.notes);
        renderQuiz(entry.quiz);
        document.getElementById("resultsBox").style.display = "block";
        showResultTab("notesTab");
      });
      list.appendChild(li);
    });

    section.style.display = "block";
  } catch (err) {
    console.error("Failed to load notes history:", err);
  }
}

let currentGeneratedNotes = null;

const saveDraftBtn = document.getElementById("saveDraftBtn");
if (saveDraftBtn) {
  saveDraftBtn.addEventListener("click", async () => {
    if (!currentGeneratedNotes) return;
    await saveNotesHistory(currentGeneratedNotes);
    loadNotesHistory();
    const msg = document.getElementById("draftSavedMsg");
    msg.style.display = "block";
    setTimeout(() => { msg.style.display = "none"; }, 2000);
  });
}

function renderQuiz(quiz) {
  const quizContent = document.getElementById("quizContent");
  quizContent.innerHTML = "";
  quiz.forEach((q, i) => {
    const qDiv = document.createElement("div");
    qDiv.style.marginBottom = "16px";
    qDiv.style.textAlign = "left";
    qDiv.innerHTML = `<strong>${i + 1}. ${q.question}</strong>`;
    q.options.forEach((opt, idx) => {
      const optP = document.createElement("p");
      optP.textContent = `${String.fromCharCode(65 + idx)}. ${opt}`;
      optP.style.textAlign = "left";
      optP.style.margin = "4px 0";
      qDiv.appendChild(optP);
    });
    quizContent.appendChild(qDiv);
  });
}

const generateBtn = document.getElementById("generateBtn");
if (generateBtn) {
  const pdfInput = document.getElementById("pdfInput");
  const statusMsg = document.getElementById("statusMsg");
  const resultsBox = document.getElementById("resultsBox");

  generateBtn.addEventListener("click", async () => {
    const file = pdfInput.files[0];
    if (!file) {
      statusMsg.textContent = "Please choose a PDF first.";
      return;
    }

    const noteStyle = document.getElementById("noteStyle").value;
    const detailLevel = document.getElementById("detailLevel").value;
    const tone = document.getElementById("tone").value;

    statusMsg.textContent = "Reading PDF...";
    generateBtn.disabled = true;

    try {
      const extractedText = await extractPdfText(file);
      statusMsg.textContent = "Generating notes and quiz...";

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText, noteStyle, detailLevel, tone })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      document.getElementById("notesContent").innerHTML = marked.parse(data.notes);
      renderQuiz(data.quiz);

      currentGeneratedNotes = {
        date: new Date().toISOString(),
        notes: data.notes,
        quiz: data.quiz,
        noteStyle
      };
      document.getElementById("draftSavedMsg").style.display = "none";

      statusMsg.textContent = "";
      resultsBox.style.display = "block";
    } catch (err) {
      console.error(err);
      statusMsg.textContent = "Something went wrong. Try again.";
    }

    generateBtn.disabled = false;
  });
}

const pomodoroStartBtn = document.getElementById("pomodoroStartBtn");
if (pomodoroStartBtn) {
  const pomodoroPauseBtn = document.getElementById("pomodoroPauseBtn");
  const pomodoroResetBtn = document.getElementById("pomodoroResetBtn");
  let pomodoroSeconds = 25 * 60;
  let pomodoroMode = "Work";
  let pomodoroInterval = null;

  function updatePomodoroDisplay() {
    const mins = String(Math.floor(pomodoroSeconds / 60)).padStart(2, "0");
    const secs = String(pomodoroSeconds % 60).padStart(2, "0");
    setText("pomodoroDisplay", `${mins}:${secs}`);
    setText("pomodoroMode", pomodoroMode);
  }

  pomodoroStartBtn.addEventListener("click", () => {
    if (pomodoroInterval !== null) return;
    pomodoroInterval = setInterval(() => {
      pomodoroSeconds--;
      if (pomodoroSeconds <= 0) {
        pomodoroMode = pomodoroMode === "Work" ? "Break" : "Work";
        pomodoroSeconds = pomodoroMode === "Work" ? 25 * 60 : 5 * 60;
      }
      updatePomodoroDisplay();
    }, 1000);
  });
  pomodoroPauseBtn.addEventListener("click", () => {
    clearInterval(pomodoroInterval); pomodoroInterval = null;
  });
  pomodoroResetBtn.addEventListener("click", () => {
    clearInterval(pomodoroInterval); pomodoroInterval = null;
    pomodoroMode = "Work"; pomodoroSeconds = 25 * 60; updatePomodoroDisplay();
  });
}

const dashboardPage = document.getElementById("dashboardPage");
if (dashboardPage) {
  dashboardPage.addEventListener("click", (e) => {
    if (e.target.closest("button") || e.target.closest(".card")) return;

    const size = 300;
    const ripple = document.createElement("div");
    ripple.classList.add("ripple");
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - size / 2}px`;
    ripple.style.top = `${e.clientY - size / 2}px`;

    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  });
}

const emailBtn = document.getElementById("emailBtn");
if (emailBtn) {
  emailBtn.addEventListener("click", async () => {
    const notes = document.getElementById("notesContent").innerText;
    const name = sessionStorage.getItem("userName") || "Student";
    const userEmail = sessionStorage.getItem("userEmail") || "";
    const subject = encodeURIComponent(`${name}'s UrStudyBuddy Notes`);
    const body = encodeURIComponent(`Here are your generated study notes:\n\n${notes}`);

    const mailtoLink = `mailto:${userEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;

    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText(notes);
        alert("If your email app didn't open, your notes have been copied — paste them into any email.");
      } catch (e) {}
    }, 500);
  });
}

function playClick(freq = 500, duration = 60) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "square";
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) {}
}

const fidgetSpinner = document.getElementById("fidgetSpinner");
if (fidgetSpinner) {
  let spinnerAngle = 0;
  let spinnerVelocity = 0;
  let spinning = false;

  fidgetSpinner.addEventListener("click", () => {
    spinnerVelocity += 25;
    if (!spinning) {
      spinning = true;
      const tick = () => {
        spinnerAngle += spinnerVelocity;
        spinnerVelocity *= 0.96;
        fidgetSpinner.style.transform = `rotate(${spinnerAngle}deg)`;
        if (spinnerVelocity > 0.2) {
          requestAnimationFrame(tick);
        } else {
          spinning = false;
        }
      };
      requestAnimationFrame(tick);
    }
  });
}

const bubbleGrid = document.getElementById("bubbleGrid");
if (bubbleGrid) {
  function buildBubbles() {
    bubbleGrid.innerHTML = "";
    for (let i = 0; i < 40; i++) {
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.addEventListener("click", () => {
        if (bubble.classList.contains("popped")) return;
        bubble.classList.add("popped");
        playClick(300, 80);
      });
      bubbleGrid.appendChild(bubble);
    }
  }
  buildBubbles();

  const resetBubbles = document.getElementById("resetBubbles");
  if (resetBubbles) resetBubbles.addEventListener("click", buildBubbles);
}

const clickyGrid = document.getElementById("clickyGrid");
if (clickyGrid) {
  for (let i = 0; i < 18; i++) {
    const key = document.createElement("div");
    key.className = "clicky-key";
    key.addEventListener("click", () => {
      playClick(400 + Math.random() * 300, 50);
    });
    clickyGrid.appendChild(key);
  }
}

function resumeSession() {
  const username = sessionStorage.getItem("userName");
  if (!username) return;

  document.getElementById("landingPage").style.display = "none";
  showPage("dashboardPage");

  setText("welcomeText", `Welcome, ${username}!`);
  setText("homeworkGreeting", `Hey ${username}, ready to tackle homework?`);
  setText("timetableGreeting", `${username}'s Weekly Schedule`);
  updateStreak();
  updateDashboardPreview();
  loadTimetable();
}
resumeSession();

const accentThemes = {
  taupe:      { light: { accent: "#A69374", hover: "#8B7A5E" }, dark: { accent: "#C4B296", hover: "#D8C7A8" } },
  sage:       { light: { accent: "#8CA88C", hover: "#6E8A6E" }, dark: { accent: "#A8C4A8", hover: "#8FB08F" } },
  "dusty-blue": { light: { accent: "#7B93B3", hover: "#5F7999" }, dark: { accent: "#9DB5D1", hover: "#7E9BC0" } },
  blush:      { light: { accent: "#C98F94", hover: "#B0767B" }, dark: { accent: "#E0ACB1", hover: "#CC9297" } },
  plum:       { light: { accent: "#8C6B8F", hover: "#6E4F71" }, dark: { accent: "#B090B3", hover: "#9A749D" } }
};

const swatches = document.querySelectorAll(".swatch");

function applyTheme(themeName) {
  const theme = accentThemes[themeName];
  if (!theme) return;

  const isDark = document.body.classList.contains("dark");
  const variant = isDark ? theme.dark : theme.light;

  document.documentElement.style.setProperty("--accent", variant.accent);
  document.documentElement.style.setProperty("--accent-hover", variant.hover);
  localStorage.setItem("accentTheme", themeName);
  swatches.forEach(s => s.classList.toggle("active", s.dataset.theme === themeName));
}

if (swatches.length > 0) {
  swatches.forEach(swatch => {
    swatch.addEventListener("click", () => {
      applyTheme(swatch.dataset.theme);
    });
  });

  const savedTheme = localStorage.getItem("accentTheme") || "taupe";
  applyTheme(savedTheme);
}

const bgSwatches = document.querySelectorAll(".bg-swatch");
const roomBg = document.getElementById("roomBg");
if (bgSwatches.length > 0 && roomBg) {
  const scenes = {
    forest: "linear-gradient(160deg, #2d4a2e, #4a6b3a, #7a9b5e)",
    ocean: "linear-gradient(160deg, #0f3057, #1f6f8b, #99e1d9)",
    sunset: "linear-gradient(160deg, #2b1055, #7597de, #f6a558)",
    night: "linear-gradient(160deg, #0b0c1e, #1b1f3b, #3a3f6b)",
    cozy: "linear-gradient(160deg, #3a2820, #7a4a32, #d9a066)"
  };

  bgSwatches.forEach(swatch => {
    swatch.addEventListener("click", () => {
      roomBg.style.background = scenes[swatch.dataset.bg];
      localStorage.setItem("roomScene", swatch.dataset.bg);
    });
  });

  const savedScene = localStorage.getItem("roomScene");
  if (savedScene && scenes[savedScene]) {
    roomBg.style.background = scenes[savedScene];
  }
}

const roomAudio = document.getElementById("roomAudio");
if (roomAudio) {
  const tracks = [
    { name: "Lofi Track 1", src: "/audio/lofi-1.mp3" },
    { name: "Lofi Track 2", src: "/audio/lofi-2.mp3" },
    { name: "Lofi Track 3", src: "/audio/lofi-3.mp3" },
    { name: "Lofi Track 4", src: "/audio/lofi-4.mp3" }
  ];
  let currentTrack = 0;
  let isPlaying = false;

  const trackList = document.getElementById("trackList");
  const nowPlaying = document.getElementById("nowPlaying");
  const playPauseBtn = document.getElementById("playPauseBtn");

  function renderTrackList() {
    trackList.innerHTML = "";
    tracks.forEach((track, i) => {
      const item = document.createElement("div");
      item.className = "track-item" + (i === currentTrack ? " playing" : "");
      item.textContent = track.name;
      item.addEventListener("click", () => loadTrack(i, true));
      trackList.appendChild(item);
    });
  }

  function loadTrack(index, autoplay) {
    currentTrack = index;
    roomAudio.src = tracks[index].src;
    nowPlaying.textContent = tracks[index].name;
    renderTrackList();
    if (autoplay) {
      roomAudio.play().catch(() => {
        nowPlaying.textContent = "Add your mp3 files to /public/audio to play";
      });
      isPlaying = true;
      playPauseBtn.textContent = "⏸";
    }
  }

  document.getElementById("playPauseBtn").addEventListener("click", () => {
    if (!roomAudio.src) { loadTrack(0, true); return; }
    if (isPlaying) {
      roomAudio.pause();
      playPauseBtn.textContent = "▶";
    } else {
      roomAudio.play().catch(() => {
        nowPlaying.textContent = "Add your mp3 files to /public/audio to play";
      });
      playPauseBtn.textContent = "⏸";
    }
    isPlaying = !isPlaying;
  });

  document.getElementById("nextTrackBtn").addEventListener("click", () => {
    loadTrack((currentTrack + 1) % tracks.length, isPlaying);
  });
  document.getElementById("prevTrackBtn").addEventListener("click", () => {
    loadTrack((currentTrack - 1 + tracks.length) % tracks.length, isPlaying);
  });

  roomAudio.addEventListener("ended", () => {
    loadTrack((currentTrack + 1) % tracks.length, true);
  });

  renderTrackList();
  nowPlaying.textContent = "Press play to start";
}

const roomTimerStart = document.getElementById("roomTimerStart");
if (roomTimerStart) {
  const roomTimerPause = document.getElementById("roomTimerPause");
  const roomTimerReset = document.getElementById("roomTimerReset");
  const roomTimerDisplay = document.getElementById("roomTimerDisplay");
  let roomSeconds = 25 * 60;
  let roomInterval = null;

  function updateRoomTimerDisplay() {
    const mins = String(Math.floor(roomSeconds / 60)).padStart(2, "0");
    const secs = String(roomSeconds % 60).padStart(2, "0");
    roomTimerDisplay.textContent = `${mins}:${secs}`;
  }

  roomTimerStart.addEventListener("click", () => {
    if (roomInterval !== null) return;
    roomInterval = setInterval(() => {
      roomSeconds--;
      if (roomSeconds <= 0) roomSeconds = 0;
      updateRoomTimerDisplay();
    }, 1000);
  });
  roomTimerPause.addEventListener("click", () => {
    clearInterval(roomInterval); roomInterval = null;
  });
  roomTimerReset.addEventListener("click", () => {
    clearInterval(roomInterval); roomInterval = null;
    roomSeconds = 25 * 60; updateRoomTimerDisplay();
  });
}