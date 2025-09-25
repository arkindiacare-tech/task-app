// Demo Users (Replace later with Google Sheet data)
const users = [
  { email: "admin@gmail.com", role: "admin" },
  { email: "user1@gmail.com", role: "user" },
  { email: "user2@gmail.com", role: "user" }
];

function login() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const user = users.find(u => u.email === email);

  if (user) {
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    loadDashboard(user);
  } else {
    alert("Unauthorized! Please use registered Gmail.");
  }
}

function loadDashboard(user) {
  document.getElementById("login-view").classList.add("hidden");

  if (user.role === "admin") {
    document.getElementById("admin-view").classList.remove("hidden");
  } else {
    document.getElementById("user-view").classList.remove("hidden");
  }
}

function logout() {
  localStorage.removeItem("loggedInUser");
  location.reload();
}

window.onload = function() {
  const savedUser = localStorage.getItem("loggedInUser");
  if (savedUser) {
    loadDashboard(JSON.parse(savedUser));
  }
};

// Dummy functions (later connected to Google Apps Script)
function showAssignTask() {
  document.getElementById("admin-content").innerHTML = "<p>Assign Task UI here</p>";
}
function showAllTasks() {
  document.getElementById("admin-content").innerHTML = "<p>All Tasks UI here</p>";
}
function showCompletedTasks() {
  document.getElementById("admin-content").innerHTML = "<p>Completed Tasks UI here</p>";
}
function showMyTasks() {
  document.getElementById("user-content").innerHTML = "<p>My Active Tasks UI here</p>";
}
function showMyCompletedTasks() {
  document.getElementById("user-content").innerHTML = "<p>My Completed Tasks UI here</p>";
}

