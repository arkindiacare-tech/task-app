// ===============================
// Task App Frontend Script.js
// ===============================

// Replace with your deployed Apps Script URL
const API_URL = "https://script.google.com/macros/s/AKfycbw_5Ulh8InxRk_zSXJp3_d6tAR7VL9XEp0uBHBg2yRI8VIyQw7270TlXUPVm6EmPam8/exec";

let loggedInUser = null;

// === Login Function ===
function login() {
  const email = document.getElementById("email").value.trim().toLowerCase();

  fetch(API_URL + "?action=getUsers")
    .then(res => res.text())
    .then(txt => JSON.parse(txt))
    .then(users => {
      const user = users.find(u => u.Email.toLowerCase() === email);
      if (user) {
        loggedInUser = user;
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        loadDashboard(user);
      } else {
        alert("Unauthorized! Please use registered Gmail.");
      }
    })
    .catch(err => {
      console.error("Login Error:", err);
      alert("Backend not responding. Check Apps Script deployment.");
    });
}

// === Load Dashboard ===
function loadDashboard(user) {
  document.getElementById("login-view").classList.add("hidden");

  document.getElementById("admin-content").innerHTML = "";
  document.getElementById("user-content").innerHTML = "";

  if (user.Role.toLowerCase() === "admin") {
    document.getElementById("admin-view").classList.remove("hidden");
    showAllTasks();
  } else {
    document.getElementById("user-view").classList.remove("hidden");
    showMyTasks();
  }
}

// === Logout ===
function logout() {
  localStorage.removeItem("loggedInUser");
  location.reload();
}

// ===============================
// Admin Functions
// ===============================
function showAssignTask() {
  document.getElementById("admin-content").innerHTML = `
    <h3>Assign New Task</h3>
    <input type="text" id="taskName" placeholder="Task Name"><br>
    <textarea id="taskDesc" placeholder="Description"></textarea><br>
    <input type="text" id="assignedTo" placeholder="Assign to (email)"><br>
    <button id="saveTaskBtn">Save Task</button>
  `;

  // Attach listener
  document.getElementById("saveTaskBtn").addEventListener("click", addTask);
}

function addTask() {
  const task = {
    id: Date.now(),
    date: new Date().toLocaleDateString(),
    taskName: document.getElementById("taskName").value,
    description: document.getElementById("taskDesc").value,
    assignedTo: document.getElementById("assignedTo").value,
    status: "Open",
    adminComments: "",
    attachments: ""
  };

  fetch(API_URL + "?action=addTask", {
    method: "POST",
    body: JSON.stringify(task)
  })
    .then(res => res.text())
    .then(txt => {
      const result = JSON.parse(txt);
      if (result.success) {
        alert("Task Added Successfully");
        showAllTasks();
      } else {
        alert("Error adding task");
      }
    })
    .catch(err => {
      console.error("Add Task Error:", err);
      alert("Error adding task.");
    });
}

function showAllTasks() {
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.Email)
    .then(res => res.text())
    .then(txt => JSON.parse(txt))
    .then(tasks => {
      let html = "<h3>All Tasks</h3><ul>";
      tasks.forEach(t => {
        html += `<li><b>${t.TaskName}</b> → ${t.AssignedTo} [${t.Status}]</li>`;
      });
      html += "</ul>";
      document.getElementById("admin-content").innerHTML = html;
    });
}

function showCompletedTasks() {
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.Email)
    .then(res => res.text())
    .then(txt => JSON.parse(txt))
    .then(tasks => {
      let html = "<h3>Completed Tasks</h3><ul>";
      tasks.filter(t => t.Status.toLowerCase() === "completed").forEach(t => {
        html += `<li>${t.TaskName} ✅</li>`;
      });
      html += "</ul>";
      document.getElementById("admin-content").innerHTML = html;
    });
}

// ===============================
// User Functions
// ===============================
function showMyTasks() {
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.Email)
    .then(res => res.text())
    .then(txt => JSON.parse(txt))
    .then(tasks => {
      let html = "<h3>My Active Tasks</h3><ul>";
      tasks.filter(t => t.Status.toLowerCase() !== "completed").forEach(t => {
        html += `<li>${t.TaskName} → ${t.Status}</li>`;
      });
      html += "</ul>";
      document.getElementById("user-content").innerHTML = html;
    });
}

function showMyCompletedTasks() {
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.Email)
    .then(res => res.text())
    .then(txt => JSON.parse(txt))
    .then(tasks => {
      let html = "<h3>My Completed Tasks</h3><ul>";
      tasks.filter(t => t.Status.toLowerCase() === "completed").forEach(t => {
        html += `<li>${t.TaskName} ✅</li>`;
      });
      html += "</ul>";
      document.getElementById("user-content").innerHTML = html;
    });
}

// ===============================
// Attach Event Listeners
// ===============================
window.onload = function() {
  const savedUser = localStorage.getItem("loggedInUser");
  if (savedUser) {
    loggedInUser = JSON.parse(savedUser);
    loadDashboard(loggedInUser);
  }

  // Attach all button listeners
  document.getElementById("loginBtn").addEventListener("click", login);
  document.getElementById("assignTaskBtn").addEventListener("click", showAssignTask);
  document.getElementById("allTasksBtn").addEventListener("click", showAllTasks);
  document.getElementById("completedTasksBtn").addEventListener("click", showCompletedTasks);
  document.getElementById("myTasksBtn").addEventListener("click", showMyTasks);
  document.getElementById("myCompletedTasksBtn").addEventListener("click", showMyCompletedTasks);
  document.getElementById("logoutBtnAdmin").addEventListener("click", logout);
  document.getElementById("logoutBtnUser").addEventListener("click", logout);
};

