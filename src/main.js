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
};

const showNameBtn = document.getElementById("showNameBtn");
if (showNameBtn) {
  showNameBtn.addEventListener("click", () => {
    document.getElementById("nameOverlay").classList.add("visible");
  });
}

const addBtn = document.getElementById("addBtn");
if (addBtn) {
  const nameInput = document.getElementById("nameInput");
  const errorMsg = document.getElementById("errorMsg");

  addBtn.addEventListener("click", () => {
    const enteredName = nameInput.value.trim();

    if (enteredName === "") {
      errorMsg.textContent = "Please enter your name.";
      return;
    }

    sessionStorage.setItem("userName", enteredName);
    document.getElementById("nameOverlay").classList.remove("visible");
    document.getElementById("landingPage").style.display = "none";
    showPage("dashboardPage");

    const name = sessionStorage.getItem("userName") || "Student";
    setText("welcomeText", `Welcome, ${name}!`);
    setText("homeworkGreeting", `Hey ${name}, ready to tackle homework?`);
    setText("timetableGreeting", `${name}'s Weekly Schedule`);
    updateStreak();
    updateDashboardPreview();
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
    const res = await fetch("https://api.countapi.xyz/get/urstudybuddy/minutesstudied");
    const data = await res.json();
    const total = data.value || 0;
    setText("globalCounter", `${Math.floor(total / 60)}h ${total % 60}m studied by students worldwide`);
  } catch (e) {
    setText("globalCounter", "Couldn't load global stats.");
  }
}
async function incrementGlobalMinutes() {
  try { await fetch("https://api.countapi.xyz/update/urstudybuddy/minutesstudied/?amount=1"); } catch (e) {}
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

      const quizContent = document.getElementById("quizContent");
      quizContent.innerHTML = "";
      data.quiz.forEach((q, i) => {
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
    if (e.target.closest("button") | e.target.closest(".card")) return;

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