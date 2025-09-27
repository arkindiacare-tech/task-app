// 🚨 Replace with your Cloudflare Worker URL
const API_URL = "https://task-nilesh.arkindiacare.workers.dev/";

let currentUser = null;

// ---------------- LOGIN ----------------
async function login(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch(`${API_URL}?action=getUsers`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const users = await response.json();
    const user = users.find(
      u => u.Username === username && u.Password === password
    );

    if (user) {
      currentUser = user;
      document.getElementById("loginForm").classList.add("hidden");
      document.getElementById("taskSection").classList.remove("hidden");
      document.getElementById("userName").textContent = user.Username;
      fetchTasks();
    } else {
      alert("Invalid username or password");
    }
  } catch (err) {
    console.error("Login Error:", err);
    alert("Backend not responding. Please try again.");
  }
}

// ---------------- FETCH TASKS ----------------
async function fetchTasks() {
  if (!currentUser) return;

  try {
    const response = await fetch(
      `${API_URL}?action=getTasks&userEmail=${encodeURIComponent(currentUser.Email)}`
    );
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const tasks = await response.json();
    renderTasks(tasks);
  } catch (err) {
    console.error("Fetch Tasks Error:", err);
    alert("Could not fetch tasks.");
  }
}

// ---------------- ADD TASK ----------------
async function addTask(event) {
  event.preventDefault();
  if (!currentUser) return;

  const task = {
    title: document.getElementById("taskTitle").value,
    description: document.getElementById("taskDesc").value,
    assignedTo: document.getElementById("assignedTo").value,
    status: "To Do",
    dueDate: document.getElementById("dueDate").value,
  };

  try {
    const response = await fetch(`${API_URL}?action=addTask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });

    const result = await response.json();
    if (result.success) {
      alert("Task added!");
      fetchTasks();
      document.getElementById("taskForm").reset();
    } else {
      alert("Error adding task: " + result.error);
    }
  } catch (err) {
    console.error("Add Task Error:", err);
    alert("Could not add task.");
  }
}

// ---------------- RENDER TASKS ----------------
function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    list.innerHTML = "<li>No tasks found.</li>";
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement("li");
    li.textContent = `${task.Title} - ${task.Status} (Due: ${task.Due_Date || "N/A"})`;
    list.appendChild(li);
  });
}
