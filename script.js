// =================================================================
// Task App Frontend Script.js (Refined logic and error handling)
// =================================================================

// !!! CRITICAL: REPLACE THIS WITH YOUR NEW DEPLOYED APPS SCRIPT URL !!!
const API_URL = "https://script.google.com/macros/s/AKfycbyRaFPrATE2MdwpY_GW4XBNqw4hRI9iDOXKMq_dPw5HXzzTIpoViVPcLjxH2NThy1ax/exec"; // PASTE THE URL FROM STEP 1 HERE

let loggedInUser = null;

// --- Helper to handle JSON fetch response ---
function handleResponse(res) {
    // This catches HTTP errors like 404, 500, etc.
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.text().then(txt => {
        try {
            // This catches the rare case where Apps Script returns HTML instead of JSON
            return JSON.parse(txt);
        } catch (e) {
            console.error("Failed to parse JSON:", txt);
            throw new Error("Received non-JSON response from server. Check Apps Script logs.");
        }
    });
}

// === Login Function ===
function login() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  if (!email) {
      alert("Please enter a Gmail ID.");
      return;
  }
  
  const loginButton = document.querySelector('#login-view button');
  loginButton.disabled = true;
  loginButton.textContent = 'Logging in...';

  // This is the call that is failing due to the old URL/CORS issue
  fetch(API_URL + "?action=getUsers")
    .then(handleResponse)
    .then(users => {
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
      
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
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
      console.error("Login Error:", err);
      // Display the specific fetch error message
      alert(`Connection Failed. Error: ${err.message}. Please check API_URL and Apps Script logs.`);
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
// (Note: Functions for task management use POST and are crucial to test after fixing the GET/CORS issue)
// ===============================
function showAssignTask() {
  document.getElementById("admin-content").innerHTML = `
    <h3>Assign New Task</h3>
    <input type="text" id="taskName" placeholder="Task Name" class="border p-2 rounded w-full mb-3"><br>
    <textarea id="taskDesc" placeholder="Description" class="border p-2 rounded w-full mb-3"></textarea><br>
    <input type="email" id="assignedTo" placeholder="Assign to (user's email)" class="border p-2 rounded w-full mb-4"><br>
    <button id="saveTaskBtn">Save Task</button>
  `;
  document.getElementById("saveTaskBtn").addEventListener("click", addTask);
}

function addTask() {
  const taskName = document.getElementById("taskName").value.trim();
  const assignedTo = document.getElementById("assignedTo").value.trim();
  
  if (!taskName || !assignedTo) {
      alert("Task Name and Assigned Email are required.");
      return;
  }
  
  const saveBtn = document.getElementById("saveTaskBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const task = {
    id: 'TASK_' + Date.now(),
    date: new Date().toLocaleDateString('en-US'),
    taskName: taskName,
    description: document.getElementById("taskDesc").value,
    assignedTo: assignedTo
  };
  
  fetch(API_URL + "?action=addTask", {
    method: "POST",
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(task)
  })
    .then(handleResponse)
    .then(result => {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Task';
      if (result.success) {
        alert("Task Added Successfully");
        showAllTasks();
      } else {
        alert("Error adding task: " + (result.error || "Unknown error"));
      }
    })
    .catch(err => {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Task';
      console.error("Add Task Error:", err);
      alert(`Error adding task: ${err.message}.`);
    });
}

function renderTaskList(tasks, targetElementId) {
    let html = tasks.length === 0 ? "<div>No tasks found.</div>" : "<ul>";

    tasks.forEach(t => {
        const status = t.Status || 'Open';
        const statusColor = status === 'Completed' ? 'text-green-600' : (status === 'Open' ? 'text-red-600' : 'text-yellow-600');
        
        html += `<li class="border p-2 mb-2 rounded">
                    <h4 class="font-bold">${t.Task_Name || t.TaskName}</h4>
                    <p class="text-sm">Assigned to: ${t.Assigned_To}</p>
                    <p class="${statusColor} font-semibold">Status: ${status}</p>
                </li>`;
    });
    html += "</ul>";
    document.getElementById(targetElementId).innerHTML = html;
}

function showAllTasks() {
  document.getElementById("admin-content").innerHTML = "<h3>Loading All Tasks...</h3>";
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.Email)
    .then(handleResponse)
    .then(tasks => {
      document.getElementById("admin-content").innerHTML = "<h3>All Tasks (Admin View)</h3>";
      renderTaskList(tasks, "admin-content");
    })
    .catch(err => {
      console.error("Admin Fetch Tasks Error:", err);
      document.getElementById("admin-content").innerHTML = `<div class="text-red-600">Error loading tasks: ${err.message}</div>`;
    });
}

function showCompletedTasks() {
  document.getElementById("admin-content").innerHTML = "<h3>Loading Completed Tasks...</h3>";
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.Email)
    .then(handleResponse)
    .then(tasks => {
      const completedTasks = tasks.filter(t => (t.Status && t.Status.toLowerCase() === "completed"));
      document.getElementById("admin-content").innerHTML = "<h3>Completed Tasks (Admin View)</h3>";
      renderTaskList(completedTasks, "admin-content");
    })
    .catch(err => {
      console.error("Admin Fetch Completed Tasks Error:", err);
      document.getElementById("admin-content").innerHTML = `<div class="text-red-600">Error loading tasks: ${err.message}</div>`;
    });
}

// ===============================
// User Functions
// ===============================
function showMyTasks() {
  document.getElementById("user-content").innerHTML = "<h3>Loading My Active Tasks...</h3>";
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.Email)
    .then(handleResponse)
    .then(tasks => {
      const activeTasks = tasks.filter(t => (t.Status && t.Status.toLowerCase() !== "completed"));
      document.getElementById("user-content").innerHTML = "<h3>My Active Tasks (User View)</h3>";
      renderTaskList(activeTasks, "user-content");
    })
    .catch(err => {
      console.error("User Fetch Active Tasks Error:", err);
      document.getElementById("user-content").innerHTML = `<div class="text-red-600">Error loading tasks: ${err.message}</div>`;
    });
}

function showMyCompletedTasks() {
  document.getElementById("user-content").innerHTML = "<h3>Loading My Completed Tasks...</h3>";
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.Email)
    .then(handleResponse)
    .then(tasks => {
      const completedTasks = tasks.filter(t => (t.Status && t.Status.toLowerCase() === "completed"));
      document.getElementById("user-content").innerHTML = "<h3>My Completed Tasks (User View)</h3>";
      renderTaskList(completedTasks, "user-content");
    })
    .catch(err => {
      console.error("User Fetch Completed Tasks Error:", err);
      document.getElementById("user-content").innerHTML = `<div class="text-red-600">Error loading tasks: ${err.message}</div>`;
    });
}


// ===============================
// Attach Event Listeners
// ===============================
window.onload = function() {
  const savedUser = localStorage.getItem("loggedInUser");
  if (savedUser) {
    try {
        loggedInUser = JSON.parse(savedUser);
        loadDashboard(loggedInUser);
    } catch (e) {
        localStorage.removeItem("loggedInUser");
    }
  }

  // Attach all button listeners (using optional chaining for robustness)
  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("assignTaskBtn")?.addEventListener("click", showAssignTask);
  document.getElementById("allTasksBtn")?.addEventListener("click", showAllTasks);
  document.getElementById("completedTasksBtn")?.addEventListener("click", showCompletedTasks);
  document.getElementById("myTasksBtn")?.addEventListener("click", showMyTasks);
  document.getElementById("myCompletedTasksBtn")?.addEventListener("click", showMyCompletedTasks);
  document.getElementById("logoutBtnAdmin")?.addEventListener("click", logout);
  document.getElementById("logoutBtnUser")?.addEventListener("click", logout);
};
