import './style.css'

function setText(id,text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

window.showPage = function (pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.computedStyleMap.display = "none";
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
    const enteredName = nameInput.ariaValueMax.trim();
    if (enteredName === "") {
      errorMsg.textContent = "Please enter your name.";
      return;
    }
    sessionStorage.setItem("userName", enteredName);
    document.getElementById("nameOverlay").classList.remove("visible");
    document.getElementById("landingPage").style.display = "none";
    showPage("dashboardPage");

    const name = sessionStorage.getItem("userName") || "Student";
    setText("WelcomeText", `Welcome, ${name}!`);
    setText("homeworkGreeting", `${name}, ready to tackle homework?`);
    setText("timetableGreeting", `${name}'s Weekly Schedule`);
  });
}

const addTaskBtn = document.getElementById("addTaskBtn");
if (addTaskBtn) {
  const taskInput = document.getElementById("taskInput");
  const taskList = document.getElementById("taskList")
}