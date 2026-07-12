import './style.css'

const addBtn = document.getElementById("addBtn");
if (addBtn) {
  const nameInput = document.getElementById("nameInput");
  const errorMsg = document.getElementById("errorMsg");

  addBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (name === "") {
      errorMsg.textContent = "Please enter your name.";
      return;
    }
    localStorage.setItem("userName", name);
    window.location.href = "home.html";
  });
}

const welcomeText = document.getElementById("welcomeText");
if (welcomeText) {
  const name = localStorage.getItem("userName") || "Student";
  welcomeText.textContent = `Welcome, ${name}!`;
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