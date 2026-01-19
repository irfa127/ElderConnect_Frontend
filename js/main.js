// Shared Platform Logic
document.addEventListener("DOMContentLoaded", () => {
  try {
    checkAuth();
  } catch (e) {
    console.error("Auth check failed:", e);
  }

  // Add active class to current nav item
  const currentPath = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });

  // Handle logout simulation
  const logoutBtn = document.querySelector(".logout-link");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "index.html";
      }
    });
  }
});

function checkAuth() {
  const protectedPages = ["dashboard", "profile", "appointments", "vitals", "senior-living"];
  const currentPath = window.location.pathname;
  const isProtected = protectedPages.some(page => currentPath.includes(page));

  const token = localStorage.getItem("token");
  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    console.error("Error parsing user data:", e);
    localStorage.removeItem("user"); // Clear invalid data
  }

  if (isProtected && (!token || !user)) {
    window.location.href = "login.html";
    return;
  }

  if (user) {
    // Update Profile Info
    const greeting = document.getElementById("user-greeting");
    const avatar = document.getElementById("user-avatar");

    if (greeting && user.full_name) greeting.innerText = `Hello, ${user.full_name} 👋`;
    if (avatar && user.full_name) avatar.src = `https://ui-avatars.com/api/?name=${user.full_name}&background=eff6ff&color=3b82f6`;
  }
}

// Modal Logic
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

// Global Notification Helper
function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === "success" ? "#10b981" : "#ef4444"};
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        z-index: 9999;
        font-weight: 700;
        animation: slideIn 0.3s ease;
    `;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Refresh User Data (Sync with Backend)
async function refreshUserData(userId) {
  if (!userId) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) userId = user.id;
    else return;
  }

  try {
    const response = await fetch(`http://localhost:8000/users/${userId}`);
    if (response.ok) {
      const updatedUser = await response.json();
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Update LocalStorage

      // Update UI Header
      const greeting = document.getElementById("user-greeting");
      const avatar = document.getElementById("user-avatar");
      if (greeting) greeting.innerText = `Hello, ${updatedUser.full_name} 👋`;
      if (avatar) avatar.src = `https://ui-avatars.com/api/?name=${updatedUser.full_name}&background=eff6ff&color=3b82f6`;

      console.log("User data refreshed");
    }
  } catch (error) {
    console.error("Failed to refresh user data:", error);
  }
}

