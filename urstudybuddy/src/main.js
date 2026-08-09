import './style.css'

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

const darkModeToggle = document.getElementById("darkModeToggle");
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
  if (darkModeToggle) darkModeToggle.textContent = "Light Mode";
}

if (darkModeToggle) {
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("darkMode", isDark);
    darkModeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
  });
}

function updateDashboardPreview() {
  const taskListEl = document.getElementById("taskList");
  const preview = document.getElementById("homeworkPreview");
  const countText = document.getElementById("taskCountText");
  if (!taskListEl || !preview || !countText) return;

  const items = Array.from(taskListEl.children);
  preview.innerHTML = "";
  items.slice(0,3).forEach(li => {
    const clone = li.cloneNode(true);
    clone.style.cursor = "default";
    preview.appendChild(clone);
  });
  const done = items.filter(li => li.classList.contains("done")).length;
  countText.textContent = `${done}/${items.length} tasks done today`;
}

function updateStreak() {
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem("lastVisit");
  let streak = parseInt(localStorage.getItem("streak")) || 0;

  if (lastVisit !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    streak 
  }
}

function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById("dockClock");
  if (clockEl) clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
}
updateClock();
setInterval(updateClock, 1000);

window.showPage = function (pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.style.display = "none";
  });
  document.getElementById(pageId).style.display = "block";
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
    li.addEventListener("click", () => li.classList.toggle("done"));

    taskList.appendChild(li);
    taskInput.value = "";
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
    intervalId = setInterval(() => {
      seconds++;
      updateDisplay();
    }, 1000);
  });

  pauseBtn.addEventListener("click", () => {
    clearInterval(intervalId);
    intervalId = null;
  });

  resetBtn.addEventListener("click", () => {
    clearInterval(intervalId);
    intervalId = null;
    seconds = 0;
    updateDisplay();
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

