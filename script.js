// ===============================
// Task App Frontend Script.js
// IMPORTANT: Replace API_URL with your new deployed Apps Script URL
// ===============================

// !!! REPLACE THIS WITH YOUR DEPLOYED APPS SCRIPT URL AFTER REDEPLOYING !!!
const API_URL = "https://script.google.com/macros/s/AKfycbw_5Ulh8InxRk_zSXJp3_d6tAR7VL9XEp0uBHBg2yRI8VIyQw7270TlXUPVm6EmPam8/exec";

let loggedInUser = null;

// --- Helper to handle JSON fetch response ---
function handleResponse(res) {
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.text().then(txt => {
        try {
            // Attempt to parse the text as JSON
            return JSON.parse(txt);
        } catch (e) {
            // If parsing fails, return the raw text or handle as an error
            console.error("Failed to parse JSON:", txt);
            throw new Error("Received non-JSON response from server.");
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
  
  document.getElementById("login-view").innerHTML = `<h2>Login</h2><input type="email" id="email" placeholder="Enter Gmail ID" value="${email}"><button disabled>Logging in...</button>`;


  fetch(API_URL + "?action=getUsers")
    .then(handleResponse)
    .then(users => {
      const user = users.find(u => u.Email.toLowerCase() === email);
      if (user) {
        loggedInUser = user;
        // In a real app, you wouldn't store password, but for this demo, it's fine.
        localStorage.setItem("loggedInUser", JSON.stringify(user)); 
        loadDashboard(user);
      } else {
        alert("Unauthorized! Please use registered Gmail.");
        document.getElementById("login-view").innerHTML = `<h2>Login</h2><input type="email" id="email" placeholder="Enter Gmail ID"><button onclick="login()">Login</button>`;
      }
    })
    .catch(err => {
      console.error("Login Error:", err);
      // Display the specific error message for better debugging
      alert(`Backend not responding. Check Apps Script deployment and CORS. Error: ${err.message}`);
      document.getElementById("login-view").innerHTML = `<h2>Login</h2><input type="email" id="email" placeholder="Enter Gmail ID"><button onclick="login()">Login</button>`;
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
    <input type="text" id="taskName" placeholder="Task Name" class="border p-2 rounded w-full mb-3"><br>
    <textarea id="taskDesc" placeholder="Description" class="border p-2 rounded w-full mb-3"></textarea><br>
    <input type="email" id="assignedTo" placeholder="Assign to (user's email)" class="border p-2 rounded w-full mb-4"><br>
    <button id="saveTaskBtn">Save Task</button>
  `;

  // Attach listener
  document.getElementById("saveTaskBtn").addEventListener("click", addTask);
}

function addTask() {
  const taskName = document.getElementById("taskName").value.trim();
  const description = document.getElementById("taskDesc").value.trim();
  const assignedTo = document.getElementById("assignedTo").value.trim();
  
  if (!taskName || !assignedTo) {
      alert("Task Name and Assigned Email are required.");
      return;
  }
  
  // Disable button to prevent double-click
  document.getElementById("saveTaskBtn").disabled = true;

  const task = {
    id: 'TASK_' + Date.now(),
    date: new Date().toLocaleDateString('en-US'),
    taskName: taskName,
    description: description,
    assignedTo: assignedTo
  };
  
  // NOTE: When using fetch, the browser sends a pre-flight OPTIONS request
  // that the Apps Script's doPost must handle (which the provided Code.gs does).
  fetch(API_URL + "?action=addTask", {
    method: "POST",
    headers: {
        'Content-Type': 'application/json', // Explicitly set content type
    },
    body: JSON.stringify(task)
  })
    .then(handleResponse)
    .then(result => {
      if (result.success) {
        alert("Task Added Successfully");
        showAllTasks();
      } else {
        alert("Error adding task: " + (result.error || "Unknown error"));
        document.getElementById("saveTaskBtn").disabled = false;
      }
    })
    .catch(err => {
      console.error("Add Task Error:", err);
      alert("Error adding task. Check console for details.");
      document.getElementById("saveTaskBtn").disabled = false;
    });
}

function renderTaskList(tasks, targetElementId, isUserView = false) {
    let html = tasks.length === 0 ? "<div>No tasks found.</div>" : "";

    tasks.forEach(t => {
        const statusColor = t.Status === 'Completed' ? 'text-green-600' : (t.Status === 'Open' ? 'text-red-600' : 'text-yellow-600');
        
        html += `
            <div class="border p-4 mb-4 rounded shadow-md">
                <h4 class="font-bold text-lg">${t.Task_Name}</h4>
                <p class="text-sm mb-2">Assigned to: ${t.Assigned_To}</p>
                <p class="text-sm mb-2">Date Assigned: ${t.Date_Assigned}</p>
                <p class="text-sm mb-2">Description: ${t.Task_Description}</p>
                <p class="${statusColor} font-semibold">Status: ${t.Status}</p>
                ${t.Latest_Update_Text ? `<p class="text-xs italic mt-2">Latest Update: ${t.Latest_Update_Text}</p>` : ''}
            </div>
        `;
    });
    document.getElementById(targetElementId).innerHTML = html;
}

function showAllTasks() {
  document.getElementById("admin-content").innerHTML = "<h3>Loading All Tasks...</h3>";
  fetch(API_URL + "?action=getTasks&userEmail=" + loggedInUser.Email)
    .then(handleResponse)
    .then(tasks => {
      const allTasks = tasks.map(t => ({
          ...t,
          Status: t.Status || 'Open' // Ensure Status is present
      }));
      document.getElementById("admin-content").innerHTML = "<h3>All Tasks (Admin View)</h3>";
      renderTaskList(allTasks, "admin-content");
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
      renderTaskList(activeTasks, "user-content", true);
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
      renderTaskList(completedTasks, "user-content", true);
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
  
  // Re-enable all buttons in the HTML by giving them IDs for better event handling
  document.querySelector('#login-view button').id = 'loginBtn';
  document.querySelector('#admin-view button:nth-child(2)').id = 'assignTaskBtn';
  document.querySelector('#admin-view button:nth-child(3)').id = 'allTasksBtn';
  document.querySelector('#admin-view button:nth-child(4)').id = 'completedTasksBtn';
  document.querySelector('#admin-view button:nth-child(5)').id = 'logoutBtnAdmin';
  document.querySelector('#user-view button:nth-child(2)').id = 'myTasksBtn';
  document.querySelector('#user-view button:nth-child(3)').id = 'myCompletedTasksBtn';
  document.querySelector('#user-view button:nth-child(4)').id = 'logoutBtnUser';
  
  // Initial check for logged-in user
  if (savedUser) {
    try {
        loggedInUser = JSON.parse(savedUser);
        loadDashboard(loggedInUser);
    } catch (e) {
        console.error("Failed to parse saved user data:", e);
        localStorage.removeItem("loggedInUser");
    }
  }

  // Attach all button listeners (ensure these elements exist in your index.html)
  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("assignTaskBtn")?.addEventListener("click", showAssignTask);
  document.getElementById("allTasksBtn")?.addEventListener("click", showAllTasks);
  document.getElementById("completedTasksBtn")?.addEventListener("click", showCompletedTasks);
  document.getElementById("myTasksBtn")?.addEventListener("click", showMyTasks);
  document.getElementById("myCompletedTasksBtn")?.addEventListener("click", showMyCompletedTasks);
  document.getElementById("logoutBtnAdmin")?.addEventListener("click", logout);
  document.getElementById("logoutBtnUser")?.addEventListener("click", logout);
};
