// Replace this with your deployed Apps Script URL
const API_URL = "https://script.google.com/macros/s/AKfycbz8185nbB6Km-m68qr0IiQV8_qZGziX_K3nlkhCHHBY1M_x3-mon6KZUy8ydQyVNrk7/exec";

let loggedInUser = null;

// === Login ===
function login() {
  const email = document.getElementById("email").value.trim().toLowerCase();

  // Fetch users from Google Sheet
  fetch(API_URL + "?action=getUsers")
    .then(res => res.json())
    .then(users => {
      const user = users.find(u => u.email.toLowerCase() === email);
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

// === Load Correct Dashboard ===
function loadDashboard(user) {
  document.getElementById("login-view").classList.add("hidden");

  if (user.role === "admin") {
    document.getElementById("admin-view").classList.remove("hidden");
  } else {
    document.getElementById("user-view").classList.remove("hidden");
  }
}

// === Logout ===
function logout() {
  localStorage.removeItem("loggedInUser");
  location.reload();
}

// === Auto Login if Saved ===
window.onload = function() {
  const savedUser = localStorage.getItem("loggedInUser");
  if (savedUser) {
    loggedInUser = JSON.parse(savedUser);
    loadDashboard(loggedInUser);
  }
};

// === Admin Functions ===
function showAssignTask() {
  document.getElementById("admin-content").innerHTML = `
    <h3>Assign New Task</h3>
    <input type="text" id="taskName" placeholder="Task Name"><br>
    <textarea id="taskDesc" placeholder="Description"></textarea><br>
    <input type="text" id="assignedTo" placeholder="Assign to (email)"><br>
    <button onclick="addTask()">Save Task</button>
  `;
}

function addTask() {
  const task = {
    id: Date.now(), // simple unique ID
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
    body: JSON.stringify(task),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.text())
    .then(msg => {
      alert("Task Added Successfully");
      showAllTasks();
    })
    .catch(err => {
      console.error("Add Task Error:", err);
      alert("Error adding task.");
    });
}

function showAllTasks() {
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.email)
    .then(res => res.json())
    .then(tasks => {
      let html = "<h3>All Tasks</h3><ul>";
      tasks.forEach(t => {
        html += `<li><b>${t.taskName}</b> → ${t.assignedTo} [${t.status}]</li>`;
      });
      html += "</ul>";
      document.getElementById("admin-content").innerHTML = html;
    });
}

function showCompletedTasks() {
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.email)
    .then(res => res.json())
    .then(tasks => {
      let html = "<h3>Completed Tasks</h3><ul>";
      tasks.filter(t => t.status === "Completed").forEach(t => {
        html += `<li>${t.taskName} ✅</li>`;
      });
      html += "</ul>";
      document.getElementById("admin-content").innerHTML = html;
    });
}

// === User Functions ===
function showMyTasks() {
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.email)
    .then(res => res.json())
    .then(tasks => {
      let html = "<h3>My Active Tasks</h3><ul>";
      tasks.filter(t => t.status !== "Completed").forEach(t => {
        html += `<li>${t.taskName} → ${t.status}</li>`;
      });
      html += "</ul>";
      document.getElementById("user-content").innerHTML = html;
    });
}

function showMyCompletedTasks() {
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.email)
    .then(res => res.json())
    .then(tasks => {
      let html = "<h3>My Completed Tasks</h3><ul>";
      tasks.filter(t => t.status === "Completed").forEach(t => {
        html += `<li>${t.taskName} ✅</li>`;
      });
      html += "</ul>";
      document.getElementById("user-content").innerHTML = html;
    });
}

